package main

import (
	"log"
	"ponto-digital-api/config"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	
)

var db *mongo.Database

func main() {
	// Conectar ao MongoDB
	var err error
	db, err = config.ConnectDB(config.DefaultConfig)
	if err != nil {
		log.Fatal("Não foi possível conectar ao banco de dados:", err)
	}

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

	// Rotas
	api := r.Group("/api")
	{
		api.POST("/login", handleLogin)
		api.POST("/register", handleRegister)
		
		// Rotas protegidas
		authorized := api.Group("/")
		authorized.Use(authMiddleware())
		{
			authorized.POST("/register-point", handleRegisterPoint)
			authorized.GET("/points", handleGetPoints)
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