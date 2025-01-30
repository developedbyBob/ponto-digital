import axios from 'axios';
import { authService } from './auth';

const API_URL = 'http://192.168.1.11:8080/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const pointService = {
  async checkBiometrySupport() {
    try {
      if (!window.PublicKeyCredential) {
        console.log('WebAuthn não é suportado neste navegador');
        return false;
      }

      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      console.log('Autenticador de plataforma disponível:', available);

      const isAndroid = /Android/i.test(navigator.userAgent);
      console.log('É um dispositivo Android:', isAndroid);

      return available || (isAndroid && window.navigator.credentials);
    } catch (error) {
      console.error('Erro ao verificar suporte biométrico:', error);
      return false;
    }
  },

  async authenticateBiometric() {
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "Sistema de Ponto Digital",
          id: window.location.hostname,
        },
        user: {
          id: Uint8Array.from("UZSL85T9AFC", c => c.charCodeAt(0)),
          name: "webauthn@example.com",
          displayName: "webauthn",
        },
        pubKeyCredParams: [{alg: -7, type: "public-key"}],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "preferred",
        },
        timeout: 60000,
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      const biometricToken = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      return biometricToken;
    } catch (error) {
      console.error('Erro na autenticação:', error);
      throw new Error('Falha na autenticação biométrica');
    }
  },

  async registerPoint({ type, device, authMethod, pin }) {
    let payload = {
      type,
      location: 'Web App',
      device: device || navigator.userAgent,
      authMethod
    };

    try {
      // Adiciona o campo apropriado baseado no método de autenticação
      if (authMethod === 'pin') {
        payload = { ...payload, pin };
        console.log('Registrando ponto com PIN:', {
          ...payload,
          pin: '****',
          payloadJSON: JSON.stringify(payload)
        });
      } else if (authMethod === 'biometric') {
        const biometricToken = await this.authenticateBiometric();
        payload = { ...payload, biometricToken };
        console.log('Registrando ponto com Biometria:', {
          ...payload,
          biometricToken: '****',
          payloadJSON: JSON.stringify(payload)
        });
      }

      const token = authService.getToken();
      console.log('Token de autenticação:', token ? 'Presente' : 'Ausente');
      console.log('Headers:', {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : 'Não presente'
      });

      const response = await axiosInstance.post('/register-point', payload);
      console.log('Resposta do servidor:', response.data);
      return response;
    } catch (error) {
      console.error('Erro detalhado ao registrar ponto:', {
        message: error.message,
        responseData: error.response?.data,
        responseStatus: error.response?.status,
        requestPayload: JSON.stringify(payload, null, 2),
        errorStack: error.stack
      });

      // Se tiver uma mensagem de erro do servidor, use ela
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },

  async getTodayPoints() {
    try {
      const response = await axiosInstance.get('/points/today');
      return response;
    } catch (error) {
      console.error('Erro ao buscar pontos do dia:', error);
      throw error;
    }
  },

  async getMonthlyPoints(year, month) {
    try {
      const response = await axiosInstance.get('/points/monthly', {
        params: { year, month }
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar pontos do mês:', error);
      throw error;
    }
  }
};