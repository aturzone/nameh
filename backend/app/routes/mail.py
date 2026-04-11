from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.services.stalwart import StalwartService
from app.utils.security import get_current_user
from app.models.user import User
from app.utils.rate_limit import RateLimiter

router = APIRouter()


class JmapSessionResponse(BaseModel):
    jmap_url: str
    capabilities: dict | None = None


class MailboxListResponse(BaseModel):
    mailboxes: list[dict]


@router.get("/jmap-session", dependencies=[Depends(RateLimiter(times=50, seconds=60))])
async def get_jmap_session(user: User = Depends(get_current_user)):
    stalwart = StalwartService()
    session = await stalwart.get_jmap_session()
    return {"jmap_url": f"{stalwart.base_url}/jmap", "session": session}


@router.post("/jmap", dependencies=[Depends(RateLimiter(times=100, seconds=60))])
async def proxy_jmap(
    body: dict,
    user: User = Depends(get_current_user),
):
    stalwart = StalwartService()
    result = await stalwart.jmap_request(body)
    return result


@router.get("/domains")
async def list_domains(user: User = Depends(get_current_user)):
    stalwart = StalwartService()
    domains = await stalwart.list_domains()
    return {"domains": domains}


@router.get("/labels")
async def list_labels(user: User = Depends(get_current_user)):
    # Mock labels for now to satisfy frontend
    return {
        "labels": [
            {"id": "lbl-1", "name": "Work", "color": "#3B82F6"},
            {"id": "lbl-2", "name": "Personal", "color": "#22C55E"}
        ]
    }


@router.get("/folders")
async def list_folders(user: User = Depends(get_current_user)):
    return {
        "folders": [
            {"name": "inbox", "unread": 5},
            {"name": "starred", "unread": 0},
            {"name": "sent", "unread": 0},
            {"name": "drafts", "unread": 2},
            {"name": "trash", "unread": 0},
            {"name": "spam", "unread": 0},
        ]
    }


@router.get("/emails")
async def list_emails(
    folder: str = "inbox",
    category: str = "",
    search: str = "",
    user: User = Depends(get_current_user)
):
    # Mock emails for now to satisfy frontend
    return {
        "emails": [
            {
                "id": "1",
                "subject": "Welcome to Nameh.me",
                "from_name": "Nameh Support",
                "from_addr": "support@nameh.me",
                "date": "2024-03-20T10:00:00Z",
                "is_read": False,
                "is_starred": True,
                "preview": "Thank you for choosing Nameh.me for your email needs. We are excited to have you on board!",
                "has_attachments": False
            },
            {
                "id": "2",
                "subject": "System Update & Security Report",
                "from_name": "System Admin",
                "from_addr": "admin@nameh.me",
                "date": "2024-03-19T15:30:00Z",
                "is_read": True,
                "is_starred": False,
                "preview": "We have successfully updated the mail server to version 2.0. All systems are operational.",
                "has_attachments": True
            }
        ]
    }


@router.get("/emails/{email_id}")
async def get_email(email_id: str, user: User = Depends(get_current_user)):
    # Mock email detail
    return {
        "id": email_id,
        "subject": "Welcome to Nameh.me",
        "from_name": "Nameh Support",
        "from_addr": "support@nameh.me",
        "to": [user.email],
        "date": "2024-03-20T10:00:00Z",
        "is_read": True,
        "is_starred": True,
        "body": "<h1>Welcome to Nameh.me!</h1><p>We are glad to have you here. This is your personal mailbox.</p>",
        "has_attachments": False,
        "labels": []
    }


@router.post("/emails/{email_id}/action")
async def email_action(email_id: str, body: dict, user: User = Depends(get_current_user)):
    return {"status": "ok"}


@router.post("/bulk-action")
async def bulk_action(body: dict, user: User = Depends(get_current_user)):
    return {"status": "ok"}


@router.post("/compose")
async def compose_email(body: dict, user: User = Depends(get_current_user)):
    return {"status": "sent"}


@router.delete("/emails/{email_id}")
async def delete_email(email_id: str, user: User = Depends(get_current_user)):
    return {"status": "deleted"}


@router.get("/status")
async def mail_status():
    stalwart = StalwartService()
    reachable = await stalwart.check_health()
    return {
        "stalwart_reachable": reachable,
        "smtp_port": 587,
        "imap_port": 993,
        "jmap_url": f"{stalwart.base_url}/jmap",
    }
