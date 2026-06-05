// Mengambil library yang dibutuhkan
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const db = require('./database');

// Membuat instance client bot baru dengan intents yang sudah kita aktifkan tadi
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Event ketika bot berhasil login dan online
client.once('clientReady', () => {
    console.log(`Haloo! Aku ${client.user.tag}!`);
});

// Event ketika ada pesan masuk di server
client.on('messageCreate', async (message) => {
    // Abaikan pesan jika dikirim oleh bot lain atau oleh bot itu sendiri
    if (message.author.bot) return;

    // Perintah sederhana untuk tes respon bot
    if (message.content === '?ping') {
        await message.reply('Pong!');
    }

    if (message.content.startsWith('?tambah ')) {
        // Mengambil teks setelah kata '?tambah '
        const argumenTeks = message.content.slice(8); 
        
        // Memisahkan argumen berdasarkan karakter '|'
        const bagian = argumenTeks.split('|').map(item => item.trim());

        // Validasi apakah formatnya sudah benar (harus ada 3 bagian)
        if (bagian.length < 3) {
            return message.reply('⚠️ Format salah! Gunakan format:\n`?tambah Nama Tugas | Deadline (YYYY-MM-DD) | @PenanggungJawab`');
        }

        const [namaTugas, deadline, penanggungJawab] = bagian;

        // Query SQL untuk memasukkan data ke tabel tugas
        const query = `INSERT INTO tugas (nama_tugas, deadline, penanggung_jawab) VALUES (?, ?, ?)`;

        db.run(query, [namaTugas, deadline, penanggungJawab], function(err) {
            if (err) {
                console.error(err.message);
                return message.reply('❌ Gagal menyimpan tugas ke database.');
            }
            
            // Membalas pesan kalau berhasil, lengkap dengan ID tugasnya
            message.reply(`✅ **Tugas Berhasil Ditambahkan!**\n📌 **ID:** ${this.lastID}\n📋 **Tugas:** ${namaTugas}\n📅 **Deadline:** ${deadline}\n👤 **PJ:** ${penanggungJawab}`);
        });
    }

    if (message.content === '?list') {
        // Query SQL untuk mengambil semua tugas yang belum selesai
        const query = `SELECT * FROM tugas WHERE status = 'Belum Selesai' ORDER BY deadline ASC`;

        db.all(query, [], (err, rows) => {
            if (err) {
                console.error(err.message);
                return message.reply('❌ Gagal mengambil daftar tugas dari database.');
            }

            // Jika tidak ada tugas yang tersimpan
            if (rows.length === 0) {
                return message.reply('🎉 Hore! Tidak ada tugas yang belum selesai saat ini. Server aman!');
            }

            // Membuat konten teks untuk daftar tugas
            let daftarTugasTeks = '';
            rows.forEach((tugas) => {
                daftarTugasTeks += `🆔 **ID:** \`${tugas.id}\`\n📋 **Tugas:** ${tugas.nama_tugas}\n📅 **Deadline:** ${tugas.deadline}\n👤 **PJ:** ${tugas.penanggung_jawab}\n───────────────────\n`;
            });

            // Membuat tampilan rapi menggunakan Discord Embed
            const embedDaftarTugas = {
                color: 0x3498db, // Warna biru
                title: '📋 Daftar Tugas & Tracker Target',
                description: daftarTugasTeks,
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'Gunakan ?selesai [ID] jika tugas sudah rampung',
                },
            };

            // Mengirimkan embed ke channel Discord
            message.reply({ embeds: [embedDaftarTugas] });
        });
    }

    if (message.content.startsWith('?selesai ')) {
        // Mengambil ID tugas setelah kata '?selesai '
        const idTugas = message.content.slice(9).trim();

        // Validasi apakah ID yang dimasukkan berupa angka
        if (!idTugas || isNaN(idTugas)) {
            return message.reply('⚠️ Format salah! Gunakan format: `?selesai [ID Tugas]`. Contoh: `?selesai 1`');
        }

        // Query SQL untuk mengubah status tugas berdasarkan ID
        const query = `UPDATE tugas SET status = 'Selesai' WHERE id = ? AND status = 'Belum Selesai'`;

        db.run(query, [idTugas], function(err) {
            if (err) {
                console.error(err.message);
                return message.reply('❌ Gagal memperbarui status tugas di database.');
            }

            // changes akan bernilai 0 jika ID tidak ditemukan atau tugasnya emang sudah selesai sebelumnya
            if (this.changes === 0) {
                return message.reply(`🔍 Tugas dengan ID \`${idTugas}\` tidak ditemukan atau mungkin sudah diselesaikan sebelumnya.`);
            }

            // Balasan jika sukses
            message.reply(`🎉 **Tugas Teratasi!** Tugas dengan ID \`${idTugas}\` telah ditandai sebagai **Selesai**. Kerja bagus!`);
        });
    }


    const cron = require('node-cron');

// ID Channel Discord tempat bot akan mengirimkan pengingat otomatis
// Kamu perlu mengganti ini dengan ID channel asli di servermu
const ID_CHANNEL_PENGINGAT = process.env.CHANNEL_PENGINGAT_ID;

// Menjadwalkan alarm otomatis menggunakan pola Cron
// Pola '0 8 * * *' artinya: Jalan setiap hari pada jam 08:00 pagi
cron.schedule('0 6 * * *', () => {
    console.log('⏰ Menjalankan pengecekan deadline otomatis...');

    // Query untuk mengambil semua tugas yang belum selesai
    const query = `SELECT * FROM tugas WHERE status = 'Belum Selesai' ORDER BY deadline ASC`;

    db.all(query, [], async (err, rows) => {
        if (err) {
            return console.error('Gagal mengecek deadline:', err.message);
        }

        // Jika tidak ada tugas, bot tidak perlu mengirim apa-apa
        if (rows.length === 0) return;

        // Ambil channel berdasarkan ID yang sudah ditentukan
        const channel = await client.channels.fetch(ID_CHANNEL_PENGINGAT).catch(console.error);
        if (!channel) return console.error('Channel pengingat tidak ditemukan! Pastikan ID benar.');

        let teksPengingat = '📢 **PENGINGAT DEADLINE TUGAS HARI INI** 📢\n\n' +
                            'Berikut adalah daftar tugas yang harus segera diselesaikan:\n───────────────────\n';

        rows.forEach((tugas) => {
            teksPengingat += `🆔 **ID:** \`${tugas.id}\`\n📋 **Tugas:** ${tugas.nama_tugas}\n📅 **Deadline:** ${tugas.deadline}\n👤 **PJ:** ${tugas.penanggung_jawab}\n───────────────────\n`;
        });

        // Kirim pengingat ke channel
        channel.send({
            embeds: [{
                color: 0xe74c3c, // Warna merah (biar dapet impresi darurat/penting)
                title: '⏰ Jangan Lupa Dikerjakan!',
                description: teksPengingat,
                timestamp: new Date().toISOString()
            }]
        });
    });
}, {
    scheduled: true,
    timezone: "Asia/Jakarta" // Menyesuaikan dengan waktu Indonesia Barat (WIB)
});
});

// Login ke Discord menggunakan token yang ada di file .env
client.login(process.env.DISCORD_TOKEN);