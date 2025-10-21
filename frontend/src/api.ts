// src/api.ts
export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T = any>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  // Tạo object headers đảm bảo kiểu là Record<string, string>
  const userHeaders: Record<string, string> = {
    ...(opts.headers instanceof Headers
      ? Object.fromEntries(opts.headers.entries())
      : (opts.headers as Record<string, string> || {})),
  };

  const merged: RequestInit = {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...userHeaders,
      ...authHeaders(),
    },
  };

  const res = await fetch(path, merged);

  if (!res.ok) {
    let msg = "";
    try {
      msg = await res.text();
    } catch {
      msg = res.statusText;
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  } else {
    return (await res.text()) as any;
  }
}
