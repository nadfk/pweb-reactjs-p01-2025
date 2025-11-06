const API_BASE = "http://localhost:5137/api";

export async function apiFetch(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem("token");

    const headers: Record<string, string> = {
        "Content-Type" : "application/json",
    };

    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(API_BASE + Path2D, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error (err || "API Error");
    }
    return res.json();
}