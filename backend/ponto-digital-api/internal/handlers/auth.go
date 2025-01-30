package handlers

import (
    "context"
    "net/http"
    "time"

    "golang.org/x/crypto/bcrypt"
    "github.com/gin-gonic/gin"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "ponto-digital-api/internal/models"
    "ponto-digital-api/internal/utils"
)

type AuthHandler struct {
    db *mongo.Database
}

func NewAuthHandler(db *mongo.Database) *AuthHandler {
    return &AuthHandler{db: db}
}

type RegisterRequest struct {
    Name     string `json:"name" binding:"required"`
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
    var req RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Verificar se o email já existe
    var existingUser models.User
    err := h.db.Collection("users").FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&existingUser)
    if err == nil {
        c.JSON(http.StatusConflict, gin.H{"error": "Email já cadastrado"})
        return
    }

    // Hash da senha
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar senha"})
        return
    }

    // Criar novo usuário
    user := models.User{
        Name:      req.Name,
        Email:     req.Email,
        Password:  string(hashedPassword),
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }

    result, err := h.db.Collection("users").InsertOne(context.Background(), user)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar usuário"})
        return
    }

    // Gerar token
    token, err := utils.GenerateToken(result.InsertedID.(primitive.ObjectID), user.Email)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao gerar token"})
        return
    }

    c.JSON(http.StatusCreated, gin.H{
        "token": token,
        "user": gin.H{
            "id":    result.InsertedID,
            "name":  user.Name,
            "email": user.Email,
        },
    })
}

func (h *AuthHandler) Login(c *gin.Context) {
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Buscar usuário
    var user models.User
    err := h.db.Collection("users").FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&user)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas"})
        return
    }

    // Verificar senha
    err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas"})
        return
    }

    // Gerar token
    token, err := utils.GenerateToken(user.ID, user.Email)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao gerar token"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "token": token,
        "user": gin.H{
            "id":    user.ID,
            "name":  user.Name,
            "email": user.Email,
        },
    })
}

func (h *AuthHandler) AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token não fornecido"})
            return
        }

        // Remover "Bearer " do token
        tokenString := authHeader[7:]

        claims, err := utils.ValidateToken(tokenString)
        if err != nil {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token inválido"})
            return
        }

        // Adicionar informações do usuário ao contexto
        c.Set("user_id", claims.UserID)
        c.Set("email", claims.Email)

        c.Next()
    }
}