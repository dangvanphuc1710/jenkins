from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from ..db import engine
from ..auth import decode_token

router = APIRouter(prefix="/api/products")

class ProductIn(BaseModel):
    title: str
    price: int = 0

@router.get("/")
def list_products():
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT p.id, p.title, p.price, p.owner_id, u.username as owner_name "
            "FROM products p LEFT JOIN users u ON u.id=p.owner_id ORDER BY p.id DESC"
        )).mappings().all()
        return {"products": list(rows)}

@router.post("/")
def create_product(p: ProductIn, user_id: int = Depends(decode_token)):
    if not p.title.strip():
        raise HTTPException(status_code=400, detail="Title required")
    with engine.begin() as conn:
        conn.execute(text("INSERT INTO products(title,price,owner_id) VALUES(:t,:pr,:o)"),
                     {"t": p.title, "pr": p.price, "o": user_id})
    return {"message": "created"}

@router.delete("/{pid}")
def delete_product(pid: int, user_id: int = Depends(decode_token)):
    with engine.begin() as conn:
        # delete only if owner matches (or you can allow admin later)
        conn.execute(text("DELETE FROM products WHERE id=:id AND owner_id=:o"), {"id": pid, "o": user_id})
    return {"message": "deleted"}

@router.put("/{pid}")
def update_product(pid: int, p: ProductIn, user_id: int = Depends(decode_token)):
    with engine.begin() as conn:
        row = conn.execute(text("SELECT owner_id FROM products WHERE id=:id"), {"id": pid}).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Not found")
        if row.owner_id != user_id:
            raise HTTPException(status_code=403, detail="Not owner")
        conn.execute(text("UPDATE products SET title=:t, price=:pr WHERE id=:id"), {"t": p.title, "pr": p.price, "id": pid})
    return {"message": "updated"}
