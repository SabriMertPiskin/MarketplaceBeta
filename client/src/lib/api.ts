import { apiRequest } from "./queryClient";

const API_BASE = "/api";

export interface LoginRequest {
  email?: string;
  password?: string;
  id_token?: string;
  kvkk_consent?: boolean;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    kvkk_consent: boolean;
  };
  created?: boolean;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  services: {
    database: string;
    storage: string;
  };
}

export interface PricingQuoteRequest {
  product_id: string;
  material_id: string;
  infill_density?: number;
  support_required?: boolean;
  hourly_rate?: number;
  fixed_cost?: number;
  margin_percent?: number;
  commission_rate?: number;
  provider_fee_rate?: number;
  min_order_amount?: number;
}

export interface PricingQuoteResponse {
  pricing: {
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
  };
  params: any;
}

export const authApi = {
  login: (data: LoginRequest): Promise<LoginResponse> =>
    apiRequest("POST", `${API_BASE}/login`, data).then(res => res.json()),

  health: (): Promise<HealthResponse> =>
    apiRequest("GET", `${API_BASE}/health`).then(res => res.json()),
};

export const productApi = {
  getProduct: (id: string): Promise<any> =>
    apiRequest("GET", `${API_BASE}/products/${id}`).then(res => res.json()),

  quote: (data: PricingQuoteRequest): Promise<PricingQuoteResponse> =>
    apiRequest("POST", `${API_BASE}/pricing/quote`, data).then(res => res.json()),
};

export const uploadApi = {
  uploadSTL: (file: File, onProgress?: (progress: number) => void): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file);

      if (onProgress) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.open("POST", `${API_BASE}/upload/stl`);
      
      // Add auth header if available
      const token = localStorage.getItem("auth_token");
      if (token) {
        xhr.setRequestHeader("Authorization", token);
      }

      xhr.send(formData);
    });
  },
};
