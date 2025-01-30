package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	Email     string            `bson:"email"`
	Password  string            `bson:"password"`
	Name      string            `bson:"name"`
	CreatedAt time.Time         `bson:"created_at"`
	UpdatedAt time.Time         `bson:"updated_at"`
}

type TimeRecord struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	UserID    primitive.ObjectID `bson:"user_id"`
	Type      string            `bson:"type"` // "entrada" ou "saida"
	Timestamp time.Time         `bson:"timestamp"`
	Location  string            `bson:"location,omitempty"`
	Device    string            `bson:"device,omitempty"`
}