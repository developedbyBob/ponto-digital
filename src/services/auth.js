import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const authService = {
  async login(email, password) {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password
    });
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  async register(name, email, password) {
    const response = await axios.post(`${API_URL}/register`, {
      name,
      email,
      password
    });
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user'));
  },

  getToken() {
    const user = this.getCurrentUser();
    return user?.token;
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};