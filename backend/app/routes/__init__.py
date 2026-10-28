from app.routes.health import router as health_router
from app.routes.students import router as students_router
from app.routes.sessions import router as sessions_router
from app.routes.attendance import router as attendance_router
from app.routes.audio import router as audio_router
from app.routes.video import router as video_router
from app.routes.analytics import router as analytics_router
from app.routes.demo import router as demo_router

__all__ = [
    "health_router",
    "students_router",
    "sessions_router",
    "attendance_router",
    "audio_router",
    "video_router",
    "analytics_router",
    "demo_router"
]
