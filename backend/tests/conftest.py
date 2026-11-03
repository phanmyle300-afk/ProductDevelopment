import uuid
from unittest.mock import AsyncMock, MagicMock
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.models.user import User, UserRole


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_recruiter():
    return User(
        id=uuid.uuid4(),
        email="recruiter@talentscout.ai",
        full_name="Senior Talent Specialist",
        role=UserRole.RECRUITER,
        is_active=True,
    )


@pytest.fixture
def mock_admin():
    return User(
        id=uuid.uuid4(),
        email="admin@talentscout.ai",
        full_name="TalentScout Administrator",
        role=UserRole.ADMIN,
        is_active=True,
    )


@pytest.fixture
def mock_hiring_manager():
    return User(
        id=uuid.uuid4(),
        email="hm@talentscout.ai",
        full_name="Engineering Hiring Manager",
        role=UserRole.HIRING_MANAGER,
        is_active=True,
    )


@pytest.fixture
def mock_interviewer():
    return User(
        id=uuid.uuid4(),
        email="interviewer@talentscout.ai",
        full_name="Lead Tech Interviewer",
        role=UserRole.INTERVIEWER,
        is_active=True,
    )


@pytest.fixture
def mock_read_only():
    return User(
        id=uuid.uuid4(),
        email="readonly@talentscout.ai",
        full_name="Auditor ReadOnly",
        role=UserRole.READ_ONLY,
        is_active=True,
    )


@pytest.fixture
def mock_db():
    session = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.get = AsyncMock()
    session.execute = AsyncMock()
    return session
