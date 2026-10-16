/* ============================================================
   Inisialisasi data: ambil dari Supabase dulu, fallback ke localStorage.
   Isi SUPABASE_URL & SUPABASE_KEY di supabase.js agar berjalan lintas perangkat.
   ============================================================ */
async function loadMessages() {
  if (typeof supabaseFetchAll === "function") {
    const { data, error } = await supabaseFetchAll();
    if (data) return data; // berhasil dari Supabase
  }
  // fallback: localStorage
  return JSON.parse(localStorage.getItem("birthdayMessages") || "[]");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

(async function(){
  var $ = function(s){ return document.querySelector(s); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function h(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }

  /* Muat pesan dari Supabase (atau localStorage jika belum dikonfigurasi) */
  var rawMessages = await loadMessages();
  var DATA = {
    nama: "Bu Maya",
    sapaan: "Ibu",
    surat: rawMessages.map(function(item){
      return { dari: item.name, kelas: item.generation, isi: item.message };
    }),
    foto: rawMessages
      .filter(function(item){ return item.photoData; })
      .map(function(item){ return { src: item.photoData, ket: item.photoTitle || "Kenangan bersama" }; })
  };

  function updateCountLabel() {
    var countEl = document.getElementById("surat-count");
    if (countEl) countEl.textContent = DATA.surat.length + " ucapan dari murid-muridmu";
  }

  function appendLiveMessage(item) {
    if (!item || !item.name || !item.message) return;

    const alreadyExists = DATA.surat.some(function(m){
      return m.dari === item.name && m.kelas === item.generation && m.isi === item.message;
    });
    if (alreadyExists) return;

    DATA.surat.push({ dari: item.name, kelas: item.generation, isi: item.message });
    updateCountLabel();

    var track = document.getElementById("track");
    if (track) {
      var emptyMessage = track.querySelector(".empty-message");
      if (emptyMessage) emptyMessage.remove();

      for (var copy = 0; copy < 3; copy++) {
        var c = h("article", "card");
        c.style.setProperty("--tilt", ((DATA.surat.length + copy) % 2 ? 1.1 : -1.1) + "deg");
        c.appendChild(h("p", "to", "Untuk " + DATA.nama + ","));
        var preview = sap(String(item.message || ""));
        c.appendChild(h("p", "message-preview", preview));
        c.appendChild(h("p", "message-read-more"));
        c.appendChild(h("p", "from", "— " + (item.name || "Murid") + (item.generation ? ", " + item.generation : "")));
        c.tabIndex = 0;
        c.setAttribute("role", "button");
        c.setAttribute("aria-label", "Baca ucapan lengkap dari " + (item.name || "Murid"));
        c.addEventListener("click", function(){
          openDetail({ dari: item.name, kelas: item.generation, isi: item.message });
        });
        c.addEventListener("keydown", function(e){
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetail({ dari: item.name, kelas: item.generation, isi: item.message });
          }
        });
        track.appendChild(c);
        cards.push(c);
      }

      var dots = document.getElementById("dots");
      var pause = document.getElementById("pause");
      if (dots) dots.hidden = false;
      if (pause) pause.hidden = false;
      if (vp) vp.style.maskImage = "";
      if (vp) vp.style.webkitMaskImage = "";
      metrics();
      offset = loopLen;
      applyTransform(offset);
    }

    if (item.photoData) {
      DATA.foto.push({ src: item.photoData, ket: item.photoTitle || "Kenangan bersama" });
      var grid = document.getElementById("grid");
      if (grid) {
        var has = true;
        var p = h(has ? "button" : "div", "pol");
        if (has) p.type = "button";
        p.style.setProperty("--r", ((DATA.foto.length % 6) ? ([-2.2, 1.6, -0.8, 2.1, -1.5, 0.9][DATA.foto.length % 6]) : -2.2) + "deg");
        var ph = h("span", "ph");
        var im = document.createElement("img");
        im.src = item.photoData; im.alt = item.photoTitle || "Foto kenangan"; im.loading = "lazy";
        ph.appendChild(im);
        p.appendChild(ph);
        p.appendChild(h("span", "cap", item.photoTitle || "Kenangan bersama"));
        p.addEventListener("click", function(){
          lastFocus = p;
          lbimg.src = item.photoData; lbimg.alt = item.photoTitle || "";
          lbcap.textContent = item.photoTitle || "Kenangan bersama";
          lb.hidden = false;
          document.getElementById("lbx").focus();
        });
        grid.appendChild(p);
      }
    }
  }

  function sap(t){ return t.split("{s}").join(DATA.sapaan); }

  $("#nama").textContent = DATA.nama;
  var N = DATA.surat.length;
  $("#surat-count").textContent = N + " ucapan dari murid-muridmu";
  if (!N) {
    $("#track").appendChild(h("p", "empty-message", "Belum ada ucapan yang dikirim. Jadilah yang pertama!"));
    $("#dots").hidden = true;
    $("#pause").hidden = true;
    $("#vp").style.maskImage = "none";
    $("#vp").style.webkitMaskImage = "none";
  }

  if (typeof subscribeToMessages === "function") {
    subscribeToMessages(function(item){
      appendLiveMessage(item);
    });
  }

  /* ---------- confetti ---------- */
  var cv = $("#confetti"), cx = cv.getContext("2d"), parts = [], craf = 0;
  function sizeCv(){
    var d = window.devicePixelRatio || 1;
    cv.width = innerWidth * d;
    cv.height = innerHeight * d;
    cx.setTransform(d, 0, 0, d, 0, 0);
  }
  sizeCv();
  function cssv(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function burst(x, y){
    if(reduce) return;
    var cols = [cssv("--yellow"), cssv("--pink"), cssv("--blue"), cssv("--chalk")];
    for(var i = 0; i < 90; i++){
      var a = -Math.PI/2 + (Math.random() - .5) * Math.PI * 1.1, v = 6 + Math.random() * 9;
      parts.push({
        x: x, y: y, vx: Math.cos(a)*v, vy: Math.sin(a)*v,
        w: 6+Math.random()*6, h: 3+Math.random()*4,
        r: Math.random()*6, vr: (Math.random()-.5)*.3,
        c: cols[i%4], life: 0
      });
    }
    if(!craf) craf = requestAnimationFrame(tick);
  }
  function tick(){
    cx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(function(p){ return p.life < 150 && p.y < innerHeight + 20; });
    parts.forEach(function(p){
      p.vy += .28; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
      cx.save();
      cx.globalAlpha = Math.max(0, 1 - p.life/150);
      cx.translate(p.x, p.y); cx.rotate(p.r);
      cx.fillStyle = p.c; cx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      cx.restore();
    });
    craf = parts.length ? requestAnimationFrame(tick) : 0;
    if(!craf) cx.clearRect(0, 0, innerWidth, innerHeight);
  }

  /* ---------- kue & nada ---------- */
  var cake = $("#cake");
  function cakePoint(){ var r = cake.getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height*.35]; }
  function toggleCakeBlow(){
    var out = cake.classList.toggle("out");
    cake.setAttribute("aria-pressed", String(out));
    cake.setAttribute("aria-label", out ? "Nyalakan lagi lilin" : "Ketuk kue untuk meniup lilin");
    if(out){
      var p = cakePoint(); burst(p[0], p[1]);
      setTimeout(function(){ burst(innerWidth*.2, innerHeight*.8); burst(innerWidth*.8, innerHeight*.8); }, 250);
    }
  }
  cake.addEventListener("click", toggleCakeBlow);
  cake.addEventListener("keydown", function(e){
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleCakeBlow();
    }
  });
  setTimeout(function(){ var p = cakePoint(); burst(p[0], p[1]); }, 500);

  var TUNE = [[7,.75],[7,.25],[9,1],[7,1],[12,1],[11,2],[7,.75],[7,.25],[9,1],[7,1],[14,1],[12,2],[19,.75],[19,.25],[16,1],[12,1],[11,1],[9,2],[17,.75],[17,.25],[16,1],[12,1],[14,1],[12,2]];
  var actx = null, nodes = [], stopT = 0, playing = false, tuneBtn = $("#tune");
  function stopTune(){
    nodes.forEach(function(o){ try{ o.stop(); }catch(e){} });
    nodes = []; clearTimeout(stopT); playing = false; tuneBtn.textContent = "Putar nada";
  }
  function playTune(){
    var AC = window.AudioContext || window.webkitAudioContext; if(!AC) return;
    actx = actx || new AC(); if(actx.state === "suspended") actx.resume();
    var beat = .46, t = actx.currentTime + .05;
    TUNE.forEach(function(n){
      var f = 261.63 * Math.pow(2, n[0]/12), d = n[1]*beat, o = actx.createOscillator(), g = actx.createGain();
      o.type = "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.22, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + d*.95);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d); nodes.push(o); t += d;
    });
    playing = true; tuneBtn.textContent = "Hentikan nada";
    stopT = setTimeout(stopTune, (t - actx.currentTime) * 1000 + 150);
  }
  tuneBtn.addEventListener("click", function(){ playing ? stopTune() : playTune(); });

  /* ---------- carousel surat: auto-scroll halus tanpa status aktif ---------- */
  var track = $("#track"), vp = $("#vp");
  var cards = [], SPEED = reduce ? 0 : 0.45;
  var offset = 0, sraf = 0, gap = 22, loopLen = 0, lastTime = 0;
  var dragState = { active: false, startX: 0, startOffset: 0 };

  // Modal detail ucapan
  var detail = h("div", "message-detail");
  detail.hidden = true;
  detail.setAttribute("role", "dialog");
  detail.setAttribute("aria-modal", "true");
  detail.setAttribute("aria-labelledby", "message-detail-title");
  detail.innerHTML = '<div class="message-detail-panel"><button type="button" class="message-detail-close" aria-label="Tutup detail">×</button><p class="eyebrow">Ucapan untuk Bu Maya</p><h3 id="message-detail-title">Pesan lengkap</h3><div class="message-detail-body"></div><p class="message-detail-from"></p></div>';
  document.body.appendChild(detail);
  var detailBody = detail.querySelector(".message-detail-body");
  var detailFrom = detail.querySelector(".message-detail-from");
  function openDetail(message) {
    detailBody.textContent = sap(String(message.isi || ""));
    detailFrom.textContent = "— " + (message.dari || "Murid") + (message.kelas ? ", " + message.kelas : "");
    detail.hidden = false;
    requestAnimationFrame(function(){ detail.classList.add("is-open"); });
    detail.querySelector(".message-detail-close").focus();
  }
  function closeDetail() { detail.classList.remove("is-open"); window.setTimeout(function(){ if (!detail.classList.contains("is-open")) detail.hidden = true; }, 230); }
  detail.querySelector(".message-detail-close").addEventListener("click", closeDetail);
  detail.addEventListener("click", function(e){ if(e.target === detail) closeDetail(); });
  document.addEventListener("keydown", function(e){ if(e.key === "Escape" && !detail.hidden) closeDetail(); });

  for (var copy = 0; copy < (N ? 3 : 0); copy++) {
    DATA.surat.forEach(function(message, i) {
      var c = h("article", "card");
      c.style.setProperty("--tilt", (i % 2 ? 1.1 : -1.1) + "deg");
      c.appendChild(h("p", "to", "Untuk " + DATA.nama + ","));
      var preview = sap(String(message.isi || ""));
      c.appendChild(h("p", "message-preview", preview));
      c.appendChild(h("p", "message-read-more"));
      c.appendChild(h("p", "from", "— " + (message.dari || "Murid") + (message.kelas ? ", " + message.kelas : "")));
      c.tabIndex = 0;
      c.setAttribute("role", "button");
      c.setAttribute("aria-label", "Baca ucapan lengkap dari " + (message.dari || "Murid"));
      c.addEventListener("click", (function(m){ return function(){ openDetail(m); }; })(message));
      c.addEventListener("keydown", (function(m){ return function(e){ if(e.key === "Enter" || e.key === " "){ e.preventDefault(); openDetail(m); } }; })(message));
      track.appendChild(c); cards.push(c);
    });
  }

  function metrics() {
    gap = parseFloat(getComputedStyle(track).columnGap) || 22;
    var firstCopyWidth = 0;
    for (var i = 0; i < N; i++) firstCopyWidth += cards[i].getBoundingClientRect().width + gap;
    loopLen = firstCopyWidth;
  }
  function applyTransform(px) {
    track.style.transform = "translate3d(" + (-px) + "px,0,0)";
  }
  function animate(time) {
    if (!lastTime) lastTime = time;
    var elapsed = Math.min(time - lastTime, 40);
    lastTime = time;
    if (!document.hidden && !dragState.active && loopLen > 0) {
      offset += SPEED * elapsed / 16.67;
      if (offset >= loopLen) offset -= loopLen;
    }
    applyTransform(offset);
    sraf = requestAnimationFrame(animate);
  }
  vp.addEventListener("pointerdown", function(e) {
    if (!N) return;
    dragState.active = true;
    dragState.startX = e.clientX;
    dragState.startOffset = offset;
    vp.classList.add("dragging");
  });
  vp.addEventListener("pointermove", function(e) {
    if (!dragState.active) return;
    offset = (dragState.startOffset - (e.clientX - dragState.startX)) % loopLen;
    if (offset < 0) offset += loopLen;
    applyTransform(offset);
  });
  function endDrag(e) {
    if (!dragState.active) return;
    dragState.active = false;
    vp.classList.remove("dragging");
  }
  vp.addEventListener("pointerup", endDrag);
  vp.addEventListener("pointercancel", endDrag);
  if (N) {
    metrics();
    offset = loopLen;
    applyTransform(offset);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ metrics(); offset = offset % loopLen; applyTransform(offset); });
    window.addEventListener("resize", function(){ sizeCv(); metrics(); offset = offset % loopLen; applyTransform(offset); });
    sraf = requestAnimationFrame(animate);
  } else {
    window.addEventListener("resize", sizeCv);
  }
  var pauseBtn = $("#pause");
  if (pauseBtn) pauseBtn.hidden = true;
  var dots = $("#dots");
  if (dots) dots.hidden = true;
  var car = $("#carousel");
  car.addEventListener("pointerenter", function(e){ if(e.pointerType === "mouse") SPEED = reduce ? 0 : 0.45; });
  /* ---------- foto ---------- */
  var grid = $("#grid"), lb = $("#lb"), lbimg = $("#lbimg"), lbcap = $("#lbcap"), lastFocus = null;
  if (!DATA.foto.length) {
    grid.appendChild(h("p", "empty-message", "Belum ada foto kebersamaan yang dikirim."));
  }
  DATA.foto.forEach(function(f, i){
    var has = !!f.src, p = h(has ? "button" : "div", "pol");
    if(has) p.type = "button";
    p.style.setProperty("--r", ([-2.2, 1.6, -0.8, 2.1, -1.5, 0.9][i % 6]) + "deg");
    var ph = h("span", "ph" + (has ? "" : " empty"));
    ph.style.display = "block";
    if(has){
      var im = document.createElement("img");
      im.src = f.src; im.alt = f.ket || "Foto kenangan"; im.loading = "lazy";
      ph.appendChild(im);
    } else {
      ph.style.display = "grid";
      ph.textContent = "Foto menyusul";
    }
    p.appendChild(ph);
    p.appendChild(h("span", "cap", f.ket || ""));
    if(has) p.addEventListener("click", function(){
      lastFocus = p;
      lbimg.src = f.src; lbimg.alt = f.ket || "";
      lbcap.textContent = f.ket || "";
      lb.hidden = false;
      $("#lbx").focus();
    });
    grid.appendChild(p);
  });
  function closeLb(){ lb.hidden = true; lbimg.removeAttribute("src"); if(lastFocus) lastFocus.focus(); }
  $("#lbx").addEventListener("click", closeLb);
  lb.addEventListener("click", function(e){ if(e.target === lb) closeLb(); });
  document.addEventListener("keydown", function(e){ if(e.key === "Escape" && !lb.hidden) closeLb(); });
})();
