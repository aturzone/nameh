import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.config import settings

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

@pytest.fixture(scope="session", autouse=True)
def anyio_backend():
    return "asyncio"

@pytest.fixture(scope="function")
async def db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture(scope="function")
async def client(db):
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

@pytest.mark.anyio
async def test_health(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@pytest.mark.anyio
async def test_register_and_login(client):
    # Register
    reg_data = {
        "email": "test@nameh.me",
        "username": "testuser",
        "password": "testpassword",
        "display_name": "Test User"
    }
    response = await client.post("/api/auth/register", json=reg_data)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["username"] == "testuser"

    # Login
    login_data = {
        "login": "testuser",
        "password": "testpassword"
    }
    response = await client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    token = data["access_token"]

    # Get Profile
    response = await client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"

@pytest.mark.anyio
async def test_mail_endpoints(client):
    # Register and get token
    reg_data = {"email": "mail@nameh.me", "username": "mailuser", "password": "password"}
    response = await client.post("/api/auth/register", json=reg_data)
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Check Folders
    response = await client.get("/api/mail/folders", headers=headers)
    assert response.status_code == 200
    assert "folders" in response.json()

    # Check Emails
    response = await client.get("/api/mail/emails", headers=headers)
    assert response.status_code == 200
    assert "emails" in response.json()

    # Check Settings
    response = await client.get("/api/users/settings", headers=headers)
    assert response.status_code == 200
    assert "language" in response.json()
