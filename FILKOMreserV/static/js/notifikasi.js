// notifikasi.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting to load notifications...');
    loadNotifications();
});

async function loadNotifications() {
    const container = document.getElementById('notif-container');
    
    if (!container) {
        console.error('Container notif-container tidak ditemukan!');
        return;
    }
    
    try {
        console.log('Menampilkan loading...');
        // Tampilkan loading
        container.innerHTML = `
            <div class="loading-container text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p class="mt-2">Memuat notifikasi...</p>
            </div>
        `;

        console.log('Mengambil data dari /api/bookings...');
        // Ambil data booking dari API
        const response = await fetch('/api/bookings');
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Data received:', data);
        
        const bookings = data.bookings || [];
        console.log('Bookings array:', bookings);
        console.log('Bookings length:', bookings.length);
        
        // Kosongkan container
        container.innerHTML = '';
        
        if (bookings.length === 0) {
            console.log('Tidak ada bookings, menampilkan empty state');
            container.innerHTML = `
                <div class="empty-state text-center py-5">
                    <i class="ri-notification-off-line" style="font-size: 4rem; color: #ccc;"></i>
                    <h4 class="mt-3 text-muted">Tidak ada notifikasi</h4>
                    <p class="text-muted">Belum ada riwayat peminjaman ruangan</p>
                </div>
            `;
            return;
        }
        
        console.log('Mengurutkan bookings...');
        // Urutkan booking berdasarkan tanggal terbaru
        bookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        console.log('Rendering notification cards...');
        // Render setiap booking sebagai notifikasi
        bookings.forEach((booking, index) => {
            console.log(`Rendering booking ${index + 1}:`, booking);
            const notifCard = createNotificationCard(booking);
            container.appendChild(notifCard);
        });
        
        console.log('Selesai rendering semua notifikasi');
        
    } catch (error) {
        console.error('Error loading notifications:', error);
        container.innerHTML = `
            <div class="error-state text-center py-5">
                <i class="ri-error-warning-line" style="font-size: 4rem; color: #dc3545;"></i>
                <h4 class="mt-3 text-danger">Gagal Memuat Notifikasi</h4>
                <p class="text-muted">Terjadi kesalahan: ${error.message}</p>
                <button class="btn btn-primary mt-3" onclick="loadNotifications()">
                    <i class="ri-refresh-line"></i> Coba Lagi
                </button>
            </div>
        `;
    }
}

function createNotificationCard(booking) {
    console.log('Creating card for booking:', booking);
    
    const card = document.createElement('div');
    card.className = 'notification-card mb-3';
    
    // Tentukan icon dan warna berdasarkan status
    const statusConfig = getStatusConfig(booking.status);
    
    // Format tanggal
    const createdDate = formatDate(booking.created_at);
    const bookingDate = formatDate(booking.date);
    
    // Username dari relasi user atau fallback
    const username = booking.user?.username || booking.user?.name || 'User';
    
    // Room name dari relasi room atau fallback
    const roomName = booking.room?.name || booking.name_room || 'Ruangan';
    
    console.log('Card data:', {
        username,
        roomName,
        status: booking.status,
        createdDate,
        bookingDate
    });
    
    card.innerHTML = `
        <div class="card border-left-${statusConfig.color}" style="border-left: 4px solid;">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <div class="notification-icon ${statusConfig.color}" style="
                            width: 40px; 
                            height: 40px; 
                            border-radius: 50%; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center;
                            background-color: rgba(0,123,255,0.1);
                        ">
                            <i class="${statusConfig.icon}" style="font-size: 1.2rem;"></i>
                        </div>
                    </div>
                    <div class="col">
                        <div class="notification-content">
                            <h5 class="notification-title mb-1">
                                Peminjaman ${roomName}
                                <span class="badge badge-${statusConfig.badgeColor} ml-2">${booking.status}</span>
                            </h5>
                            <p class="notification-message mb-2">
                                <strong>${username}</strong> ${getStatusMessage(booking.status)} ruangan <strong>${roomName}</strong>
                            </p>
                            <div class="notification-details">
                                <div class="row">
                                    <div class="col-md-6">
                                        <small class="text-muted">
                                            <i class="ri-calendar-line"></i> ${bookingDate}
                                        </small>
                                    </div>
                                    <div class="col-md-6">
                                        <small class="text-muted">
                                            <i class="ri-time-line"></i> ${booking.start_time} - ${booking.end_time}
                                        </small>
                                    </div>
                                </div>
                                ${booking.description ? `
                                    <div class="mt-2">
                                        <small class="text-muted">
                                            <i class="ri-file-text-line"></i> ${booking.description}
                                        </small>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="col-auto">
                        <small class="text-muted notification-time">
                            <i class="ri-time-line"></i> ${createdDate}
                        </small>
                        ${booking.file_path ? `
                            <div class="mt-2">
                                <a href="${booking.file_path}" target="_blank" class="btn btn-sm btn-outline-primary">
                                    <i class="ri-download-line"></i> File
                                </a>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

function getStatusConfig(status) {
    const configs = {
        'Pending': {
            icon: 'ri-time-line',
            color: 'warning',
            badgeColor: 'warning'
        },
        'Approved': {
            icon: 'ri-check-line',
            color: 'success',
            badgeColor: 'success'
        },
        'Rejected': {
            icon: 'ri-close-line',
            color: 'danger',
            badgeColor: 'danger'
        },
        'Cancelled': {
            icon: 'ri-close-circle-line',
            color: 'secondary',
            badgeColor: 'secondary'
        }
    };
    
    return configs[status] || configs['Pending'];
}

function getStatusMessage(status) {
    const messages = {
        'Pending': 'mengajukan peminjaman',
        'Approved': 'berhasil meminjam',
        'Rejected': 'ditolak peminjamannya untuk',
        'Cancelled': 'membatalkan peminjaman'
    };
    
    return messages[status] || 'mengajukan peminjaman';
}

function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Jika hari ini
        if (diffDays === 1) {
            return 'Hari ini ' + date.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // Jika kemarin
        if (diffDays === 2) {
            return 'Kemarin ' + date.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // Jika dalam seminggu
        if (diffDays <= 7) {
            return `${diffDays - 1} hari lalu`;
        }
        
        // Format tanggal lengkap
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

// Fungsi untuk refresh notifikasi
function refreshNotifications() {
    console.log('Refreshing notifications...');
    loadNotifications();
}

// Auto refresh setiap 30 detik
setInterval(refreshNotifications, 30000);