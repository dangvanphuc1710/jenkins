import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const t = await res.text();
        alert("Login failed: " + t);
        return;
      }
      const data = await res.json();
      localStorage.setItem("token", data.token);
      alert("Đăng nhập thành công");
      nav("/products");
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto" }}>
      <h2>Đăng nhập</h2>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input placeholder="username" value={username} onChange={e => setUsername(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit">Đăng nhập</button>
          <button type="button" onClick={() => { localStorage.removeItem("token"); alert("Đã xóa token localStorage"); }}>Logout (xóa token)</button>
        </div>
      </form>
    </div>
  );
}
