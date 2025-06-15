package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"FILKOMreserV/config"
	"FILKOMreserV/routes"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found")
	}

	if err := config.InitDB(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	router := gin.Default()

	router.LoadHTMLGlob("views/*")

	router.Static("/static", "./static")

	router.Static("/uploads", "./uploads")


	routes.SetupRoutes(router)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server running on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
