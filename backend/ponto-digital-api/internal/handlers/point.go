package handlers

import (
	"bytes" // Adicionado
	"context"
	"encoding/base64"
	"encoding/json" // Adicionado
	"errors"
	"io" // Adicionado
	"log"
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"ponto-digital-api/internal/models"
)

type PointHandler struct {
	db *mongo.Database
}

func NewPointHandler(db *mongo.Database) *PointHandler {
	return &PointHandler{db: db}
}

type RegisterPointRequest struct {
    BiometricToken string `json:"biometricToken,omitempty"`
    Pin           string `json:"pin,omitempty"`
    Type          string `json:"type" binding:"required"`
    Location      string `json:"location"`
    Device        string `json:"device"`
    AuthMethod    string `json:"authMethod" binding:"required,oneof=pin biometric"`
}


func (h *PointHandler) verifyPin(userID primitive.ObjectID, pin string) error {
    var user models.User
    err := h.db.Collection("users").FindOne(
        context.Background(),
        bson.M{"_id": userID},
    ).Decode(&user)

    if err != nil {
        return err
    }

    if user.Pin != pin {
        return errors.New("PIN inválido")
    }

    return nil
}

func (h *PointHandler) verifyBiometricToken(token string) error {
    if token == "" {
        return errors.New("Token biométrico não fornecido")
    }

    _, err := base64.StdEncoding.DecodeString(token)
    if err != nil {
        return errors.New("Token biométrico inválido")
    }

    return nil
}

func (h *PointHandler) RegisterPoint(c *gin.Context) {
    // Log do request raw
    body, err := io.ReadAll(c.Request.Body)
    if err != nil {
        log.Printf("Erro ao ler body: %v\n", err)
        c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao ler request"})
        return
    }
    // Restaura o body para ser usado novamente
    c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

    // Log do body recebido
    log.Printf("Body recebido: %s\n", string(body))

    // Log dos headers
    log.Printf("Headers recebidos: %+v\n", c.Request.Header)

    var req RegisterPointRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        log.Printf("Erro de binding: %v\n", err)
        
        // Tenta decodificar manualmente para debug
        var rawData map[string]interface{}
        if jsonErr := json.Unmarshal(body, &rawData); jsonErr != nil {
            log.Printf("Erro ao decodificar JSON manualmente: %v\n", jsonErr)
        } else {
            log.Printf("Dados decodificados manualmente: %+v\n", rawData)
        }

        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Erro de validação: " + err.Error(),
            "received": string(body),
        })
        return
    }

    // Log dos dados após binding
    log.Printf("Dados após binding: %+v\n", req)

    // Pegar o ID do usuário do contexto
    userID, exists := c.Get("user_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
        return
    }

    // Log do userID
    log.Printf("UserID: %v\n", userID)

    // Validar o tipo de registro
    if req.Type != "entrada" && req.Type != "saída" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Tipo de registro inválido: " + req.Type})
        return
    }

    // Validar o método de autenticação e seus requisitos
    switch req.AuthMethod {
    case "pin":
        log.Printf("Tentativa de autenticação com PIN para usuário: %v\n", userID)
        if req.Pin == "" {
            c.JSON(http.StatusBadRequest, gin.H{"error": "PIN não fornecido"})
            return
        }
        if err := h.verifyPin(userID.(primitive.ObjectID), req.Pin); err != nil {
            log.Printf("Erro na verificação do PIN: %v\n", err)
            c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
            return
        }
    case "biometric":
        log.Printf("Tentativa de autenticação biométrica para usuário: %v\n", userID)
        if err := h.verifyBiometricToken(req.BiometricToken); err != nil {
            log.Printf("Erro na verificação biométrica: %v\n", err)
            c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
            return
        }
    default:
        c.JSON(http.StatusBadRequest, gin.H{"error": "Método de autenticação inválido: " + req.AuthMethod})
        return
    }

    // Criar registro de ponto
    timeRecord := models.TimeRecord{
        UserID:     userID.(primitive.ObjectID),
        Type:       req.Type,
        Timestamp:  time.Now(),
        Location:   req.Location,
        Device:     req.Device,
        AuthMethod: req.AuthMethod,
    }

    // Log do registro a ser inserido
    log.Printf("Inserindo registro: %+v\n", timeRecord)

    // Inserir no banco
    result, err := h.db.Collection("time_records").InsertOne(context.Background(), timeRecord)
    if err != nil {
        log.Printf("Erro ao inserir no banco: %v\n", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao registrar ponto"})
        return
    }

    log.Printf("Registro inserido com sucesso. ID: %v\n", result.InsertedID)

    c.JSON(http.StatusCreated, gin.H{
        "id":        result.InsertedID,
        "message":   "Ponto registrado com sucesso",
        "timestamp": timeRecord.Timestamp,
        "type":      timeRecord.Type,
    })
}

