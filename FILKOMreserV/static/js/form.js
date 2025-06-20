// Global variable untuk menyimpan data booking
let bookingData = null;

// Inisialisasi form saat halaman dimuat
function initializeBookingForm() {
    // Ambil data booking dari sessionStorage
    const storedData = sessionStorage.getItem('bookingFormData');
    
    if (!storedData) {
        // Jika tidak ada data, redirect kembali ke dashboard
        alert('Data booking tidak ditemukan. Silakan pilih ruangan terlebih dahulu.');
        window.location.href = '/dashboard';
        return;
    }
    
    bookingData = JSON.parse(storedData);
    
    // Debug: Log booking data untuk melihat slot ID
    console.log('Booking data loaded:', bookingData);
    
    // Validasi slot ID
    if (!bookingData.slotId || bookingData.slotId === 'undefined' || bookingData.slotId === null) {
        console.error('Invalid slot ID in booking data:', bookingData.slotId);
        alert('Data slot tidak valid. Silakan kembali dan pilih slot lagi.');
        window.location.href = '/dashboard';
        return;
    }
    
    // Cek autentikasi
    const auth = checkUserAuth();
    if (!auth.canBook) {
        alert('Anda tidak memiliki akses untuk melakukan booking.');
        window.location.href = '/dashboard';
        return;
    }
    
    // Populate form dengan data yang sudah dipilih
    populateForm();
    
    // Update tombol auth
    updateAuthButton(auth);
}

// Mengisi form dengan data dari booking yang dipilih
function populateForm() {
    if (!bookingData) return;
    
    // Tampilkan informasi ruangan
    document.getElementById('selected-room-info').style.display = 'block';
    document.getElementById('info-room-name').textContent = bookingData.roomName;
    document.getElementById('info-date').textContent = bookingData.formattedDate;
    document.getElementById('info-time').textContent = `${bookingData.startTime} - ${bookingData.endTime}`;
    document.getElementById('info-capacity').textContent = `${bookingData.capacity} orang`;
    document.getElementById('info-location').textContent = bookingData.location;
    document.getElementById('info-facilities').textContent = bookingData.facilities;
    
    // Populate form fields
    document.getElementById('nama').value = bookingData.username || '';
    document.getElementById('tanggal').value = bookingData.date;
    document.getElementById('checkin').value = bookingData.startTime;
    document.getElementById('checkout').value = bookingData.endTime;
    
    // Update info text dengan slot ID untuk debugging
    document.getElementById('booking-info').innerHTML = `
        Lengkapi informasi booking untuk <strong>${bookingData.roomName}</strong> 
        pada <strong>${bookingData.formattedDate}</strong> 
        pukul <strong>${bookingData.startTime} - ${bookingData.endTime}</strong>.
        <br><small class="text-muted">Slot ID: ${bookingData.slotId}</small>
    `;
}

// Cek status autentikasi user
function checkUserAuth() {
    const userRole = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') || localStorage.getItem('isLoggedIn');
    const username = sessionStorage.getItem('username') || localStorage.getItem('username');
    
    return {
        isLoggedIn: isLoggedIn === 'true',
        role: userRole,
        username: username,
        canBook: isLoggedIn === 'true' && userRole === 'user'
    };
}

// Update tampilan tombol auth
function updateAuthButton(auth) {
    const authButton = document.getElementById('authButton');
    if (authButton) {
        if (auth.isLoggedIn) {
            authButton.textContent = `Logout (${auth.username})`;
            authButton.onclick = logout;
        } else {
            authButton.textContent = 'Login';
            authButton.onclick = () => window.location.href = '/login';
        }
    }
}

// Fungsi logout
function logout() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '/login';
}

