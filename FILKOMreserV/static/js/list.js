// Ambil parameter dari URL dan update tampilan tanggal & waktu
function initializeListPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const date = urlParams.get('date');
    const startTime = urlParams.get('start_time');
    const endTime = urlParams.get('end_time');
    const capacity = urlParams.get('capacity');
  
    if (date && startTime && endTime) {
      document.getElementById('selected-date').textContent = formatDate(date);
      document.getElementById('selected-time').textContent = `${startTime} - ${endTime}`;
  
      fetchRooms(date, startTime, endTime, capacity).then(rooms => {
        renderRooms(rooms, date, startTime, endTime);
      });
    } else {
      document.getElementById('room-list').innerHTML = `
        <div class="text-center">
          <div class="alert alert-danger" role="alert">
            Parameter pencarian tidak lengkap. Silakan kembali ke halaman utama.
          </div>
          <a href="/dashboard" class="btn btn-primary">Kembali ke Dashboard</a>
        </div>
      `;
    }
  }
  
  async function fetchRooms(date, startTime, endTime, capacity) {
    const params = new URLSearchParams({
      date,
      start_time: startTime,
      end_time: endTime,
      capacity
    });
  
    try {
        const response = await fetch('/api/rooms?' + params.toString(), {
          method: 'GET',
          credentials: 'include'
        });
      
        if (!response.ok) throw new Error('Failed to fetch rooms');
        
        const data = await response.json();
        
        // Debug: Log data untuk melihat struktur response
        console.log('API Response:', data);
        console.log('Rooms data:', data.rooms);
        
        return data.rooms;
      } catch (error) {
        console.error(error);
        return [];
      }
    }
      
  
  // Function untuk mengecek apakah slot waktu sesuai dengan kriteria pencarian
  function isTimeSlotInRange(slotStart, slotEnd, searchStart, searchEnd) {
    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const slotStartMinutes = parseTime(slotStart);
    const slotEndMinutes = parseTime(slotEnd);
    const searchStartMinutes = parseTime(searchStart);
    const searchEndMinutes = parseTime(searchEnd);
    
    return slotStartMinutes < searchEndMinutes && slotEndMinutes > searchStartMinutes;
  }
  
  function renderRooms(rooms, searchDate, searchStartTime, searchEndTime) {
    const container = document.getElementById('room-list');
    container.innerHTML = '';
  
    if (!rooms.length) {
      container.innerHTML = `
        <div class="text-center mt-5">
          <div class="alert alert-warning" role="alert">
            Tidak ada ruangan yang tersedia untuk kriteria yang dipilih.
          </div>
          <a href="/dashboard" class="btn btn-primary mt-3">
            Kembali ke Dashboard
          </a>
        </div>
      `;
      return;
    }
  
    rooms.forEach(room => {
      // Debug: Log room data untuk melihat struktur availability
      console.log('Room data:', room);
      console.log('Room availability:', room.availability);
      
      const availableSlots = room.availability ? 
        room.availability.filter(slot => {
          // Debug: Log setiap slot untuk debugging
          console.log('Checking slot:', slot);
          
          return !slot.booked && 
                 slot.Date === searchDate &&
                 isTimeSlotInRange(slot.StartTime, slot.EndTime, searchStartTime, searchEndTime);
        }) : [];
        
      // Debug: Log available slots
      console.log('Available slots for room', room.name, ':', availableSlots);
  
      const roomCard = document.createElement('div');
      roomCard.classList.add('card', 'mb-4', 'shadow-sm');
      roomCard.setAttribute('data-room-id', room.id);
  
      roomCard.innerHTML = `
        <div class="card-header" style="background-color: var(--primary-color, #007bff); color: white;">
          <h5 class="mb-0">
            <i class="ri-door-open-line mr-2"></i>
            ${room.name}
          </h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <p class="mb-2">
                <i class="ri-group-line mr-1"></i>
                <strong>Kapasitas:</strong> ${room.capacity} orang
              </p>
              <p class="mb-2">
                <i class="ri-map-pin-line mr-1"></i>
                <strong>Lokasi:</strong> ${room.location || 'Gedung FILKOM'}
              </p>
            </div>
            <div class="col-md-6">
              <p class="mb-2">
                <i class="ri-settings-line mr-1"></i>
                <strong>Fasilitas:</strong> ${room.facilities || 'AC, Proyektor, Whiteboard'}
              </p>
              <p class="mb-2">
                <i class="ri-checkbox-circle-line mr-1"></i>
                <strong>Status:</strong> 
                <span class="badge ${availableSlots.length > 0 ? 'badge-success' : 'badge-danger'}">
                  ${availableSlots.length > 0 ? 'Tersedia' : 'Tidak Tersedia'}
                </span>
              </p>
            </div>
          </div>
  
          ${availableSlots.length > 0 ? `
            <hr>
            <div class="mt-3">
              <h6 class="mb-3">
                <i class="ri-time-line mr-1"></i>
                Slot Waktu yang Sesuai:
              </h6>
              <div class="row slot-container">
                ${availableSlots.map((slot, index) => {
                  // PERBAIKAN UTAMA: Cek kedua kemungkinan nama field ID
                  const slotId = slot.id || slot.ID || slot.Id;
                  
                  // Debug: Log slot ID untuk memastikan
                  console.log('Slot ID check:', {
                    slot: slot,
                    'slot.id': slot.id,
                    'slot.ID': slot.ID,
                    'slot.Id': slot.Id,
                    'finalSlotId': slotId
                  });
                  
                  if (!slotId) {
                    console.error('Slot ID not found for slot:', slot);
                  }
                  
                  return `
                    <div class="col-md-4 col-sm-6 mb-3">
                      <div class="border rounded p-3 text-center slot-item" 
                           style="background-color: #f8f9fa; cursor: pointer;"
                           data-slot-id="${slotId}"
                           data-room-id="${room.id}"
                           data-room-name="${room.name}"
                           data-date="${slot.Date}"
                           data-start-time="${slot.StartTime}"
                           data-end-time="${slot.EndTime}"
                           data-capacity="${room.capacity}">
                        <div class="mb-2">
                          <i class="ri-calendar-line text-primary"></i>
                          <small class="text-muted d-block">${formatDate(slot.Date)}</small>
                        </div>
                        <div class="font-weight-bold" style="color: var(--primary-color, #007bff);">
                          ${slot.StartTime} - ${slot.EndTime}
                        </div>
                        <button class="btn btn-sm btn-outline-primary mt-2 slot-select-btn" 
                                onclick="selectTimeSlot(this, ${JSON.stringify({
                                  slotId: slotId,
                                  roomId: room.id,
                                  roomName: room.name,
                                  date: slot.Date,
                                  startTime: slot.StartTime,
                                  endTime: slot.EndTime,
                                  capacity: room.capacity,
                                  facilities: room.facilities || 'AC, Proyektor, Whiteboard',
                                  location: room.location || 'Gedung FILKOM'
                                }).replace(/"/g, '&quot;')})">
                          <i class="ri-check-line mr-1"></i>
                          Pilih Slot
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
              <div class="mt-4 text-center">
                <button class="btn btn-success btn-lg book-room-btn" 
                        onclick="proceedToBookingForm()"
                        style="background-color: var(--primary-color, #007bff); border-color: var(--primary-color, #007bff);"
                        disabled>
                  <i class="ri-calendar-check-line mr-2"></i>
                  Pilih Slot Terlebih Dahulu
                </button>
              </div>
            </div>
          ` : `
            <hr>
            <div class="alert alert-warning mt-3">
              <i class="ri-time-line mr-2"></i>
              Ruangan tidak tersedia untuk waktu ${searchStartTime} - ${searchEndTime}. Silakan pilih waktu lain.
            </div>
          `}
        </div>
      `;
  
      container.appendChild(roomCard);
    });
  }
  
  function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
  }
  
  // Cek apakah user sudah login dan memiliki role user
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

  // FUNGSI UTAMA: Select time slot dan simpan data
  function selectTimeSlot(buttonElement, slotData) {
    const auth = checkUserAuth();
    
    // Debug: Log data slot yang diterima
    console.log('selectTimeSlot called with:', slotData);
    
    if (!auth.canBook) {
      if (!auth.isLoggedIn) {
        alert('Anda harus login terlebih dahulu untuk memesan ruangan.');
        window.location.href = '/login';
        return;
      } else if (auth.role !== 'user') {
        alert('Hanya user yang dapat memesan ruangan.');
        return;
      }
    }
    
    // Validasi slotId
    if (!slotData.slotId || slotData.slotId === 'undefined' || slotData.slotId === null) {
      console.error('Invalid slot ID:', slotData.slotId);
      alert('Error: Slot ID tidak valid. Silakan refresh halaman dan coba lagi.');
      return;
    }
    
    // Reset semua tombol slot di seluruh halaman
    document.querySelectorAll('.slot-select-btn').forEach(btn => {
      btn.classList.remove('btn-primary', 'selected');
      btn.classList.add('btn-outline-primary');
      btn.innerHTML = '<i class="ri-check-line mr-1"></i>Pilih Slot';
    });
    
    // Reset semua slot item styling
    document.querySelectorAll('.slot-item').forEach(item => {
      item.style.backgroundColor = '#f8f9fa';
      item.style.border = '1px solid #dee2e6';
    });
    
    // Reset semua tombol booking
    document.querySelectorAll('.book-room-btn').forEach(btn => {
      btn.disabled = true;
      btn.innerHTML = '<i class="ri-calendar-check-line mr-2"></i>Pilih Slot Terlebih Dahulu';
    });
    
    // Highlight slot yang dipilih
    buttonElement.classList.remove('btn-outline-primary');
    buttonElement.classList.add('btn-primary', 'selected');
    buttonElement.innerHTML = '<i class="ri-check-fill mr-1"></i>Terpilih';
    
    // Highlight slot item container
    const slotItem = buttonElement.closest('.slot-item');
    slotItem.style.backgroundColor = '#e3f2fd';
    slotItem.style.border = '2px solid var(--primary-color, #007bff)';
    
    // Enable tombol booking untuk ruangan ini
    const bookBtn = buttonElement.closest('.card').querySelector('.book-room-btn');
    bookBtn.disabled = false;
    bookBtn.innerHTML = '<i class="ri-calendar-check-line mr-2"></i>Pesan Ruangan Ini';
    
    // Parse data slot dari parameter
    const selectedSlotData = {
      slotId: slotData.slotId,
      roomId: slotData.roomId,
      roomName: slotData.roomName,
      date: slotData.date,
      startTime: slotData.startTime,
      endTime: slotData.endTime,
      capacity: slotData.capacity,
      facilities: slotData.facilities,
      location: slotData.location,
      formattedDate: formatDate(slotData.date),
      username: auth.username
    };
    
    // Debug: Log final selected data
    console.log('Final selected slot data:', selectedSlotData);
    
    // Simpan ke global variable dan sessionStorage
    window.selectedSlot = selectedSlotData;
    sessionStorage.setItem('selectedSlot', JSON.stringify(selectedSlotData));
    
    // Optional: Tampilkan notifikasi sukses
    showSlotSelectedNotification(selectedSlotData);
  }
  
  // Fungsi untuk menampilkan notifikasi slot terpilih
  function showSlotSelectedNotification(slotData) {
    // Hapus notifikasi sebelumnya jika ada
    const existingNotification = document.querySelector('.slot-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Buat notifikasi baru
    const notification = document.createElement('div');
    notification.className = 'alert alert-info slot-notification mt-3';
    notification.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="ri-information-line mr-2"></i>
        <div>
          <strong>Slot Terpilih:</strong><br>
          <small>
            ${slotData.roomName} | ${slotData.formattedDate} | ${slotData.startTime} - ${slotData.endTime}
            <br><strong>Slot ID:</strong> ${slotData.slotId}
          </small>
        </div>
      </div>
    `;
    
    // Tambahkan ke container room yang dipilih
    const selectedCard = document.querySelector(`[data-room-id="${slotData.roomId}"]`);
    if (selectedCard) {
      selectedCard.querySelector('.card-body').appendChild(notification);
    }
  }
  
  // FUNGSI UTAMA: Redirect ke form booking
  function proceedToBookingForm() {
    const auth = checkUserAuth();
    
    if (!auth.canBook) {
      if (!auth.isLoggedIn) {
        alert('Anda harus login terlebih dahulu untuk memesan ruangan.');
        window.location.href = '/login';
        return;
      } else if (auth.role !== 'user') {
        alert('Hanya user yang dapat memesan ruangan.');
        return;
      }
    }
    
    if (!window.selectedSlot) {
      alert('Silakan pilih slot waktu terlebih dahulu.');
      return;
    }
    
    const slot = window.selectedSlot;
    
    // Validasi ulang slot ID
    if (!slot.slotId || slot.slotId === 'undefined' || slot.slotId === null) {
      alert('Error: Data slot tidak valid. Silakan pilih slot lagi.');
      return;
    }
    
    // Persiapkan data untuk form booking
    const bookingFormData = {
      // Data dari slot yang dipilih
      slotId: slot.slotId,
      roomId: slot.roomId,
      roomName: slot.roomName,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      formattedDate: slot.formattedDate,
      
      // Data tambahan ruangan
      capacity: slot.capacity,
      facilities: slot.facilities,
      location: slot.location,
      
      // Data user
      username: slot.username,
      
      // Data untuk API request
      apiData: {
        username: slot.username,
        name_room: slot.roomName,
        date: slot.date,
        start_time: slot.startTime,
        end_time: slot.endTime,
        timeslot_id: slot.slotId
      }
    };
    
    // Debug: Log booking form data
    console.log('Booking form data:', bookingFormData);
    
    // Simpan ke sessionStorage untuk form
    sessionStorage.setItem('bookingFormData', JSON.stringify(bookingFormData));
    
    // Konfirmasi sebelum redirect
    const confirmMessage = `Konfirmasi data booking:\n\n` +
                          `Ruangan: ${slot.roomName}\n` +
                          `Tanggal: ${slot.formattedDate}\n` +
                          `Waktu: ${slot.startTime} - ${slot.endTime}\n` +
                          `Kapasitas: ${slot.capacity} orang\n` +
                          `Slot ID: ${slot.slotId}\n\n` +
                          `Lanjutkan ke form booking?`;
    
    if (confirm(confirmMessage)) {
      // Redirect ke form booking
      window.location.href = '/form';
    }
  }
  
  // Fungsi untuk direct booking (opsional, jika ingin langsung booking tanpa form)
  async function directBookRoom() {
    const auth = checkUserAuth();
    
    if (!auth.canBook || !window.selectedSlot) {
      alert('Tidak dapat melakukan booking. Pastikan Anda sudah login dan memilih slot.');
      return;
    }
    
    const slot = window.selectedSlot;
    
    try {
      // Disable tombol sementara
      const bookBtn = event.target;
      bookBtn.disabled = true;
      bookBtn.innerHTML = '<i class="ri-loader-4-line mr-2"></i>Memproses...';
      
      // Siapkan data untuk API
      const bookingData = {
        username: slot.username,
        name_room: slot.roomName,
        date: slot.date,
        start_time: slot.startTime,
        end_time: slot.endTime,
        timeslot_id: slot.slotId, // Pastikan slot ID disertakan
        description: `Booking ruangan ${slot.roomName} untuk ${slot.formattedDate}`,
        status: 'Pending'
      };
      
      console.log('Direct booking data:', bookingData);
      
      // Kirim request ke API
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (sessionStorage.getItem('token') || localStorage.getItem('token'))
        },
        body: JSON.stringify(bookingData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Redirect ke halaman my-bookings atau dashboard
        window.location.href = '/my-bookings';
      } else {
        throw new Error(result.error || 'Booking gagal');
      }
      
    } catch (error) {
      console.error('Booking error:', error);
      alert('Terjadi kesalahan saat booking: ' + error.message);
      
      // Restore tombol
      const bookBtn = event.target;
      bookBtn.disabled = false;
      bookBtn.innerHTML = '<i class="ri-calendar-check-line mr-2"></i>Pesan Ruangan Ini';
    }
  }
  
  // Fungsi untuk mendapatkan data slot yang dipilih (untuk debugging)
  function getSelectedSlotData() {
    const stored = sessionStorage.getItem('selectedSlot');
    if (stored) {
      return JSON.parse(stored);
    }
    return window.selectedSlot || null;
  }
  
  // Fungsi untuk clear selected slot
  function clearSelectedSlot() {
    window.selectedSlot = null;
    sessionStorage.removeItem('selectedSlot');
    sessionStorage.removeItem('bookingFormData');
    
    // Reset UI
    document.querySelectorAll('.slot-select-btn').forEach(btn => {
      btn.classList.remove('btn-primary', 'selected');
      btn.classList.add('btn-outline-primary');
      btn.innerHTML = '<i class="ri-check-line mr-1"></i>Pilih Slot';
    });
    
    document.querySelectorAll('.book-room-btn').forEach(btn => {
      btn.disabled = true;
      btn.innerHTML = '<i class="ri-calendar-check-line mr-2"></i>Pilih Slot Terlebih Dahulu';
    });
  }
  
  // Event listener untuk load page
  window.addEventListener('DOMContentLoaded', initializeListPage);
  
  // Event listener untuk back/forward browser
  window.addEventListener('popstate', function() {
    clearSelectedSlot();
  });