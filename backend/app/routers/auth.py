"""Google SSO via OAuth 2.0 Authorization Code flow.

The browser hits `/api/auth/login`, bounces through Google, and returns to
`/api/auth/callback`. On success we store the user's email in a signed session
cookie (Starlette SessionMiddleware); `get_current_user` reads it on every request.
Any Google account with a verified email is allowed.
"""
from authlib.integrations.starlette_client import OAuth, OAuthError
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@router.get("/login")
async def login(request: Request):
    redirect_uri = f"{settings.public_base_url.rstrip('/')}/api/auth/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/callback")
async def callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError:
        raise HTTPException(status_code=401, detail="Google sign-in failed")

    userinfo = token.get("userinfo") or {}
    email = (userinfo.get("email") or "").lower()
    if not email or not userinfo.get("email_verified"):
        raise HTTPException(status_code=401, detail="No verified email from Google")

    # Upsert: reuse the existing single-user row if its email already matches.
    user = db.scalars(select(User).where(User.email == email)).first()
    if user is None:
        user = User(email=email, display_name=userinfo.get("name") or email)
        db.add(user)
        db.commit()

    request.session["user_email"] = email
    return RedirectResponse(url=settings.frontend_url, status_code=303)


@router.get("/me")
def me(db: Session = Depends(get_db), request: Request = None):
    email = request.session.get("user_email")
    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = db.scalars(select(User).where(User.email == email)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "currency": user.currency,
        "onboarded": user.onboarded_at is not None,
    }


@router.post("/logout")
def logout(request: Request):
    request.session.clear()
    return {"status": "ok"}



