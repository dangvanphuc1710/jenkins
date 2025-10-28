# Trong file backend/app/main.py

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

# Import các thành phần từ file db.py của bạn (Giả định)
# Bạn CẦN CHỈNH SỬA phần này để khớp với file db.py và models.py của bạn
from . import db  # Giả sử db.py chứa logic session và models
# from . import models # Giả sử bạn có file models.py định nghĩa User

# --- Giả định cấu trúc model và DB Session (Bạn cần thay thế bằng code thật của mình) ---
# Đây CHỈ LÀ VÍ DỤ để code chạy được
# Giả sử bạn có model User trong file models.py
# class User(Base):
#     __tablename__ = "users"
#     id = Column(Integer, primary_key=True, index=True)
#     username = Column(String, unique=True, index=True)
#     hashed_password = Column(String)

# Giả sử bạn có hàm get_db trong db.py
def get_db():
    database = db.SessionLocal() # Giả sử SessionLocal từ db.py
    try:
        yield database
    finally:
        database.close()
# --- Hết phần giả định ---


# Thư viện bảo mật
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta

# Cấu hình bảo mật
PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "YOUR_VERY_SECRET_KEY"  # <-- THAY BẰNG MỘT KHÓA BÍ MẬT MẠNH
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app = FastAPI() # Giả sử app của bạn được khởi tạo ở đây

# --- Schemas (Pydantic Models) ---
class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Hàm Hỗ trợ Bảo mật ---
def verify_password(plain_password, hashed_password):
    return PWD_CONTEXT.verify(plain_password, hashed_password)

def get_password_hash(password):
    return PWD_CONTEXT.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Hàm (giả định) để lấy user từ DB
def get_user(db: Session, username: str):
    # Thay thế 'models.User' bằng model User thật của bạn
    # return db.query(models.User).filter(models.User.username == username).first()
    
    # ---- GIẢ ĐỊNH ----
    # Đây là code giả định, BẠN PHẢI THAY BẰNG TRUY VẤN DB THẬT
    if username == "testuser":
        return {"username": "testuser", "hashed_password": get_password_hash("testpass")}
    return None
    # ------------------


# === ENDPOINT ĐĂNG KÝ ===
@app.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # 1. Kiểm tra xem user đã tồn tại chưa
    db_user = get_user(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # 2. Mã hóa mật khẩu
    hashed_password = get_password_hash(user.password)
    
    # 3. Tạo user mới (Bạn cần thay 'models.User' bằng model của bạn)
    # db_user_obj = models.User(username=user.username, hashed_password=hashed_password)
    # db.add(db_user_obj)
    # db.commit()
    # db.refresh(db_user_obj)
    
    # Code giả định (xóa đi khi có DB thật)
    print(f"Đã tạo user: {user.username} với hash: {hashed_password}")
    
    return {"username": user.username, "message": "User created successfully"}

# === ENDPOINT ĐĂNG NHẬP (Tạo Token) ===
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Lấy user từ DB
    user = get_user(db, form_data.username)
    
    # 2. Xác thực
    if not user or not verify_password(form_data.password, user["hashed_password"]): # Sửa user.hashed_password nếu dùng model thật
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 3. Tạo token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires # Sửa user.username nếu dùng model thật
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# (Thêm các endpoint khác của bạn ở đây...)