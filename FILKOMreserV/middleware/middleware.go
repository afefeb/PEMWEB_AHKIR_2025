package middleware

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

var jwtSecretKey = []byte(os.Getenv("JWT_SECRET"))

func init() {
	if len(jwtSecretKey) == 0 {
		jwtSecretKey = []byte("default-secret-key")
	}
}

// JWTAuthMiddleware - Middleware untuk memverifikasi JWT dari cookie
func JWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := c.Cookie("Authorization")
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		claims := jwt.MapClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtSecretKey, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Ambil username dan role dari token
		username, ok := claims["username"].(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token payload"})
			c.Abort()
			return
		}

		// Ambil role dari token (karena AuthController sudah include role di JWT)
		role, ok := claims["role"].(string)
		if !ok {
			role = "user" // default role jika tidak ada
		}

		// Set ke context untuk digunakan controller selanjutnya
		c.Set("username", username)
		c.Set("role", role)
		c.Next()
	}
}

// RequireAdminRole - Middleware untuk memverifikasi role admin
// Harus digunakan setelah JWTAuthMiddleware
func RequireAdminRole() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Ambil role dari context (sudah di-set oleh JWTAuthMiddleware)
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found"})
			c.Abort()
			return
		}

		roleStr, ok := role.(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid role format"})
			c.Abort()
			return
		}

		// Verifikasi role admin
		if roleStr != "admin" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied - Admin role required",
				"user_role": roleStr,
				"message": "Anda tidak memiliki akses ke halaman ini",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}