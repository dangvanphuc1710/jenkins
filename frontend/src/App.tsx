import React from "react";
import { Link } from "react-router-dom";

export default function App() {
  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>React + Vite + FastAPI + Postgres</h1>
      <p>
        <Link to="/login">Đăng nhập</Link>{" "} | {" "}
        <Link to="/register">Đăng ký</Link>{" "} | {" "}
        <Link to="/products">Quản lý sản phẩm</Link>
      </p>
      <p>Giao diện demo — dùng menu trên để chuyển trang.</p>
    </div>
  );
}
