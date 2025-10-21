import React, { useEffect, useState } from "react";
import { apiRegister, apiLogin, apiGetProducts, apiAddProduct } from "./api";

export default function App() {
  const [user, setUser] = useState<string | null>(localStorage.getItem("token"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState<{id:number, title:string, price:number}[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const res = await apiRegister(username, password);
    alert(res.detail || "Đăng ký thành công!");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await apiLogin(username, password);
    if (res.access_token) {
      localStorage.setItem("token", res.access_token);
      setUser(res.access_token);
    } else {
      alert(res.detail || "Sai tài khoản hoặc mật khẩu!");
    }
  }

  async function loadProducts() {
    if (!user) return;
    const res = await apiGetProducts(user);
    setProducts(res.products || []);
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;
    await apiAddProduct(user, title, parseFloat(price));
    setTitle("");
    setPrice("");
    loadProducts();
  }

  useEffect(() => {
    if (user) loadProducts();
  }, [user]);

  if (!user) {
    return (
      <div style={{maxWidth:400,margin:"80px auto",fontFamily:"system-ui"}}>
        <h2>Đăng nhập hoặc Đăng ký</h2>
        <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:8}}>
          <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button type="submit">Đăng nhập</button>
        </form>
        <button onClick={handleRegister} style={{marginTop:10}}>Đăng ký</button>
      </div>
    );
  }

  return (
    <div style={{maxWidth:700,margin:"40px auto",fontFamily:"system-ui"}}>
      <h1>Quản lý sản phẩm</h1>
      <button onClick={()=>{localStorage.removeItem("token");setUser(null);}}>Đăng xuất</button>
      <form onSubmit={addProduct} style={{display:"flex",gap:8,marginTop:20}}>
        <input placeholder="Tên sản phẩm" value={title} onChange={e=>setTitle(e.target.value)} style={{flex:1}} />
        <input placeholder="Giá" value={price} onChange={e=>setPrice(e.target.value)} style={{width:100}} />
        <button type="submit">Thêm</button>
      </form>
      <ul>
        {products.map(p => (
          <li key={p.id}>#{p.id} - {p.title} ({p.price}₫)</li>
        ))}
      </ul>
    </div>
  );
}
