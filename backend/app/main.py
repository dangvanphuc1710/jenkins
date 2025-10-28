from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from .db import engine, init_db  # Import module kết nối cơ sở dữ liệu
import os

# Khởi tạo ứng dụng FastAPI
app = FastAPI(title="Demo API (FastAPI + Postgres)")

# Cấu hình CORS (cho phép gọi API từ frontend)
origins = [os.getenv("CORS_ORIGINS", "http://localhost")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Định nghĩa model cho dữ liệu đầu vào
class ItemIn(BaseModel):
    title: str

# Sự kiện chạy khi khởi động server (dùng để khởi tạo DB)
@app.on_event("startup")
def on_startup():
    init_db()

# Endpoint kiểm tra sức khỏe hệ thống
@app.get("/api/health")
def health():
    return {"status": "ok"}

# Lấy danh sách items
@app.get("/api/items")
def list_items():
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT id, title FROM items ORDER BY id DESC")
        ).mappings().all()
        return {"items": list(rows)}

# Tạo mới một item
@app.post("/api/items", status_code=201)
def create_item(item: ItemIn):
    if not item.title.strip():
        raise HTTPException(status_code=400, detail="Title is required.")

    with engine.begin() as conn:
        conn.execute(
            text("INSERT INTO items(title) VALUES(:t)"),
            {"t": item.title}
        )

    return {"message": "created"}
