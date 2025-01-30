import axios from 'axios';

const API_URL = 'http://192.168.1.11:8080/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const authService = {
  async login(email, password) {
    try {
      const response = await axiosInstance.post('/login', {
        email,
        password
      });

      if (response.data.token) {
        localStorage.setItem(TOKEN_KEY, response.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  },

  async register(name, email, password) {
    try {
      const response = await axiosInstance.post('/register', {
        name,
        email,
        password
      });

      if (response.data.token) {
        localStorage.setItem(TOKEN_KEY, response.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  async updateProfile(data) {
    try {
      const response = await axiosInstance.put('/profile', data, {
        headers: { Authorization: `Bearer ${this.getToken()}` }
      });
      
      if (response.data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  },
};

// Interceptor para tratar erros de autenticação
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);