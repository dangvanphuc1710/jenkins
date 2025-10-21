import React, { useEffect, useState } from "react";
import { authHeaders } from "./api";

type Product = { id: number; title: string; price: number; owner_id?: number; owner_name?: string };

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number | "">("");

  async function refresh() {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
      alert("Không lấy được product: " + (err as any).message);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return alert("Nhập title");
    try {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ title, price: Number(price) || 0 })
      });
      setTitle(""); setPrice("");
      refresh();
    } catch (err: any) {
      alert("Thêm thất bại: " + err.message + ". Hãy đăng nhập trước.");
    }
  }

  async function remove(id: number) {
    if (!confirm("Xóa sản phẩm này?")) return;
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE", headers: authHeaders() });
      refresh();
    } catch (err: any) {
      alert("Xóa thất bại: " + err.message);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto" }}>
      <h2>Quản lý sản phẩm</h2>
      <form onSubmit={add} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input placeholder="title" value={title} onChange={e => setTitle(e.target.value)} style={{ flex: 1 }} />
        <input placeholder="price" type="number" value={price as any} onChange={e => setPrice(e.target.value === "" ? "" : Number(e.target.value))} />
        <button type="submit">Thêm</button>
      </form>

      <ul>
        {products.map(p =>
          <li key={p.id} style={{ marginBottom: 8 }}>
            <b>#{p.id}</b> {p.title} — {p.price} VNĐ {p.owner_name ? `(owner: ${p.owner_name})` : ""}
            &nbsp; <button onClick={() => remove(p.id)}>Xóa</button>
          </li>
        )}
      </ul>
    </div>
  );
}
