from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from ..db import engine
from ..auth import decode_token
from pydantic import BaseModel

router = APIRouter(prefix="/api/products")

class ProductIn(BaseModel):
    title: str
    price: int

@router.get("/")
def list_products():
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT id, title, price FROM products ORDER BY id DESC")).mappings().all()
        return {"products": list(rows)}

@router.post("/")
def create_product(p: ProductIn, user_id: int = Depends(decode_token)):
    with engine.begin() as conn:
        conn.execute(text("INSERT INTO products(title,price,owner_id) VALUES(:t,:p,:o)"),
                     {"t": p.title, "p": p.price, "o": user_id})
    return {"message": "created"}

@router.delete("/{pid}")
def delete_product(pid: int, user_id: int = Depends(decode_token)):
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM products WHERE id=:id AND owner_id=:o"), {"id": pid, "o": user_id})
    return {"message": "deleted"}
