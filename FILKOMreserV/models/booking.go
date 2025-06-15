
package models

import (
	"time"
)

type Booking struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserID      uint      `json:"user_id" gorm:"not null"` // Foreign key ke User.ID
	RoomID      uint      `json:"room_id" gorm:"not null"` // ✅ Ubah ke RoomID (integer) bukan NameRoom (string)
	Description string    `json:"description"`
	FilePath    string    `json:"file_path"`
	Date        string    `json:"date" gorm:"not null;size:255;uniqueIndex:idx_room_time"` // ✅ Tambah size limit
	StartTime   string    `json:"start_time" gorm:"not null;size:255;uniqueIndex:idx_room_time"`
	EndTime     string    `json:"end_time" gorm:"not null;size:255;uniqueIndex:idx_room_time"`
	Status      string    `json:"status" gorm:"default:Pending;size:191"`
	TimeSlotID  *uint     `json:"timeslot_id"` // ✅ Ubah ke pointer untuk nullable
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relations
	User     User      `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID"`
	Room     Room      `json:"room,omitempty" gorm:"foreignKey:RoomID;references:ID"` // ✅ Ubah referensi
	TimeSlot *TimeSlot `json:"timeslot,omitempty" gorm:"foreignKey:TimeSlotID;references:ID"` // ✅ Ubah ke pointer
}

// BookingRequest untuk input dari frontend
type BookingRequest struct {
	Username    string `json:"username" binding:"required"`
	NameRoom    string `json:"name_room" binding:"required"` // Tetap terima name_room dari frontend
	Description string `json:"description"`
	FilePath    string `json:"file_path"`
	Date        string `json:"date" binding:"required"`
	StartTime   string `json:"start_time" binding:"required"`
	EndTime     string `json:"end_time" binding:"required"`
}