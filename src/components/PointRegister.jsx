import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Fingerprint, Clock, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const PointRegister = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastRegister, setLastRegister] = useState(null);
  const [biometryAvailable, setBiometryAvailable] = useState(false);

  useEffect(() => {
    checkBiometrySupport();
    fetchLastRegister();
  }, []);

  const checkBiometrySupport = async () => {
    try {
      if (window.PublicKeyCredential) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setBiometryAvailable(available);
      }
    } catch (error) {
      console.error('Erro ao verificar suporte biométrico:', error);
      setBiometryAvailable(false);
    }
  };

  const fetchLastRegister = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/points`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.length > 0) {
        setLastRegister(response.data[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar último registro:', error);
    }
  };

  const createBiometricCredential = async () => {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    
    const publicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: "Sistema de Ponto Digital",
        id: window.location.hostname,
      },
      user: {
        id: new Uint8Array(16),
        name: "user@example.com",
        displayName: "Usuário",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      timeout: 60000,
    };

    try {
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });
      return credential;
    } catch (error) {
      console.error('Falha na verificação biométrica:', error);
      throw new Error('Falha na verificação biométrica');
    }
  };

  const handleRegisterPoint = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Verificar biometria
      const credential = await createBiometricCredential();
      
      if (!credential) {
        throw new Error('Verificação biométrica falhou');
      }

      // Determinar tipo de registro (entrada/saída)
      const type = !lastRegister || lastRegister.type === 'saída' ? 'entrada' : 'saída';

      // Registrar ponto
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/register-point`,
        {
          biometricToken: credential.id,
          type,
          device: navigator.userAgent,
          location: 'Web Browser'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess(`Ponto registrado com sucesso: ${type}`);
      setLastRegister(response.data);
      fetchLastRegister();
    } catch (err) {
      setError(err.message || 'Erro ao registrar ponto');
    } finally {
      setLoading(false);
    }
  };

  if (!biometryAvailable) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Registro de Ponto</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Seu dispositivo não suporta autenticação biométrica.
              Por favor, use um dispositivo compatível.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Registro de Ponto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <Button
            size="lg"
            onClick={handleRegisterPoint}
            disabled={loading}
            className="w-32 h-32 rounded-full"
          >
            {loading ? (
              <Clock className="h-16 w-16 animate-spin" />
            ) : (
              <Fingerprint className="h-16 w-16" />
            )}
          </Button>
          <div className="mt-2 text-sm text-gray-500">
            {loading ? 'Verificando...' : 'Toque para registrar ponto'}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {lastRegister && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Último registro:</h3>
            <div className="text-sm text-gray-600">
              <p>Tipo: {lastRegister.type}</p>
              <p>Horário: {new Date(lastRegister.timestamp).toLocaleString()}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PointRegister;