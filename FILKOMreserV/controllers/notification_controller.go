package controllers

import (
	"net/http"

	"FILKOMreserV/config"
	"FILKOMreserV/models"
	"github.com/gin-gonic/gin"
)

// NotificationController struct
type NotificationController struct{}

// NewNotificationController - constructor
func NewNotificationController() *NotificationController {
	return &NotificationController{}
}

// GetAllNotifications - Get all notifications with room name
func (nc *NotificationController) GetAllNotifications(c *gin.Context) {
	var notifications []models.Notification
	if err := config.DB.Preload("Room").Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}

	var response []models.NotificationWithRoom
	for _, n := range notifications {
		response = append(response, models.NotificationWithRoom{
			ID:          n.ID,
			RoomName:    n.Room.Name,
			BorrowDate:  n.BorrowDate,
			StartTime:   n.StartTime,
			EndTime:     n.EndTime,
			Status:      n.Status,
			File:        n.File,
			Description: n.Description,
			Username:    n.Username,
		})
	}

	c.JSON(http.StatusOK, gin.H{"notifications": response})
}

// CreateNotification - Create a new notification
func (nc *NotificationController) CreateNotification(c *gin.Context) {
	var input models.Notification
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Notification created successfully"})
}

// UpdateNotificationStatus - Update status of a notification
func (nc *NotificationController) UpdateNotificationStatus(c *gin.Context) {
	var req models.UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var notif models.Notification
	if err := config.DB.First(&notif, req.ID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	notif.Status = req.Status
	if err := config.DB.Save(&notif).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}
