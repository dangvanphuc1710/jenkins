import React, { useEffect, useState } from "react";

// === API Helpers (Tách ra cho dễ quản lý) ===
async function apiRegister(username: string, password: string) {
    // URL /api/register sẽ được Nginx proxy sang backend:8000
    const res = await fetch("/api/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, password })
    });
    return res.json();
}

async function apiLogin(username: string, password: string) {
    // Backend dùng OAuth2PasswordRequestForm, nên phải gửi dạng form-data
    const body = new URLSearchParams();
    body.append('username', username);
    body.append('password', password);
    
    const res = await fetch("/api/token", { // URL /api/token
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: body
    });
    return res.json();
}

async function apiGetItems(token: string) {
     const res = await fetch("/api/items", { // URL /api/items
         headers: { Authorization: `Bearer ${token}` }
     });
     return res.json();
}

async function apiAddItem(token: string, title: string) {
    await fetch("/api/items", { // URL /api/items
        method: "POST",
        headers: {
            "Content-Type":"application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({title})
    });
}
// === Kết thúc API Helpers ===


export default function App() {
  // State cho auth
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // State cho items (giống code cũ)
  const [health, setHealth] = useState<string>("checking...");
  const [items, setItems] = useState<{id:number, title:string}[]>([]);
  const [title, setTitle] = useState("");

  // === Hàm xử lý Auth ===
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    try {
        const res = await apiRegister(username, password);
        if(res.detail === "Đăng ký thành công") {
            alert("Đăng ký thành công! Vui lòng đăng nhập.");
            setUsername("");
            setPassword("");
        } else {
            alert(res.detail || "Lỗi không xác định");
        }
    } catch (err) {
        alert("Đăng ký thất bại");
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
        const res = await apiLogin(username, password);
        if (res.access_token) {
            localStorage.setItem("token", res.access_token);
            setToken(res.access_token);
            setUsername("");
            setPassword("");
        } else {
            alert(res.detail || "Sai tài khoản hoặc mật khẩu!");
        }
    } catch (err) {
         alert("Đăng nhập thất bại");
    }
  }
  
  function handleLogout() {
      localStorage.removeItem("token");
      setToken(null);
      setItems([]); // Xóa danh sách items cũ
  }

  // === Hàm xử lý Items (giống code cũ, nhưng dùng token) ===
  async function refresh() {
    if (!token) return; // Không có token thì không refresh
    
    // Check health (không cần token)
    const h = await fetch("/api/health").then(r=>r.json()).catch(()=>({status:"fail"}));
    setHealth(h.status ?? "fail");
    
    // Lấy items (cần token)
    try {
        const it = await apiGetItems(token);
        setItems(it.items || []);
    } catch (err) {
        // Có thể token hết hạn
        alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        handleLogout();
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !token) return;
    await apiAddItem(token, title);
    setTitle("");
    refresh();
  }

  useEffect(()=>{
      if (token) {
        refresh();
      }
      // Giữ dòng này để linter (vạch vàng) không báo lỗi
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  
  // === GIAO DIỆN ===
  
  // 1. Nếu CHƯA đăng nhập (không có token)
  if (!token) {
    return (
        <div style={{maxWidth: 400, margin: "80px auto", fontFamily: "system-ui, sans-serif"}}>
            <h2>Đăng nhập hoặc Đăng ký</h2>
            <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:10, padding:"10px 0"}}>
                <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} required style={{padding:8}} />
                <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required style={{padding:8}} />
                <button type="submit" style={{padding:8}}>Đăng nhập</button>
                <button type="button" onClick={handleRegister} style={{padding:8, background:"#eee"}}>Đăng ký</button>
            </form>
        </div>
    );
  }
  
  // 2. Nếu ĐÃ đăng nhập (có token)
  return (
    <div style={{maxWidth: 720, margin: "40px auto", fontFamily: "system-ui, sans-serif"}}>
      <button onClick={handleLogout} style={{float: 'right'}}>Đăng xuất</button>
      <h1>React + Vite + FastAPI + Postgres</h1>
      <p>Backend health: <b>{health}</b></p>
      <form onSubmit={addItem} style={{display:"flex", gap:8}}>
        <input
          placeholder="New item title"
          value={title}
          onChange={e=>setTitle(e.target.value)}
          style={{flex:1, padding:8}}
        />
        <button type="submit">Add</button>
      </form>
      <ul>
        {items.map(i=> <li key={i.id}>#{i.id}: {i.title}</li>)}
      </ul>
    </div>
  );
}