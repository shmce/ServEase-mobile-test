export interface User {
  id: string;
  full_name: string;
  email: string;
  contact_number: string;
  role: 'customer' | 'provider' | 'admin';
  status: 'pending' | 'active' | 'inactive' | 'rejected' | 'suspended';
  is_verified: boolean;
  date_of_birth?: string;
  trust_score: number;
  created_at: string;
}

export interface ProviderProfile {
  id: string;
  user_id: string;
  business_name: string;
  bio?: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  average_rating: number;
  total_reviews: number;
  trust_score: number;
  created_at: string;
}

export interface ProviderService {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  category_id: string;
  price: number;
  supports_hourly: boolean;
  hourly_rate?: number;
  supports_flat: boolean;
  flat_rate?: number;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_reference: string;
  customer_id: string;
  provider_id: string;
  service_id: string;
  service_address: string;
  scheduled_at: string;
  pricing_mode: 'hourly' | 'flat';
  hourly_rate?: number;
  flat_rate?: number;
  hours_required?: number;
  total_amount: number;
  status:
    | 'pending'
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'disputed';
  cancellation_reason?: string;
  cancellation_explanation?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  paid_at?: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  booking_id: string;
  raised_by: string;
  reason: string;
  status: 'open' | 'resolved' | 'closed';
  created_at: string;
}

export interface ProviderReview {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  review_text?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  customer_id: string;
  provider_id: string;
  amount: number;
  method: 'cash' | 'card' | 'wallet';
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  transaction_ref?: string;
  created_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  parent_id?: string;
  category_level: number;
}

export interface BookingRescheduleRequest {
  id: string;
  booking_id: string;
  provider_id: string;
  reason: string;
  explanation: string;
  proposed_date: string;
  proposed_time: string;
  status: 'pending' | 'approved' | 'declined';
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
}

export interface AdditionalCharge {
  id: string;
  booking_id: string;
  requested_by: string;
  description: string;
  amount: number;
  justification: string;
  status: 'pending' | 'approved' | 'declined';
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
}

export interface ProviderDocument {
  provider_id: string;
  document_type: string;
  document_file_path: string;
  status: 'pending' | 'approved' | 'rejected';
  reject_reason?: string;
  uploaded_at: string;
}