// Validasi form sebelum submit
function validateForm() {
    let isValid = true;
    
    // Reset warning messages
    document.querySelectorAll('.warning-message').forEach(el => {
        el.style.display = 'none';
    });
    
    // Validate nama
    const nama = document.getElementById('nama').value.trim();
    if (!nama) {
        const namaWarning = document.getElementById('nama-warning');
        if (namaWarning) namaWarning.style.display = 'block';
        isValid = false;
    }
    
    // Validate file upload
    const fileUpload = document.getElementById('fileUpload');
    if (fileUpload && !fileUpload.files.length) {
        const fileWarning = document.getElementById('file-warning');
        if (fileWarning) fileWarning.style.display = 'block';
        isValid = false;
    } else if (fileUpload && fileUpload.files.length > 0) {
        // Validate file size (5MB max)
        const file = fileUpload.files[0];
        if (file.size > 5 * 1024 * 1024) {
            alert('Ukuran file terlalu besar. Maksimal 5MB.');
            const fileWarning = document.getElementById('file-warning');
            if (fileWarning) fileWarning.style.display = 'block';
            isValid = false;
        }
        
        // Validate file type
        const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
        const fileName = file.name.toLowerCase();
        const isValidType = allowedTypes.some(type => fileName.endsWith(type));
        
        if (!isValidType) {
            alert('Format file tidak didukung. Gunakan: PDF, DOC, DOCX, JPG, atau PNG.');
            const fileWarning = document.getElementById('file-warning');
            if (fileWarning) fileWarning.style.display = 'block';
            isValid = false;
        }
    }
    
    // Validate deskripsi
    const deskripsi = document.getElementById('deskripsi').value.trim();
    if (!deskripsi) {
        const deskripsiWarning = document.getElementById('deskripsi-warning');
        if (deskripsiWarning) deskripsiWarning.style.display = 'block';
        isValid = false;
    }
    
    return isValid;
}

