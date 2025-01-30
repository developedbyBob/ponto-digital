package handlers

import (
    "context"
    "net/http"
    "time"
    "log"
    "github.com/gin-gonic/gin"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "go.mongodb.org/mongo-driver/mongo"
    "golang.org/x/crypto/bcrypt"
    "ponto-digital-api/internal/models"
)

type UserHandler struct {
    db *mongo.Database
}

func NewUserHandler(db *mongo.Database) *UserHandler {
    return &UserHandler{db: db}
}

type UpdateProfileRequest struct {
    Name            string `json:"name" binding:"required"`
    CurrentPassword string `json:"currentPassword,omitempty"`
    NewPassword     string `json:"newPassword,omitempty"`
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
    var req UpdateProfileRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    userID, exists := c.Get("user_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
        return
    }

    // Buscar usuário atual
    var user models.User
    err := h.db.Collection("users").FindOne(
        context.Background(),
        bson.M{"_id": userID.(primitive.ObjectID)},
    ).Decode(&user)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar usuário"})
        return
    }

    // Preparar atualização
    update := bson.M{
        "$set": bson.M{
            "name":       req.Name,
            "updated_at": time.Now(),
        },
    }

    // Se forneceu senha, validar e atualizar
    if req.NewPassword != "" {
        // Verificar senha atual
        if err := bcrypt.CompareHashAndPassword(
            []byte(user.Password),
            []byte(req.CurrentPassword),
        ); err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Senha atual incorreta"})
            return
        }

        // Hash da nova senha
        hashedPassword, err := bcrypt.GenerateFromPassword(
            []byte(req.NewPassword),
            bcrypt.DefaultCost,
        )
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar nova senha"})
            return
        }

        update["$set"].(bson.M)["password"] = string(hashedPassword)
    }

    // Atualizar usuário
    result, err := h.db.Collection("users").UpdateOne(
        context.Background(),
        bson.M{"_id": userID.(primitive.ObjectID)},
        update,
    )
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar perfil"})
        return
    }

    if result.ModifiedCount == 0 {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Nenhuma alteração realizada"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Perfil atualizado com sucesso",
        "user": gin.H{
            "id":    user.ID,
            "name":  req.Name,
            "email": user.Email,
        },
    })
}

func (h *UserHandler) GetProfile(c *gin.Context) {
    userID, exists := c.Get("user_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
        return
    }

    var user models.User
    err := h.db.Collection("users").FindOne(
        context.Background(),
        bson.M{"_id": userID.(primitive.ObjectID)},
    ).Decode(&user)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar usuário"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "id":    user.ID,
        "name":  user.Name,
        "email": user.Email,
    })
}

func (h *UserHandler) SetupPin(c *gin.Context) {
    var req struct {
        Pin string `json:"pin" binding:"required,min=4,max=6"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "PIN deve ter entre 4 e 6 dígitos"})
        return
    }

    userID, exists := c.Get("user_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
        return
    }

    // Atualizar o PIN do usuário
    update := bson.M{
        "$set": bson.M{
            "pin": req.Pin,
            "updated_at": time.Now(),
        },
    }

    result, err := h.db.Collection("users").UpdateOne(
        context.Background(),
        bson.M{"_id": userID.(primitive.ObjectID)},
        update,
    )

    if err != nil {
        log.Printf("Erro ao configurar PIN: %v\n", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao configurar PIN"})
        return
    }

    if result.ModifiedCount == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
        return
    }

    log.Printf("PIN configurado com sucesso para usuário: %v\n", userID)
    c.JSON(http.StatusOK, gin.H{"message": "PIN configurado com sucesso"})
}