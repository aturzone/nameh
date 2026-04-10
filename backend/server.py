import os
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import jwt, JWTError
from passlib.context import CryptContext

app = FastAPI(title="Nameh.me API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "nameh-preview-secret-key"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer()

# ── In-Memory Storage ────────────────────────────────
users_db = {}
emails_db = {}
folders_db = {}

DEMO_USER_ID = str(uuid.uuid4())
DEMO_EMAIL = "demo@nameh.me"

def seed_demo_data():
    hashed = pwd_context.hash("demo123")
    users_db[DEMO_USER_ID] = {
        "id": DEMO_USER_ID,
        "email": DEMO_EMAIL,
        "username": "demo",
        "display_name": "Demo User",
        "hashed_password": hashed,
        "is_active": True,
        "is_admin": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    now = datetime.now(timezone.utc)
    sample_emails = [
        {
            "id": str(uuid.uuid4()),
            "folder": "inbox",
            "from_addr": "team@nameh.me",
            "from_name": "Nameh.me Team",
            "to": [DEMO_EMAIL],
            "subject": "Welcome to Nameh.me",
            "preview": "Welcome to the future of email. Your account is ready and we are excited to have you on board...",
            "body": "<h2>Welcome to Nameh.me</h2><p>Your account is ready. Nameh.me is built for speed, privacy, and scale.</p><p>Here are a few things you can do:</p><ul><li>Send and receive emails</li><li>Organize with folders and labels</li><li>Customize your settings</li></ul><p>Enjoy your new email experience!</p>",
            "date": (now - timedelta(minutes=15)).isoformat(),
            "is_read": False,
            "is_starred": True,
            "has_attachments": False,
            "labels": ["important"],
        },
        {
            "id": str(uuid.uuid4()),
            "folder": "inbox",
            "from_addr": "security@nameh.me",
            "from_name": "Nameh.me Security",
            "to": [DEMO_EMAIL],
            "subject": "Your security settings",
            "preview": "We recommend enabling two-factor authentication to keep your account secure...",
            "body": "<h2>Secure Your Account</h2><p>We recommend enabling two-factor authentication (2FA) for your Nameh.me account.</p><p>Visit Settings to configure your security preferences.</p>",
            "date": (now - timedelta(hours=2)).isoformat(),
            "is_read": False,
            "is_starred": False,
            "has_attachments": False,
            "labels": ["security"],
        },
        {
            "id": str(uuid.uuid4()),
            "folder": "inbox",
            "from_addr": "ali.reza@nameh.me",
            "from_name": "Ali Reza",
            "to": [DEMO_EMAIL],
            "subject": "Project meeting tomorrow",
            "preview": "Hi, just a reminder about our project meeting scheduled for tomorrow at 10 AM...",
            "body": "<p>Hi,</p><p>Just a reminder about our project meeting scheduled for tomorrow at 10 AM. Please review the documents I shared earlier.</p><p>Best regards,<br>Ali</p>",
            "date": (now - timedelta(hours=5)).isoformat(),
            "is_read": True,
            "is_starred": False,
            "has_attachments": True,
            "labels": [],
        },
        {
            "id": str(uuid.uuid4()),
            "folder": "inbox",
            "from_addr": "sara.m@nameh.me",
            "from_name": "Sara Mohammadi",
            "to": [DEMO_EMAIL],
            "subject": "Design review feedback",
            "preview": "I have reviewed the latest design mockups and have some feedback to share...",
            "body": "<p>Hi there,</p><p>I have reviewed the latest design mockups and here is my feedback:</p><ol><li>The color palette looks great</li><li>Navigation could be more intuitive</li><li>Consider adding dark mode support</li></ol><p>Let me know your thoughts!</p><p>Sara</p>",
            "date": (now - timedelta(days=1)).isoformat(),
            "is_read": True,
            "is_starred": True,
            "has_attachments": True,
            "labels": ["design"],
        },
        {
            "id": str(uuid.uuid4()),
            "folder": "inbox",
            "from_addr": "newsletter@tech.io",
            "from_name": "Tech Weekly",
            "to": [DEMO_EMAIL],
            "subject": "This week in tech: AI breakthroughs and more",
            "preview": "Catch up on the latest tech news including breakthroughs in artificial intelligence...",
            "body": "<h2>Tech Weekly Newsletter</h2><p>This week's top stories:</p><ul><li>New AI model achieves human-level reasoning</li><li>Quantum computing milestone reached</li><li>Open source email platforms on the rise</li></ul>",
            "date": (now - timedelta(days=2)).isoformat(),
            "is_read": True,
            "is_starred": False,
            "has_attachments": False,
            "labels": ["newsletter"],
        },
        {
            "id": str(uuid.uuid4()),
            "folder": "sent",
            "from_addr": DEMO_EMAIL,
            "from_name": "Demo User",
            "to": ["ali.reza@nameh.me"],
            "subject": "Re: Project meeting tomorrow",
            "preview": "Thanks Ali, I will review the documents and see you at the meeting...",
            "body": "<p>Thanks Ali, I will review the documents and see you at the meeting.</p><p>Best,<br>Demo</p>",
            "date": (now - timedelta(hours=4)).isoformat(),
            "is_read": True,
            "is_starred": False,
            "has_attachments": False,
            "labels": [],
        },
        {
            "id": str(uuid.uuid4()),
            "folder": "sent",
            "from_addr": DEMO_EMAIL,
            "from_name": "Demo User",
            "to": ["sara.m@nameh.me"],
            "subject": "Re: Design review feedback",
            "preview": "Great feedback Sara! I agree with all your points, especially about dark mode...",
            "body": "<p>Great feedback Sara! I agree with all your points, especially about dark mode. Let's discuss in our next sync.</p>",
            "date": (now - timedelta(hours=20)).isoformat(),
            "is_read": True,
            "is_starred": False,
            "has_attachments": False,
            "labels": [],
        },
        {
            "id": str(uuid.uuid4()),
            "folder": "drafts",
            "from_addr": DEMO_EMAIL,
            "from_name": "Demo User",
            "to": ["team@nameh.me"],
            "subject": "Q1 Report Draft",
            "preview": "Here is the draft for our Q1 report. Please review and provide feedback...",
            "body": "<p>Here is the draft for our Q1 report.</p><p>[Draft content...]</p>",
            "date": (now - timedelta(hours=1)).isoformat(),
            "is_read": True,
            "is_starred": False,
            "has_attachments": True,
            "labels": [],
        },
        {
            "id": str(uuid.uuid4()),
            "folder": "spam",
            "from_addr": "promo@deals-xyz.com",
            "from_name": "Amazing Deals",
            "to": [DEMO_EMAIL],
            "subject": "You won a prize! Click here!",
            "preview": "Congratulations! You have been selected as a winner...",
            "body": "<p>Congratulations! You have been selected...</p>",
            "date": (now - timedelta(days=1)).isoformat(),
            "is_read": False,
            "is_starred": False,
            "has_attachments": False,
            "labels": [],
        },
        {
            "id": str(uuid.uuid4()),
            "folder": "spam",
            "from_addr": "noreply@scam-site.net",
            "from_name": "Account Alert",
            "to": [DEMO_EMAIL],
            "subject": "Urgent: Verify your account now",
            "preview": "Your account will be suspended unless you verify immediately...",
            "body": "<p>Your account will be suspended...</p>",
            "date": (now - timedelta(days=3)).isoformat(),
            "is_read": False,
            "is_starred": False,
            "has_attachments": False,
            "labels": [],
        },
    ]

    for email in sample_emails:
        email["user_id"] = DEMO_USER_ID
        emails_db[email["id"]] = email

seed_demo_data()

# ── Auth Helpers ─────────────────────────────────────

def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(hours=24)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id or user_id not in users_db:
            raise HTTPException(status_code=401, detail="Invalid token")
        return users_db[user_id]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ── Models ───────────────────────────────────────────

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

class EmailAction(BaseModel):
    action: str  # read, unread, star, unstar, trash, spam, move
    target_folder: str | None = None

# ── Health ───────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "healthy", "services": {"api": "healthy", "database": "mock", "redis": "mock"}, "version": "0.1.0"}

@app.get("/api/health/live")
async def live():
    return {"status": "alive"}

# ── Auth ─────────────────────────────────────────────

@app.post("/api/auth/register")
async def register(body: RegisterReq):
    for u in users_db.values():
        if u["email"] == body.email or u["username"] == body.username:
            raise HTTPException(status_code=409, detail="Email or username already exists")
    
    user_id = str(uuid.uuid4())
    users_db[user_id] = {
        "id": user_id,
        "email": body.email,
        "username": body.username,
        "display_name": body.display_name or body.username,
        "hashed_password": pwd_context.hash(body.password),
        "is_active": True,
        "is_admin": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    
    welcome = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "folder": "inbox",
        "from_addr": "team@nameh.me",
        "from_name": "Nameh.me Team",
        "to": [body.email],
        "subject": "Welcome to Nameh.me",
        "preview": "Welcome! Your email account is ready.",
        "body": "<h2>Welcome to Nameh.me</h2><p>Your account is set up and ready to use.</p>",
        "date": datetime.now(timezone.utc).isoformat(),
        "is_read": False,
        "is_starred": False,
        "has_attachments": False,
        "labels": [],
    }
    emails_db[welcome["id"]] = welcome
    
    token = create_token({"sub": user_id, "username": body.username})
    return {"access_token": token, "token_type": "bearer", "user_id": user_id, "username": body.username}

@app.post("/api/auth/login")
async def login(body: LoginReq):
    user = None
    for u in users_db.values():
        if u["email"] == body.login or u["username"] == body.login:
            user = u
            break
    if not user or not pwd_context.verify(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token({"sub": user["id"], "username": user["username"]})
    return {"access_token": token, "token_type": "bearer", "user_id": user["id"], "username": user["username"]}

# ── Users ────────────────────────────────────────────

@app.get("/api/users/me")
async def get_profile(user=Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "username": user["username"],
        "display_name": user["display_name"],
        "is_active": user["is_active"],
        "is_admin": user["is_admin"],
        "created_at": user["created_at"],
    }

@app.patch("/api/users/me")
async def update_profile(body: dict, user=Depends(get_current_user)):
    if "display_name" in body:
        users_db[user["id"]]["display_name"] = body["display_name"]
    return users_db[user["id"]]

# ── Mail ─────────────────────────────────────────────

@app.get("/api/mail/folders")
async def get_folders(user=Depends(get_current_user)):
    user_emails = [e for e in emails_db.values() if e["user_id"] == user["id"]]
    folder_counts = {}
    for e in user_emails:
        f = e["folder"]
        if f not in folder_counts:
            folder_counts[f] = {"total": 0, "unread": 0}
        folder_counts[f]["total"] += 1
        if not e["is_read"]:
            folder_counts[f]["unread"] += 1
    
    default_folders = ["inbox", "sent", "drafts", "trash", "spam"]
    result = []
    for f in default_folders:
        counts = folder_counts.get(f, {"total": 0, "unread": 0})
        result.append({"name": f, "total": counts["total"], "unread": counts["unread"]})
    return {"folders": result}

@app.get("/api/mail/emails")
async def get_emails(folder: str = "inbox", search: str = "", user=Depends(get_current_user)):
    user_emails = [e for e in emails_db.values() if e["user_id"] == user["id"] and e["folder"] == folder]
    if search:
        q = search.lower()
        user_emails = [e for e in user_emails if q in e["subject"].lower() or q in e["preview"].lower() or q in e["from_name"].lower()]
    user_emails.sort(key=lambda x: x["date"], reverse=True)
    safe = [{k: v for k, v in e.items() if k != "body"} for e in user_emails]
    return {"emails": safe, "total": len(safe)}

@app.get("/api/mail/emails/{email_id}")
async def get_email(email_id: str, user=Depends(get_current_user)):
    email = emails_db.get(email_id)
    if not email or email["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Email not found")
    email["is_read"] = True
    return email

@app.post("/api/mail/emails/{email_id}/action")
async def email_action(email_id: str, body: EmailAction, user=Depends(get_current_user)):
    email = emails_db.get(email_id)
    if not email or email["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Email not found")
    
    if body.action == "read":
        email["is_read"] = True
    elif body.action == "unread":
        email["is_read"] = False
    elif body.action == "star":
        email["is_starred"] = True
    elif body.action == "unstar":
        email["is_starred"] = False
    elif body.action == "trash":
        email["folder"] = "trash"
    elif body.action == "spam":
        email["folder"] = "spam"
    elif body.action == "move" and body.target_folder:
        email["folder"] = body.target_folder
    
    return {"status": "ok"}

@app.delete("/api/mail/emails/{email_id}")
async def delete_email(email_id: str, user=Depends(get_current_user)):
    email = emails_db.get(email_id)
    if not email or email["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Email not found")
    if email["folder"] == "trash":
        del emails_db[email_id]
    else:
        email["folder"] = "trash"
    return {"status": "ok"}

@app.post("/api/mail/compose")
async def compose(body: ComposeReq, user=Depends(get_current_user)):
    email = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "folder": body.folder,
        "from_addr": user["email"],
        "from_name": user["display_name"],
        "to": body.to,
        "subject": body.subject,
        "preview": body.body[:120].replace("<", "").replace(">", ""),
        "body": body.body,
        "date": datetime.now(timezone.utc).isoformat(),
        "is_read": True,
        "is_starred": False,
        "has_attachments": False,
        "labels": [],
    }
    emails_db[email["id"]] = email
    return email

@app.get("/api/mail/status")
async def mail_status():
    return {
        "stalwart_reachable": True,
        "smtp_port": 587,
        "imap_port": 993,
        "jmap_url": "/jmap",
        "total_accounts": len(users_db),
        "total_emails": len(emails_db),
    }
