from fastapi import APIRouter

from . import users, tracks, playlists, likes, auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(tracks.router, prefix="/tracks", tags=["tracks"])
api_router.include_router(playlists.router, prefix="/playlists", tags=["playlists"])
api_router.include_router(likes.router, prefix="/likes", tags=["likes"]) 