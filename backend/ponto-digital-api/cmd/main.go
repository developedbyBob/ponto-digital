package main

import (
	"log"
	"ponto-digital-api/config"
	"github.com/gin-gonic/gin"
	"ponto-digital-api/internal/handlers"
	"go.mongodb.org/mongo-driver/mongo"
	
)

var db *mongo.Database

func main() {
    // Conectar ao MongoDB
    db, err := config.ConnectDB(config.DefaultConfig)
    if err != nil {
        log.Fatal("Não foi possível conectar ao banco de dados:", err)
    }

    // Inicializar handlers
    authHandler := handlers.NewAuthHandler(db)
    pointHandler := handlers.NewPointHandler(db)
    userHandler := handlers.NewUserHandler(db)

    r := gin.Default()

    // Configuração CORS
    r.Use(func(c *gin.Context) {
        c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
        c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
        c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
        c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }

        c.Next()
    })

    // Rotas da API
    api := r.Group("/api")
    {
        // Rotas públicas
        api.POST("/register", authHandler.Register)
        api.POST("/login", authHandler.Login)

        // Rotas protegidas
        protected := api.Group("/")
        protected.Use(authHandler.AuthMiddleware())
        {
            // Rotas de ponto
            protected.POST("/register-point", pointHandler.RegisterPoint)
            protected.GET("/points/today", pointHandler.GetUserPoints)
            protected.GET("/points/monthly", pointHandler.GetMonthlyPoints)
            protected.POST("/setup-pin", userHandler.SetupPin)

            // Rotas de usuário
            protected.GET("/profile", userHandler.GetProfile)
            protected.PUT("/profile", userHandler.UpdateProfile)

            // Rota de estatísticas (opcional)
            protected.GET("/statistics", pointHandler.GetStatistics)
        }
    }

    // Iniciar servidor
    if err := r.Run(":8080"); err != nil {
        log.Fatal("Falha ao iniciar servidor:", err)
    }
}

func handleLogin(c *gin.Context) {
	// Implementaremos depois
	c.JSON(200, gin.H{
		"message": "Login endpoint",
	})
}

func handleRegister(c *gin.Context) {
	// Implementaremos depois
	c.JSON(200, gin.H{
		"message": "Register endpoint",
	})
}

func handleRegisterPoint(c *gin.Context) {
	// Implementaremos depois
	c.JSON(200, gin.H{
		"message": "Register point endpoint",
	})
}

func handleGetPoints(c *gin.Context) {
	// Implementaremos depois
	c.JSON(200, gin.H{
		"message": "Get points endpoint",
	})
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Implementaremos depois
		c.Next()
	}
}