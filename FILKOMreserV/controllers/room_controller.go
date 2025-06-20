package controllers

import (
	"net/http"
	"strconv"
	"strings"
	"FILKOMreserV/config"
	"FILKOMreserV/models"
	"github.com/gin-gonic/gin"
	"time"
	"sort"
)

// RoomController struct
type RoomController struct{}

// NewRoomController constructor
func NewRoomController() *RoomController {
	return &RoomController{}
}


// GetRoomByID returns a specific room by ID
func (rc *RoomController) GetRoomByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room ID"})
		return
	}

	var room models.Room
	if err := config.DB.Preload("TimeSlots").First(&room, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	c.JSON(http.StatusOK, room.ToResponse())
}

// Get Room Detail
func GetRoomDetail(c *gin.Context) {
	id := c.Param("id")

	var room models.Room
	result := config.DB.First(&room, id)
	if result.Error != nil {
		c.String(404, "Ruangan tidak ditemukan")
		return
	}

	room.FacilityList = strings.Split(room.Facilities, ",")

	// Misal kamu buat field UsageHistoryList di model Room atau bisa pakai map:
	usageHistoryList := []string{}
	if room.UsageHistory != "" {
		usageHistoryList = strings.Split(room.UsageHistory, ",")
	}

	c.HTML(http.StatusOK, "informasi.html", gin.H{
		"room":             room,
		"UsageHistoryList": usageHistoryList,
	})
}
func (rc *RoomController) ApiListRoomsHandler(c *gin.Context) {
	dateStr := c.Query("date")
	startStr := c.Query("start_time")
	endStr := c.Query("end_time")
	capacityStr := c.Query("capacity")
	
	// Parsing input dengan pengecekan error sederhana
	capacity, err := strconv.Atoi(capacityStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid capacity"})
		return
	}
	
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
		return
	}
	
	startTime, err := time.Parse("15:04", startStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_time format"})
		return
	}
	
	endTime, err := time.Parse("15:04", endStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_time format"})
		return
	}
	
	// Pastikan waktu akhir setelah waktu mulai
	if !endTime.After(startTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end_time must be after start_time"})
		return
	}
	
	var rooms []models.Room
	
	// Format tanggal sebagai string agar cocok dengan field DB yang biasanya string
	dateFormatted := date.Format("2006-01-02")
	
	err = config.DB.Preload("TimeSlots", "date = ?", dateFormatted).
    Where("capacity >= ?", capacity).
    Find(&rooms).Error 


	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	
	var availableRooms []models.Room
	
	for _, room := range rooms {
		// Filter slot yang tidak booked
		var usableSlots []models.TimeSlot
		for _, slot := range room.TimeSlots {
			if !slot.Booked {
				usableSlots = append(usableSlots, slot)
			}
		}
	
		// Urutkan berdasarkan StartTime ascending
		sort.Slice(usableSlots, func(i, j int) bool {
			return usableSlots[i].StartTime < usableSlots[j].StartTime
		})
	
		// Cek apakah ada rangkaian slot yang menutupi waktu dari startTime ke endTime
		isAvailable := false
	
		for i := 0; i < len(usableSlots); i++ {
			s := usableSlots[i]
	
			slotStart, err1 := time.Parse("15:04", s.StartTime)
			slotEnd, err2 := time.Parse("15:04", s.EndTime)
			if err1 != nil || err2 != nil {
				// Skip slot yang format waktunya salah
				continue
			}
	
			// Slot harus bisa menutupi waktu mulai yang diminta,
			// artinya slotStart <= startTime < slotEnd
			if slotStart.After(startTime) || !slotEnd.After(startTime) {
				// slot tidak bisa mulai sebelum waktu mulai, atau tidak menutupi waktu mulai
				continue
			}
	
			currentEnd := slotEnd
	
			// Cari slot-slot berikutnya yang nyambung/tumpang tindih untuk melanjutkan coverage sampai endTime
			for j := i + 1; j < len(usableSlots) && currentEnd.Before(endTime); j++ {
				nextSlot := usableSlots[j]
	
				nextStart, err3 := time.Parse("15:04", nextSlot.StartTime)
				nextEnd, err4 := time.Parse("15:04", nextSlot.EndTime)
				if err3 != nil || err4 != nil {
					continue
				}
	
				// Cek apakah nextStart <= currentEnd (nyambung atau tumpang tindih)
				if !nextStart.After(currentEnd) {
					// Perpanjang currentEnd jika nextEnd lebih jauh
					if nextEnd.After(currentEnd) {
						currentEnd = nextEnd
					}
				} else {
					// Ada celah waktu, berarti chain putus
					break
				}
			}
	
			// Setelah chain, cek apakah coverage sudah sampai endTime
			if !currentEnd.Before(endTime) {
				isAvailable = true
				break
			}
		}
	
		if isAvailable {
			availableRooms = append(availableRooms, room)
		}
	}
	
	// Kirim response selalu dengan array (minimal kosong)
	c.JSON(http.StatusOK, gin.H{
		"rooms": availableRooms,
	})
}


