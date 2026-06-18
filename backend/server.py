from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import json
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Annotated

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Body
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone


# ---------- DB ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]

# Model mapping (provider, model_id)
MODEL_MAP = {
    "claude": ("anthropic", "claude-sonnet-4-5-20250929"),
    "gpt": ("openai", "gpt-5.2"),
    "gemini": ("gemini", "gemini-3-flash-preview"),
}
DEFAULT_MODEL = "claude"

# ---------- App ----------
app = FastAPI(title="Mindora AI API")
api = APIRouter(prefix="/api")


# ---------- Auth helpers ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 3600,
        path="/",
    )


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    user["id"] = str(user["_id"])
    user.pop("_id", None)
    user.pop("password_hash", None)
    return user


CurrentUser = Annotated[dict, Depends(get_current_user)]


# ---------- Schemas ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    grade: Optional[int] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TeachIn(BaseModel):
    question: str
    subject: Optional[str] = None
    session_id: Optional[str] = None
    model: Optional[str] = None  # "claude" | "gpt" | "gemini"


# ---------- AI Teacher System Prompt ----------
TEACHER_SYSTEM = """You are Mindora AI — a personal teacher and mentor for school students (grades 6-12).

CORE PHILOSOPHY: Don't Give Answers. Build Understanding.

You NEVER give direct answers. Instead, you teach through:
- Vivid real-life examples (everyday objects, situations)
- Short stories and analogies a student can picture
- Visual/spatial explanations (describe what to imagine)
- Mini thought-experiments and "what would happen if..." moments
- Socratic questions that guide the student to discover the answer
- Connecting new concepts to things the student already knows

RESPONSE FORMAT (always follow):
1. Hook: 1-2 sentences with a relatable scene, story, or surprising question.
2. Real-life Example: Connect the concept to something tangible.
3. Guided Discovery: Ask the student 1-2 short questions to think about.
4. Tiny Insight: Reveal one piece of the concept (not the whole answer).
5. Next Step: Invite them to reply with their thinking.

STYLE:
- Warm, curious, encouraging. Like a favorite teacher.
- Short paragraphs. Use line breaks generously.
- Use simple emoji-free formatting; markdown bold for key terms.
- Never lecture for more than ~150 words per turn.
- Never reveal the full answer in one go; always leave room for the student to think.

If the student says "just tell me the answer", gently redirect: "Let's discover it together — it'll stick way longer that way."
"""


# ---------- Auth Routes ----------
@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name,
        "grade": body.grade,
        "role": "student",
        "xp": 120,
        "streak": 3,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.users.insert_one(doc)
    user_id = str(res.inserted_id)
    token = create_access_token(user_id, email)
    set_auth_cookie(response, token)
    return {
        "id": user_id,
        "email": email,
        "name": body.name,
        "grade": body.grade,
        "role": "student",
        "xp": 120,
        "streak": 3,
        "token": token,
    }


@api.post("/auth/login")
async def login(body: LoginIn, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user_id = str(user["_id"])
    token = create_access_token(user_id, email)
    set_auth_cookie(response, token)
    return {
        "id": user_id,
        "email": email,
        "name": user.get("name"),
        "grade": user.get("grade"),
        "role": user.get("role", "student"),
        "xp": user.get("xp", 0),
        "streak": user.get("streak", 0),
        "token": token,
    }


@api.post("/auth/logout")
async def logout(response: Response, user: CurrentUser):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: CurrentUser):
    return user


