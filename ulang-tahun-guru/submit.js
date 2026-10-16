(function () {
  const form = document.getElementById("messageForm");
  const photoInput = document.getElementById("photo");
  const previewWrap = document.getElementById("previewWrap");
  const previewImage = document.getElementById("previewImage");
  const changePhoto = document.getElementById("changePhoto");
  const removePhoto = document.getElementById("removePhoto");
  const message = document.getElementById("message");
  const charCount = document.getElementById("charCount");
  const status = document.getElementById("formStatus");
  let photoData = "";

  message.addEventListener("input", () => charCount.textContent = message.value.length);

  photoInput.addEventListener("change", () => {
    const file = photoInput.files && photoInput.files[0];
    status.textContent = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      status.textContent = "Format foto harus JPG, PNG, atau WEBP.";
      photoInput.value = "";
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      status.textContent = "Ukuran foto maksimal 3 MB. Silakan pilih foto yang lebih kecil.";
      photoInput.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      photoData = String(reader.result || "");
      previewImage.src = photoData;
      previewWrap.hidden = false;
    };
    reader.onerror = () => { status.textContent = "Foto tidak dapat dibaca. Coba pilih ulang."; };
    reader.readAsDataURL(file);
  });

  changePhoto.addEventListener("click", () => photoInput.click());
  removePhoto.addEventListener("click", () => {
    photoData = "";
    photoInput.value = "";
    previewImage.removeAttribute("src");
    previewWrap.hidden = true;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";

    if (window.location.protocol === "file:") {
      status.textContent = "Buka halaman ini melalui server lokal (misalnya http://localhost:8000), bukan dari file langsung. Supabase tidak bisa dipanggil saat halaman dibuka sebagai file.";
      status.classList.add("warning-status");
      const submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true;
      submitBtn.textContent = "Buka via server";
      return;
    }

    if (!form.reportValidity()) return;

    const entry = {
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
      name: document.getElementById("studentName").value.trim(),
      generation: document.getElementById("generation").value.trim(),
      message: message.value.trim(),
      photoTitle: document.getElementById("photoTitle").value.trim(),
      photoData,
      submittedAt: new Date().toISOString()
    };
    if (!entry.name || !entry.generation || !entry.message) {
      status.textContent = "Nama/inisial, angkatan, dan ucapan wajib diisi.";
      return;
    }

    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Mengirim...";

    /* Coba kirim ke Supabase, fallback ke localStorage jika belum dikonfigurasi */
    const result = (typeof supabaseInsert === "function")
      ? await supabaseInsert(entry)
      : { ok: false, error: "config" };

    if (result.ok) {
      /* Berhasil tersimpan di Supabase */
      form.reset();
      photoData = "";
      previewImage.removeAttribute("src");
      previewWrap.hidden = true;
      charCount.textContent = "0";
      status.textContent = "Ucapan berhasil terkirim! Terima kasih sudah memberikan ucapan.";
      status.classList.remove("warning-status");
      submitBtn.textContent = "Terkirim!";
    } else {
      /* Fallback: simpan di localStorage */
      try {
        const key = "birthdayMessages";
        const entries = JSON.parse(localStorage.getItem(key) || "[]");
        entries.push(entry);
        localStorage.setItem(key, JSON.stringify(entries));
        form.reset();
        photoData = "";
        previewImage.removeAttribute("src");
        previewWrap.hidden = true;
        charCount.textContent = "0";
        const isConfigErr = result.error === "config";
        status.textContent = isConfigErr
          ? "Kiriman tersimpan di browser ini. Catatan: saat ini kiriman belum terkirim ke server dan belum terlihat di perangkat lain."
          : "Server sedang bermasalah. Kiriman disimpan sementara di browser ini.";
        status.classList.add("warning-status");
        submitBtn.textContent = isConfigErr ? "Terkirim di browser ini" : "Tersimpan lokal";
      } catch (error) {
        status.textContent = "Penyimpanan gagal. Ukuran foto mungkin terlalu besar; coba foto yang lebih kecil.";
        submitBtn.disabled = false;
        submitBtn.textContent = "Kirim Ucapan";
      }
    }
  });
})();
