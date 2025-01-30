package config

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Config struct {
	MongoURI      string
	DatabaseName  string
	ClientOptions *options.ClientOptions
}

var DefaultConfig Config

func init() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Erro ao carregar arquivo .env")
	}

	DefaultConfig = Config{
		MongoURI:     os.Getenv("MONGO_URI"),          
		DatabaseName: os.Getenv("DATABASE_NAME"),      
	}
}

// ConnectDB é responsável por conectar ao banco de dados MongoDB
func ConnectDB(cfg Config) (*mongo.Database, error) {
	// Contexto com timeout de 10 segundos
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Criar o cliente MongoDB
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.MongoURI))
	if err != nil {
		log.Fatal(err)
		return nil, err
	}

	// Verificar a conexão
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal(err)
		return nil, err
	}

	log.Println("Conectado ao MongoDB Atlas com sucesso!")
	return client.Database(cfg.DatabaseName), nil
}
