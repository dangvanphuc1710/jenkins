from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from ..db import engine
from ..auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/api/users")

class UserIn(BaseModel):
    username: str
    password: str

@router.post("/register")
def register(user: UserIn):
    if not user.username.strip() or not user.password.strip():
        raise HTTPException(status_code=400, detail="username and password required")
    with engine.begin() as conn:
        exists = conn.execute(text("SELECT id FROM users WHERE username=:u"), {"u": user.username}).fetchone()
        if exists:
            raise HTTPException(status_code=400, detail="User already exists")
        conn.execute(text("INSERT INTO users(username,password) VALUES(:u,:p)"),
                     {"u": user.username, "p": hash_password(user.password)})
    return {"message": "registered"}

@router.post("/login")
def login(user: UserIn):
    with engine.connect() as conn:
        dbuser = conn.execute(text("SELECT id, username, password FROM users WHERE username=:u"), {"u": user.username}).fetchone()
        if not dbuser or not verify_password(user.password, dbuser.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = create_token(dbuser.id)
        return {"token": token}
