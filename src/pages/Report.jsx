import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar,
  ChevronLeft,
  Download,
  Clock,
  Loader2,
  LogIn,
  LogOut
} from 'lucide-react';
import { pointService } from '@/services/point';
//import { cn } from '@/lib/utils';

const Report = () => {
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMonthlyRecords();
  }, [currentMonth]);

  const fetchMonthlyRecords = async () => {
    try {
      setLoading(true);
      const response = await pointService.getMonthlyPoints(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1
      );
      setMonthlyRecords(response.data);
      setError('');
    } catch (error) {
      setError('Erro ao buscar registros do mês');
      console.error('Erro ao buscar registros:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalMonthHours = () => {
    let totalMinutes = 0;
    monthlyRecords.forEach(day => {
      let entryTime = null;
      day.records.forEach(record => {
        if (record.type === 'entrada') {
          entryTime = new Date(record.timestamp);
        } else if (record.type === 'saída' && entryTime) {
          const exitTime = new Date(record.timestamp);
          totalMinutes += (exitTime - entryTime) / (1000 * 60);
          entryTime = null;
        }
      });
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const calculateDailyHours = (records) => {
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

  const generateReport = () => {
    const rows = monthlyRecords.map(day => ({
      data: new Date(day.date).toLocaleDateString(),
      horas: calculateDailyHours(day.records),
      registros: day.records.map(r => 
        `${r.type}: ${new Date(r.timestamp).toLocaleTimeString()}`
      ).join('; ')
    }));

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Data,Horas Trabalhadas,Registros\n"
      + rows.map(row => 
          `${row.data},${row.horas},"${row.registros}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_${currentMonth.getMonth() + 1}_${currentMonth.getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Relatório Mensal</h1>
          </div>
        </div>

        {/* Seletor de Mês e Total de Horas */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="flex items-center space-x-4 py-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <select
                className="border rounded p-2 bg-background"
                value={currentMonth.getMonth()}
                onChange={(e) => {
                  const newDate = new Date(currentMonth);
                  newDate.setMonth(parseInt(e.target.value));
                  setCurrentMonth(newDate);
                }}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(0, i).toLocaleDateString('pt-BR', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                className="border rounded p-2 bg-background"
                value={currentMonth.getFullYear()}
                onChange={(e) => {
                  const newDate = new Date(currentMonth);
                  newDate.setFullYear(parseInt(e.target.value));
                  setCurrentMonth(newDate);
                }}
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <option key={i} value={new Date().getFullYear() - 2 + i}>
                    {new Date().getFullYear() - 2 + i}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-medium">Total de Horas no Mês:</span>
                </div>
                <span className="text-xl font-bold">
                  {loading ? '--:--' : calculateTotalMonthHours()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações */}
        <Card className="bg-primary/5">
          <CardContent className="py-4">
            <div className="flex justify-end">
              <Button 
                onClick={generateReport}
                disabled={loading || monthlyRecords.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Relatório CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Registros Diários</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : monthlyRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado para este mês
                </div>
              ) : (
                monthlyRecords.map((day, index) => (
                  <div
                    key={index}
                    className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">
                        {new Date(day.date).toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long'
                        })}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{calculateDailyHours(day.records)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {day.records.map((record, recordIndex) => (
                        <div
                          key={recordIndex}
                          className="flex items-center space-x-2 text-sm text-muted-foreground"
                        >
                          {record.type === 'entrada' ? (
                            <LogIn className="h-4 w-4 text-green-500" />
                          ) : (
                            <LogOut className="h-4 w-4 text-red-500" />
                          )}
                          <span>{record.type}:</span>
                          <span>
                            {new Date(record.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Report;