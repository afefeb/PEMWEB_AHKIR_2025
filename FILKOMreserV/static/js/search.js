function searchRooms() {
    const dateRaw = document.getElementById("date-picker").value;
    const startTimeRaw = document.getElementById("start-time-picker").value;
    const endTimeRaw = document.getElementById("end-time-picker").value;
    const capacity = document.getElementById("capacity").value;
  
    if (!dateRaw || !startTimeRaw || !endTimeRaw || !capacity) {
      alert("Mohon lengkapi semua field pencarian.");
      return;
    }
  
    // Format ulang ke format yang lebih stabil (ISO-like)
    const date = new Date(dateRaw).toISOString().slice(0, 10); // "YYYY-MM-DD"
    
    const pad = (num) => String(num).padStart(2, '0');
    
    // Pastikan time tetap dalam HH:mm
    const [startH, startM] = startTimeRaw.split(":");
    const [endH, endM] = endTimeRaw.split(":");
    const startTime = `${pad(startH)}:${pad(startM)}`;
    const endTime = `${pad(endH)}:${pad(endM)}`;
  
    const params = new URLSearchParams({
      date,
      start_time: startTime,
      end_time: endTime,
      capacity,
    });
  
    window.location.href = `/list?${params.toString()}`;
  }