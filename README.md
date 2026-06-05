# Study Assistant & Task Tracker Discord Bot

Bot Discord ini dirancang khusus untuk menjadi asisten belajar dan pengingat tugas kelompok atau personal. Menggunakan Node.js, `discord.js` v14, dan database lokal SQLite, bot ini dapat mencatat deadline tugas serta memberikan pengingat otomatis setiap pagi agar tidak ada tugas yang terlewat.

## Fitur Utama
- **Manajemen Tugas (CRUD):** Tambah, lihat, dan selesaikan tugas langsung lewat ruang obrolan Discord.
- **Database SQLite Persisten:** Data tugas tetap aman tersimpan di dalam file lokal meskipun bot di-restart atau mati.
- **Pengingat Otomatis (Cron Job):** Bot akan otomatis mengirimkan ringkasan tugas yang belum selesai ke channel tertentu setiap hari pada pukul 06:00 WIB.
- **Tampilan Informatif:** Menggunakan Discord Embeds berwarna yang rapi untuk kenyamanan visual.

---

## Persyaratan Sistem
Sebelum menjalankan bot ini, pastikan kamu sudah menginstall:
- [Node.js](https://nodejs.org/) (Versi 16.x atau yang lebih baru)
- npm (Otomatis terinstall bersama Node.js)

---

## Langkah Instalasi

1. **Clone Repositori Ini**
   ```bash
   git clone [https://github.com/username/study-assistant-bot.git](https://github.com/username/study-assistant-bot.git)
   cd study-assistant-bot
