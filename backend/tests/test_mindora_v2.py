"""Mindora AI iteration 2 backend tests.

Covers: PATCH /auth/me parent_email, curriculum (overview/list/lesson/quiz/complete),
voice STT+TTS round-trip, visual SVG+image generation, parent digest preview/send/view.
"""
import io
import os
import json
import time
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://teaching-flow-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@mindora.ai"
ADMIN_PASSWORD = "Admin@Mindora2026"

_state = {}


@pytest.fixture(scope="module", autouse=True)
def login_admin():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    _state["token"] = r.json()["token"]
    _state["user_id"] = r.json()["id"]
    yield


def _h():
    return {"Authorization": f"Bearer {_state['token']}", "Content-Type": "application/json"}


# ---------- Health / version ----------
def test_root_version():
    r = requests.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data.get("service") == "Mindora AI"
    assert data.get("version") == "1.1"


# ---------- PATCH /auth/me ----------
def test_patch_me_parent_email():
    r = requests.patch(f"{API}/auth/me", json={"parent_email": "parent@test.com"}, headers=_h(), timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["parent_email"] == "parent@test.com"
    # Verify persistence with /me
    r2 = requests.get(f"{API}/auth/me", headers=_h(), timeout=30)
    assert r2.json()["parent_email"] == "parent@test.com"


# ---------- Curriculum ----------
def test_curriculum_overview():
    r = requests.get(f"{API}/curriculum/overview", headers=_h(), timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["grades"] == [6, 7, 8, 9, 10, 11, 12]
    assert set(d["subjects"].keys()) == {"math", "science", "english", "coding"}
    assert d["total_lessons"] == 108


def test_curriculum_list_9_science():
    r = requests.get(f"{API}/curriculum/9/science", headers=_h(), timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["grade"] == 9
    assert d["subject"] == "science"
    assert isinstance(d["lessons"], list)
    assert len(d["lessons"]) >= 3
    for l in d["lessons"]:
        assert "slug" in l and "title" in l and "completed" in l


def test_curriculum_lesson_content():
    slug = "g9s-bio-evolution"
    r = requests.get(f"{API}/curriculum/lesson/{slug}", headers=_h(), timeout=90)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["lesson"]["slug"] == slug
    content = d["content"]
    for k in ["intro", "key_idea", "story", "tiny_experiment", "check_questions"]:
        assert k in content
    # Socratic: should include guiding questions (intro or check_questions should have '?')
    full_text = (content.get("intro", "") + " " + " ".join(content.get("check_questions", []) or []))
    assert "?" in full_text, f"Expected Socratic question, got: {full_text[:200]}"
    assert isinstance(d["completed"], bool)


def test_curriculum_lesson_route_no_collision():
    # /curriculum/lesson/{slug} must NOT collide with /curriculum/{grade}/{subject}
    r = requests.get(f"{API}/curriculum/lesson/g7s-photosynthesis", headers=_h(), timeout=90)
    assert r.status_code == 200, f"Route ordering bug; got {r.status_code}: {r.text[:200]}"
    d = r.json()
    assert d["lesson"]["slug"] == "g7s-photosynthesis"


def test_curriculum_quiz():
    slug = "g9s-bio-evolution"
    r = requests.get(f"{API}/curriculum/quiz/{slug}", headers=_h(), timeout=90)
    assert r.status_code == 200, r.text
    d = r.json()
    questions = d.get("questions", [])
    assert len(questions) == 4, f"Expected 4 questions, got {len(questions)}"
    for q in questions:
        assert "options" in q and len(q["options"]) == 4
        assert "correct_index" in q
        assert "explanation" in q
    _state["quiz_questions"] = questions


def test_curriculum_complete_lesson():
    slug = "g9s-bio-evolution"
    # First fetch user xp
    me1 = requests.get(f"{API}/auth/me", headers=_h(), timeout=15).json()
    xp_before = me1.get("xp", 0)

    # Submit perfect answers
    qs = _state.get("quiz_questions") or requests.get(f"{API}/curriculum/quiz/{slug}", headers=_h(), timeout=60).json()["questions"]
    answers = [q["correct_index"] for q in qs]
    r = requests.post(f"{API}/curriculum/lesson/{slug}/complete", json={"answers": answers}, headers=_h(), timeout=30)
    assert r.status_code == 200, r.text
    res = r.json()
    assert res["total"] == 4
    assert res["correct"] == 4
    assert res["score_pct"] == 100
    assert res["passed"] is True

    # Verify XP increased by 50 (only first time)
    me2 = requests.get(f"{API}/auth/me", headers=_h(), timeout=15).json()
    if res["passed"]:
        # may already be completed from a prior run -- just check >= xp_before
        assert me2["xp"] >= xp_before


# ---------- Voice TTS + STT round trip ----------
def test_voice_tts():
    r = requests.post(f"{API}/voice/tts", json={"text": "Hi, this is Mindora.", "voice": "nova"}, headers=_h(), timeout=60)
    assert r.status_code == 200, r.text[:200]
    assert "audio/mpeg" in r.headers.get("content-type", "")
    assert len(r.content) > 5000
    _state["tts_audio"] = r.content


def test_voice_stt_roundtrip():
    audio = _state.get("tts_audio")
    if not audio:
        pytest.skip("TTS audio not available")
    files = {"audio": ("speech.mp3", io.BytesIO(audio), "audio/mpeg")}
    headers = {"Authorization": f"Bearer {_state['token']}"}
    r = requests.post(f"{API}/voice/stt", files=files, headers=headers, timeout=90)
    assert r.status_code == 200, r.text[:300]
    data = r.json()
    assert "text" in data
    assert len(data["text"].strip()) > 0


# ---------- Visual generation ----------
def test_visual_svg():
    payload = {
        "question": "What is gravity?",
        "response": "Imagine an invisible string pulling apples toward the earth. Everything with mass has this invisible pull.",
    }
    r = requests.post(f"{API}/visual/generate", json=payload, headers=_h(), timeout=60)
    assert r.status_code == 200, r.text[:300]
    d = r.json()
    assert d["type"] in {"svg", "image", "none"}
    if d["type"] == "svg":
        assert "<svg" in d["svg"]
        # brand color check (lenient — any one of these)
        brand = ["#4F46E5", "#06B6D4", "#8B5CF6", "#EC4899", "#10B981", "#FBBF24"]
        assert any(c.lower() in d["svg"].lower() for c in brand), "expected at least one brand color"


def test_visual_image_or_svg():
    payload = {
        "question": "How does photosynthesis work?",
        "response": "A plant uses sunlight, water and air to build its own food, the way a tiny kitchen turns ingredients into a meal.",
    }
    r = requests.post(f"{API}/visual/generate", json=payload, headers=_h(), timeout=120)
    assert r.status_code == 200, r.text[:300]
    d = r.json()
    assert d["type"] in {"image", "svg", "none"}
    if d["type"] == "image":
        assert "data" in d and len(d["data"]) > 100


# ---------- Parent digest ----------
def test_parent_preview():
    r = requests.get(f"{API}/parent/preview", headers=_h(), timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "student" in d and "name" in d["student"]
    assert "parent_email" in d
    assert "completed_lessons" in d
    assert "chat_sessions" in d


def test_parent_send_digest_no_email():
    # Clear parent_email
    r = requests.patch(f"{API}/auth/me", json={"parent_email": None}, headers=_h(), timeout=30)
    # PATCH accepts only fields not None — workaround: set to empty string is invalid email.
    # Instead, directly set parent_email to None via a tiny side door: keep existing and check
    # Pydantic with None on EmailStr is skipped. So we set in db isn't accessible. Use trick:
    # Send empty body shouldn't unset. We must rely on the user starting with parent_email cleared.
    # Workaround: send a sentinel value first to a non-existent state — but PATCH only sets when not None.
    # So instead: set parent_email to invalid-and-then-test? We can't.
    # Pragmatic approach: directly call send-digest after ensuring NOT having parent_email by registering
    # a fresh user.
    fresh_email = f"nopar+{int(time.time())}{uuid.uuid4().hex[:4]}@mindora.ai"
    rr = requests.post(f"{API}/auth/register", json={"email": fresh_email, "password": "Student@2026", "name": "NoPar", "grade": 9}, timeout=30)
    assert rr.status_code == 200, rr.text
    tok = rr.json()["token"]
    r2 = requests.post(f"{API}/parent/send-digest", headers={"Authorization": f"Bearer {tok}"}, timeout=30)
    assert r2.status_code == 400
    assert "parent email" in r2.json().get("detail", "").lower()


def test_parent_send_digest_success():
    # Set parent_email back to Resend test inbox
    r = requests.patch(f"{API}/auth/me", json={"parent_email": "delivered@resend.dev"}, headers=_h(), timeout=30)
    assert r.status_code == 200
    assert r.json()["parent_email"] == "delivered@resend.dev"

    r2 = requests.post(f"{API}/parent/send-digest", headers=_h(), timeout=60)
    assert r2.status_code == 200, r2.text[:400]
    d = r2.json()
    assert d.get("ok") is True
    assert isinstance(d.get("email_id"), str)
    assert d["email_id"].startswith("re_") or len(d["email_id"]) > 5
