import httpx

from app.config import settings


class StalwartService:
    def __init__(self):
        self.base_url = settings.stalwart_url
        self.admin_user = settings.stalwart_admin_user
        self.admin_password = settings.stalwart_admin_password

    def _auth(self) -> tuple[str, str]:
        return (self.admin_user, self.admin_password)

    async def check_health(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self.base_url}/healthz")
                return resp.status_code == 200
        except Exception:
            return False

    async def create_account(
        self,
        username: str,
        password: str,
        email: str,
        display_name: str,
    ) -> bool:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"{self.base_url}/api/account",
                    json={
                        "name": username,
                        "secret": password,
                        "email": [email],
                        "description": display_name,
                        "type": "individual",
                    },
                    auth=self._auth(),
                )
                return resp.status_code in (200, 201)
        except Exception:
            return False

    async def delete_account(self, username: str) -> bool:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.delete(
                    f"{self.base_url}/api/account/{username}",
                    auth=self._auth(),
                )
                return resp.status_code in (200, 204)
        except Exception:
            return False

    async def list_domains(self) -> list:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{self.base_url}/api/domain",
                    auth=self._auth(),
                )
                if resp.status_code == 200:
                    return resp.json()
                return []
        except Exception:
            return []

    async def get_jmap_session(self) -> dict:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{self.base_url}/.well-known/jmap")
                if resp.status_code == 200:
                    return resp.json()
                return {}
        except Exception:
            return {}

    async def jmap_request(self, body: dict) -> dict:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"{self.base_url}/jmap",
                    json=body,
                    auth=self._auth(),
                )
                if resp.status_code == 200:
                    return resp.json()
                return {"error": resp.text}
        except Exception as e:
            return {"error": str(e)}
