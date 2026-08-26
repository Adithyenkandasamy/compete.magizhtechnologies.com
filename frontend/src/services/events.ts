import api from './api'

export interface Event {
  id: string
  title: string
  description: string
  category: string
  event_type: string
  mode: 'online' | 'offline' | 'hybrid'
  start_date: string
  end_date: string
  location?: string
  banner_url?: string
  registration_deadline: string
  max_participants?: number
  participant_count: number
  prize_pool?: string
  status: string
}

export const eventService = {
  getAll: (filters?: any) => api.get<Event[]>('/events', { params: filters }),
  getById: (id: string) => api.get<Event>(`/events/${id}`),
  create: (data: any) => api.post<Event>('/events', data),
  update: (id: string, data: any) => api.put<Event>(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  register: (eventId: string) => api.post(`/events/${eventId}/register`),
  unregister: (eventId: string) => api.post(`/events/${eventId}/unregister`),
}
