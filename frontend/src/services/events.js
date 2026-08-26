import api from './api';
export const eventService = {
    getAll: (filters) => api.get('/events', { params: filters }),
    getById: (id) => api.get(`/events/${id}`),
    create: (data) => api.post('/events', data),
    update: (id, data) => api.put(`/events/${id}`, data),
    delete: (id) => api.delete(`/events/${id}`),
    register: (eventId) => api.post(`/events/${eventId}/register`),
    unregister: (eventId) => api.post(`/events/${eventId}/unregister`),
};
