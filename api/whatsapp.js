// /api/whatsapp — conserje conversacional. Responde o escala a humano.
// Sin plantillas con acentos graves a propósito: copiable sin riesgo de truncado.

const SUPABASE_URL = "https://kuqhrszlxewonvkkjnsg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_xmjbr4SQU_4K79wFdGYocg_v1NOj5R5";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Sin sesión" });

  const userRes = await fetch(SUPABASE_URL + "/auth/v1/user", {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: "Bearer " + token }
  });
  if (!userRes.ok) return res.status(401).json({ error: "Sesión no válida" });

  const { venue_name, tone, customer, history } = req.body || {};
  if (!venue_name || !Array.isArray(history) || history.length === 0 || history.length > 60)
    return res.status(400).json({ error: "Payload no válido" });

  const prompt = [
    "Eres el conserje de WhatsApp de " + venue_name + ", del grupo Bonita Menorca. Atiendes a clientes reales por WhatsApp.",
    "Tono del local: " + (tone || "cercano y profesional"),
    "Cliente: " + (customer || "desconocido"),
    "",
    "Reglas estrictas:",
    "- Responde en el idioma del último mensaje del cliente.",
    "- Breve y natural, estilo WhatsApp: 1 a 3 frases. Emojis con mucha moderación (máximo uno).",
    "- NUNCA inventes datos: ni disponibilidad de mesas, ni horarios concretos, ni precios, ni platos. Si no lo sabes, dilo y ofrece el camino (enlace de reservas https://binifadet.com/reservas, visitas https://binifadet.com/visitas, tienda https://binifadet.com/tienda, o que el equipo le confirme).",
    "- NUNCA confirmes una reserva tú mismo: remite al enlace o escala.",
    "- DEBES ESCALAR a un humano (accion=escalar) cuando haya: queja o cliente molesto, grupos de 8 o más personas, pagos/facturas/condiciones comerciales, modificación o cancelación de una reserva existente, alergias o temas de salud que requieran confirmación de cocina, o cualquier cosa que no puedas resolver con seguridad.",
    "- Al escalar, tu mensaje es un traspaso amable: confirma que le pasas con el equipo, sin inventar plazos de respuesta.",
    "",
    "Devuelve SOLO un objeto JSON valido, sin markdown ni texto adicional, con este formato exacto:",
    '{"accion":"responder","mensaje":"..."} o {"accion":"escalar","mensaje":"..."}',
    "",
    "Conversación hasta ahora (el último mensaje es del cliente y es el que debes atender):",
    JSON.stringify(history, null, 1)
  ].join("\n");

  try {
    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await apiRes.json();
    if (data.error) return res.status(502).json({ error: data.error.message || "Error de la API de Claude" });

    const text = (data.content || []).filter(function(b){ return b.type === "text"; })
      .map(function(b){ return b.text; }).join("\n");

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return res.status(502).json({ error: "Respuesta del modelo sin JSON" });
    const out = JSON.parse(text.slice(start, end + 1));
    if (out.accion !== "responder" && out.accion !== "escalar")
      return res.status(502).json({ error: "Acción no reconocida" });

    return res.status(200).json({
      accion: out.accion,
      mensaje: (out.mensaje || "").trim(),
      usage: { input_tokens: (data.usage && data.usage.input_tokens) || 0, output_tokens: (data.usage && data.usage.output_tokens) || 0 }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "No se pudo generar la respuesta" });
  }
}
