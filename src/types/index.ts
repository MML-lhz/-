export interface User {
  id: number;
  username: string;
  role: 'student' | 'admin';
}

export interface Feedback {
  id: number;
  userId: number;
  category: string;
  title: string;
  content: string;
  images: string[];
  status: 'pending' | 'processing' | 'resolved';
  reply: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Product {
  id: number;
  userId: number;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair';
  status: 'available' | 'sold';
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface LostFound {
  id: number;
  userId: number;
  type: 'lost' | 'found';
  title: string;
  description: string;
  images: string[];
  location: string;
  contact: string;
  status: 'active' | 'claimed' | 'returned';
  claimerId: number | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  claimer?: User;
}

export interface Order {
  id: number;
  userId: number;
  productId: number;
  status: 'pending' | 'confirmed' | 'completed';
  createdAt: string;
  updatedAt: string;
  user?: User;
  product?: Product;
}

export interface AuthResponse {
  success: boolean;
  data: {
    id: number;
    username: string;
    role: 'student' | 'admin';
    token?: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}
