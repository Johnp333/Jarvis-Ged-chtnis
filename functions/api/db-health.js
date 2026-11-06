
export async function onRequestGet(context) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };

  try {
    if (!context.env.DB) {
      throw new Error("Datenbank nicht verbunden");
    }

    const result = await context.env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'memories'"
    ).first();

    if (!result) {
      throw new Error("Tabelle nicht gefunden");
    }

    return new Response(JSON.stringify({
      app: "Jarvis",
      datenbank: "verbunden",
      tabelle: "memories erreichbar"
    }), { status: 200, headers });

  } catch (error) {
    return new Response(JSON.stringify({
      app: "Jarvis",
      datenbank: "Verbindung fehlgeschlagen"
    }), { status: 503, headers });
  }
}
