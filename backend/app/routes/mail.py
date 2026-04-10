from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.services.stalwart import StalwartService
from app.utils.security import get_current_user

router = APIRouter()


class JmapSessionResponse(BaseModel):
    jmap_url: str
    capabilities: dict | None = None


class MailboxListResponse(BaseModel):
    mailboxes: list[dict]


@router.get("/jmap-session")
async def get_jmap_session(current_user: dict = Depends(get_current_user)):
    stalwart = StalwartService()
    session = await stalwart.get_jmap_session()
    return {"jmap_url": f"{stalwart.base_url}/jmap", "session": session}


@router.post("/jmap")
async def proxy_jmap(
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    stalwart = StalwartService()
    result = await stalwart.jmap_request(body)
    return result


@router.get("/domains")
async def list_domains(current_user: dict = Depends(get_current_user)):
    stalwart = StalwartService()
    domains = await stalwart.list_domains()
    return {"domains": domains}


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
