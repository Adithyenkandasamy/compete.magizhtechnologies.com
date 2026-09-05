import uuid

import pytest
from httpx import AsyncClient

from app.models.enums import UserRole
from tests.api.test_auth import create_test_user


@pytest.fixture
async def profile_auth(client: AsyncClient, session) -> dict:
    email = f"profile_{uuid.uuid4()}@example.com"
    await create_test_user(session, email=email, role=UserRole.STUDENT)
    login_res = await client.post(
        "/api/auth/login",
        data={"username": email, "password": "StrongPass123!"},
    )
    token = login_res.json()["access_token"]
    return {"email": email, "token": token}


@pytest.mark.asyncio
async def test_get_my_profile(client: AsyncClient, profile_auth: dict):
    """1. getting the authenticated user's profile"""
    response = await client.get(
        "/api/me/profile",
        headers={"Authorization": f"Bearer {profile_auth['token']}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Test User"
    assert "user_id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_update_my_profile(client: AsyncClient, profile_auth: dict):
    """2. updating the authenticated user's profile"""
    payload = {
        "full_name": "Updated Name",
        "college": "Anna University",
        "department": "CSE",
        "year": 3,
        "skills": ["Python", "React"],
        "phone": "+919999999999",
        "bio": "Hello world",
    }
    response = await client.put(
        "/api/me/profile",
        json=payload,
        headers={"Authorization": f"Bearer {profile_auth['token']}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"
    assert data["college"] == "Anna University"
    assert data["department"] == "CSE"
    assert data["year"] == 3
    assert data["skills"] == ["Python", "React"]


@pytest.mark.asyncio
async def test_profile_requires_auth(client: AsyncClient):
    """3. profile endpoints require a valid token"""
    response = await client.get("/api/me/profile")
    assert response.status_code == 401