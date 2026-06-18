from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import re
import io
import json
import uuid
import asyncio
import logging
import base64
import bcrypt
import jwt
import resend
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Annotated

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse, HTMLResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
from emergentintegrations.llm.openai import OpenAISpeechToText, OpenAITextToSpeech

from curriculum import CURRICULUM, SUBJECTS, GRADES, all_lessons, find_lesson, lessons_for


# ---------- DB ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

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


def create_digest_token(user_id: str, parent_email: str) -> str:
    payload = {
        "sub": user_id,
        "parent_email": parent_email,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "type": "parent_digest",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="access_token", value=token, httponly=True, secure=True,
        samesite="none", max_age=7 * 24 * 3600, path="/",
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
    parent_email: Optional[EmailStr] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TeachIn(BaseModel):
    question: str
    subject: Optional[str] = None
    session_id: Optional[str] = None
    model: Optional[str] = None
    lesson_slug: Optional[str] = None


class VisualIn(BaseModel):
    question: str
    response: str


class TTSIn(BaseModel):
    text: str
    voice: Optional[str] = "nova"


class UpdateProfileIn(BaseModel):
    parent_email: Optional[EmailStr] = None
    name: Optional[str] = None
    grade: Optional[int] = None


# ---------- AI System Prompts ----------
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

VISUAL_DECIDER_SYSTEM = """You are a visual-design assistant for an AI tutor. Given a student question and the tutor's reply, decide what kind of visual would help the student understand best.

Return ONE JSON object — nothing else — with this shape:
{
  "type": "svg" | "image" | "none",
  "title": "short title (max 6 words)",
  "prompt": "if type=image, a detailed art prompt for an educational illustration (flat vector style, clean, minimal, bright friendly colors, no text in image); if type=svg, leave empty string",
  "svg": "if type=svg, a complete <svg viewBox=\"0 0 400 280\" xmlns=\"http://www.w3.org/2000/svg\">...</svg> with simple shapes, gradients, and labels. Use brand colors #4F46E5, #06B6D4, #8B5CF6, #EC4899, #10B981, #FBBF24 on a dark background. Include short text labels. Otherwise leave empty string."
}

Choose "svg" for: math diagrams, geometry, charts, system diagrams, simple flows, labelled parts.
Choose "image" for: real-world scenes (plant, ocean, animal, planet, factory analogy, kitchen analogy).
Choose "none" if the concept is purely abstract/textual.
Keep SVG simple — under 80 lines. No external assets, no scripts.
"""

LESSON_SYSTEM = """You are Mindora AI building a discovery-style mini-lesson for a school student.

Given a lesson title, concept and real-life hook, produce ONE JSON object — nothing else:
{
  "intro": "2-3 short paragraphs. Open with the hook. End with a curious question.",
  "key_idea": "ONE crisp sentence with the central insight.",
  "story": "A 3-4 sentence story or analogy that makes the concept stick.",
  "tiny_experiment": "A short hands-on activity the student can try in <5 minutes.",
  "check_questions": ["3 short, open-ended Socratic check-in questions, no yes/no."]
}

Tone: warm teacher. Grade-appropriate. No direct answer. Never reveal the full concept — keep room for the student to discover.
"""

QUIZ_SYSTEM = """You are Mindora AI writing a tiny quiz for a school student.

Given the lesson title and concept, produce ONE JSON object — nothing else:
{
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "...?",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "Short, warm explanation that builds understanding (not just 'right/wrong')."
    }
    // 4 questions total
  ]
}

Rules: 4 MCQs. Each has 4 options. Make at least one option a tempting misconception. Explanations should teach, not just say correct/incorrect.
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
        "parent_email": body.parent_email.lower() if body.parent_email else None,
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
        "id": user_id, "email": email, "name": body.name, "grade": body.grade,
        "parent_email": doc["parent_email"], "role": "student",
        "xp": 120, "streak": 3, "token": token,
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
        "id": user_id, "email": email, "name": user.get("name"),
        "grade": user.get("grade"), "parent_email": user.get("parent_email"),
        "role": user.get("role", "student"),
        "xp": user.get("xp", 0), "streak": user.get("streak", 0), "token": token,
    }


@api.post("/auth/logout")
async def logout(response: Response, user: CurrentUser):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: CurrentUser):
    return user


@api.patch("/auth/me")
async def update_me(body: UpdateProfileIn, user: CurrentUser):
    update = {}
    if body.parent_email is not None:
        update["parent_email"] = body.parent_email.lower()
    if body.name is not None:
        update["name"] = body.name
    if body.grade is not None:
        update["grade"] = body.grade
    if update:
        await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": update})
    fresh = await db.users.find_one({"_id": ObjectId(user["id"])})
    fresh["id"] = str(fresh["_id"])
    fresh.pop("_id", None)
    fresh.pop("password_hash", None)
    return fresh


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
    # completed lessons count
    completed_lessons = await db.completed_lessons.count_documents({"user_id": user["id"]})
    return {
        "user": {
            "name": user.get("name"), "xp": user.get("xp", 0),
            "streak": user.get("streak", 0), "grade": user.get("grade"),
            "parent_email": user.get("parent_email"),
            "level": max(1, user.get("xp", 0) // 100),
            "next_level_xp": (max(1, user.get("xp", 0) // 100) + 1) * 100,
        },
        "subjects": subjects, "goals": goals, "weekly_activity": weekly_activity,
        "mentor_status": "online",
        "concepts_mastered": 47 + completed_lessons,
        "understanding_score": 89,
        "completed_lessons": completed_lessons,
    }


# ---------- Chat ----------
@api.get("/chat/sessions")
async def list_sessions(user: CurrentUser):
    cursor = db.chat_sessions.find({"user_id": user["id"]}).sort("updated_at", -1).limit(50)
    out = []
    async for s in cursor:
        out.append({
            "id": s["session_id"], "title": s.get("title", "New conversation"),
            "subject": s.get("subject"), "updated_at": s.get("updated_at"),
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
            "id": str(m["_id"]), "role": m["role"], "content": m["content"],
            "created_at": m.get("created_at"),
        })
    return out


async def _save_message(session_id: str, role: str, content: str) -> None:
    await db.chat_messages.insert_one({
        "session_id": session_id, "role": role, "content": content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


@api.post("/chat/teach")
async def teach(body: TeachIn, user: CurrentUser):
    model_key = (body.model or DEFAULT_MODEL).lower()
    if model_key not in MODEL_MAP:
        model_key = DEFAULT_MODEL
    provider, model_id = MODEL_MAP[model_key]
    session_id = body.session_id or str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    existing = await db.chat_sessions.find_one({"session_id": session_id, "user_id": user["id"]})
    if not existing:
        title = body.question.strip()[:60]
        await db.chat_sessions.insert_one({
            "session_id": session_id, "user_id": user["id"], "title": title,
            "subject": body.subject, "model": model_key, "lesson_slug": body.lesson_slug,
            "created_at": now_iso, "updated_at": now_iso,
        })
    else:
        await db.chat_sessions.update_one(
            {"session_id": session_id},
            {"$set": {"updated_at": now_iso, "model": model_key}},
        )

    await _save_message(session_id, "user", body.question)

    subject_line = f"\nSubject focus: {body.subject}." if body.subject else ""
    if body.lesson_slug:
        l = find_lesson(body.lesson_slug)
        if l:
            subject_line += f"\nCurrent lesson: {l['title']} (concept: {l['concept']}, grade {l['grade']})."
    system_msg = TEACHER_SYSTEM + subject_line

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY, session_id=session_id, system_message=system_msg,
    ).with_model(provider, model_id)

    async def event_generator():
        full_response = ""
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

        if full_response:
            await _save_message(session_id, "assistant", full_response)
            await db.users.update_one(
                {"_id": ObjectId(user["id"])}, {"$inc": {"xp": 10}},
            )
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        event_generator(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ---------- Visualization ----------
def _strip_code_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    return text.strip()


@api.post("/visual/generate")
async def visual_generate(body: VisualIn, user: CurrentUser):
    """Decide visual type and generate SVG (Claude) or image (Gemini Nano Banana)."""
    decider = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"visual-{uuid.uuid4()}",
        system_message=VISUAL_DECIDER_SYSTEM,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    user_payload = (
        f"Student question: {body.question}\n\n"
        f"Tutor reply (excerpt): {body.response[:600]}\n\n"
        "Now respond with the JSON object only."
    )

    decision_text = ""
    try:
        async for ev in decider.stream_message(UserMessage(text=user_payload)):
            if isinstance(ev, TextDelta):
                decision_text += ev.content
            elif isinstance(ev, StreamDone):
                break
    except Exception as e:
        logging.exception("visual decider failed")
        return {"type": "none"}

    decision_text = _strip_code_fences(decision_text)
    try:
        decision = json.loads(decision_text)
    except Exception:
        logging.warning(f"could not parse visual decision: {decision_text[:200]}")
        return {"type": "none"}

    vtype = decision.get("type", "none")
    title = decision.get("title", "")

    if vtype == "svg":
        svg = decision.get("svg", "")
        if "<svg" not in svg:
            return {"type": "none"}
        return {"type": "svg", "title": title, "svg": svg}

    if vtype == "image":
        prompt = decision.get("prompt") or f"Educational illustration: {body.question}"
        try:
            img_chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"img-{uuid.uuid4()}",
                system_message="You generate educational illustrations.",
            )
            img_chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

            full_prompt = (
                f"{prompt}. Flat vector illustration style, minimal, bright friendly colors "
                "on dark navy background, clean educational diagram for a school student, "
                "no text labels in the image, soft glow accents."
            )
            text, images = await img_chat.send_message_multimodal_response(UserMessage(text=full_prompt))
            if images:
                first = images[0]
                return {
                    "type": "image",
                    "title": title or prompt[:60],
                    "mime_type": first.get("mime_type", "image/png"),
                    "data": first["data"],
                }
        except Exception as e:
            logging.exception("image generation failed")
            return {"type": "none"}

    return {"type": "none"}


# ---------- Voice ----------
@api.post("/voice/stt")
async def voice_stt(user: CurrentUser, audio: UploadFile = File(...), language: Optional[str] = Form("en")):
    """Transcribe audio to text using Whisper."""
    if not audio.filename:
        raise HTTPException(status_code=400, detail="No audio file provided")
    raw = await audio.read()
    if len(raw) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio too large (max 20MB)")
    # Whisper SDK accepts file-like with name
    bio = io.BytesIO(raw)
    bio.name = audio.filename or "audio.webm"
    try:
        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        result = await stt.transcribe(file=bio, model="whisper-1", response_format="json", language=language)
        text = getattr(result, "text", None) or (result.get("text") if isinstance(result, dict) else "")
        return {"text": text or ""}
    except Exception as e:
        logging.exception("stt failed")
        raise HTTPException(status_code=500, detail=str(e))


@api.post("/voice/tts")
async def voice_tts(body: TTSIn, user: CurrentUser):
    """Generate speech mp3 from text using OpenAI TTS."""
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty text")
    if len(text) > 4096:
        text = text[:4096]
    try:
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        audio_bytes = await tts.generate_speech(
            text=text, model="tts-1", voice=body.voice or "nova", response_format="mp3",
        )
        return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/mpeg")
    except Exception as e:
        logging.exception("tts failed")
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Curriculum ----------
@api.get("/curriculum/overview")
async def curriculum_overview(user: CurrentUser):
    # Count lessons per grade and subject
    total = len(all_lessons())
    by_grade = {}
    for g in GRADES:
        by_grade[g] = {}
        for s in SUBJECTS:
            by_grade[g][s] = len(lessons_for(g, s))
    return {
        "grades": GRADES,
        "subjects": SUBJECTS,
        "total_lessons": total,
        "lessons_per_grade_subject": by_grade,
    }


@api.get("/curriculum/lesson/{slug}")
async def curriculum_lesson(slug: str, user: CurrentUser):
    lesson = find_lesson(slug)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    cached = await db.lesson_content.find_one({"slug": slug})
    if not cached:
        content_chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"lesson-{slug}",
            system_message=LESSON_SYSTEM,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        prompt = (
            f"Title: {lesson['title']}\n"
            f"Concept: {lesson['concept']}\n"
            f"Real-life hook: {lesson['hook']}\n"
            f"Grade: {lesson['grade']}\n\n"
            "Return the JSON object only."
        )
        raw = ""
        async for ev in content_chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                raw += ev.content
            elif isinstance(ev, StreamDone):
                break
        raw = _strip_code_fences(raw)
        try:
            content = json.loads(raw)
        except Exception:
            content = {
                "intro": raw[:600],
                "key_idea": lesson["concept"],
                "story": "",
                "tiny_experiment": "",
                "check_questions": [],
            }
        await db.lesson_content.insert_one({
            "slug": slug, "content": content,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        cached = {"content": content}

    completed = await db.completed_lessons.find_one({"user_id": user["id"], "lesson_slug": slug})
    return {
        "lesson": lesson,
        "content": cached["content"],
        "completed": bool(completed),
    }


@api.get("/curriculum/quiz/{slug}")
async def curriculum_quiz(slug: str, user: CurrentUser):
    lesson = find_lesson(slug)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    cached = await db.lesson_quiz.find_one({"slug": slug})
    if not cached:
        quiz_chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"quiz-{slug}",
            system_message=QUIZ_SYSTEM,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        prompt = (
            f"Title: {lesson['title']}\n"
            f"Concept: {lesson['concept']}\n"
            f"Grade: {lesson['grade']}\n\nReturn the JSON object only."
        )
        raw = ""
        async for ev in quiz_chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                raw += ev.content
            elif isinstance(ev, StreamDone):
                break
        raw = _strip_code_fences(raw)
        try:
            quiz = json.loads(raw)
        except Exception:
            quiz = {"questions": []}
        await db.lesson_quiz.insert_one({
            "slug": slug, "quiz": quiz,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        cached = {"quiz": quiz}
    return cached["quiz"]


class QuizSubmitIn(BaseModel):
    answers: List[int]


@api.post("/curriculum/lesson/{slug}/complete")
async def complete_lesson(slug: str, body: QuizSubmitIn, user: CurrentUser):
    lesson = find_lesson(slug)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    quiz_doc = await db.lesson_quiz.find_one({"slug": slug})
    if not quiz_doc:
        raise HTTPException(status_code=400, detail="Quiz not generated yet")
    questions = quiz_doc["quiz"].get("questions", [])
    correct = 0
    for i, q in enumerate(questions):
        if i < len(body.answers) and body.answers[i] == q.get("correct_index"):
            correct += 1
    score_pct = int(100 * correct / len(questions)) if questions else 0
    passed = score_pct >= 50

    if passed:
        existing = await db.completed_lessons.find_one({"user_id": user["id"], "lesson_slug": slug})
        if not existing:
            await db.completed_lessons.insert_one({
                "user_id": user["id"], "lesson_slug": slug,
                "score": score_pct,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            })
            await db.users.update_one(
                {"_id": ObjectId(user["id"])}, {"$inc": {"xp": 50}},
            )
    return {"correct": correct, "total": len(questions), "score_pct": score_pct, "passed": passed}


@api.get("/curriculum/{grade}/{subject}")
async def curriculum_list(grade: int, subject: str, user: CurrentUser):
    if subject not in SUBJECTS or grade not in GRADES:
        raise HTTPException(status_code=404, detail="Not found")
    items = lessons_for(grade, subject)
    completed = {
        d["lesson_slug"] async for d in db.completed_lessons.find({"user_id": user["id"]})
    }
    for it in items:
        it["completed"] = it["slug"] in completed
    return {
        "grade": grade,
        "subject": subject,
        "subject_meta": SUBJECTS[subject],
        "lessons": items,
    }


# ---------- Parent digest ----------
def _render_digest_html(student: dict, completed_lessons: List[dict], chat_summaries: List[dict]) -> str:
    name = student.get("name", "your child")
    streak = student.get("streak", 0)
    xp = student.get("xp", 0)
    level = max(1, xp // 100)

    lesson_rows = ""
    for cl in completed_lessons[:6]:
        l = find_lesson(cl["lesson_slug"])
        if l:
            lesson_rows += f"""
            <tr><td style="padding:12px 0;border-bottom:1px solid #232336;color:#e8e8ee;font-size:14px;">
              <strong style="color:#fff;">{l['title']}</strong><br/>
              <span style="color:#a0a0b8;font-size:12px;">{l['subject_name']} · Grade {l['grade']} · Score {cl.get('score','?')}%</span>
            </td></tr>"""
    if not lesson_rows:
        lesson_rows = """<tr><td style="padding:12px 0;color:#a0a0b8;font-size:14px;">No completed lessons yet this week — but conversations counted!</td></tr>"""

    chat_rows = ""
    for s in chat_summaries[:5]:
        chat_rows += f"""
        <tr><td style="padding:10px 0;border-bottom:1px solid #232336;color:#e8e8ee;font-size:14px;">
          <strong style="color:#fff;">{s.get('title','Wonder')}</strong>
          <span style="color:#a0a0b8;font-size:12px;display:block;">{s.get('updated_at','')[:10]}</span>
        </td></tr>"""
    if not chat_rows:
        chat_rows = """<tr><td style="padding:10px 0;color:#a0a0b8;font-size:14px;">No chats this week.</td></tr>"""

    return f"""<!DOCTYPE html>
<html><body style="margin:0;background:#0a0a0f;font-family:Helvetica,Arial,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#13131a;border:1px solid #232336;border-radius:24px;overflow:hidden;">
        <tr><td style="padding:32px 32px 16px;">
          <div style="font-family:Helvetica;font-size:11px;letter-spacing:3px;color:#818cf8;text-transform:uppercase;margin-bottom:18px;">Mindora AI · Weekly Digest</div>
          <h1 style="margin:0 0 8px;font-size:28px;color:#fff;letter-spacing:-0.5px;">{name}'s week of learning</h1>
          <p style="margin:0;color:#a0a0b8;font-size:14px;">Built understanding — not just minutes logged.</p>
        </td></tr>

        <tr><td style="padding:8px 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="33%" style="padding:18px;border-radius:14px;background:#1c1c24;text-align:center;">
                <div style="font-size:28px;color:#fff;">⚡ {xp}</div>
                <div style="font-size:11px;color:#818cf8;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">XP earned</div>
              </td>
              <td width="10"></td>
              <td width="33%" style="padding:18px;border-radius:14px;background:#1c1c24;text-align:center;">
                <div style="font-size:28px;color:#fff;">🔥 {streak}</div>
                <div style="font-size:11px;color:#fb923c;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Day streak</div>
              </td>
              <td width="10"></td>
              <td width="33%" style="padding:18px;border-radius:14px;background:#1c1c24;text-align:center;">
                <div style="font-size:28px;color:#fff;">★ {level}</div>
                <div style="font-size:11px;color:#a78bfa;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Level</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 32px 16px;">
          <h3 style="margin:8px 0 6px;font-size:16px;color:#fff;">Lessons mastered</h3>
          <table width="100%" cellpadding="0" cellspacing="0">{lesson_rows}</table>
        </td></tr>

        <tr><td style="padding:0 32px 16px;">
          <h3 style="margin:18px 0 6px;font-size:16px;color:#fff;">Curiosity moments</h3>
          <table width="100%" cellpadding="0" cellspacing="0">{chat_rows}</table>
        </td></tr>

        <tr><td style="padding:24px 32px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#4F46E5,#8B5CF6);border-radius:14px;">
            <tr><td style="padding:18px;color:#fff;font-size:14px;line-height:1.5;">
              <strong>Dinner-table prompt:</strong><br/>
              Ask {name.split()[0]}: "What's one thing you discovered this week that surprised you?"
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 32px 32px;text-align:center;">
          <div style="font-size:11px;color:#666;font-family:monospace;letter-spacing:2px;text-transform:uppercase;">Mindora AI · Built for thinkers</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""


async def _build_digest(user_id: str):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return None
    user["id"] = str(user["_id"])
    completed = await db.completed_lessons.find({"user_id": user_id}).sort("completed_at", -1).to_list(20)
    sessions = await db.chat_sessions.find({"user_id": user_id}).sort("updated_at", -1).to_list(10)
    return user, completed, sessions


@api.post("/parent/send-digest")
async def send_parent_digest(user: CurrentUser):
    if not RESEND_API_KEY:
        raise HTTPException(status_code=500, detail="Email service not configured")
    parent_email = user.get("parent_email")
    if not parent_email:
        raise HTTPException(status_code=400, detail="No parent email on file — add one in Settings")

    bundle = await _build_digest(user["id"])
    if not bundle:
        raise HTTPException(status_code=404, detail="No data")
    full_user, completed, sessions = bundle

    html = _render_digest_html(full_user, completed, sessions)
    subject = f"📚 {full_user.get('name','Your child')}'s Mindora week"
    params = {
        "from": SENDER_EMAIL,
        "to": [parent_email],
        "subject": subject,
        "html": html,
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        await db.digest_log.insert_one({
            "user_id": user["id"], "parent_email": parent_email,
            "email_id": result.get("id") if isinstance(result, dict) else None,
            "sent_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"ok": True, "email_id": result.get("id") if isinstance(result, dict) else None}
    except Exception as e:
        logging.exception("send digest failed")
        raise HTTPException(status_code=500, detail=f"Email send failed: {str(e)}")


@api.get("/parent/digest/{token}")
async def parent_digest_view(token: str):
    """Public endpoint that renders the digest from a signed token (for in-email 'view in browser' link)."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "parent_digest":
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    bundle = await _build_digest(payload["sub"])
    if not bundle:
        raise HTTPException(status_code=404, detail="Not found")
    full_user, completed, sessions = bundle
    html = _render_digest_html(full_user, completed, sessions)
    return HTMLResponse(content=html)


@api.get("/parent/preview")
async def parent_digest_preview(user: CurrentUser):
    """Return digest preview JSON for in-app rendering."""
    bundle = await _build_digest(user["id"])
    if not bundle:
        raise HTTPException(status_code=404, detail="No data")
    full_user, completed, sessions = bundle
    completed_out = []
    for cl in completed[:10]:
        l = find_lesson(cl["lesson_slug"])
        if l:
            completed_out.append({
                "title": l["title"], "subject": l["subject_name"],
                "grade": l["grade"], "score": cl.get("score", 0),
                "completed_at": cl.get("completed_at"),
            })
    return {
        "student": {
            "name": full_user.get("name"), "xp": full_user.get("xp", 0),
            "streak": full_user.get("streak", 0), "grade": full_user.get("grade"),
            "level": max(1, full_user.get("xp", 0) // 100),
        },
        "parent_email": full_user.get("parent_email"),
        "completed_lessons": completed_out,
        "chat_sessions": [
            {"title": s.get("title", "Wonder"), "updated_at": s.get("updated_at", ""), "subject": s.get("subject")}
            for s in sessions[:8]
        ],
    }


# Public landing demo
class PublicDemoIn(BaseModel):
    question: str


@api.post("/demo/teach")
async def public_demo(body: PublicDemoIn):
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY, session_id=f"demo-{uuid.uuid4()}",
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
    return {"service": "Mindora AI", "ok": True, "version": "1.1"}


# ---------- Startup ----------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.chat_sessions.create_index([("user_id", 1), ("updated_at", -1)])
    await db.chat_messages.create_index([("session_id", 1), ("created_at", 1)])
    await db.lesson_content.create_index("slug", unique=True)
    await db.lesson_quiz.create_index("slug", unique=True)
    await db.completed_lessons.create_index([("user_id", 1), ("lesson_slug", 1)], unique=True)

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@mindora.ai").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin", "role": "admin",
            "xp": 999, "streak": 30,
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


# Routers + CORS
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
