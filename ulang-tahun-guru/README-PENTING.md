# Website Ulang Tahun Guru

## Perubahan
- Menghapus ucapan dan foto dummy.
- Menambahkan `kirim-ucapan.html` untuk nama/inisial, angkatan, ucapan, judul foto, dan upload foto.
- Foto dapat diganti atau dihapus sebelum submit.
- Ada disclaimer bahwa kiriman tidak bisa diubah/dihapus setelah dikirim dan checkbox persetujuan.
- Halaman utama menampilkan ucapan dan foto yang tersimpan.

## Penting: mode saat ini masih demo lokal
Website ini masih berupa HTML/CSS/JavaScript statis. Form menyimpan data ke `localStorage`, sehingga kiriman hanya tersimpan di browser/perangkat yang dipakai mengirim. Data **belum** masuk ke server dan teman yang membuka website dari perangkat lain tidak akan melihat kiriman itu.

Agar bisa digunakan sungguhan oleh banyak murid:
1. Siapkan backend/database dan penyimpanan foto (misalnya Supabase).
2. Ganti blok `localStorage` pada `submit.js` menjadi request ke backend.
3. Ubah `script.js` agar mengambil data ucapan/foto dari backend.
4. Atur aturan database/storage agar kiriman tidak dapat dihapus atau diedit oleh publik. Admin yang dipercaya tetap sebaiknya punya mekanisme moderasi untuk konten yang tidak pantas.

Jangan menganggap tulisan “tidak bisa dihapus” sebagai jaminan teknis pada versi demo ini: pengguna yang mengerti browser masih bisa menghapus data lokal. Jaminan tersebut harus diterapkan pada backend.
