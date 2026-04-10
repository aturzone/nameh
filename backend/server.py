import os
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import jwt, JWTError
from passlib.context import CryptContext

app = FastAPI(title="Nameh.me API", version="0.2.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

SECRET_KEY = "nameh-preview-secret-key"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer()

users_db = {}
emails_db = {}
labels_db = {}
settings_db = {}

DEMO_USER_ID = str(uuid.uuid4())
DEMO_EMAIL = "demo@nameh.me"

DEFAULT_LABELS = [
    {"id": "lbl-work", "name": "Work", "color": "#EF4444"},
    {"id": "lbl-personal", "name": "Personal", "color": "#22C55E"},
    {"id": "lbl-project", "name": "Project", "color": "#3B82F6"},
    {"id": "lbl-finance", "name": "Finance", "color": "#F59E0B"},
    {"id": "lbl-travel", "name": "Travel", "color": "#8B5CF6"},
]

def seed():
    users_db[DEMO_USER_ID] = {
        "id": DEMO_USER_ID, "email": DEMO_EMAIL, "username": "demo",
        "display_name": "Demo User", "hashed_password": pwd_context.hash("demo123"),
        "is_active": True, "is_admin": False, "created_at": datetime.now(timezone.utc).isoformat(),
    }
    labels_db[DEMO_USER_ID] = [dict(lbl, user_id=DEMO_USER_ID) for lbl in DEFAULT_LABELS]
    settings_db[DEMO_USER_ID] = {"language": "en", "font": "dm-sans", "signature": "", "theme": "light"}

    now = datetime.now(timezone.utc)
    mails = [
        {"folder": "inbox", "category": "primary", "from_addr": "team@nameh.me", "from_name": "Nameh.me Team",
         "subject": "Welcome to Nameh.me", "preview": "Welcome to the future of email. Your account is ready and we are excited to have you on board.",
         "body": "<h2>Welcome to Nameh.me</h2><p>Your account is ready. Nameh.me is built for speed, privacy, and scale.</p><ul><li>Send and receive emails securely</li><li>Organize with folders and labels</li><li>Use keyboard shortcuts for speed</li></ul><p>Press <kbd>?</kbd> to see keyboard shortcuts.</p>",
         "date": (now - timedelta(minutes=5)).isoformat(), "is_read": False, "is_starred": True, "has_attachments": False, "labels": ["lbl-work"], "importance": "high"},

        {"folder": "inbox", "category": "primary", "from_addr": "security@nameh.me", "from_name": "Nameh.me Security",
         "subject": "Secure your account with 2FA", "preview": "We recommend enabling two-factor authentication to keep your account safe from unauthorized access.",
         "body": "<h2>Enable Two-Factor Authentication</h2><p>We strongly recommend enabling 2FA for your account. Visit <strong>Settings &gt; Security</strong> to configure it.</p><p>Stay safe!</p>",
         "date": (now - timedelta(hours=1)).isoformat(), "is_read": False, "is_starred": False, "has_attachments": False, "labels": [], "importance": "normal"},

        {"folder": "inbox", "category": "primary", "from_addr": "ali.rezaei@nameh.me", "from_name": "Ali Rezaei",
         "subject": "Project meeting tomorrow at 10 AM", "preview": "Hi, just a quick reminder about our project sync meeting scheduled for tomorrow morning.",
         "body": "<p>Hi,</p><p>Just a quick reminder about our project sync meeting tomorrow at 10 AM. Please review the sprint board before the call.</p><p>Agenda:</p><ol><li>Sprint review</li><li>Blockers discussion</li><li>Next sprint planning</li></ol><p>See you there!<br/>Ali</p>",
         "date": (now - timedelta(hours=3)).isoformat(), "is_read": True, "is_starred": False, "has_attachments": True, "labels": ["lbl-work", "lbl-project"], "importance": "normal"},

        {"folder": "inbox", "category": "primary", "from_addr": "sara.mohammadi@nameh.me", "from_name": "Sara Mohammadi",
         "subject": "Design review feedback - v2.3", "preview": "Reviewed the latest mockups. The color system is solid. A few notes on the navigation patterns.",
         "body": "<p>Hi,</p><p>I reviewed the v2.3 design mockups. Here are my notes:</p><ol><li>Color system is excellent</li><li>Navigation feels smoother</li><li>Consider adding breadcrumbs</li><li>Dark mode contrast needs work</li></ol><p>Attached the annotated screenshots.</p><p>Sara</p>",
         "date": (now - timedelta(hours=8)).isoformat(), "is_read": True, "is_starred": True, "has_attachments": True, "labels": ["lbl-project"], "importance": "normal"},

        {"folder": "inbox", "category": "social", "from_addr": "connect@linkedin.com", "from_name": "LinkedIn",
         "subject": "You have 3 new connection requests", "preview": "Ahmad K., Maryam S., and 1 other person want to connect with you on LinkedIn.",
         "body": "<p>You have new connection requests on LinkedIn. Log in to view and accept them.</p>",
         "date": (now - timedelta(hours=12)).isoformat(), "is_read": True, "is_starred": False, "has_attachments": False, "labels": [], "importance": "low"},

        {"folder": "inbox", "category": "social", "from_addr": "noreply@github.com", "from_name": "GitHub",
         "subject": "[nameh-me/backend] Pull request #42 merged", "preview": "PR #42 'Add email threading support' has been merged into main by @developer.",
         "body": "<p><strong>Pull Request #42</strong> - Add email threading support</p><p>Merged into <code>main</code> by @developer</p><p>Changes: +340 -28</p>",
         "date": (now - timedelta(hours=6)).isoformat(), "is_read": False, "is_starred": False, "has_attachments": False, "labels": ["lbl-project"], "importance": "normal"},

        {"folder": "inbox", "category": "promotions", "from_addr": "deals@shop.ir", "from_name": "DigiKala",
         "subject": "Winter sale - up to 70% off electronics", "preview": "Don't miss our biggest winter sale. Premium electronics at unbeatable prices for a limited time.",
         "body": "<h2>Winter Sale</h2><p>Up to 70% off on premium electronics. Limited time offer!</p>",
         "date": (now - timedelta(days=1)).isoformat(), "is_read": True, "is_starred": False, "has_attachments": False, "labels": [], "importance": "low"},

        {"folder": "inbox", "category": "updates", "from_addr": "billing@cloud.ir", "from_name": "Cloud Services",
         "subject": "Your monthly invoice is ready", "preview": "Your invoice for December 2025 is ready. Total amount: 2,500,000 IRR.",
         "body": "<p>Your invoice for December 2025 is ready.</p><p><strong>Total: 2,500,000 IRR</strong></p><p>Due date: January 15, 2026</p>",
         "date": (now - timedelta(days=1, hours=6)).isoformat(), "is_read": False, "is_starred": False, "has_attachments": True, "labels": ["lbl-finance"], "importance": "normal"},

        {"folder": "inbox", "category": "primary", "from_addr": "reza.k@nameh.me", "from_name": "Reza Karimi",
         "subject": "Lunch tomorrow?", "preview": "Hey! Want to grab lunch tomorrow at that new place downtown? Around 1 PM works for me.",
         "body": "<p>Hey!</p><p>Want to grab lunch tomorrow at that new place downtown? I heard they have amazing kebab. Around 1 PM?</p><p>Reza</p>",
         "date": (now - timedelta(days=2)).isoformat(), "is_read": True, "is_starred": False, "has_attachments": False, "labels": ["lbl-personal"], "importance": "normal"},

        {"folder": "inbox", "category": "updates", "from_addr": "newsletter@tech-weekly.com", "from_name": "Tech Weekly",
         "subject": "This week: AI breakthroughs and the future of email", "preview": "Catch up on AI advances, quantum computing milestones, and how modern email platforms are changing communication.",
         "body": "<h2>Tech Weekly</h2><ul><li>New AI model achieves reasoning breakthrough</li><li>Quantum computing milestone</li><li>Modern email platforms rise</li><li>Open source infrastructure trends</li></ul>",
         "date": (now - timedelta(days=3)).isoformat(), "is_read": True, "is_starred": False, "has_attachments": False, "labels": [], "importance": "low"},

        {"folder": "sent", "from_addr": DEMO_EMAIL, "from_name": "Demo User", "category": "primary",
         "subject": "Re: Project meeting tomorrow at 10 AM", "preview": "Thanks Ali, I'll review the sprint board tonight. See you at the meeting.",
         "body": "<p>Thanks Ali, I'll review the sprint board tonight. See you at the meeting!</p>", "to_list": ["ali.rezaei@nameh.me"],
         "date": (now - timedelta(hours=2)).isoformat(), "is_read": True, "is_starred": False, "has_attachments": False, "labels": [], "importance": "normal"},

        {"folder": "sent", "from_addr": DEMO_EMAIL, "from_name": "Demo User", "category": "primary",
         "subject": "Re: Design review feedback - v2.3", "preview": "Great feedback Sara! I agree on all points. Let me work on the dark mode contrast.",
         "body": "<p>Great feedback Sara! Especially about the dark mode contrast. I'll push a fix today.</p>", "to_list": ["sara.mohammadi@nameh.me"],
         "date": (now - timedelta(hours=7)).isoformat(), "is_read": True, "is_starred": False, "has_attachments": False, "labels": [], "importance": "normal"},

        {"folder": "sent", "from_addr": DEMO_EMAIL, "from_name": "Demo User", "category": "primary",
         "subject": "Q1 planning document", "preview": "Hi team, attached is the Q1 planning document for review. Please share feedback by Friday.",
         "body": "<p>Hi team,</p><p>Attached is the Q1 planning document. Please review and share feedback by Friday.</p><p>Key areas:</p><ul><li>Product roadmap</li><li>Engineering milestones</li><li>Hiring plan</li></ul>",
         "to_list": ["team@nameh.me"],
         "date": (now - timedelta(days=1)).isoformat(), "is_read": True, "is_starred": False, "has_attachments": True, "labels": ["lbl-work"], "importance": "normal"},

        {"folder": "drafts", "from_addr": DEMO_EMAIL, "from_name": "Demo User", "category": "primary",
         "subject": "Q1 Report Draft", "preview": "Here is the draft for our Q1 report with all the metrics and analysis...",
         "body": "<p>Q1 Report Draft...</p><p>[Content being written]</p>", "to_list": ["team@nameh.me"],
         "date": (now - timedelta(hours=1)).isoformat(), "is_read": True, "is_starred": False, "has_attachments": True, "labels": ["lbl-work"], "importance": "normal"},

        {"folder": "spam", "from_addr": "promo@deals-xyz.com", "from_name": "Amazing Deals", "category": "promotions",
         "subject": "You won a $1,000,000 prize! Click here!", "preview": "Congratulations! You have been selected as our lucky winner this month...",
         "body": "<p>Congratulations! You have been selected...</p>",
         "date": (now - timedelta(days=1)).isoformat(), "is_read": False, "is_starred": False, "has_attachments": False, "labels": [], "importance": "low"},

        {"folder": "spam", "from_addr": "noreply@scam-site.net", "from_name": "Account Alert", "category": "updates",
         "subject": "URGENT: Verify your account immediately", "preview": "Your account will be permanently suspended unless you verify within 24 hours...",
         "body": "<p>Your account will be suspended...</p>",
         "date": (now - timedelta(days=2)).isoformat(), "is_read": False, "is_starred": False, "has_attachments": False, "labels": [], "importance": "low"},

        {"folder": "trash", "from_addr": "old@example.com", "from_name": "Old Contact", "category": "primary",
         "subject": "Outdated information", "preview": "This email contained outdated information and was moved to trash.",
         "body": "<p>Outdated content</p>",
         "date": (now - timedelta(days=5)).isoformat(), "is_read": True, "is_starred": False, "has_attachments": False, "labels": [], "importance": "low"},
    ]

    for m in mails:
        eid = str(uuid.uuid4())
        emails_db[eid] = {
            "id": eid, "user_id": DEMO_USER_ID,
            "to": m.get("to_list", [DEMO_EMAIL]),
            **{k: v for k, v in m.items() if k != "to_list"},
        }

seed()

# ── Auth ─────────────────────────────────────────────

def create_token(data: dict) -> str:
    return jwt.encode({**data, "exp": datetime.now(timezone.utc) + timedelta(hours=24)}, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("sub")
        if not uid or uid not in users_db:
            raise HTTPException(status_code=401, detail="Invalid token")
        return users_db[uid]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

class RegisterReq(BaseModel):
    email: str
    username: str
    password: str
    display_name: str | None = None

class LoginReq(BaseModel):
    login: str
    password: str

class ComposeReq(BaseModel):
    to: list[str]
    subject: str
    body: str
    folder: str = "sent"

class ActionReq(BaseModel):
    action: str
    target_folder: str | None = None

class BulkActionReq(BaseModel):
    ids: list[str]
    action: str
    target_folder: str | None = None

class LabelReq(BaseModel):
    name: str
    color: str

class SettingsReq(BaseModel):
    language: str | None = None
    font: str | None = None
    signature: str | None = None
    theme: str | None = None

# ── Routes ───────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "healthy", "services": {"api": "healthy", "database": "mock", "redis": "mock"}, "version": "0.2.0"}

@app.get("/api/health/live")
async def live():
    return {"status": "alive"}

@app.post("/api/auth/register")
async def register(body: RegisterReq):
    for u in users_db.values():
        if u["email"] == body.email or u["username"] == body.username:
            raise HTTPException(status_code=409, detail="Email or username already exists")
    uid = str(uuid.uuid4())
    users_db[uid] = {"id": uid, "email": body.email, "username": body.username,
        "display_name": body.display_name or body.username,
        "hashed_password": pwd_context.hash(body.password),
        "is_active": True, "is_admin": False, "created_at": datetime.now(timezone.utc).isoformat()}
    labels_db[uid] = [dict(lbl, user_id=uid) for lbl in DEFAULT_LABELS]
    settings_db[uid] = {"language": "en", "font": "dm-sans", "signature": "", "theme": "light"}
    w = {"id": str(uuid.uuid4()), "user_id": uid, "folder": "inbox", "category": "primary",
         "from_addr": "team@nameh.me", "from_name": "Nameh.me Team", "to": [body.email],
         "subject": "Welcome to Nameh.me", "preview": "Your account is ready.",
         "body": "<h2>Welcome!</h2><p>Your Nameh.me account is ready.</p>",
         "date": datetime.now(timezone.utc).isoformat(), "is_read": False, "is_starred": False,
         "has_attachments": False, "labels": [], "importance": "normal"}
    emails_db[w["id"]] = w
    return {"access_token": create_token({"sub": uid, "username": body.username}), "token_type": "bearer", "user_id": uid, "username": body.username}

@app.post("/api/auth/login")
async def login(body: LoginReq):
    user = next((u for u in users_db.values() if u["email"] == body.login or u["username"] == body.login), None)
    if not user or not pwd_context.verify(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": create_token({"sub": user["id"], "username": user["username"]}), "token_type": "bearer", "user_id": user["id"], "username": user["username"]}

@app.get("/api/users/me")
async def get_profile(user=Depends(get_current_user)):
    return {k: v for k, v in user.items() if k != "hashed_password"}

@app.patch("/api/users/me")
async def update_profile(body: dict, user=Depends(get_current_user)):
    if "display_name" in body:
        users_db[user["id"]]["display_name"] = body["display_name"]
    return {k: v for k, v in users_db[user["id"]].items() if k != "hashed_password"}

# ── Settings ─────────────────────────────────────────

@app.get("/api/users/settings")
async def get_settings(user=Depends(get_current_user)):
    return settings_db.get(user["id"], {"language": "en", "font": "dm-sans", "signature": "", "theme": "light"})

@app.patch("/api/users/settings")
async def update_settings(body: SettingsReq, user=Depends(get_current_user)):
    s = settings_db.setdefault(user["id"], {"language": "en", "font": "dm-sans", "signature": "", "theme": "light"})
    for k, v in body.dict(exclude_none=True).items():
        s[k] = v
    return s

# ── Labels ───────────────────────────────────────────

@app.get("/api/mail/labels")
async def get_labels(user=Depends(get_current_user)):
    return {"labels": labels_db.get(user["id"], [])}

@app.post("/api/mail/labels")
async def create_label(body: LabelReq, user=Depends(get_current_user)):
    lbl = {"id": f"lbl-{uuid.uuid4().hex[:8]}", "name": body.name, "color": body.color, "user_id": user["id"]}
    labels_db.setdefault(user["id"], []).append(lbl)
    return lbl

@app.delete("/api/mail/labels/{label_id}")
async def delete_label(label_id: str, user=Depends(get_current_user)):
    lbls = labels_db.get(user["id"], [])
    labels_db[user["id"]] = [lb for lb in lbls if lb["id"] != label_id]
    return {"status": "ok"}

# ── Mail ─────────────────────────────────────────────

@app.get("/api/mail/folders")
async def get_folders(user=Depends(get_current_user)):
    ue = [e for e in emails_db.values() if e["user_id"] == user["id"]]
    fc = {}
    for e in ue:
        f = e["folder"]
        fc.setdefault(f, {"total": 0, "unread": 0})
        fc[f]["total"] += 1
        if not e["is_read"]:
            fc[f]["unread"] += 1
    starred = sum(1 for e in ue if e["is_starred"])
    starred_unread = sum(1 for e in ue if e["is_starred"] and not e["is_read"])
    result = []
    for f in ["inbox", "starred", "sent", "drafts", "trash", "spam"]:
        if f == "starred":
            result.append({"name": f, "total": starred, "unread": starred_unread})
        else:
            c = fc.get(f, {"total": 0, "unread": 0})
            result.append({"name": f, "total": c["total"], "unread": c["unread"]})
    return {"folders": result}

@app.get("/api/mail/emails")
async def get_emails(folder: str = "inbox", category: str = "", search: str = "", user=Depends(get_current_user)):
    ue = [e for e in emails_db.values() if e["user_id"] == user["id"]]
    if folder == "starred":
        ue = [e for e in ue if e["is_starred"]]
    else:
        ue = [e for e in ue if e["folder"] == folder]
    if category:
        ue = [e for e in ue if e.get("category") == category]
    if search:
        q = search.lower()
        ue = [e for e in ue if q in e["subject"].lower() or q in e.get("preview", "").lower() or q in e.get("from_name", "").lower()]
    ue.sort(key=lambda x: x["date"], reverse=True)
    return {"emails": [{k: v for k, v in e.items() if k != "body"} for e in ue], "total": len(ue)}

@app.get("/api/mail/emails/{email_id}")
async def get_email(email_id: str, user=Depends(get_current_user)):
    e = emails_db.get(email_id)
    if not e or e["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Email not found")
    e["is_read"] = True
    return e

@app.post("/api/mail/emails/{email_id}/action")
async def email_action(email_id: str, body: ActionReq, user=Depends(get_current_user)):
    e = emails_db.get(email_id)
    if not e or e["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Email not found")
    actions = {"read": ("is_read", True), "unread": ("is_read", False), "star": ("is_starred", True), "unstar": ("is_starred", False)}
    if body.action in actions:
        k, v = actions[body.action]
        e[k] = v
    elif body.action == "trash":
        e["folder"] = "trash"
    elif body.action == "spam":
        e["folder"] = "spam"
    elif body.action == "move" and body.target_folder:
        e["folder"] = body.target_folder
    elif body.action == "label" and body.target_folder:
        if body.target_folder not in e.get("labels", []):
            e.setdefault("labels", []).append(body.target_folder)
    elif body.action == "unlabel" and body.target_folder:
        e["labels"] = [lb for lb in e.get("labels", []) if lb != body.target_folder]
    return {"status": "ok"}

@app.post("/api/mail/bulk-action")
async def bulk_action(body: BulkActionReq, user=Depends(get_current_user)):
    for eid in body.ids:
        e = emails_db.get(eid)
        if not e or e["user_id"] != user["id"]:
            continue
        if body.action == "read":
            e["is_read"] = True
        elif body.action == "unread":
            e["is_read"] = False
        elif body.action == "trash":
            e["folder"] = "trash"
        elif body.action == "spam":
            e["folder"] = "spam"
        elif body.action == "star":
            e["is_starred"] = True
        elif body.action == "move" and body.target_folder:
            e["folder"] = body.target_folder
    return {"status": "ok", "count": len(body.ids)}

@app.delete("/api/mail/emails/{email_id}")
async def delete_email(email_id: str, user=Depends(get_current_user)):
    e = emails_db.get(email_id)
    if not e or e["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Email not found")
    if e["folder"] == "trash":
        del emails_db[email_id]
    else:
        e["folder"] = "trash"
    return {"status": "ok"}

@app.post("/api/mail/compose")
async def compose(body: ComposeReq, user=Depends(get_current_user)):
    sig = settings_db.get(user["id"], {}).get("signature", "")
    full_body = body.body
    if sig:
        full_body += f"<br/><br/>--<br/>{sig}"
    e = {"id": str(uuid.uuid4()), "user_id": user["id"], "folder": body.folder, "category": "primary",
         "from_addr": user["email"], "from_name": user["display_name"], "to": body.to,
         "subject": body.subject, "preview": body.body[:120].replace("<", "").replace(">", ""),
         "body": full_body, "date": datetime.now(timezone.utc).isoformat(),
         "is_read": True, "is_starred": False, "has_attachments": False, "labels": [], "importance": "normal"}
    emails_db[e["id"]] = e
    return e

@app.get("/api/mail/status")
async def mail_status():
    return {"stalwart_reachable": True, "smtp_port": 587, "imap_port": 993, "jmap_url": "/jmap",
            "total_accounts": len(users_db), "total_emails": len(emails_db)}
