# Despliegue en Vercel

Detalle del despliegue en Vercel, variables de entorno y pruebas sobre producción o preview. Lee este archivo antes de tocar `vercel.json`, `.vercelignore` o configuración de despliegue.

- Producción: https://proyecto-sportify.vercel.app (proyecto de Vercel `kgb10/proyecto-sportify`, enlazado en `.vercel/`, ignorado por git).
- **Cada push a `main` despliega a producción.** Para esperar el despliegue de un commit: `gh api repos/JuanFierro15/ProyectoSportify/commits/<sha>/status` (estado `success`, contexto `Vercel`).
- Preset Vite (salida `dist/`) en el dashboard (cambiado el 14-10-2026 con `vercel api /v9/projects/<id> -X PATCH -f framework=vite`) y también en `vercel.json` (`"framework": "vite"`, que es el que manda). Un push a otra rama crea un despliegue *Preview* (no producción, con Deployment Protection: probarlo con `vercel curl`, no con `curl`).
- Variables en Vercel (Production y Preview): `GEMINI_API_KEY` (sensible) y `GEMINI_MODEL`. Aplican desde el siguiente despliegue: cambiar con `vercel env update GEMINI_MODEL production --value … --yes` y luego `vercel redeploy https://proyecto-sportify.vercel.app --target production`. Ojo: `vercel env run` muestra el valor de `.env.local` (lo pisa); para verificar el valor real, `vercel env pull` a un archivo temporal del scratchpad, leer solo esa línea y borrarlo (la key, al ser Secret, no se baja). **Nunca imprimir el valor de la key ni de ningún secreto** (ni en código, logs o reportes): de la key solo se dice si existe, si está vacía y cuántos caracteres tiene.
- Probar en producción con Chrome escribe en el `localStorage` real del navegador: respaldarlo antes y restaurarlo al terminar (o usar un perfil temporal, como el de las capturas).