func (h *PointHandler) GetUserPoints(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
		return
	}

	// Obter registros do dia atual
	startOfDay := time.Now().Truncate(24 * time.Hour)
	endOfDay := startOfDay.Add(24 * time.Hour)

	filter := bson.M{
		"user_id": userID.(primitive.ObjectID),
		"timestamp": bson.M{
			"$gte": startOfDay,
			"$lt":  endOfDay,
		},
	}

	cursor, err := h.db.Collection("time_records").Find(context.Background(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar registros"})
		return
	}
	defer cursor.Close(context.Background())

	var records []models.TimeRecord
	if err := cursor.All(context.Background(), &records); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao decodificar registros"})
		return
	}

	c.JSON(http.StatusOK, records)
}

func (h *PointHandler) GetMonthlyPoints(c *gin.Context) {
    userID, exists := c.Get("user_id")
    if (!exists) {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
        return
    }

    // Pegar ano e mês dos parâmetros da query
    year, err := strconv.Atoi(c.Query("year"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Ano inválido"})
        return
    }

    month, err := strconv.Atoi(c.Query("month"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Mês inválido"})
        return
    }

    // Calcular início e fim do mês
    loc, _ := time.LoadLocation("America/Sao_Paulo")
    startOfMonth := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, loc)
    endOfMonth := startOfMonth.AddDate(0, 1, 0)

    // Buscar registros do mês
    filter := bson.M{
        "user_id": userID.(primitive.ObjectID),
        "timestamp": bson.M{
            "$gte": startOfMonth,
            "$lt":  endOfMonth,
        },
    }

    // Ordenar por data
    opts := options.Find().SetSort(bson.M{"timestamp": 1})

    cursor, err := h.db.Collection("time_records").Find(context.Background(), filter, opts)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar registros"})
        return
    }
    defer cursor.Close(context.Background())

    var records []models.TimeRecord
    if err := cursor.All(context.Background(), &records); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao decodificar registros"})
        return
    }

    // Agrupar registros por dia
    recordsByDay := make(map[string][]models.TimeRecord)
    for _, record := range records {
        day := record.Timestamp.Format("2006-01-02")
        recordsByDay[day] = append(recordsByDay[day], record)
    }

    // Converter para slice para retorno
    var response []struct {
        Date    string              `json:"date"`
        Records []models.TimeRecord `json:"records"`
    }

    for date, dayRecords := range recordsByDay {
        response = append(response, struct {
            Date    string              `json:"date"`
            Records []models.TimeRecord `json:"records"`
        }{
            Date:    date,
            Records: dayRecords,
        })
    }

    // Ordenar por data
    sort.Slice(response, func(i, j int) bool {
        return response[i].Date < response[j].Date
    })

    c.JSON(http.StatusOK, response)
}

func (h *PointHandler) GetStatistics(c *gin.Context) {
    userID, exists := c.Get("user_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
        return
    }

    // Obter o primeiro dia do mês atual
    now := time.Now()
    startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

    // Buscar registros do mês atual
    filter := bson.M{
        "user_id": userID.(primitive.ObjectID),
        "timestamp": bson.M{
            "$gte": startOfMonth,
        },
    }

    cursor, err := h.db.Collection("time_records").Find(context.Background(), filter)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar registros"})
        return
    }
    defer cursor.Close(context.Background())

    var records []models.TimeRecord
    if err := cursor.All(context.Background(), &records); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao decodificar registros"})
        return
    }

    // Calcular estatísticas
    var totalHours float64
    var daysWorked int
    var lateDays int
    daysMap := make(map[string][]models.TimeRecord)

    // Agrupar registros por dia
    for _, record := range records {
        day := record.Timestamp.Format("2006-01-02")
        daysMap[day] = append(daysMap[day], record)
    }

    // Analisar cada dia
    for _, dayRecords := range daysMap {
        if len(dayRecords) > 0 {
            daysWorked++

            // Verificar primeira entrada do dia
            firstEntry := dayRecords[0]
            if firstEntry.Type == "entrada" && firstEntry.Timestamp.Hour() >= 9 { // considerando 9h como hora limite
                lateDays++
            }

            // Calcular horas trabalhadas
            var entryTime *time.Time
            for _, record := range dayRecords {
                if record.Type == "entrada" {
                    entryTime = &record.Timestamp
                } else if record.Type == "saída" && entryTime != nil {
                    duration := record.Timestamp.Sub(*entryTime)
                    totalHours += duration.Hours()
                    entryTime = nil
                }
            }
        }
    }

    // Calcular médias
    averageHoursPerDay := 0.0
    if daysWorked > 0 {
        averageHoursPerDay = totalHours / float64(daysWorked)
    }

    c.JSON(http.StatusOK, gin.H{
        "total_hours":          totalHours,
        "days_worked":          daysWorked,
        "late_days":           lateDays,
        "average_hours_per_day": averageHoursPerDay,
        "current_month":        now.Format("January 2006"),
    })
}