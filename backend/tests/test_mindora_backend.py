"""Mindora AI backend regression tests.

Covers: health, auth (register/login/me/logout), LMS dashboard, chat SSE
streaming + persistence, and public /demo/teach endpoint.
"""
import json
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://teaching-flow-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@mindora.ai"
ADMIN_PASSWORD = "Admin@Mindora2026"


# ---------- shared state ----------
_state = {}


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- 1. Health ----------
def test_health_root(client):
    r = client.get(f"{API}/")
    assert r.status_code == 200
    data = r.json()
    assert data.get("service") == "Mindora AI"
    assert data.get("ok") is True


# ---------- 2. Register (new student) ----------
def test_register_new_student(client):
    email = f"student.test+{int(time.time())}{uuid.uuid4().hex[:4]}@mindora.ai"
    payload = {"email": email, "password": "Student@2026", "name": "Alex Chen", "grade": 9}
    r = client.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["email"] == email
    assert data["name"] == "Alex Chen"
    assert data["grade"] == 9
    assert data["role"] == "student"
    assert isinstance(data.get("token"), str) and len(data["token"]) > 20
    assert "access_token" in r.cookies
    _state["student_email"] = email
    _state["student_token"] = data["token"]
    _state["student_id"] = data["id"]


def test_register_duplicate_email(client):
    email = _state.get("student_email")
    assert email
    r = client.post(f"{API}/auth/register", json={
        "email": email, "password": "Student@2026", "name": "Dup", "grade": 9,
    })
    assert r.status_code == 400


# ---------- 3. Login ----------
def test_login_admin_success(client):
    r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["email"] == ADMIN_EMAIL
    assert data["role"] == "admin"
    assert isinstance(data.get("token"), str)
    assert "access_token" in r.cookies
    _state["admin_token"] = data["token"]


def test_login_wrong_password(client):
    r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong-password"})
    assert r.status_code == 401


# ---------- 4. /auth/me ----------
def test_me_with_bearer(client):
    token = _state.get("admin_token")
    r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == ADMIN_EMAIL
    # ensure mongo _id is not leaked
    assert "_id" not in data
    assert "password_hash" not in data


def test_me_without_token():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


# ---------- 5. LMS dashboard ----------
def test_lms_dashboard(client):
    token = _state["admin_token"]
    r = requests.get(f"{API}/lms/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    d = r.json()
    assert "user" in d and "xp" in d["user"] and "streak" in d["user"] and "level" in d["user"]
    assert len(d["subjects"]) == 4
    assert len(d["goals"]) == 4
    assert len(d["weekly_activity"]) == 7
    assert d["mentor_status"] == "online"
    assert isinstance(d["concepts_mastered"], int)
    assert isinstance(d["understanding_score"], int)
    # weekly activity shape
    for row in d["weekly_activity"]:
        assert "day" in row and "minutes" in row and "concepts" in row


def test_lms_dashboard_unauth():
    r = requests.get(f"{API}/lms/dashboard")
    assert r.status_code == 401


# ---------- 6. AI Teacher SSE streaming ----------
def test_chat_teach_streaming(client):
    token = _state["admin_token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {"question": "What is photosynthesis?", "model": "claude"}
    with requests.post(f"{API}/chat/teach", json=payload, headers=headers, stream=True, timeout=120) as r:
        assert r.status_code == 200
        assert "text/event-stream" in r.headers.get("content-type", "")
        session_id = None
        deltas = []
        done = False
        for raw in r.iter_lines(decode_unicode=True):
            if not raw or not raw.startswith("data: "):
                continue
            evt = json.loads(raw[6:])
            t = evt.get("type")
            if t == "session":
                session_id = evt["session_id"]
            elif t == "delta":
                deltas.append(evt["content"])
            elif t == "error":
                pytest.fail(f"LLM stream error: {evt.get('message')}")
            elif t == "done":
                done = True
                break
        assert session_id, "no session event"
        assert done, "no done event"
        assert len(deltas) > 0, "no delta tokens"
        full = "".join(deltas)
        assert len(full) > 50
        # Socratic style check: should include a question mark (guided discovery)
        assert "?" in full, f"Expected Socratic question but got: {full[:200]}"
        _state["session_id"] = session_id
        _state["assistant_text"] = full


# ---------- 7. Chat persistence ----------
def test_chat_sessions_list(client):
    token = _state["admin_token"]
    r = requests.get(f"{API}/chat/sessions", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    sessions = r.json()
    ids = [s["id"] for s in sessions]
    assert _state["session_id"] in ids


def test_chat_session_messages(client):
    token = _state["admin_token"]
    sid = _state["session_id"]
    r = requests.get(f"{API}/chat/sessions/{sid}/messages", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    msgs = r.json()
    assert len(msgs) >= 2
    assert msgs[0]["role"] == "user"
    assert "photosynthesis" in msgs[0]["content"].lower()
    assert msgs[1]["role"] == "assistant"
    assert len(msgs[1]["content"]) > 20


# ---------- 8. Public demo endpoint ----------
def test_public_demo_teach(client):
    r = requests.post(f"{API}/demo/teach", json={"question": "Why is the sky blue?"}, timeout=120)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "answer" in data and isinstance(data["answer"], str)
    assert len(data["answer"]) > 50


# ---------- 9. Logout ----------
def test_logout(client):
    token = _state["admin_token"]
    r = requests.post(f"{API}/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json().get("ok") is True
