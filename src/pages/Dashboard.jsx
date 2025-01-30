import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  LogOut, 
  User, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import PointRegister from '@/components/PointRegister';
import { authService } from '@/services/auth';
import { pointService } from '@/services/point';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const [records, setRecords] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  useEffect(() => {
    fetchRecords();
  }, [currentDate]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await pointService.getTodayPoints();
      setRecords(response?.data || []);
    } catch (error) {
      console.error('Erro ao buscar registros:', error);
      setError('Não foi possível carregar os registros');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const calculateWorkHours = () => {
    if (records.length < 2) return '00:00';

    let totalMinutes = 0;
    let entryTime = null;

    records.forEach(record => {
      if (record.type === 'entrada') {
        entryTime = new Date(record.timestamp);
      } else if (record.type === 'saída' && entryTime) {
        const exitTime = new Date(record.timestamp);
        totalMinutes += (exitTime - entryTime) / (1000 * 60);
        entryTime = null;
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <User className="h-6 w-6" />
              <span className="font-medium">Olá, {user?.name || 'Usuário'}</span>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </CardContent>
        </Card>

        {/* Registro de Ponto */}
        <PointRegister onRegister={fetchRecords} />

        {/* Resumo do Dia */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">Registros do Dia</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDateChange(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {currentDate.toLocaleDateString()}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDateChange(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {/* Total de Horas */}
              <div className="bg-primary/5 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className={cn(
                    "h-5 w-5",
                    loading ? "animate-spin text-muted-foreground" : "text-primary"
                  )} />
                  <span className="font-medium">Total de Horas:</span>
                  <span>{loading ? '--:--' : calculateWorkHours()}</span>
                </div>
              </div>

              {/* Lista de Registros */}
              <div className="space-y-2">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : records.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum registro encontrado
                  </div>
                ) : (
                  records.map((record, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Clock className={cn(
                          "h-4 w-4",
                          record.type === 'entrada' ? "text-green-500" : "text-red-500"
                        )} />
                        <span className="font-medium">{record.type}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-24 hover:bg-primary/5"
            onClick={() => navigate('/report')}
          >
            <div className="flex flex-col items-center space-y-2">
              <FileText className="h-6 w-6" />
              <span>Relatório Mensal</span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-24 hover:bg-primary/5"
            onClick={() => navigate('/profile')}
          >
            <div className="flex flex-col items-center space-y-2">
              <User className="h-6 w-6" />
              <span>Meu Perfil</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;