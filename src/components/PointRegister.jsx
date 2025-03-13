import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Fingerprint, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  Key
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { pointService } from '@/services/point';

const PointRegister = ({ onRegister = () => {} }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastRegister, setLastRegister] = useState(null);
  const [biometryAvailable, setBiometryAvailable] = useState(false);
  const [usePinFallback, setUsePinFallback] = useState(false);
  const [pin, setPin] = useState('');

  useEffect(() => {
    checkBiometrySupport();
    fetchLastRegister();
  }, []);

  const checkBiometrySupport = async () => {
    try {
      const isSupported = await pointService.checkBiometrySupport();
      setBiometryAvailable(isSupported);
    } catch (error) {
      console.error('Erro ao verificar suporte biométrico:', error);
      setBiometryAvailable(false);
    }
  };

  const fetchLastRegister = async () => {
    try {
      const response = await pointService.getTodayPoints();
      if (response?.data?.length > 0) {
        // Ordenar registros por timestamp (do mais recente para o mais antigo)
        const sortedRecords = [...response.data].sort((a, b) => 
          new Date(b.Timestamp) - new Date(a.Timestamp)
        );
        console.log("Último registro obtido:", sortedRecords[0]);
        setLastRegister(sortedRecords[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar último registro:', error);
    }
  };

  const handleRegisterPoint = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Corrigir a lógica para determinar o tipo de registro
      // Verificar Type (com T maiúsculo)
      console.log("Determinando tipo com base no último registro:", lastRegister);
      
      let type;
      if (!lastRegister) {
        type = 'entrada';
      } else {
        // Verificar explicitamente Type e type para diagnóstico
        console.log("lastRegister.Type:", lastRegister.Type);
        console.log("lastRegister.type:", lastRegister.type);
        
        // Usar Type com T maiúsculo como está no backend
        type = lastRegister.Type === 'entrada' ? 'saída' : 'entrada';
      }
      
      console.log("Tipo determinado para registro:", type);
      
      // Solicitar verificação biométrica
      await pointService.authenticateBiometric();
      
      // Registrar ponto
      const response = await pointService.registerPoint({
        type,
        device: navigator.userAgent,
        authMethod: 'biometric'
      });

      if (response?.data) {
        setSuccess(`Ponto registrado com sucesso: ${type}`);
        console.log("Resposta do registro:", response.data);
        setLastRegister({...response.data, Type: type}); // Garantir que Type está definido
        onRegister();
      }
    } catch (err) {
      setError(err.message || 'Erro ao registrar ponto');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Mesma lógica corrigida para o PIN
      let type;
      if (!lastRegister) {
        type = 'entrada';
      } else {
        type = lastRegister.Type === 'entrada' ? 'saída' : 'entrada';
      }
      
      console.log("Tipo determinado para registro com PIN:", type);
      
      const response = await pointService.registerPoint({
        type,
        device: navigator.userAgent,
        authMethod: 'pin',
        pin
      });

      if (response?.data) {
        setSuccess(`Ponto registrado com sucesso: ${type}`);
        console.log("Resposta do registro com PIN:", response.data);
        setLastRegister({...response.data, Type: type}); // Garantir que Type está definido
        onRegister();
        setPin('');
      }
    } catch (err) {
      setError(err.message || 'PIN inválido');
    } finally {
      setLoading(false);
    }
  };

  const LastRegisterSection = () => (
    lastRegister && (
      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">Último registro:</h3>
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>
              {lastRegister?.Timestamp 
                ? new Date(lastRegister.Timestamp).toLocaleString('pt-BR')
                : 'Data não disponível'}
            </span>
          </div>
          <div className="mt-1">
            Tipo: {lastRegister?.Type || 'Não especificado'}
          </div>
        </div>
      </div>
    )
  );

  const AlertSection = () => (
    <>
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
    </>
  );

  if (!biometryAvailable && !usePinFallback) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Registro de Ponto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Autenticação biométrica não disponível neste dispositivo.
              Você pode usar um PIN como alternativa.
            </AlertDescription>
          </Alert>
          <Button 
            className="w-full"
            onClick={() => setUsePinFallback(true)}
          >
            <Key className="mr-2 h-4 w-4" />
            Usar PIN
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (usePinFallback) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Registro de Ponto com PIN</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Digite seu PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                minLength={4}
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                className="text-center text-2xl tracking-widest"
              />
            </div>
            
            <AlertSection />
            
            <Button 
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verificando...</span>
                </span>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Registrar Ponto
                </>
              )}
            </Button>
            
            <Button 
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setUsePinFallback(false)}
            >
              Tentar Biometria
            </Button>

            <LastRegisterSection />
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Registro de Ponto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center">
          <Button
            size="lg"
            onClick={handleRegisterPoint}
            disabled={loading}
            className={cn(
              "w-32 h-32 rounded-full transition-all duration-200",
              loading && "animate-pulse"
            )}
          >
            {loading ? (
              <Loader2 className="h-16 w-16 animate-spin" />
            ) : (
              <Fingerprint className="h-16 w-16" />
            )}
          </Button>
          <span className="mt-4 text-sm text-muted-foreground">
            {loading ? 'Verificando...' : 'Toque para registrar ponto'}
          </span>
        </div>

        <AlertSection />
        <LastRegisterSection />

        <Button 
          variant="outline"
          className="w-full"
          onClick={() => setUsePinFallback(true)}
        >
          <Key className="mr-2 h-4 w-4" />
          Usar PIN
        </Button>
      </CardContent>
    </Card>
  );
};

PointRegister.propTypes = {
  onRegister: PropTypes.func
};

export default PointRegister;