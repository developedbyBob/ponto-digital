import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  LogOut,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import PointRegister from "@/components/PointRegister";
import { authService } from "@/services/auth";
import { pointService } from "@/services/point";
import { cn } from "@/lib/utils";
import { formatTime, formatDate } from "@/utils/dateFormat";

const Dashboard = () => {
  const [records, setRecords] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  useEffect(() => {
    fetchRecords();
  }, [currentDate]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Se a data selecionada for a data atual, usar o endpoint /points/today
      const isToday = isCurrentDateToday();
      
      let response;
      if (isToday) {
        response = await pointService.getTodayPoints();
        console.log("Buscando registros do dia atual:", response?.data);
      } else {
        // Para datas diferentes da atual, usamos o endpoint mensal com filtro por dia
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // Mês começa em 0
        
        response = await pointService.getMonthlyPoints(year, month);
        console.log("Resposta mensal completa:", response?.data);
        
        // Filtrar apenas os registros do dia selecionado
        if (response?.data && Array.isArray(response.data)) {
          const formattedDate = formatDateISO(currentDate);
          console.log("Procurando registros para a data:", formattedDate);
          
          // Procurar pelo dia específico nos dados mensais
          const dayData = response.data.find(dayItem => {
            const itemDate = new Date(dayItem.date);
            return isSameDay(itemDate, currentDate);
          });
          
          if (dayData) {
            console.log("Registros encontrados para o dia:", dayData);
            response = { data: dayData.records };
          } else {
            console.log("Nenhum registro encontrado para esta data");
            response = { data: [] };
          }
        }
      }
      
      // Verificar e validar cada registro
      const validatedRecords = response?.data?.map(record => {
        // Certificar-se de que Timestamp é uma data válida
        if (record.Timestamp) {
          try {
            const date = new Date(record.Timestamp);
            if (isNaN(date.getTime())) {
              console.warn("Data inválida detectada:", record.Timestamp);
              // Se a data for inválida, usar a data atual como fallback
              return { ...record, Timestamp: new Date().toISOString() };
            }
          } catch (e) {
            console.error("Erro ao processar data:", e);
            return { ...record, Timestamp: new Date().toISOString() };
          }
        }
        return record;
      }) || [];
      
      setRecords(validatedRecords);
    } catch (error) {
      console.error("Erro ao buscar registros:", error);
      setError("Não foi possível carregar os registros");
    } finally {
      setLoading(false);
    }
  };

  // Função para verificar se a data atual selecionada é hoje
  const isCurrentDateToday = () => {
    const today = new Date();
    return isSameDay(today, currentDate);
  };
  
  // Função auxiliar para verificar se duas datas são o mesmo dia
  const isSameDay = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };
  
  // Função para formatar data no formato ISO (YYYY-MM-DD)
  const formatDateISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const calculateWorkHours = () => {
    if (records.length < 2) return "00:00";

    let totalMinutes = 0;
    let entryTime = null;

    // Ordenar registros por timestamp
    const sortedRecords = [...records].sort((a, b) => 
      new Date(a.Timestamp) - new Date(b.Timestamp)
    );

    sortedRecords.forEach((record) => {
      if (record.Type === "entrada") {
        entryTime = new Date(record.Timestamp);
      } else if (record.Type === "saída" && entryTime) {
        const exitTime = new Date(record.Timestamp);
        totalMinutes += (exitTime - entryTime) / (1000 * 60);
        entryTime = null;
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  // Função auxiliar para verificar se uma data é válida
  const isValidDate = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <User className="h-6 w-6" />
              <span className="font-medium">
                Olá, {user?.name || "Usuário"}
              </span>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </CardContent>
        </Card>

        {/* Registro de Ponto (mostrar apenas se a data for hoje) */}
        {isCurrentDateToday() && <PointRegister onRegister={fetchRecords} />}

        {/* Resumo do Dia */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">
              Registros do Dia
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDateChange(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {formatDate(currentDate)}
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
                  <Clock
                    className={cn(
                      "h-5 w-5",
                      loading
                        ? "animate-spin text-muted-foreground"
                        : "text-primary"
                    )}
                  />
                  <span className="font-medium">Total de Horas:</span>
                  <span>{loading ? "--:--" : calculateWorkHours()}</span>
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
                        <Clock
                          className={cn(
                            "h-4 w-4",
                            record.Type === "entrada"
                              ? "text-green-500"
                              : "text-red-500"
                          )}
                        />
                        <span className="font-medium">{record.Type}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {isValidDate(record.Timestamp)
                          ? formatTime(record.Timestamp)
                          : "--:--"}
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
            onClick={() => navigate("/report")}
          >
            <div className="flex flex-col items-center space-y-2">
              <FileText className="h-6 w-6" />
              <span>Relatório Mensal</span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-24 hover:bg-primary/5"
            onClick={() => navigate("/profile")}
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