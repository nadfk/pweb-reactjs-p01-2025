const API_BASE = "http://localhost:8080";

interface Meta {
  page: number;
  limit: number;
  total: number;
  prev_page: number | null;
  next_page: number | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Meta;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMessage = "API Error";
    try {
        // Try to parse error JSON message from the backend
        const errJson = await res.json();
        errMessage = errJson.message || errMessage;
    } catch {
        // Fallback to plain text error
        errMessage = await res.text() || errMessage;
    }
    throw new Error(errMessage);
  }
  return res.json() as Promise<ApiResponse<any>>; // Updated return type to include ApiResponse wrapper
}

export const authAPI = {
  register: (data: { username?: string; email: string; password: string }): Promise<ApiResponse<any>> =>
    apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }): Promise<ApiResponse<{ access_token: string }>> =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: (): Promise<ApiResponse<{ id: string; username: string | null; email: string }>> => 
    apiFetch("/auth/me"),
};

export const genreAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<any[]>> => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.search) query.append("search", params.search);
    return apiFetch(`/genre?${query.toString()}`);
  },

  getById: (id: string): Promise<ApiResponse<any>> => apiFetch(`/genre/${id}`),
};

export const bookAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    orderByTitle?: string;
    orderByPublishDate?: string;
  }): Promise<ApiResponse<any[]>> => { // Updated return type
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.search) query.append("search", params.search);
    if (params?.orderByTitle) query.append("orderByTitle", params.orderByTitle);
    if (params?.orderByPublishDate)
      query.append("orderByPublishDate", params.orderByPublishDate);
    return apiFetch(`/books?${query.toString()}`);
  },

  getById: (id: string): Promise<ApiResponse<any>> => apiFetch(`/books/${id}`),

  create: (data: {
    title: string;
    writer: string;
    publisher: string;
    publication_year: number;
    description?: string;
    price: number;
    stock_quantity: number;
    genre_id: string;
  }): Promise<ApiResponse<any>> =>
    apiFetch("/books", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: {
      description?: string | null;
      price?: number;
      stock_quantity?: number;
    }
  ): Promise<ApiResponse<any>> =>
    apiFetch(`/books/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<ApiResponse<any>> =>
    apiFetch(`/books/${id}`, {
      method: "DELETE",
    }),
};

export const transactionAPI = {
  create: (data: { items: { book_id: string; quantity: number }[] }): Promise<ApiResponse<any>> =>
    apiFetch("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    orderById?: string;
    orderByAmount?: string;
  }): Promise<ApiResponse<any[]>> => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.search) query.append("search", params.search);
    if (params?.orderById) query.append("orderById", params.orderById);
    if (params?.orderByAmount) query.append("orderByAmount", params.orderByAmount);
    return apiFetch(`/transactions?${query.toString()}`);
  },

  getById: (id: string): Promise<ApiResponse<any>> => apiFetch(`/transactions/${id}`),

  getStatistics: (): Promise<ApiResponse<any>> => apiFetch("/transactions/statistics"),
};