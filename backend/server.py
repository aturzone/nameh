import os
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import jwt, JWTError
from passlib.context import CryptContext
from pymongo import MongoClient

app = FastAPI(title="Nameh.me API", version="0.3.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "nameh_preview")
SECRET_KEY = "nameh-preview-secret-key"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer()

client = MongoClient(MONGO_URL)
db = client[DB_NAME]
users_col = db["users"]
emails_col = db["emails"]
labels_col = db["labels"]
settings_col = db["settings"]

# Ensure indexes
users_col.create_index("email", unique=True, sparse=True)
users_col.create_index("username", unique=True, sparse=True)
emails_col.create_index("user_id")
emails_col.create_index([("user_id", 1), ("folder", 1)])
labels_col.create_index("user_id")
settings_col.create_index("user_id", unique=True, sparse=True)

DEMO_EMAIL = "demo@nameh.me"

DEFAULT_LABELS = [
    {"id": "lbl-work", "name": "Work", "color": "#EF4444"},
    {"id": "lbl-personal", "name": "Personal", "color": "#22C55E"},
    {"id": "lbl-project", "name": "Project", "color": "#3B82F6"},
    {"id": "lbl-finance", "name": "Finance", "color": "#F59E0B"},
    {"id": "lbl-travel", "name": "Travel", "color": "#8B5CF6"},
]


def seed():
    if users_col.find_one({"email": DEMO_EMAIL}):
        return
    uid = str(uuid.uuid4())
    users_col.insert_one({
        "uid": uid, "email": DEMO_EMAIL, "username": "demo",
        "display_name": "Demo User", "hashed_password": pwd_context.hash("demo123"),
        "is_active": True, "is_admin": False, "created_at": datetime.now(timezone.utc).isoformat(),
    })
    for lbl in DEFAULT_LABELS:
        labels_col.insert_one({**lbl, "user_id": uid})
    settings_col.insert_one({"user_id": uid, "language": "en", "font": "dm-sans", "signature": "", "theme": "light"})

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
        emails_col.insert_one({
            "eid": eid, "user_id": uid,
            "to": m.get("to_list", [DEMO_EMAIL]),
            **{k: v for k, v in m.items() if k != "to_list"},
        })

seed()

# ── Helpers ──────────────────────────────────────────

def doc_clean(doc):
    if doc is None:
        return None
    d = {k: v for k, v in doc.items() if k != "_id"}
    if "eid" in d:
        d["id"] = d.pop("eid")
    if "uid" in d:
        d["id"] = d.pop("uid")
    return d

# ── Auth ─────────────────────────────────────────────

def create_token(data: dict) -> str:
    return jwt.encode({**data, "exp": datetime.now(timezone.utc) + timedelta(hours=24)}, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("sub")
        if not uid:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = users_col.find_one({"uid": uid}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        user["id"] = user.pop("uid", uid)
        return user
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
    try:
        client.admin.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    return {"status": "healthy", "services": {"api": "healthy", "database": db_status, "storage": "mongodb"}, "version": "0.3.0"}

@app.get("/api/health/live")
async def live():
    return {"status": "alive"}

@app.post("/api/auth/register")
async def register(body: RegisterReq):
    if users_col.find_one({"$or": [{"email": body.email}, {"username": body.username}]}):
        raise HTTPException(status_code=409, detail="Email or username already exists")
    uid = str(uuid.uuid4())
    users_col.insert_one({"uid": uid, "email": body.email, "username": body.username,
        "display_name": body.display_name or body.username,
        "hashed_password": pwd_context.hash(body.password),
        "is_active": True, "is_admin": False, "created_at": datetime.now(timezone.utc).isoformat()})
    for lbl in DEFAULT_LABELS:
        labels_col.insert_one({**lbl, "user_id": uid})
    settings_col.insert_one({"user_id": uid, "language": "en", "font": "dm-sans", "signature": "", "theme": "light"})
    w_eid = str(uuid.uuid4())
    emails_col.insert_one({"eid": w_eid, "user_id": uid, "folder": "inbox", "category": "primary",
         "from_addr": "team@nameh.me", "from_name": "Nameh.me Team", "to": [body.email],
         "subject": "Welcome to Nameh.me", "preview": "Your account is ready.",
         "body": "<h2>Welcome!</h2><p>Your Nameh.me account is ready.</p>",
         "date": datetime.now(timezone.utc).isoformat(), "is_read": False, "is_starred": False,
         "has_attachments": False, "labels": [], "importance": "normal"})
    return {"access_token": create_token({"sub": uid, "username": body.username}), "token_type": "bearer", "user_id": uid, "username": body.username}

@app.post("/api/auth/login")
async def login(body: LoginReq):
    user = users_col.find_one({"$or": [{"email": body.login}, {"username": body.login}]}, {"_id": 0})
    if not user or not pwd_context.verify(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    uid = user["uid"]
    return {"access_token": create_token({"sub": uid, "username": user["username"]}), "token_type": "bearer", "user_id": uid, "username": user["username"]}

@app.get("/api/users/me")
async def get_profile(user=Depends(get_current_user)):
    return {k: v for k, v in user.items() if k != "hashed_password"}

@app.patch("/api/users/me")
async def update_profile(body: dict, user=Depends(get_current_user)):
    update = {}
    if "display_name" in body:
        update["display_name"] = body["display_name"]
    if update:
        users_col.update_one({"uid": user["id"]}, {"$set": update})
    updated = users_col.find_one({"uid": user["id"]}, {"_id": 0, "hashed_password": 0})
    if updated and "uid" in updated:
        updated["id"] = updated.pop("uid")
    return updated

# ── Settings ─────────────────────────────────────────

@app.get("/api/users/settings")
async def get_settings(user=Depends(get_current_user)):
    s = settings_col.find_one({"user_id": user["id"]}, {"_id": 0, "user_id": 0})
    return s or {"language": "en", "font": "dm-sans", "signature": "", "theme": "light"}

@app.patch("/api/users/settings")
async def update_settings(body: SettingsReq, user=Depends(get_current_user)):
    update = {k: v for k, v in body.dict(exclude_none=True).items()}
    if update:
        settings_col.update_one({"user_id": user["id"]}, {"$set": update}, upsert=True)
    s = settings_col.find_one({"user_id": user["id"]}, {"_id": 0, "user_id": 0})
    return s or {"language": "en", "font": "dm-sans", "signature": "", "theme": "light"}

# ── Labels ───────────────────────────────────────────

@app.get("/api/mail/labels")
async def get_labels(user=Depends(get_current_user)):
    lbls = list(labels_col.find({"user_id": user["id"]}, {"_id": 0, "user_id": 0}))
    return {"labels": lbls}

@app.post("/api/mail/labels")
async def create_label(body: LabelReq, user=Depends(get_current_user)):
    lbl = {"id": f"lbl-{uuid.uuid4().hex[:8]}", "name": body.name, "color": body.color, "user_id": user["id"]}
    labels_col.insert_one(lbl)
    return {"id": lbl["id"], "name": lbl["name"], "color": lbl["color"]}

@app.delete("/api/mail/labels/{label_id}")
async def delete_label(label_id: str, user=Depends(get_current_user)):
    labels_col.delete_one({"id": label_id, "user_id": user["id"]})
    return {"status": "ok"}

# ── Mail ─────────────────────────────────────────────

@app.get("/api/mail/folders")
async def get_folders(user=Depends(get_current_user)):
    uid = user["id"]
    pipeline = [
        {"$match": {"user_id": uid}},
        {"$group": {"_id": "$folder", "total": {"$sum": 1}, "unread": {"$sum": {"$cond": [{"$eq": ["$is_read", False]}, 1, 0]}}}}
    ]
    folder_counts = {r["_id"]: {"total": r["total"], "unread": r["unread"]} for r in emails_col.aggregate(pipeline)}
    starred = emails_col.count_documents({"user_id": uid, "is_starred": True})
    starred_unread = emails_col.count_documents({"user_id": uid, "is_starred": True, "is_read": False})
    result = []
    for f in ["inbox", "starred", "sent", "drafts", "trash", "spam"]:
        if f == "starred":
            result.append({"name": f, "total": starred, "unread": starred_unread})
        else:
            c = folder_counts.get(f, {"total": 0, "unread": 0})
            result.append({"name": f, "total": c["total"], "unread": c["unread"]})
    return {"folders": result}

@app.get("/api/mail/emails")
async def get_emails(folder: str = "inbox", category: str = "", search: str = "", user=Depends(get_current_user)):
    uid = user["id"]
    query = {"user_id": uid}
    if folder == "starred":
        query["is_starred"] = True
    else:
        query["folder"] = folder
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"subject": {"$regex": search, "$options": "i"}},
            {"preview": {"$regex": search, "$options": "i"}},
            {"from_name": {"$regex": search, "$options": "i"}},
        ]
    emails = list(emails_col.find(query, {"_id": 0, "body": 0}).sort("date", -1))
    for e in emails:
        if "eid" in e:
            e["id"] = e.pop("eid")
    return {"emails": emails, "total": len(emails)}

@app.get("/api/mail/emails/{email_id}")
async def get_email(email_id: str, user=Depends(get_current_user)):
    e = emails_col.find_one({"eid": email_id, "user_id": user["id"]}, {"_id": 0})
    if not e:
        raise HTTPException(status_code=404, detail="Email not found")
    emails_col.update_one({"eid": email_id}, {"$set": {"is_read": True}})
    e["is_read"] = True
    if "eid" in e:
        e["id"] = e.pop("eid")
    return e

@app.post("/api/mail/emails/{email_id}/action")
async def email_action(email_id: str, body: ActionReq, user=Depends(get_current_user)):
    e = emails_col.find_one({"eid": email_id, "user_id": user["id"]})
    if not e:
        raise HTTPException(status_code=404, detail="Email not found")
    update = {}
    if body.action == "read":
        update["is_read"] = True
    elif body.action == "unread":
        update["is_read"] = False
    elif body.action == "star":
        update["is_starred"] = True
    elif body.action == "unstar":
        update["is_starred"] = False
    elif body.action == "trash":
        update["folder"] = "trash"
    elif body.action == "spam":
        update["folder"] = "spam"
    elif body.action == "move" and body.target_folder:
        update["folder"] = body.target_folder
    elif body.action == "label" and body.target_folder:
        emails_col.update_one({"eid": email_id}, {"$addToSet": {"labels": body.target_folder}})
        return {"status": "ok"}
    elif body.action == "unlabel" and body.target_folder:
        emails_col.update_one({"eid": email_id}, {"$pull": {"labels": body.target_folder}})
        return {"status": "ok"}
    if update:
        emails_col.update_one({"eid": email_id}, {"$set": update})
    return {"status": "ok"}

@app.post("/api/mail/bulk-action")
async def bulk_action(body: BulkActionReq, user=Depends(get_current_user)):
    uid = user["id"]
    query = {"eid": {"$in": body.ids}, "user_id": uid}
    update = {}
    if body.action == "read":
        update["is_read"] = True
    elif body.action == "unread":
        update["is_read"] = False
    elif body.action == "trash":
        update["folder"] = "trash"
    elif body.action == "spam":
        update["folder"] = "spam"
    elif body.action == "star":
        update["is_starred"] = True
    elif body.action == "move" and body.target_folder:
        update["folder"] = body.target_folder
    if update:
        emails_col.update_many(query, {"$set": update})
    return {"status": "ok", "count": len(body.ids)}

@app.delete("/api/mail/emails/{email_id}")
async def delete_email(email_id: str, user=Depends(get_current_user)):
    e = emails_col.find_one({"eid": email_id, "user_id": user["id"]})
    if not e:
        raise HTTPException(status_code=404, detail="Email not found")
    if e["folder"] == "trash":
        emails_col.delete_one({"eid": email_id})
    else:
        emails_col.update_one({"eid": email_id}, {"$set": {"folder": "trash"}})
    return {"status": "ok"}

@app.post("/api/mail/compose")
async def compose(body: ComposeReq, user=Depends(get_current_user)):
    sig = ""
    s = settings_col.find_one({"user_id": user["id"]}, {"_id": 0})
    if s:
        sig = s.get("signature", "")
    full_body = body.body
    if sig:
        full_body += f"<br/><br/>--<br/>{sig}"
    eid = str(uuid.uuid4())
    e = {"eid": eid, "user_id": user["id"], "folder": body.folder, "category": "primary",
         "from_addr": user.get("email", ""), "from_name": user.get("display_name", ""), "to": body.to,
         "subject": body.subject, "preview": body.body[:120].replace("<", "").replace(">", ""),
         "body": full_body, "date": datetime.now(timezone.utc).isoformat(),
         "is_read": True, "is_starred": False, "has_attachments": False, "labels": [], "importance": "normal"}
    emails_col.insert_one(e)
    return {"id": eid, "user_id": user["id"], "folder": body.folder, "subject": body.subject,
            "date": e["date"], "is_read": True, "is_starred": False}

@app.get("/api/mail/status")
async def mail_status():
    return {"stalwart_reachable": True, "smtp_port": 587, "imap_port": 993, "jmap_url": "/jmap",
            "total_accounts": users_col.count_documents({}), "total_emails": emails_col.count_documents({})}
