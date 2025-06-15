package routes

import (
	"FILKOMreserV/controllers"
	"FILKOMreserV/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
	// Inisialisasi controller
	authController := controllers.NewAuthController()
	roomController := controllers.NewRoomController()
	notificationController := controllers.NewNotificationController()
	bookingController := controllers.NewBookingController()

	// Routes tanpa auth
	router.POST("/login", authController.Login)
	router.POST("/logout", authController.Logout)

	router.GET("/login", func(c *gin.Context) {
		c.File("views/login.html")
	})
	router.GET("/", func(c *gin.Context) {
		c.File("views/dashboard.html")
	})
	router.GET("/dashboard", func(c *gin.Context) {
		c.File("views/dashboard.html")
	})

	router.GET("/informasi/:id", controllers.GetRoomDetail)
	router.GET("/list", func(c *gin.Context) {
		c.File("views/list.html")
	})
	router.GET("/notifikasi", func(c *gin.Context) {
		c.File("views/notifikasi.html")
	})

	router.GET("/form", func(c *gin.Context) {
		c.File("views/form.html")
	})

	// Group API yang butuh token JWT (login)
	api := router.Group("/api")
	api.Use(middleware.JWTAuthMiddleware()) // Pasang middleware JWT di sini

	// Room API
	api.GET("/rooms", roomController.ApiListRoomsHandler) // Route: GET /api/rooms

	// Booking API yang harus login
	bookings := api.Group("/bookings") // Base path: /api/bookings
	{
		// Create new booking - Route: POST /api/bookings
		bookings.POST("", bookingController.CreateBooking)
		
		// Get all bookings - Route: GET /api/bookings (with optional filtering)
		bookings.GET("", bookingController.GetBookings)
		
		// Update booking status - Route: PUT /api/bookings/:id/status
		bookings.PUT("/:id/status", bookingController.UpdateBookingStatus)
	}

	// Notifications API y auth
	api.GET("/notifications", notificationController.GetAllNotifications)
	api.POST("/notifications", notificationController.CreateNotification)
	api.PUT("/notifications/status", notificationController.UpdateNotificationStatus)

}