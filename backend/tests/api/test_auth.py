import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.models.enums import AccountStatus, UserRole
from app.models.user import Profile, User


async def create_test_user(
    session: AsyncSession,
    email: str = "test@example.com",
    password: str = "StrongPass123!",
    role: UserRole = UserRole.STUDENT,
    status: AccountStatus = AccountStatus.ACTIVE,
) -> User:
    """Helper to create a user directly in the test DB."""
    user = User(
        email=email,
        password_hash=get_password_hash(password),
        role=role,
        status=status,
    )
    session.add(user)
    await session.flush()

    profile = Profile(user_id=user.id, full_name="Test User")
    session.add(profile)
    await session.commit()
    await session.refresh(user)
    return user


@pytest.mark.asyncio
async def test_successful_registration(client: AsyncClient):
    """1. successful registration"""
    payload = {
        "email": "newuser@example.com",
        "password": "ValidPassword123!",
        "full_name": "New User",
    }
    response = await client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["role"] == "STUDENT"
    assert data["status"] == "ACTIVE"
    assert "password_hash" not in data


@pytest.mark.asyncio
async def test_duplicate_email(client: AsyncClient, session: AsyncSession):
    """2. duplicate email"""
    await create_test_user(session, email="duplicate@example.com")
    
    payload = {
        "email": "duplicate@example.com",
        "password": "ValidPassword123!",
        "full_name": "New User",
    }
    response = await client.post("/api/auth/register", json=payload)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_invalid_registration_data(client: AsyncClient):
    """3. invalid registration data"""
    payload = {
        "email": "not-an-email",
        "password": "short",
        "full_name": "N",
    }
    response = await client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_successful_login(client: AsyncClient, session: AsyncSession):
    """4. successful login"""
    await create_test_user(session, email="login@example.com", password="Password123!")
    
    payload = {"username": "login@example.com", "password": "Password123!"}
    response = await client.post("/api/auth/login", data=payload)
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_wrong_password(client: AsyncClient, session: AsyncSession):
    """5. wrong password"""
    await create_test_user(session, email="wrongpass@example.com", password="Password123!")
    
    payload = {"username": "wrongpass@example.com", "password": "WrongPassword!"}
    response = await client.post("/api/auth/login", data=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_nonexistent_account_login(client: AsyncClient):
    """6. nonexistent account login"""
    payload = {"username": "doesnotexist@example.com", "password": "Password123!"}
    response = await client.post("/api/auth/login", data=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_with_valid_token(client: AsyncClient, session: AsyncSession):
    """7. /me with valid token"""
    await create_test_user(session, email="valid@example.com", password="Password123!")
    login_res = await client.post(
        "/api/auth/login", data={"username": "valid@example.com", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]

    response = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "valid@example.com"
    assert "password_hash" not in response.json()


@pytest.mark.asyncio
async def test_me_without_token(client: AsyncClient):
    """8. /me without token"""
    response = await client.get("/api/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_with_invalid_token(client: AsyncClient):
    """9. /me with invalid token"""
    response = await client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_suspended_user_authentication(client: AsyncClient, session: AsyncSession):
    """10. suspended user authentication"""
    await create_test_user(session, email="suspended@example.com", status=AccountStatus.SUSPENDED)
    
    payload = {"username": "suspended@example.com", "password": "StrongPass123!"}
    response = await client.post("/api/auth/login", data=payload)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_student_accessing_admin_protected_endpoint(client: AsyncClient, session: AsyncSession):
    """11. student accessing admin-protected endpoint"""
    await create_test_user(session, email="student@example.com", role=UserRole.STUDENT)
    login_res = await client.post(
        "/api/auth/login", data={"username": "student@example.com", "password": "StrongPass123!"}
    )
    token = login_res.json()["access_token"]

    # We need a dummy admin endpoint to test this
    from fastapi import APIRouter, Depends
    from app.api.deps import require_admin
    
    router = APIRouter()
    @router.get("/test-admin", dependencies=[Depends(require_admin)])
    async def dummy_admin():
        return {"msg": "ok"}
    
    from app.main import app
    app.include_router(router)

    response = await client.get("/test-admin", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_accessing_admin_protected_endpoint(client: AsyncClient, session: AsyncSession):
    """12. admin accessing admin-protected endpoint"""
    await create_test_user(session, email="admin@example.com", role=UserRole.ADMIN)
    login_res = await client.post(
        "/api/auth/login", data={"username": "admin@example.com", "password": "StrongPass123!"}
    )
    token = login_res.json()["access_token"]

    # Reusing the dummy admin endpoint from above test if run sequentially,
    # but the router is already included.
    response = await client.get("/test-admin", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
