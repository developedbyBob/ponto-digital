import axios from 'axios';
import { authService } from './auth';

const API_URL = 'http://10.158.15.192:8080/api';

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
      console.log('Resposta do servidor (registerPoint):', response.data);
      
      // Adicionar Type ao retorno para garantir consistência
      return {
        ...response,
        data: {
          ...response.data,
          Type: type // Garantir que Type está presente na resposta
        }
      };
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
      console.log('Resposta getTodayPoints:', response.data);
      return response;
    } catch (error) {
      console.error('Erro ao buscar pontos do dia:', error);
      throw error;
    }
  },

  async getPointsByDate(date) {
    try {
      // Formatar a data no formato ISO (YYYY-MM-DD)
      const formattedDate = this.formatDateISO(date);
      console.log(`Buscando pontos para a data: ${formattedDate}`);
      
      // Buscar registros do mês e depois filtrar pelo dia
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // Mês começa em 0
      
      const response = await this.getMonthlyPoints(year, month);
      
      // Filtrar apenas os registros do dia especificado
      if (response?.data && Array.isArray(response.data)) {
        const dayData = response.data.find(day => {
          return this.isSameDay(new Date(day.date), date);
        });
        
        if (dayData) {
          return { data: dayData.records };
        }
      }
      
      // Se não encontrar dados para o dia, retornar array vazio
      return { data: [] };
    } catch (error) {
      console.error(`Erro ao buscar pontos para a data ${date}:`, error);
      throw error;
    }
  },

  async getMonthlyPoints(year, month) {
    try {
      console.log(`Buscando pontos para ano=${year}, mês=${month}`);
      const response = await axiosInstance.get('/points/monthly', {
        params: { year, month }
      });
      
      console.log('Resposta getMonthlyPoints:', response.data);
      return response;
    } catch (error) {
      console.error(`Erro ao buscar pontos do mês ${month}/${year}:`, error);
      throw error;
    }
  },
  
  // Função auxiliar para verificar se duas datas são o mesmo dia
  isSameDay(date1, date2) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  },
  
  // Função para formatar data no formato ISO (YYYY-MM-DD)
  formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};