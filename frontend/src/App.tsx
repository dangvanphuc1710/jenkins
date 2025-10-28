// Trong file frontend/src/App.tsx (hoặc component chứa form)

import React, { useState } from 'react';
// (import các file css, logo... của bạn)
import './App.css'; // Giả sử

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // Để hiển thị thông báo

  // Xử lý API URL
  // Dùng URL tuyệt đối đến IP của bạn. 
  // Hoặc nếu bạn đã cấu hình Nginx proxy, bạn có thể dùng đường dẫn tương đối
  const API_URL = 'http://54.163.18.105'; // <-- Đảm bảo đây là IP backend
  // Hoặc nếu Nginx đã proxy /api về backend: const API_URL = '/api';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn form submit theo cách truyền thống
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/register`, { // Endpoint từ FastAPI
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Xử lý lỗi từ server (vd: username đã tồn tại)
        throw new Error(data.detail || 'Something went wrong');
      }

      // Đăng ký thành công
      setMessage(`Đăng ký thành công tài khoản: ${data.username}! Vui lòng đăng nhập.`);
      setUsername('');
      setPassword('');

    } catch (error: any) {
      setMessage(`Lỗi đăng ký: ${error.message}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    // FastAPI endpoint /token yêu cầu 'application/x-www-form-urlencoded'
    // khi dùng OAuth2PasswordRequestForm
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch(`${API_URL}/token`, { // Endpoint từ FastAPI
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Username hoặc mật khẩu không đúng');
      }

      // Đăng nhập thành công, lưu token
      localStorage.setItem('access_token', data.access_token);
      setMessage('Đăng nhập thành công!');
      // (Ở đây bạn có thể chuyển hướng người dùng sang trang khác)

    } catch (error: any) {
      setMessage(`Lỗi đăng nhập: ${error.message}`);
    }
  };

  return (
    <div className="App">
      {/* (Phần header "Jenkins CI" của bạn) */}
      
      <div className="login-container"> {/* Giả sử bạn có class này */}
        <h2>Đăng nhập hoặc Đăng ký</h2>
        
        {message && <p className="message">{message}</p>} {/* Hiển thị thông báo */}

        {/* Chúng ta dùng onSubmit cho form thay vì onClick cho từng nút 
          để có thể submit bằng phím Enter
        */}
        <form>
          <div>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {/* Đổi 2 nút submit thành 1 nút submit (Đăng nhập)
            và 1 nút button (Đăng ký)
          */}
          <button type="submit" onClick={handleLogin}>Đăng nhập</button>
          <button type="button" onClick={handleRegister}>Đăng ký</button>
        </form>
      </div>
    </div>
  );
}

export default App;