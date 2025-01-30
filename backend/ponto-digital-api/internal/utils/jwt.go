package utils

import (
	"time"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var jwtSecret = []byte("2732f6b343f9904cb6ca54211d7234ad8a59905206a970d67d946d38ef0197854b18962b232e331b112a3de367539d6f74356ffbed653e6ec1bf80ffedec902c94f2df4382cd8df6fe12b0023296ce38ad884afee1a6bcdc895456bf05471817457253bb39433334658bde294cb236ed8ae935a4d3679c08b5e280211d923ea2") // Nova chave

type Claims struct {
	UserID primitive.ObjectID `json:"user_id"`
	Email  string            `json:"email"`
	jwt.RegisteredClaims
}

func GenerateToken(userID primitive.ObjectID, email string) (string, error) {
	claims := Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, jwt.ErrSignatureInvalid
	}

	return claims, nil
}