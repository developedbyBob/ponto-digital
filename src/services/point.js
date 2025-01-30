import axios from 'axios';
import { authService } from './auth';

const API_URL = 'http://localhost:8080/api';

export const pointService = {
  async registerPoint(data) {
    const token = authService.getToken();
    return axios.post(`${API_URL}/register-point`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  async getTodayPoints() {
    const token = authService.getToken();
    return axios.get(`${API_URL}/points`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Verificar se o dispositivo suporta biometria
  async checkBiometrySupport() {
    if (!window.PublicKeyCredential) {
      return false;
    }
    
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
      console.error('Erro ao verificar suporte biométrico:', error);
      return false;
    }
  }
};