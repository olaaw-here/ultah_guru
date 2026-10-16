/* ============================================================
   SUPABASE CONFIG – isi 2 baris di bawah, lalu simpan!
   ============================================================
   1. Buka https://supabase.com → pilih project kamu
   2. Settings → API
      - "Project URL"    → isi ke SUPABASE_URL
      - "anon public"    → isi ke SUPABASE_KEY
   3. Buat tabel "messages" dengan SQL ini (di SQL Editor Supabase):

      CREATE TABLE messages (
        id           TEXT PRIMARY KEY,
        name         TEXT NOT NULL,
        generation   TEXT NOT NULL,
        message      TEXT NOT NULL,
        photo_title  TEXT,
        photo_data   TEXT,
        submitted_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Aktifkan Row Level Security (RLS)
      ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

      -- Izinkan siapa saja INSERT (kirim ucapan)
      CREATE POLICY "allow_insert" ON messages
        FOR INSERT TO anon WITH CHECK (true);

      -- Izinkan siapa saja SELECT (baca ucapan)
      CREATE POLICY "allow_select" ON messages
        FOR SELECT TO anon USING (true);

   ============================================================ */

const SUPABASE_URL = "https://ushynmskydguubgqwoxc.supabase.co";   // <- ganti ini
const SUPABASE_KEY = "sb_publishable_Sh-3UlZ2qVTD9LBaPFfakw_-TUTAuV_";      // <- ganti ini

const supabaseClient = (typeof window !== "undefined" && window.supabase && typeof window.supabase.createClient === "function")
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    })
  : null;

/* ============================================================
   Jangan ubah kode di bawah ini
   ============================================================ */

function isSupabaseConfigured() {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_KEY &&
    !SUPABASE_URL.startsWith("GANTI") &&
    !SUPABASE_KEY.startsWith("GANTI")
  );
}

function normalizeSupabaseRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    generation: row.generation,
    message: row.message,
    photoTitle: row.photo_title || row.photoTitle || "",
    photoData: row.photo_data || row.photoData || "",
    submittedAt: row.submitted_at || row.submittedAt
  };
}

/**
 * Kirim satu ucapan ke Supabase.
 * @param {Object} entry - objek dengan field: id, name, generation, message, photoTitle, photoData, submittedAt
 * @returns {Promise<{ok: boolean, error: string|null}>}
 */
async function supabaseInsert(entry) {
  if (!isSupabaseConfigured()) {
    console.warn("[Supabase] URL/Key belum diisi. Lewati penyimpanan ke server.");
    return { ok: false, error: "config" };
  }

  const payload = {
    id:           entry.id,
    name:         entry.name,
    generation:   entry.generation,
    message:      entry.message,
    photo_title:  entry.photoTitle  || null,
    photo_data:   entry.photoData   || null,
    submitted_at: entry.submittedAt
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "apikey":        SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Prefer":        "return=minimal"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[Supabase] Insert gagal:", res.status, text);
      return { ok: false, error: text };
    }

    return { ok: true, error: null };
  } catch (err) {
    console.error("[Supabase] Network error:", err);
    return { ok: false, error: err.message };
  }
}

/**
 * Ambil semua ucapan dari Supabase, diurutkan dari terlama ke terbaru.
 * @returns {Promise<{data: Array|null, error: string|null}>}
 */
async function supabaseFetchAll() {
  if (!isSupabaseConfigured()) {
    console.warn("[Supabase] URL/Key belum diisi. Baca data dari localStorage saja.");
    return { data: null, error: "config" };
  }

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("messages")
        .select("*")
        .order("submitted_at", { ascending: true });

      if (error) {
        console.error("[Supabase] Fetch gagal:", error);
        return { data: null, error: error.message || "fetch_error" };
      }

      return {
        data: (data || []).map(normalizeSupabaseRow),
        error: null
      };
    } catch (err) {
      console.error("[Supabase] Network error:", err);
      return { data: null, error: err.message };
    }
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/messages?select=*&order=submitted_at.asc`,
      {
        headers: {
          "apikey":        SUPABASE_KEY,
          "Authorization": "Bearer " + SUPABASE_KEY
        }
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("[Supabase] Fetch gagal:", res.status, text);
      return { data: null, error: text };
    }

    const rows = await res.json();
    return {
      data: rows.map(normalizeSupabaseRow).filter(Boolean),
      error: null
    };
  } catch (err) {
    console.error("[Supabase] Network error:", err);
    return { data: null, error: err.message };
  }
}

/**
 * Subscribe ke event insert baru dan panggil callback untuk setiap ucapan baru.
 * @param {Function} onInsert
 * @returns {Function} cleanup function
 */
function subscribeToMessages(onInsert) {
  if (!isSupabaseConfigured() || !supabaseClient || typeof onInsert !== "function") {
    return function cleanup() {};
  }

  const channel = supabaseClient.channel("messages-realtime");

  channel.on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "messages" },
    (payload) => {
      const row = normalizeSupabaseRow(payload.new);
      if (row) onInsert(row);
    }
  );

  channel.subscribe((status) => {
    if (status === "CHANNEL_ERROR") {
      console.error("[Supabase] Realtime channel error");
    }
  });

  return function cleanup() {
    supabaseClient.removeChannel(channel);
  };
}
