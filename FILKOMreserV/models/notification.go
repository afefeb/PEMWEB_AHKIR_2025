package models

import (
	"time"
	"gorm.io/gorm"
)

type Notification struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	RoomID      uint           `json:"room_id" gorm:"not null"`
	Room        Room           `json:"-" gorm:"foreignKey:RoomID"`
	BorrowDate  string         `json:"borrow_date" gorm:"not null"`
	StartTime   string         `json:"start_time" gorm:"not null"`
	EndTime     string         `json:"end_time" gorm:"not null"`
	Status      string         `json:"status" gorm:"not null;default:'proses'"`
	File        string         `json:"file"`
	Description string         `json:"description"`
	Username    string         `json:"username" gorm:"not null"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

type NotificationWithRoom struct {
	ID          uint   `json:"id"`
	RoomName    string `json:"room_name"`
	BorrowDate  string `json:"borrow_date"`
	StartTime   string `json:"start_time"`
	EndTime     string `json:"end_time"`
	Status      string `json:"status"`
	File        string `json:"file"`
	Description string `json:"description"`
	Username    string `json:"username"`
}

type UpdateStatusRequest struct {
	ID     uint   `json:"id" binding:"required"`
	Status string `json:"status" binding:"required"`
}