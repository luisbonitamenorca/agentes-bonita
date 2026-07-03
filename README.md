# Bonita · Agentes

Panel de control de los agentes IA de Bonita Menorca. Fase A: Analista de reseñas con bandeja de aprobación.

## Arquitectura

- `index.html` — panel completo (login + bandeja + agentes + actividad + ajustes). Habla con Supabase directamente para datos y con `/api/generar` para redactar.
- `api/generar.js` — función serverless de Vercel. Único punto que llama a la API de Claude. Verifica la sesión de Supabase antes de generar.
- Supabase (proyecto `agentes-bonita`): tablas `agent_reviews`, `agent_tones`, `agent_runs`, con RLS solo-autenticados. Esquema ya aplicado y datos de prueba sembrados.

## Despliegue (una vez)

1. Sube esta carpeta a un repositorio nuevo de GitHub (por ejemplo `agentes-bonita`).
2. En Vercel: **Add New → Project → importa el repo**. Framework preset: *Other*. Sin build command.
3. En Vercel → Settings → **Environment Variables**, añade:
   - `ANTHROPIC_API_KEY` = tu clave de la API de Anthropic (console.anthropic.com)
4. Deploy.

## Usuarios (una vez)

En Supabase → proyecto `agentes-bonita` → **Authentication → Users → Add user**:
crea los usuarios de Luis y Patricia con email + contraseña (marca "Auto confirm user").
No hay registro abierto: solo entran los usuarios creados aquí.

## Uso

- **Bandeja**: reseñas y comentarios con la respuesta propuesta. Aprobar / Editar / Regenerar / Descartar.
- **Ajustes**: tono por local. Cambiar tono + regenerar = calibrar.
- **Actividad**: tokens y coste de cada ejecución (Sonnet 4.6).
- Botón «Restaurar reseñas de prueba» en Actividad: vuelve a dejar los datos simulados en pendiente.

## Próximos pasos (cuando lleguen los permisos)

- Google Business Profile API → ingesta real de reseñas + publicación real al aprobar.
- Meta Graph API → comentarios de Facebook e Instagram en la misma bandeja.
- Cron de Vercel → ejecución programada del agente sin abrir el panel.