# ---------- LMS dashboard ----------
@api.get("/lms/dashboard")
async def lms_dashboard(user: CurrentUser):
    subjects = [
        {"id": "math", "name": "Mathematics", "progress": 72, "color": "#4F46E5", "lessons": 24, "completed": 17},
        {"id": "science", "name": "Science", "progress": 58, "color": "#06B6D4", "lessons": 28, "completed": 16},
        {"id": "english", "name": "English", "progress": 84, "color": "#8B5CF6", "lessons": 20, "completed": 17},
        {"id": "coding", "name": "Coding", "progress": 41, "color": "#EC4899", "lessons": 30, "completed": 12},
    ]
    goals = [
        {"id": 1, "title": "Master Photosynthesis", "progress": 80, "subject": "Science"},
        {"id": 2, "title": "Solve 20 Algebra Problems", "progress": 65, "subject": "Mathematics"},
        {"id": 3, "title": "Write a Short Story", "progress": 40, "subject": "English"},
        {"id": 4, "title": "Build a Python Calculator", "progress": 25, "subject": "Coding"},
    ]
    weekly_activity = [
        {"day": "Mon", "minutes": 45, "concepts": 3},
        {"day": "Tue", "minutes": 62, "concepts": 5},
        {"day": "Wed", "minutes": 38, "concepts": 2},
        {"day": "Thu", "minutes": 80, "concepts": 6},
        {"day": "Fri", "minutes": 55, "concepts": 4},
        {"day": "Sat", "minutes": 90, "concepts": 7},
        {"day": "Sun", "minutes": 30, "concepts": 2},
    ]
    return {
        "user": {
            "name": user.get("name"),
            "xp": user.get("xp", 0),
            "streak": user.get("streak", 0),
            "grade": user.get("grade"),
            "level": max(1, user.get("xp", 0) // 100),
            "next_level_xp": (max(1, user.get("xp", 0) // 100) + 1) * 100,
        },
        "subjects": subjects,
        "goals": goals,
        "weekly_activity": weekly_activity,
        "mentor_status": "online",
        "concepts_mastered": 47,
        "understanding_score": 89,
    }


# ---------- Chat ----------
@api.get("/chat/sessions")
async def list_sessions(user: CurrentUser):
    cursor = db.chat_sessions.find({"user_id": user["id"]}).sort("updated_at", -1).limit(50)
    out = []
    async for s in cursor:
        out.append({
            "id": s["session_id"],
            "title": s.get("title", "New conversation"),
            "subject": s.get("subject"),
            "updated_at": s.get("updated_at"),
            "model": s.get("model", DEFAULT_MODEL),
        })
    return out


@api.get("/chat/sessions/{session_id}/messages")
async def get_messages(session_id: str, user: CurrentUser):
    s = await db.chat_sessions.find_one({"session_id": session_id, "user_id": user["id"]})
    if not s:
        return []
    cursor = db.chat_messages.find({"session_id": session_id}).sort("created_at", 1)
    out = []
    async for m in cursor:
        out.append({
            "id": str(m["_id"]),
            "role": m["role"],
            "content": m["content"],
            "created_at": m.get("created_at"),
        })
    return out


async def _save_message(session_id: str, role: str, content: str) -> None:
    await db.chat_messages.insert_one({
        "session_id": session_id,
        "role": role,
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


@api.post("/chat/teach")
async def teach(body: TeachIn, user: CurrentUser):
    model_key = (body.model or DEFAULT_MODEL).lower()
    if model_key not in MODEL_MAP:
        model_key = DEFAULT_MODEL
    provider, model_id = MODEL_MAP[model_key]

    session_id = body.session_id or str(uuid.uuid4())

    # Upsert session
    now_iso = datetime.now(timezone.utc).isoformat()
    existing = await db.chat_sessions.find_one({"session_id": session_id, "user_id": user["id"]})
    if not existing:
        title = body.question.strip()[:60]
        await db.chat_sessions.insert_one({
            "session_id": session_id,
            "user_id": user["id"],
            "title": title,
            "subject": body.subject,
            "model": model_key,
            "created_at": now_iso,
            "updated_at": now_iso,
        })
    else:
        await db.chat_sessions.update_one(
            {"session_id": session_id},
            {"$set": {"updated_at": now_iso, "model": model_key}},
        )

    await _save_message(session_id, "user", body.question)

    # Build chat history context
    history_cursor = db.chat_messages.find({"session_id": session_id}).sort("created_at", 1).limit(20)
    history = []
    async for m in history_cursor:
        history.append({"role": m["role"], "content": m["content"]})

    subject_line = f"\nSubject focus: {body.subject}." if body.subject else ""
    system_msg = TEACHER_SYSTEM + subject_line

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_msg,
    ).with_model(provider, model_id)

    async def event_generator():
        full_response = ""
        # Send session id first
        yield f"data: {json.dumps({'type': 'session', 'session_id': session_id})}\n\n"
        try:
            async for ev in chat.stream_message(UserMessage(text=body.question)):
                if isinstance(ev, TextDelta):
                    full_response += ev.content
                    yield f"data: {json.dumps({'type': 'delta', 'content': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    break
        except Exception as e:
            logging.exception("LLM stream error")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

        # Save assistant message
        if full_response:
            await _save_message(session_id, "assistant", full_response)
            # Award XP for each conversation turn
            await db.users.update_one(
                {"_id": ObjectId(user["id"])},
                {"$inc": {"xp": 10}},
            )
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# Public landing-page demo endpoint (no auth): single-shot non-streaming
class PublicDemoIn(BaseModel):
    question: str


@api.post("/demo/teach")
async def public_demo(body: PublicDemoIn):
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"demo-{uuid.uuid4()}",
        system_message=TEACHER_SYSTEM,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    full = ""
    try:
        async for ev in chat.stream_message(UserMessage(text=body.question)):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
    except Exception as e:
        logging.exception("demo stream error")
        raise HTTPException(status_code=500, detail=str(e))
    return {"answer": full}


@api.get("/")
async def root():
    return {"service": "Mindora AI", "ok": True}


# ---------- Startup ----------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.chat_sessions.create_index([("user_id", 1), ("updated_at", -1)])
    await db.chat_messages.create_index([("session_id", 1), ("created_at", 1)])

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@mindora.ai").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "xp": 999,
            "streak": 30,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )


@app.on_event("shutdown")
async def shutdown():
    client.close()


# ---------- Middlewares ----------
app.include_router(api)

# CORS — allow frontend origin with credentials
frontend_origin = os.environ.get("FRONTEND_URL", "http://localhost:3000")
allow_origins = [frontend_origin, "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
