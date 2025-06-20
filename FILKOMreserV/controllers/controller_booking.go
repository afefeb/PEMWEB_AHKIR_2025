package controllers

import (
	"FILKOMreserV/config"
	"FILKOMreserV/models"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type BookingController struct{}

func NewBookingController() *BookingController {
	return &BookingController{}
}

// CreateBooking membuat booking baru
func (bc *BookingController) CreateBooking(c *gin.Context) {
	db := config.DB

	// Parse multipart form
	err := c.Request.ParseMultipartForm(10 << 20) // 10 MB
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal parsing form"})
		return
	}

	// === Upload File (Opsional) ===
	var filePath string
	file, header, err := c.Request.FormFile("file")
	if err == nil {
		defer file.Close()

		uploadDir := "./uploads/"
		if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
			os.MkdirAll(uploadDir, os.ModePerm)
		}

		filename := time.Now().Format("20060102150405") + "_" + filepath.Base(header.Filename)
		filePath = filepath.Join(uploadDir, filename)

		out, err := os.Create(filePath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan file"})
			return
		}
		defer out.Close()

		if _, err := io.Copy(out, file); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan isi file"})
			return
		}
	}

	// === Ambil data form ===
	username := c.PostForm("username")
	roomName := c.PostForm("name_room")
	date := c.PostForm("date")
	startTime := c.PostForm("start_time")
	endTime := c.PostForm("end_time")
	description := c.PostForm("description")
	status := c.PostForm("status")
	timeslotIDStr := c.PostForm("timeslot_id")

	if username == "" || roomName == "" || date == "" || startTime == "" || endTime == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Field username, name_room, date, start_time, dan end_time wajib diisi"})
		return
	}

	// === Ambil User berdasarkan username ===
	var user models.User
	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User tidak ditemukan"})
		return
	}

	// === Ambil Room berdasarkan name ===
	var room models.Room
	if err := db.Where("name = ?", roomName).First(&room).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Room tidak ditemukan"})
		return
	}

	// === Validasi TimeSlot jika diberikan ===
	var timeSlot models.TimeSlot
	var timeslotID *uint
	if timeslotIDStr != "" {
		id, err := strconv.ParseUint(timeslotIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format timeslot_id tidak valid"})
			return
		}
		timeslotIDUint := uint(id)
		timeslotID = &timeslotIDUint

		if err := db.First(&timeSlot, *timeslotID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "TimeSlot tidak ditemukan"})
			return
		}

		if timeSlot.Booked {
			c.JSON(http.StatusConflict, gin.H{"error": "TimeSlot sudah dibooking"})
			return
		}

		if timeSlot.Date != date || timeSlot.StartTime != startTime || timeSlot.EndTime != endTime {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Form tidak sesuai dengan data TimeSlot",
				"details": map[string]string{
					"form_date":  date,
					"form_start": startTime,
					"form_end":   endTime,
					"slot_date":  timeSlot.Date,
					"slot_start": timeSlot.StartTime,
					"slot_end":   timeSlot.EndTime,
				},
			})
			return
		}
	}

	// === Default status jika kosong ===
	if status == "" {
		status = "Pending"
	}

	// === Cek apakah slot sudah dibooking ===
	var existing models.Booking
	if err := db.Where("room_id = ? AND date = ? AND start_time = ? AND end_time = ?", room.ID, date, startTime, endTime).
		First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Slot waktu sudah dibooking", "existing_booking_id": existing.ID})
		return
	}

	// === Mulai transaksi ===
	tx := db.Begin()

	booking := models.Booking{
		UserID:      user.ID,
		RoomID:      room.ID, // ✅ Gunakan RoomID
		Description: description,
		FilePath:    filePath,
		Date:        date,
		StartTime:   startTime,
		EndTime:     endTime,
		Status:      status,
		TimeSlotID:  timeslotID, // ✅ Pointer
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := tx.Create(&booking).Error; err != nil {
		tx.Rollback()
		if filePath != "" {
			os.Remove(filePath)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat booking"})
		return
	}

	if timeslotID != nil && *timeslotID > 0 {
		if err := tx.Model(&timeSlot).Update("booked", true).Error; err != nil {
			tx.Rollback()
			if filePath != "" {
				os.Remove(filePath)
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update TimeSlot"})
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		if filePath != "" {
			os.Remove(filePath)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal commit transaksi"})
		return
	}

	db.Preload("User").Preload("Room").Preload("TimeSlot").First(&booking, booking.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Booking berhasil dibuat",
		"booking": booking,
	})
}

func (bc *BookingController) GetBookingsAdmin(c *gin.Context) {
	var bookings []models.Booking

	err := config.DB.
		Preload("User").
		Preload("Room").
		Order("created_at desc").
		Find(&bookings).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data booking"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"bookings": bookings})
}


// GetBookings mengembalikan semua data booking
func (bc *BookingController) GetBookings(c *gin.Context) {
	db := config.DB
	var bookings []models.Booking

	if err := db.Preload("User").Preload("Room").Preload("TimeSlot").Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data booking"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"bookings": bookings})
}

// UpdateBookingStatus mengubah status booking tertentu berdasarkan ID
func (bc *BookingController) UpdateBookingStatus(c *gin.Context) {
	db := config.DB
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID booking tidak valid"})
		return
	}

	var booking models.Booking
	if err := db.First(&booking, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking tidak ditemukan"})
		return
	}

	var input struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status diperlukan"})
		return
	}

	booking.Status = input.Status
	if err := db.Save(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status booking berhasil diubah", "booking": booking})
}