import { create } from 'zustand';
const authStore = (set) => {
    // Initialize from localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return {
        token,
        user,
        isAuthenticated: !!token,
        setAuth: (newToken, newUser) => {
            if (newToken) {
                localStorage.setItem('token', newToken);
                if (newUser) {
                    localStorage.setItem('user', JSON.stringify(newUser));
                }
            }
            set({
                token: newToken,
                user: newUser,
                isAuthenticated: !!newToken,
            });
        },
        logout: () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            set({
                token: null,
                user: null,
                isAuthenticated: false,
            });
        },
    };
};
export const useAuthStore = create()(authStore);
