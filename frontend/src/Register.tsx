import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const t = await res.text();
        alert("Register failed: " + t);
        return;
      }
      alert("Đăng ký thành công. Mời đăng nhập.");
      nav("/login");
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto" }}>
      <h2>Đăng ký</h2>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input placeholder="username" value={username} onChange={e => setUsername(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Đăng ký</button>
      </form>
    </div>
  );
}
