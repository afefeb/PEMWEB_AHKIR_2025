document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Cegah reload halaman

    const username = form.username.value.trim();
    const password = form.password.value.trim();

    if (!username || !password) {
      alert("Username dan password harus diisi!");
      return;
    }

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // WAJIB agar cookie JWT disimpan!
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Simpan data user ke sessionStorage untuk keperluan lain (booking, dll)
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("userRole", data.role || "user"); // Ambil role dari response
        sessionStorage.setItem("username", data.username);

        if (data.token) {
          sessionStorage.setItem("token", data.token);
        }

        alert("Login berhasil! Selamat datang, " + data.username);

        // Redirect berdasarkan role
        if (data.role === "admin") {
          window.location.href = "/admin/dashboard";
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        alert("Login gagal: " + (data.error || "Periksa kembali username dan password."));
      }
    } catch (error) {
      console.error("Error saat login:", error);
      alert("Terjadi kesalahan saat login. Coba lagi nanti.");
    }
  });
});
