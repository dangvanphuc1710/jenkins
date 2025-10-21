from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
import psycopg2

SECRET = "supersecret"
ALGORITHM = "HS256"

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== DATABASE =====
conn = psycopg2.connect(
    host="localhost",
    dbname="mydb",
    user="postgres",
    password="123456"
)
cur = conn.cursor()
cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
);
""")
cur.execute("""
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    title TEXT,
    price FLOAT
);
""")
conn.commit()

# ===== MODELS =====
class User(BaseModel):
    username: str
    password: str

class Product(BaseModel):
    title: str
    price: float

# ===== AUTH =====
def create_token(data: dict):
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(hours=4)
    return jwt.encode(to_encode, SECRET, algorithm=ALGORITHM)

def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        decoded = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
        return decoded
    except:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")

# ===== API =====
@app.post("/api/register")
def register(user: User):
    try:
        cur.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (user.username, user.password))
        conn.commit()
        return {"detail": "Đăng ký thành công"}
    except:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Username đã tồn tại")

@app.post("/api/login")
def login(user: User):
    cur.execute("SELECT * FROM users WHERE username=%s AND password=%s", (user.username, user.password))
    data = cur.fetchone()
    if not data:
        raise HTTPException(status_code=401, detail="Sai tài khoản hoặc mật khẩu")
    token = create_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/api/products")
def list_products(user=Depends(verify_token)):
    cur.execute("SELECT id, title, price FROM products ORDER BY id DESC")
    rows = cur.fetchall()
    return {"products": [{"id":r[0],"title":r[1],"price":r[2]} for r in rows]}

@app.post("/api/products")
def add_product(p: Product, user=Depends(verify_token)):
    cur.execute("INSERT INTO products (title, price) VALUES (%s, %s)", (p.title, p.price))
    conn.commit()
    return {"detail": "Đã thêm sản phẩm"}
