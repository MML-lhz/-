import axios from 'axios';
import { AuthResponse, Feedback, Product, LostFound, PaginatedResponse, User } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { username: string; password: string; role?: string }) =>
    api.post<AuthResponse>('/register', data),
  
  login: (data: { username: string; password: string }) =>
    api.post<AuthResponse>('/login', data),
  
  getMe: () => api.get<{ success: boolean; user: User }>('/auth/me'),
};

export const feedbackApi = {
  submit: (data: { category: string; title: string; content: string; images?: string[] }) =>
    api.post<{ success: boolean; data: Feedback }>('/feedback', data),
  
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<PaginatedResponse<Feedback>>('/feedback', { params }),
  
  getById: (id: number) => api.get<{ success: boolean; data: Feedback }>(`/feedback/${id}`),
  
  update: (id: number, data: { status?: string; reply?: string }) =>
    api.put<{ success: boolean; data: Feedback }>(`/feedback/${id}`, data),
  
  getUserFeedbacks: (userId: number) =>
    api.get<{ success: boolean; data: Feedback[] }>(`/feedback/user/${userId}`),
  
  getMyFeedbacks: () => api.get<{ success: boolean; data: Feedback[] }>('/feedback/my'),
};

export const userApi = {
  getStats: () => api.get<{ success: boolean; data: { posts: number; purchases: number; feedbacks: number; lostFound: number; claims: number } }>('/user/stats'),
  getMe: () => api.get<{ success: boolean; data: { id: number; username: string; role: string; avatar: string; phone: string; email: string; bio: string } }>('/auth/me'),
  updateProfile: (data: { avatar?: string; phone?: string; email?: string; bio?: string }) =>
    api.put<{ success: boolean; data: { id: number; username: string; role: string; avatar: string; phone: string; email: string; bio: string } }>('/user/profile', data),
  updatePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.put<{ success: boolean; message: string }>('/user/password', data),
};

export const marketApi = {
  publish: (data: { title: string; description: string; price: number; images: string[]; category: string; condition: string }) =>
    api.post<{ success: boolean; data: Product }>('/market', data),
  
  getAll: (params?: { page?: number; limit?: number; search?: string; category?: string; condition?: string; minPrice?: number; maxPrice?: number; sort?: string }) =>
    api.get<PaginatedResponse<Product>>('/market', { params }),
  
  getById: (id: number) => api.get<{ success: boolean; data: Product }>(`/market/${id}`),
  
  update: (id: number, data: { status?: string }) =>
    api.put<{ success: boolean; data: Product }>(`/market/${id}`, data),
  
  delete: (id: number) => api.delete<{ success: boolean }>(`/market/${id}`),
  
  buy: (id: number) => api.post<{ success: boolean; message: string }>(`/market/${id}/buy`),
  
  getMyPurchases: () => api.get<{ success: boolean; data: Product[] }>('/market/my-purchases'),
  
  getMyPosts: () => api.get<{ success: boolean; data: Product[] }>('/market/my-posts'),
};

export const cartApi = {
  add: (productId: number) => api.post<{ success: boolean; data: any }>('/cart', { productId }),
  
  getAll: () => api.get<{ success: boolean; data: any[] }>('/cart'),
  
  remove: (id: number) => api.delete<{ success: boolean }>(`/cart/${id}`),
  
  checkout: (cartItemIds: number[]) => api.post<{ success: boolean; data: { purchasedItems: any[]; errors: any[]; totalPurchased: number; totalErrors: number } }>('/cart/checkout', { cartItemIds }),
};

export const lostFoundApi = {
  publish: (data: { type: 'lost' | 'found'; title: string; description: string; images?: string[]; location: string; contact: string }) =>
    api.post<{ success: boolean; data: LostFound }>('/lost-found', data),
  
  getAll: (params?: { page?: number; limit?: number; type?: string; status?: string }) =>
    api.get<PaginatedResponse<LostFound>>('/lost-found', { params }),
  
  getById: (id: number) => api.get<{ success: boolean; data: LostFound }>(`/lost-found/${id}`),
  
  claim: (id: number, data: { message: string }) =>
    api.post<{ success: boolean }>(`/lost-found/${id}/claim`, data),
  
  confirm: (id: number) => api.put<{ success: boolean }>(`/lost-found/${id}/confirm`),
  
  getMyClaims: () => api.get<{ success: boolean; data: LostFound[] }>('/lost-found/my-claims'),
  
  getMyPosts: () => api.get<{ success: boolean; data: LostFound[] }>('/lost-found/my-posts'),
};

export interface Announcement {
  id: number;
  userId: number;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  author?: User;
}

export const announcementApi = {
  getAll: () => api.get<{ success: boolean; data: Announcement[] }>('/announcements'),
  
  publish: (data: { title: string; content: string; category?: string; pinned?: boolean }) =>
    api.post<{ success: boolean; data: Announcement }>('/announcements', data),
  
  update: (id: number, data: { title?: string; content?: string; category?: string; pinned?: boolean }) =>
    api.put<{ success: boolean; data: Announcement }>(`/announcements/${id}`, data),
  
  delete: (id: number) => api.delete<{ success: boolean }>(`/announcements/${id}`),
};

export default api;
