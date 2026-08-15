export type UserRole = 'customer' | 'staff' | 'admin';
export type BusinessCategory = 'hospital' | 'clinic' | 'salon' | 'government' | 'restaurant' | 'service_center' | 'bank';
export type BusinessStatus = 'open' | 'busy' | 'almost_full' | 'closed' | 'paused';
export type QueueStatus = 'waiting' | 'called' | 'serving' | 'completed' | 'skipped' | 'cancelled';
export type NotificationType = 'turn_approaching' | 'turn_now' | 'skipped' | 'cancelled' | 'info';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  phone?: string | null;
  business_id?: string | null;
  created_at: string;
}

export interface Business {
  id: string;
  name: string;
  category: BusinessCategory;
  description: string | null;
  address: string;
  city: string;
  phone: string | null;
  operating_hours: string; // JSON string
  status: BusinessStatus;
  max_capacity: number;
  avg_service_time_mins: number;
  image_url: string | null;
  created_at: string;
  // Computed fields
  waiting_count?: number;
  serving_count?: number;
  current_token?: string | null;
  estimated_wait_mins?: number;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  default_duration_mins: number;
  price: number;
  is_active: number;
}

export interface Counter {
  id: string;
  business_id: string;
  name: string;
  staff_id: string | null;
  staff_name?: string | null;
  is_active: number;
  current_ticket_id: string | null;
  current_ticket_number?: string | null;
  current_customer_name?: string | null;
}

export interface QueueEntry {
  id: string;
  ticket_number: string;
  business_id: string;
  service_id: string;
  service_name?: string;
  user_id: string | null;
  counter_id: string | null;
  counter_name?: string | null;
  customer_name: string;
  customer_phone: string | null;
  status: QueueStatus;
  priority: number;
  notes: string | null;
  estimated_wait_mins: number;
  actual_wait_mins: number | null;
  joined_at: string;
  called_at: string | null;
  served_at: string | null;
  completed_at: string | null;
  // Live calculated fields
  position?: number;
  people_ahead?: number;
  is_excessive_wait?: boolean;
  business_name?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  ticket_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

export interface WaitTimeStat {
  id: string;
  business_id: string;
  service_id: string | null;
  day_of_week: number;
  hour_of_day: number;
  avg_wait_mins: number;
  avg_service_mins: number;
  sample_count: number;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  business_id?: string | null;
}

export interface QueueState {
  business: Business;
  services: Service[];
  counters: Counter[];
  activeCountersCount: number;
  waitingQueue: QueueEntry[];
  currentlyServing: QueueEntry[];
  recentlyCompleted: QueueEntry[];
  stats: {
    totalWaiting: number;
    totalServing: number;
    totalServedToday: number;
    avgWaitMins: number;
    avgServiceMins: number;
    isExcessiveDelayDetected: boolean;
  };
}
