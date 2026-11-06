
export async function onRequestGet(context) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };

  try {
    if (!context.env.DB) {
      throw new Error("DB nicht verbunden");
    }

    const result = await context.env.DB.prepare(`
      SELECT id, title, content, category,
             status, created_at, updated_at
      FROM memories
      WHERE is_sensitive = 0
        AND status = 'aktuell'
      ORDER BY updated_at DESC
      LIMIT 20
    `).all();

    return new Response(JSON.stringify({
      app: "Jarvis",
      erinnerungen: result.results || []
    }), { status: 200, headers });

  } catch (error) {
    return new Response(JSON.stringify({
      error: "Datenbankabfrage fehlgeschlagen"
    }), { status: 503, headers });
  }
}
