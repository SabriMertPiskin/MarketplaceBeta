export interface User {
  id: string;
  email: string;
  name: string;
  role: "customer" | "producer" | "admin";
  phone?: string;
  address?: string;
  kvkk_consent: boolean;
  kvkk_consent_date?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  stl_file_url?: string;
  ipfs_hash?: string;
  analysis?: STLAnalysis;
  status: "draft" | "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface STLAnalysis {
  triangle_count: number;
  dimensions_mm: [number, number, number];
  volume_mm3: number;
  surface_area_mm2: number;
  bounding_box_volume_mm3: number;
  estimated_weight_g: number;
  estimated_print_time_minutes: number;
  print_difficulty: string;
  complexity_score: number;
  preview?: Array<[[number, number, number], [number, number, number], [number, number, number]]>;
}

export interface Order {
  id: string;
  customer_id: string;
  producer_id?: string;
  product_id: string;
  status: OrderStatus;
  quantity: number;
  material_type?: string;
  pricing_data?: PricingData;
  customer_price?: number;
  producer_earnings?: number;
  platform_commission?: number;
  payment_fee?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  paid_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  
  // Populated fields
  customer?: User;
  producer?: User;
  product?: Product;
}

export type OrderStatus = 
  | "draft"
  | "pending"
  | "accepted"
  | "rejected"
  | "paid"
  | "in_production"
  | "completed_by_producer"
  | "confirmed"
  | "cancelled"
  | "refunded"
  | "dispute_open"
  | "partial_refund";

export interface PricingData {
  breakdown: {
    material_cost: number;
    time_cost: number;
    support_cost: number;
    fixed_cost: number;
    producer_margin: number;
    producer_subtotal: number;
    platform_commission: number;
    payment_fee: number;
    customer_total: number;
  };
  producer_earnings: number;
  platform_commission: number;
  payment_fee: number;
  customer_price: number;
}

export interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  
  // Populated fields
  sender?: User;
  receiver?: User;
  order?: Order;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string;
  order_id?: string;
  is_read: boolean;
  created_at: string;
  
  // Populated fields
  order?: Order;
}

export interface Material {
  id: string;
  name: string;
  type: string;
  price_per_gram: number;
  density: number;
  properties?: Record<string, any>;
  is_active: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface Conversation {
  id: string;
  order_id: string;
  other_user: {
    id: string;
    name: string;
  };
  last_message?: Message;
  unread_count: number;
}

export interface DashboardStats {
  total_orders?: number;
  active_orders?: number;
  total_spent?: number;
  total_earnings?: number;
  messages?: number;
  rating?: number;
  completed_orders?: number;
}
