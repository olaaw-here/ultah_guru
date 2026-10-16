(async function () {
  var PER_PAGE = 9;
  var NAMA = "Bu Maya", SAPAAN = "Ibu";
  var list = document.getElementById("suratList");
  var pager = document.getElementById("pager");
  var prev = document.getElementById("prev");
  var next = document.getElementById("next");
  var info = document.getElementById("pagerInfo");
  var countEl = document.getElementById("surat-count");
  var surat = [], page = 1;

  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function sap(t) { return String(t || "").split("{s}").join(SAPAAN); }

  /* ---------- pop-up surat lengkap (gaya sama dengan halaman utama) ---------- */
  var detail = h("div", "message-detail");
  detail.hidden = true;
  detail.setAttribute("role", "dialog");
  detail.setAttribute("aria-modal", "true");
  detail.setAttribute("aria-labelledby", "message-detail-title");
  detail.innerHTML = '<div class="message-detail-panel"><button type="button" class="message-detail-close" aria-label="Tutup detail">×</button><p class="eyebrow">Ucapan untuk ' + NAMA + '</p><h3 id="message-detail-title">Pesan lengkap</h3><div class="message-detail-body"></div><p class="message-detail-from"></p></div>';
  document.body.appendChild(detail);
  var detailBody = detail.querySelector(".message-detail-body");
  var detailFrom = detail.querySelector(".message-detail-from");
  var closeBtn = detail.querySelector(".message-detail-close");
  var lastFocus = null;

  function openDetail(m, opener) {
    lastFocus = opener || null;
    detailBody.textContent = sap(m.isi);
    detailFrom.textContent = "— " + (m.dari || "Murid") + (m.kelas ? ", " + m.kelas : "");
    detail.hidden = false;
    requestAnimationFrame(function () { detail.classList.add("is-open"); });
    closeBtn.focus();
  }
  function closeDetail() {
    detail.classList.remove("is-open");
    setTimeout(function () { if (!detail.classList.contains("is-open")) detail.hidden = true; }, 230);
    if (lastFocus) lastFocus.focus();
  }
  closeBtn.addEventListener("click", closeDetail);
  detail.addEventListener("click", function (e) { if (e.target === detail) closeDetail(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !detail.hidden) closeDetail(); });

  async function load() {
    if (typeof supabaseFetchAll === "function") {
      var res = await supabaseFetchAll();
      if (res && res.data) return res.data;
    }
    try { return JSON.parse(localStorage.getItem("birthdayMessages") || "[]"); }
    catch (e) { return []; }
  }

  function toSurat(item) {
    return { dari: item.name, kelas: item.generation, isi: item.message };
  }

  function render() {
    var total = surat.length;
    var pages = Math.max(1, Math.ceil(total / PER_PAGE));
    page = Math.min(Math.max(page, 1), pages);
    countEl.textContent = total + " ucapan dari murid-muridmu";
    list.textContent = "";

    if (!total) {
      list.appendChild(h("p", "empty-message", "Belum ada ucapan yang dikirim. Jadilah yang pertama!"));
      pager.hidden = true;
      return;
    }

    surat.slice((page - 1) * PER_PAGE, page * PER_PAGE).forEach(function (m, i) {
      var c = h("article", "card");
      c.style.setProperty("--tilt", (i % 2 ? 0.8 : -0.8) + "deg");
      c.appendChild(h("p", "to", "Untuk " + NAMA + ","));
      c.appendChild(h("p", "message-preview", sap(m.isi)));
      c.appendChild(h("p", "message-read-more", "Baca selengkapnya"));
      c.appendChild(h("p", "from", "— " + (m.dari || "Murid") + (m.kelas ? ", " + m.kelas : "")));
      c.tabIndex = 0;
      c.setAttribute("role", "button");
      c.setAttribute("aria-label", "Baca ucapan lengkap dari " + (m.dari || "Murid"));
      c.addEventListener("click", function () { openDetail(m, c); });
      c.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(m, c); }
      });
      list.appendChild(c);
    });

    pager.hidden = pages <= 1;
    prev.disabled = page === 1;
    next.disabled = page === pages;
    info.textContent = "Halaman " + page + " dari " + pages;
  }

  function go(n) {
    page = n;
    render();
    list.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  prev.addEventListener("click", function () { go(page - 1); });
  next.addEventListener("click", function () { go(page + 1); });

  surat = (await load()).map(toSurat);
  render();

  /* surat baru yang masuk saat halaman terbuka */
  if (typeof subscribeToMessages === "function") {
    subscribeToMessages(function (item) {
      if (!item || !item.name || !item.message) return;
      var m = toSurat(item);
      var dup = surat.some(function (x) { return x.dari === m.dari && x.kelas === m.kelas && x.isi === m.isi; });
      if (dup) return;
      surat.push(m);
      render();
    });
  }
})();
