package models

import (
	"strings"
)

type Room struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	Name         string         `json:"name" gorm:"not null"`
	Capacity     int            `json:"capacity" gorm:"not null"`
	Description  string         `json:"description"`
	ImageURL     string         `json:"image_url"`
	Facilities   string         `json:"-" gorm:"type:text"` 
	UsageHistory string         `json:"-" gorm:"type:text"` // Stored as comma-separated string
	FacilityList  []string `gorm:"-"`
	TimeSlots    []TimeSlot     `json:"availability" gorm:"foreignKey:RoomID"`
}

// GetFacilities returns facilities as a slice of strings
func (r *Room) GetFacilities() []string {
	if r.Facilities == "" {
		return []string{}
	}
	return strings.Split(r.Facilities, ",")
}

// SetFacilities sets facilities from a slice of strings
func (r *Room) SetFacilities(facilities []string) {
	r.Facilities = strings.Join(facilities, ",")
}

// GetUsageHistory returns usage history as a slice of strings
func (r *Room) GetUsageHistory() []string {
	if r.UsageHistory == "" {
		return []string{}
	}
	return strings.Split(r.UsageHistory, ",")
}

// RoomResponse is used for API responses
type RoomResponse struct {
	ID           uint       `json:"id"`
	Name         string     `json:"name"`
	Capacity     int        `json:"capacity"`
	Description  string     `json:"description"`
	ImageURL     string     `json:"image_url"`
	Availability []TimeSlot `json:"availability"`
	Facilities   []string   `json:"facilities"`
	UsageHistory []string   `json:"usage_history"`
}

// ToResponse converts Room to RoomResponse
func (r *Room) ToResponse() RoomResponse {
	return RoomResponse{
		ID:           r.ID,
		Name:         r.Name,
		Capacity:     r.Capacity,
		Description:  r.Description,
		ImageURL:     r.ImageURL,
		Availability: r.TimeSlots,
		Facilities:   r.GetFacilities(),
		UsageHistory: r.GetUsageHistory(),
	}
}

type TimeSlot struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	RoomID    uint   `gorm:"not null;uniqueIndex:idx_room_time"`
	Date      string `gorm:"not null;uniqueIndex:idx_room_time"`
	StartTime string `gorm:"not null;uniqueIndex:idx_room_time"`
	EndTime   string `gorm:"not null;uniqueIndex:idx_room_time"`
	Booked bool `json:"booked" gorm:"default:false"`
}



