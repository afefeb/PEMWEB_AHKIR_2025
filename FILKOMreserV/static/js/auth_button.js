// auth_button.js - Final Fixed Version
window.addEventListener("load", function () {
    const authButton = document.getElementById("authButton");
    if (!authButton) {
        console.log("Auth button not found!");
        return;
    }

    // Cek autentikasi dari sessionStorage (untuk UI state)
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const username = sessionStorage.getItem('username');
    const userRole = sessionStorage.getItem('userRole');
    
    console.log("=== AUTH STATUS ===");
    console.log("isLoggedIn:", isLoggedIn);
    console.log("username:", username);
    console.log("userRole:", userRole);
    console.log("==================");

    if (isLoggedIn && username) {
        // User sudah login - tampilkan tombol Logout
        authButton.textContent = `Logout (${username})`;
        authButton.style.backgroundColor = "#dc3545"; // Merah untuk logout
        
        authButton.onclick = async function () {
            if (confirm(`Apakah Anda yakin ingin logout, ${username}?`)) {
                try {
                    // Panggil API logout - GANTI ke POST sesuai route
                    const res = await fetch("/logout", {
                        method: "POST", // ⬅️ PENTING: Ganti ke POST
                        credentials: "include", // Kirim cookie
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                        console.log("Logout success:", data.message);
                        
                        // Hapus semua data session
                        sessionStorage.clear();
                        
                        alert("Logout berhasil!");
                        window.location.href = "/login";
                    } else {
                        console.error("Logout failed:", res.status);
                        // Tetap hapus session meskipun API gagal
                        sessionStorage.clear();
                        window.location.href = "/login";
                    }
                } catch (err) {
                    console.error("Logout error:", err);
                    // Tetap hapus session dan redirect
                    sessionStorage.clear();
                    alert("Terjadi kesalahan saat logout, tapi Anda sudah logout.");
                    window.location.href = "/login";
                }
            }
        };
    } else {
        // User belum login - tampilkan tombol Login
        authButton.textContent = "Login";
        authButton.style.backgroundColor = "#007bff"; // Biru untuk login
        
        authButton.onclick = function () {
            window.location.href = "/login";
        };
    }
});

// Fungsi helper untuk cek auth status (bisa dipanggil dari script lain)
function getAuthStatus() {
    return {
        isLoggedIn: sessionStorage.getItem('isLoggedIn') === 'true',
        username: sessionStorage.getItem('username'),
        userRole: sessionStorage.getItem('userRole'),
        token: sessionStorage.getItem('token')
    };
}

// Fungsi untuk update button tanpa reload halaman
function refreshAuthButton() {
    const event = new Event('load');
    window.dispatchEvent(event);
}

