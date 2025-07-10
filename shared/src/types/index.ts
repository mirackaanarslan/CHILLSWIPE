// Core domain types
export interface Question {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Request types
export interface PlaceBetRequest {
  questionId: string;
  outcome: 'YES' | 'NO';
  amount: number;
  wallet: string | null;
} 