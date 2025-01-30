package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"ponto-digital-api/internal/models"
)

type PointHandler struct {
	db *mongo.Database
}

func NewPointHandler(db *mongo.Database) *PointHandler {
	return &PointHandler{db: db}
}

type RegisterPointRequest struct {
	BiometricToken string `json:"biometricToken" binding:"required"`
	Type          string `json:"type" binding:"required"` // "entrada" ou "saída"
	Location      string `json:"location,omitempty"`
	Device        string `json:"device,omitempty"`
}

func (h *PointHandler) RegisterPoint(c *gin.Context) {
	var req RegisterPointRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Pegar o ID do usuário do contexto (setado pelo middleware de autenticação)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
		return
	}

	// Validar o tipo de registro
	if req.Type != "entrada" && req.Type != "saída" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tipo de registro inválido"})
		return
	}

	// Criar registro de ponto
	timeRecord := models.TimeRecord{
		UserID:    userID.(primitive.ObjectID),
		Type:      req.Type,
		Timestamp: time.Now(),
		Location:  req.Location,
		Device:    req.Device,
	}

	// Inserir no banco
	result, err := h.db.Collection("time_records").InsertOne(context.Background(), timeRecord)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao registrar ponto"})
		return
	}

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