from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import text
from .db import engine, init_db
import os
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta

# --- Cấu hình ---
SECRET_KEY = "day-la-khoa-bi-mat-cua-ban-va-nen-duoc-thay-doi"
ALGORITHM = "HS260"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# --- Khởi tạo ---
app = FastAPI(title="Demo API (FastAPI + Postgres)")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

# --- CORS Middleware ---
origins_str = os.getenv("CORS_ORIGINS", "http://localhost,http://54.163.18.105")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins_str.split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# --- Pydantic Models ---
class ItemIn(BaseModel):
    title: str

class UserIn(BaseModel):
    username: str
    password: str

# --- Helper functions (Hàm hỗ trợ Auth) ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token không hợp lệ (sub)")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Token không hợp lệ (jwt error)")

# --- Sự kiện Startup ---
@app.on_event("startup")
def on_startup():
    init_db()

# --- API Endpoints ---

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/register")
def register(user: UserIn):
    hashed_password = get_password_hash(user.password)
    try:
        with engine.begin() as conn:
            conn.execute(
                text("""INSERT INTO "user" (username, password) VALUES (:u, :p)"""),
                {"u": user.username, "p": hashed_password}
            )
        return {"detail": "Đăng ký thành công"}
    except Exception as e:
        if "unique constraint" in str(e).lower():
             raise HTTPException(status_code=400, detail="Username đã tồn tại")
        raise HTTPException(status_code=500, detail=f"Lỗi server: {e}")

@app.post("/api/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    with engine.connect() as conn:
        res = conn.execute(
            text("""SELECT * FROM "user" WHERE username = :u"""),
            {"u": form_data.username}
        ).mappings().first()
    
    if not res:
        raise HTTPException(status_code=400, detail="Sai username hoặc password")
    
    if not verify_password(form_data.password, res['password']):
        raise HTTPException(status_code=400, detail="Sai username hoặc password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": res['username']}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- API Protected (Bắt buộc đăng nhập) ---

@app.get("/api/items")
def list_items(current_user: str = Depends(get_current_user)):
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT id, title FROM items ORDER BY id DESC")).mappings().all()
        return {"items": list(rows)}

@app.post("/api/items", status_code=201)
def create_item(item: ItemIn, current_user: str = Depends(get_current_user)):
    if not item.title.strip():
        raise HTTPException(status_code=400, detail="Title is required.")
    with engine.begin() as conn:
        conn.execute(text("INSERT INTO items(title) VALUES(:t)"), {"t": item.title})
    return {"message": "created"}