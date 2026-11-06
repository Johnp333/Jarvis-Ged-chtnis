
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


export async function onRequestPost(context) {
  const { request, env } = context;

  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };

  function antwort(daten, status) {
    return new Response(JSON.stringify(daten), {
      status,
      headers
    });
  }

  if (request.headers.get("Origin") !==
      "https://jarvis-pages-test.pages.dev") {
    return antwort({ error: "Zugriff verweigert" }, 403);
  }

  if (!request.headers.get("Content-Type")
      ?.toLowerCase().startsWith("application/json")) {
    return antwort({ error: "JSON erforderlich" }, 415);
  }

  if (!env.DB) {
    return antwort({ error: "Datenbank nicht verbunden" }, 503);
  }

  let daten;

  try {
    const text = await request.text();

    if (text.length > 10000) {
      return antwort({ error: "Anfrage zu gross" }, 413);
    }

    daten = JSON.parse(text);
  } catch {
    return antwort({ error: "Ungueltiges JSON" }, 400);
  }

  const titel = typeof daten?.title === "string"
    ? daten.title.trim() : "";

  const inhalt = typeof daten?.content === "string"
    ? daten.content.trim() : "";

  const kategorie = typeof daten?.category === "string"
    ? daten.category.trim() || "Allgemein"
    : "Allgemein";

  if (!titel || !inhalt ||
      titel.length > 120 ||
      inhalt.length > 2000 ||
      kategorie.length > 40) {
    return antwort({
      error: "Titel, Inhalt oder Kategorie ungueltig"
    }, 400);
  }

  const id = crypto.randomUUID();

  try {
    await env.DB.prepare(`
      INSERT INTO memories
      (id, title, content, category,
       status, source, is_sensitive)
      VALUES (?, ?, ?, ?, 'aktuell', 'manuell', 0)
    `).bind(
      id, titel, inhalt, kategorie
    ).run();

    return antwort({
      gespeichert: true,
      id,
      title: titel
    }, 201);

  } catch {
    return antwort({
      error: "Speichern fehlgeschlagen"
    }, 503);
  }
}

