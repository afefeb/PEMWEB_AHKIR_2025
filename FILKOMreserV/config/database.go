package config

import (
	"fmt"
	"log"
	"os"
	"time"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"FILKOMreserV/models"
	"gorm.io/gorm/clause"

)

var DB *gorm.DB

func InitDB() error {
	// Database connection parameters
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	// Set default values if not provided
	if dbHost == "" {
		dbHost = "localhost"
	}
	if dbPort == "" {
		dbPort = "3306"
	}
	if dbUser == "" {
		dbUser = "root"
	}
	if dbName == "" {
		dbName = "room_booking"
	}

	// Create DSN (Data Source Name)
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser, dbPassword, dbHost, dbPort, dbName)

	// Connect to database
	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}

	log.Println("Database connected successfully")

	// Auto migrate the schema
	err = DB.AutoMigrate(
		&models.User{},
		&models.Room{},
		&models.TimeSlot{},
		&models.Booking{},

	)
	if err != nil {
		return fmt.Errorf("failed to migrate database: %v", err)
	}

	// Seed initial data
	seedData()

	// Panggil seed function di sini agar otomatis saat init DB
	if err := seedTimeSlots(); err != nil {
		log.Println("Warning: seeding time slots failed:", err)
	}

	return nil
}

func seedData() {
	// Seed users
	var userCount int64
	DB.Model(&models.User{}).Count(&userCount)
	if userCount == 0 {
		users := []models.User{
			{Username: "admin", Password: "password123", Role: "admin"},
		}
		DB.Create(&users)
		log.Println("Users seeded successfully")
	}

	rooms := []models.Room{
		{
			ID:          1,
			Name:        "GKM",
			Capacity:    100,
			Description: "Gedung Kreativitas Bersama FILKOM UB",
			ImageURL:    "/static/asset/gkm1.jpg",
			Facilities:  "Videotron,Ac Central,Kursi,Lampu Sorot,Audio,Panggung",
		},
		{
			ID:          2,
			Name:        "Auditorium Algoritma G2",
			Capacity:    300,
			Description: "Gedung G2 FILKOM UB",
			ImageURL:    "/static/asset/adver.webp",
			Facilities:  "Videotron,Ac Central,Kursi,Lampu Sorot,Audio,Panggung",
		},
		{
			ID:          3,
			Name:        "Gedung F",
			Capacity:    40,
			Description: "Ruang Kelas Gedung F FILKOM UB",
			ImageURL:    "/static/asset/gedungfkelas1.jpg",
			Facilities:  "Videotron,Ac Central,Kursi,Lampu Sorot,Audio,Panggung",
		},
		{
			ID:          4,
			Name:        "Heuristik",
			Capacity:    120,
			Description: "Gedung A FILKOM UB",
			ImageURL:    "/static/asset/heru.webp",
			Facilities:  "Videotron,Ac Central,Kursi,Lampu Sorot,Audio,Panggung",
		},
	}

	for _, room := range rooms {
		if err := DB.Clauses(clause.OnConflict{
			UpdateAll: true,
		}).Create(&room).Error; err != nil {
			log.Printf("Failed to insert room %v: %v", room.Name, err)
		}
	}	

		// Seed time slots for each room
		seedTimeSlots()
	
}

func seedTimeSlots() error {
	var count int64
	if err := DB.Model(&models.TimeSlot{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		log.Println("Time slots already seeded, skipping...")
		return nil
	}

	startDate := time.Now()
	endDate := startDate.AddDate(0, 1, 0) // 1 bulan ke depan
	slotDuration := 3 * time.Hour
	startHour := 8
	endHour := 20

	var timeSlots []models.TimeSlot
	for roomID := uint(1); roomID <= 4; roomID++ {
		for d := startDate; d.Before(endDate); d = d.AddDate(0, 0, 1) {
			dateStr := d.Format("2006-01-02")

			for hour := startHour; hour <= endHour-int(slotDuration.Hours()); hour += int(slotDuration.Hours()) {
				startTime := time.Date(d.Year(), d.Month(), d.Day(), hour, 0, 0, 0, d.Location())
				endTime := startTime.Add(slotDuration)

				timeSlots = append(timeSlots, models.TimeSlot{
					RoomID:    roomID,
					Date:      dateStr,
					StartTime: startTime.Format("15:04"),
					EndTime:   endTime.Format("15:04"),
					Booked:    false,
				})
			}
		}
	}

	if err := DB.Create(&timeSlots).Error; err != nil {
		return err
	}

	log.Printf("Seeded %d time slots", len(timeSlots))
	return nil
} 

