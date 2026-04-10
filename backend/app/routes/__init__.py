from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.mail import router as mail_router

__all__ = ["health_router", "auth_router", "users_router", "mail_router"]
