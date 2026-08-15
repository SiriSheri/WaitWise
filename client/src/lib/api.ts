import { Business, Service, QueueEntry, QueueState, User, Notification, SmartInsights } from '../types';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('waitwise_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  // Auth
  auth: {
    register: (payload: { name: string; email: string; password: string; phone?: string; role?: string; business_id?: string }) =>
      fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }).then((r) => handleResponse<{ user: User; token: string; message: string }>(r)),

    login: (payload: { email: string; password: string }) =>
      fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }).then((r) => handleResponse<{ user: User; token: string; message: string }>(r)),

    me: () =>
      fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders(),
      }).then((r) => handleResponse<{ user: User }>(r)),
  },

  // Businesses
  businesses: {
    list: (params?: { category?: string; status?: string; search?: string; city?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.append('category', params.category);
      if (params?.status) searchParams.append('status', params.status);
      if (params?.search) searchParams.append('search', params.search);
      if (params?.city) searchParams.append('city', params.city);

      const qs = searchParams.toString();
      return fetch(`${API_BASE}/businesses${qs ? `?${qs}` : ''}`).then((r) =>
        handleResponse<{ businesses: Business[] }>(r)
      );
    },

    getById: (id: string) =>
      fetch(`${API_BASE}/businesses/${id}`).then((r) =>
        handleResponse<{
          business: Business;
          services: Service[];
          counters: any[];
          stats: any;
          insights: SmartInsights;
        }>(r)
      ),

    getStats: (id: string) =>
      fetch(`${API_BASE}/businesses/${id}/stats`).then((r) =>
        handleResponse<{ insights: SmartInsights }>(r)
      ),

    updateSettings: (id: string, payload: Partial<Business>) =>
      fetch(`${API_BASE}/businesses/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }).then((r) => handleResponse<{ message: string; business: Business }>(r)),
  },

  // Queue
  queue: {
    join: (payload: {
      businessId: string;
      serviceId: string;
      customerName: string;
      customerPhone?: string;
      notes?: string;
      priority?: number;
    }) =>
      fetch(`${API_BASE}/queue/join`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }).then((r) => handleResponse<{ message: string; ticket: QueueEntry }>(r)),

    getTicket: (id: string) =>
      fetch(`${API_BASE}/queue/ticket/${id}`).then((r) =>
        handleResponse<{ ticket: QueueEntry }>(r)
      ),

    cancelTicket: (id: string) =>
      fetch(`${API_BASE}/queue/ticket/${id}/cancel`, {
        method: 'POST',
        headers: getHeaders(),
      }).then((r) => handleResponse<{ message: string; ticket: QueueEntry }>(r)),

    getActive: () =>
      fetch(`${API_BASE}/queue/user/active`, {
        headers: getHeaders(),
      }).then((r) => handleResponse<{ activeTickets: QueueEntry[] }>(r)),

    getHistory: () =>
      fetch(`${API_BASE}/queue/user/history`, {
        headers: getHeaders(),
      }).then((r) => handleResponse<{ history: QueueEntry[] }>(r)),
  },

  // Staff
  staff: {
    getQueueState: (businessId: string) =>
      fetch(`${API_BASE}/staff/queue-state/${businessId}`, {
        headers: getHeaders(),
      }).then((r) => handleResponse<{ state: QueueState }>(r)),

    callNext: (payload: { businessId: string; counterId: string }) =>
      fetch(`${API_BASE}/staff/call-next`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }).then((r) => handleResponse<{ message: string; ticket: QueueEntry | null }>(r)),

    updateTicketStatus: (id: string, payload: { status: string; notes?: string }) =>
      fetch(`${API_BASE}/staff/ticket/${id}/status`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }).then((r) => handleResponse<{ message: string; ticket: QueueEntry }>(r)),

    createWalkIn: (payload: {
      businessId: string;
      serviceId: string;
      customerName: string;
      customerPhone?: string;
      priority?: number;
      notes?: string;
    }) =>
      fetch(`${API_BASE}/staff/walk-in`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }).then((r) => handleResponse<{ message: string; ticket: QueueEntry }>(r)),

    pauseQueue: (payload: { businessId: string; status: string }) =>
      fetch(`${API_BASE}/staff/pause-queue`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }).then((r) => handleResponse<{ message: string; status: string }>(r)),

    toggleCounter: (payload: { counterId: string; isActive: boolean }) =>
      fetch(`${API_BASE}/staff/counter/toggle`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }).then((r) => handleResponse<{ message: string }>(r)),

    createCounter: (payload: { businessId: string; name: string }) =>
      fetch(`${API_BASE}/staff/counter/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }).then((r) => handleResponse<{ message: string; counterId: string }>(r)),

    createService: (payload: {
      businessId: string;
      name: string;
      description?: string;
      defaultDurationMins: number;
      price: number;
    }) =>
      fetch(`${API_BASE}/staff/service/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }).then((r) => handleResponse<{ message: string; serviceId: string }>(r)),
  },

  // Notifications
  notifications: {
    list: () =>
      fetch(`${API_BASE}/notifications`, {
        headers: getHeaders(),
      }).then((r) => handleResponse<{ notifications: Notification[]; unreadCount: number }>(r)),

    markAsRead: (id: string) =>
      fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'POST',
        headers: getHeaders(),
      }).then((r) => handleResponse<{ success: boolean }>(r)),

    markAllAsRead: () =>
      fetch(`${API_BASE}/notifications/read-all`, {
        method: 'POST',
        headers: getHeaders(),
      }).then((r) => handleResponse<{ success: boolean }>(r)),
  },
};
