import axios from "axios";

// Use relative URL in development (proxy handles it), full URL in production
const API_URL = process.env.NODE_ENV === 'development'
  ? ''
  : (process.env.REACT_APP_API_URL || "https://backend-java-pkn3.onrender.com");

// TypeScript interfaces for API data
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive?: boolean;
}

export interface Application {
  id: number;
  name: string;
  description?: string;
  platform?: string;
  version?: string;
}

export interface Compte {
  id: number;
  username: string;
  applicationId: number;
  password?: string;
  status?: string;
}

export interface Test {
  id: number;
  name: string;
  statut: string;
  sessionId?: number;
}

export interface TestSession {
  id: number;
  name: string;
  date?: string;
  status?: string;
}

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (process.env.NODE_ENV === 'development') {
    console.log("API Request:", config.method?.toUpperCase(), config.url);
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error("Erreur API:", error.message);
    }
    
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_type");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_id");
      localStorage.removeItem("username");
      localStorage.removeItem("email");
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post("/auth/token", { username, password });
    return response.data;
  },
  me: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async () => (await api.get<User[]>("/users")).data,
  getById: async (id: number) => (await api.get<User>(`/users/${id}`)).data,
  create: async (data: Partial<User>) => (await api.post<User>("/users", data)).data,
  update: async (id: number, data: Partial<User>) => (await api.put<User>(`/users/${id}`, data)).data,
  delete: async (id: number) => (await api.delete(`/users/${id}`)).data,
};

// Profile API
export const profileAPI = {
  getMe: async () => (await api.get<User>("/users/me")).data,
  updateMe: async (data: Partial<User>) => (await api.put<User>("/users/me", data)).data,
  changePassword: async (oldPassword: string, newPassword: string) => 
    (await api.put("/users/me/password", { oldPassword, newPassword })).data,
};

// Applications API
export const applicationsAPI = {
  getAll: async () => (await api.get<Application[]>("/applications")).data,
  getById: async (id: number) => (await api.get<Application>(`/applications/${id}`)).data,
  create: async (data: Partial<Application>) => (await api.post<Application>("/applications", data)).data,
  update: async (id: number, data: Partial<Application>) => (await api.put<Application>(`/applications/${id}`, data)).data,
  delete: async (id: number) => (await api.delete(`/applications/${id}`)).data,
};

// Comptes API
export const comptesAPI = {
  getAll: async () => (await api.get<Compte[]>("/comptes")).data,
  getById: async (id: number) => (await api.get<Compte>(`/comptes/${id}`)).data,
  create: async (data: Partial<Compte>) => (await api.post<Compte>("/comptes", data)).data,
  update: async (id: number, data: Partial<Compte>) => (await api.put<Compte>(`/comptes/${id}`, data)).data,
  delete: async (id: number) => (await api.delete(`/comptes/${id}`)).data,
};

// Tests API
export const testsAPI = {
  getAll: async (sessionId?: number) => {
    const params = sessionId ? { sessionId } : {};
    return (await api.get<Test[]>("/tests", { params })).data;
  },
  create: async (data: Partial<Test>) => (await api.post<Test>("/tests", data)).data,
  update: async (id: number, data: Partial<Test>) => (await api.put<Test>(`/tests/${id}`, data)).data,
  delete: async (id: number) => (await api.delete(`/tests/${id}`)).data,
};

// Test Sessions API
export const testSessionsAPI = {
  getAll: async () => (await api.get<TestSession[]>("/test-sessions")).data,
  create: async (data: Partial<TestSession>) => (await api.post<TestSession>("/test-sessions", data)).data,
  update: async (id: number, data: Partial<TestSession>) => (await api.put<TestSession>(`/test-sessions/${id}`, data)).data,
  delete: async (id: number) => (await api.delete(`/test-sessions/${id}`)).data,
};

// Todos API
export const todosAPI = {
  getAll: async () => (await api.get<Todo[]>("/todos")).data,
  getById: async (id: number) => (await api.get<Todo>(`/todos/${id}`)).data,
  create: async (data: Partial<Todo>) => (await api.post<Todo>("/todos", data)).data,
  update: async (id: number, data: Partial<Todo>) => (await api.put<Todo>(`/todos/${id}`, data)).data,
  delete: async (id: number) => (await api.delete(`/todos/${id}`)).data,
  toggle: async (id: number) => (await api.patch(`/todos/${id}/toggle`)).data,
};

export default api;