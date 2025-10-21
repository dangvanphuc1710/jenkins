const API_URL = "http://localhost:8000";

export async function apiRegister(username: string, password: string) {
  const res = await fetch(`${API_URL}/api/register`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function apiLogin(username: string, password: string) {
  const res = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function apiGetProducts(token: string) {
  const res = await fetch(`${API_URL}/api/products`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function apiAddProduct(token: string, title: string, price: number) {
  const res = await fetch(`${API_URL}/api/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title, price })
  });
  return res.json();
}
