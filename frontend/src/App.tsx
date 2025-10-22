import React, { useEffect, useState } from "react";

// === API Helpers (Tách ra cho dễ quản lý) ===
async function apiRegister(username: string, password: string) {
    const res = await fetch("/api/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, password })
    });
    return res.json();
}

async function apiLogin(username: string, password: string) {
    const body = new URLSearchParams();
    body.append('username', username);
    body.append('password', password);
    
    const res = await fetch("/api/token", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: body
    });
    return res.json();
}

async function apiGetItems(token: string) {
     const res = await fetch("/api/items", {
         headers: { Authorization: `Bearer ${token}` }
     });
     return res.json();
}

async function apiAddItem(token: string, title: string) {
    await fetch("/api/items", {
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
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [health, setHealth] = useState<string>("checking...");
  const [items, setItems] = useState<{id:number, title:string}[]>([]);
  const [title, setTitle] = useState("");

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
      setItems([]);
  }

  async function refresh() {
    if (!token) return;
    
    const h = await fetch("/api/health").then(r=>r.json()).catch(()=>({status:"fail"}));
    setHealth(h.status ?? "fail");
    
    try {
        const it = await apiGetItems(token);
        setItems(it.items || []);
    } catch (err) {
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  
  // === GIAO DIỆN ===
  
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