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

	// Group API yang butuh token JWT
	api := router.Group("/api")
	api.Use(middleware.JWTAuthMiddleware())

	api.GET("/rooms", roomController.ApiListRoomsHandler)

	bookings := api.Group("/bookings")
	{
		bookings.POST("", bookingController.CreateBooking)
		bookings.GET("", bookingController.GetBookings)
	}

	admin := router.Group("/admin")
	admin.Use(middleware.JWTAuthMiddleware())
	admin.Use(middleware.RequireAdminRole())

	admin.GET("/dashboard", func(c *gin.Context) {
		c.File("views/dashboard-admin.html")
	})

	admin.GET("/bookings", bookingController.GetBookingsAdmin)
	admin.PUT("/bookings/:id/status", bookingController.UpdateBookingStatus)

}
