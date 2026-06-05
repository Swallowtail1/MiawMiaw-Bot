const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Menentukan lokasi file database (akan membuat file bernama 'belajar_bot.db')
const dbPath = path.resolve(__dirname, 'belajar_bot.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Gagal menghubungkan ke database SQLite:', err.message);
    } else {
        console.log('📦 Berhasil terhubung ke database SQLite.');
    }
});

// Membuat tabel tugas jika belum ada
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS tugas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama_tugas TEXT NOT NULL,
            deadline TEXT NOT NULL,
            penanggung_jawab TEXT NOT NULL,
            status TEXT DEFAULT 'Belum Selesai',
            dibuat_pada DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Gagal membuat tabel tugas:', err.message);
        } else {
            console.log('📋 Tabel "tugas" siap digunakan.');
        }
    });
});

module.exports = db;