// Proses form dan kirim booking
async function prosesForm() {
    if (!validateForm()) {
        alert('Mohon lengkapi semua field yang wajib diisi.');
        return;
    }
    
    if (!bookingData) {
        alert('Data booking tidak valid.');
        return;
    }
    
    // Validasi ulang slot ID sebelum submit
    if (!bookingData.slotId || bookingData.slotId === 'undefined' || bookingData.slotId === null) {
        console.error('Invalid slot ID before submit:', bookingData);
        alert('Error: Slot ID tidak valid. Silakan kembali dan pilih slot lagi.');
        return;
    }
    
    // Show loading
    showLoading('Memproses booking, harap tunggu...');
    
    try {
        // Prepare form data for submission
        const formData = new FormData();
        
        // Add booking data - pastikan slot ID benar
        formData.append('username', bookingData.username);
        formData.append('name_room', bookingData.roomName);
        formData.append('date', bookingData.date);
        formData.append('start_time', bookingData.startTime);
        formData.append('end_time', bookingData.endTime);
        formData.append('timeslot_id', bookingData.slotId.toString()); // Pastikan string
        formData.append('description', document.getElementById('deskripsi').value.trim());
        formData.append('status', 'Pending');
        
        // Debug: Log data yang akan dikirim
        console.log('Form data being sent:');
        for (let [key, value] of formData.entries()) {
            console.log(key, ':', value);
        }
        
        // Add file
        const fileUpload = document.getElementById('fileUpload');
        if (fileUpload && fileUpload.files.length > 0) {
            formData.append('file', fileUpload.files[0]);
        }
        
        // Send to server
        const response = await fetch('/api/bookings', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        const result = await response.json();
        
        // Debug: Log response
        console.log('Server response:', result);
        
        if (response.ok) {
            // Success
            showSuccessMessage(result);
            
            // Clear booking data
            clearBookingData();
            
            // Redirect setelah delay
            setTimeout(() => {
                window.location.href = '/my-bookings';
            }, 3000);
        } else {
            // Error from server
            throw new Error(result.error || result.message || 'Booking gagal');
        }

    } catch (error) {
        console.error('Booking error:', error);
        hideLoading();
        showErrorMessage(error.message);
    }
}

// Tampilkan loading overlay
function showLoading(message = 'Memproses, harap tunggu...') {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loading-text');
    
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
    if (loadingText) {
        loadingText.textContent = message;
    }
}

// Sembunyikan loading overlay
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Tampilkan pesan sukses
function showSuccessMessage(result) {
    hideLoading();
    
    let message = `Booking berhasil dibuat!\n\n`;
    message += `ID Booking: ${result.booking?.id || result.id || 'N/A'}\n`;
    message += `Status: ${result.booking?.status || result.status || 'Pending'}\n\n`;
    message += `Booking Anda akan diproses oleh admin.\n`;
    message += `Anda akan diarahkan ke halaman booking saya...`;
    
    alert(message);
}

// Tampilkan pesan error
function showErrorMessage(errorMessage) {
    let message = 'Terjadi kesalahan saat memproses booking:\n\n';
    message += errorMessage;
    message += '\n\nSilakan coba lagi atau hubungi administrator.';
    
    alert(message);
}

// Kembali ke halaman list
function kembaliKeList() {
    // Konfirmasi sebelum kembali
    const deskripsiField = document.getElementById('deskripsi');
    const fileUploadField = document.getElementById('fileUpload');
    
    const deskripsi = deskripsiField ? deskripsiField.value.trim() : '';
    const fileUpload = fileUploadField ? fileUploadField.files.length > 0 : false;
    
    let confirmMessage = 'Apakah Anda yakin ingin kembali?';
    if (deskripsi || fileUpload) {
        confirmMessage += ' Data yang sudah diisi akan hilang.';
    }
    
    if (confirm(confirmMessage)) {
        // Kembali ke halaman list dengan parameter yang sama
        if (bookingData) {
            const params = new URLSearchParams({
                date: bookingData.date,
                start_time: bookingData.startTime,
                end_time: bookingData.endTime,
                capacity: bookingData.capacity || '1'
            });
            window.location.href = '/list?' + params.toString();
        } else {
            window.location.href = '/dashboard';
        }
    }
}

// Clear booking data dari storage
function clearBookingData() {
    sessionStorage.removeItem('bookingFormData');
    sessionStorage.removeItem('selectedSlot');
    bookingData = null;
}

// Handle browser refresh/close
function handleBeforeUnload(e) {
    // Warn user if they're leaving with unsaved data
    const deskripsiField = document.getElementById('deskripsi');
    const fileUploadField = document.getElementById('fileUpload');
    
    if (!deskripsiField || !fileUploadField) return;
    
    const deskripsi = deskripsiField.value.trim();
    const fileUpload = fileUploadField.files.length > 0;
    
    if (deskripsi || fileUpload) {
        e.preventDefault();
        e.returnValue = 'Data yang sudah diisi akan hilang jika Anda meninggalkan halaman ini.';
        return e.returnValue;
    }
}

// Event listeners
window.addEventListener('DOMContentLoaded', initializeBookingForm);
window.addEventListener('beforeunload', handleBeforeUnload);

// Handle browser back button
window.addEventListener('popstate', function() {
    // Clear data when navigating back
    clearBookingData();
});

// Utility function untuk debug (opsional)
function getBookingData() {
    return {
        current: bookingData,
        stored: JSON.parse(sessionStorage.getItem('bookingFormData') || 'null'),
        selectedSlot: JSON.parse(sessionStorage.getItem('selectedSlot') || 'null')
    };
}

// // Fungsi tambahan untuk debugging slot ID
// function debugSlotId() {
//     console.log('=== SLOT ID DEBUG ===');
//     console.log('Current bookingData:', bookingData);
//     console.log('Stored bookingFormData:', sessionStorage.getItem('bookingFormData'));
//     console.log('Stored selectedSlot:', sessionStorage.getItem('selectedSlot'));
    
//     if (bookingData) {
//         console.log('Slot ID from bookingData:', bookingData.slotId);
//         console.log('Slot ID type:', typeof bookingData.slotId);
//         console.log('Slot ID valid?', !!(bookingData.slotId && bookingData.slotId !== 'undefined' && bookingData.slotId !== null));
//     }
//     console.log('===================');
// }