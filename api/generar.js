// /api/generar — único punto de contacto con la API de Claude.
// La ANTHROPIC_API_KEY vive en las variables de entorno de Vercel, nunca en el cliente.

const SUPABASE_URL = "https://kuqhrszlxewonvkkjnsg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_xmjbr4SQU_4K79wFdGYocg_v1NOj5R5";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  // 1) Verificar que quien llama tiene sesión válida de Supabase
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Sin sesión" });

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` }
  });
  if (!userRes.ok) return res.status(401).json({ error: "Sesión no válida" });

  // 2) Validar el payload
  const { reviews } = req.body || {};
  if (!Array.isArray(reviews) ||
