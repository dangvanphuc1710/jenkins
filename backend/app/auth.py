import os
import jwt
import datetime
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.hash import bcrypt

SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")
security = HTTPBearer()

def hash_password(password: str) -> str:
    return bcrypt.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.verify(password, hashed)
    except Exception:
        return False

def create_token(user_id: int) -> str:
    payload = {"user_id": user_id, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12)}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def decode_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return int(payload.get("user_id"))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
