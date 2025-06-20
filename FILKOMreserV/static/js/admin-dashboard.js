document.addEventListener("DOMContentLoaded", function () {
  loadAdminBookings();
});

async function loadAdminBookings() {
  const tableBody = document.getElementById("loanTableBody");

  tableBody.innerHTML = `
    <tr>
      <td colspan="8" class="text-center">Loading data booking...</td>
    </tr>
  `;

  try {
    const res = await fetch("/admin/bookings", {
      credentials: "include",
    });

    if (!res.ok) throw new Error("Gagal memuat data");

    const data = await res.json();
    const bookings = data.bookings || [];

    tableBody.innerHTML = "";

    if (bookings.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted">Tidak ada data booking.</td>
        </tr>
      `;
      return;
    }

    bookings.forEach((booking, index) => {
      const tr = document.createElement("tr");

      const user = booking.user?.username || booking.user?.name || "-";
      const room = booking.room?.name || booking.name_room || "-";
      const waktu = `${booking.start_time} - ${booking.end_time}`;
      const deskripsi = booking.description || "-";
      const status = booking.status;

      let aksiHTML = "";
      if (status === "Pending") {
        aksiHTML = `
          <button class="btn btn-sm btn-success mr-1" onclick="updateBookingStatus(${booking.id}, 'Approved')">Terima</button>
          <button class="btn btn-sm btn-danger" onclick="updateBookingStatus(${booking.id}, 'Rejected')">Tolak</button>
        `;
      } else {
        aksiHTML = `<span class="badge badge-${getStatusColor(status)}">${status}</span>`;
      }

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${user}</td>
        <td>${room}</td>
        <td>${booking.date}</td>
        <td>${waktu}</td>
        <td><span class="badge badge-${getStatusColor(status)}">${status}</span></td>
        <td>${aksiHTML}</td>
        <td>
          ${
            booking.file_path
              ? `<a href="/${booking.file_path.replace(/^\/+/, '')}" target="_blank" class="btn btn-outline-primary btn-sm">
                  <i class="ri-download-line"></i> File
                 </a>`
              : "-"
          }
        </td>
      `;

      tableBody.appendChild(tr);
    });
  } catch (err) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-danger">Error: ${err.message}</td>
      </tr>
    `;
  }
}

function getStatusColor(status) {
  switch (status) {
    case "Approved":
      return "success";
    case "Rejected":
      return "danger";
    case "Pending":
      return "warning";
    default:
      return "secondary";
  }
}

async function updateBookingStatus(id, status) {
  if (!confirm(`Yakin ingin mengubah status booking menjadi ${status}?`)) return;

  try {
    const res = await fetch(`/admin/bookings/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ status }),
    });

    const data = await res.json();

    if (res.ok) {
      alert(data.message || "Status berhasil diperbarui");
      loadAdminBookings();
    } else {
      alert("Gagal update status: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    alert("Terjadi kesalahan: " + err.message);
  }
}
