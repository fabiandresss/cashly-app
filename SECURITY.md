# Seguridad de Cashly

Resumen de la postura de seguridad y de cómo volver a verificarla. Última auditoría: 16-oct-2026.

## Modelo de seguridad

| Capa | Control |
|---|---|
| **Datos** | Row Level Security (RLS) en las 13 tablas, con política `auth.uid() = user_id`. El rol `anon` no tiene ningún permiso sobre las tablas. |
| **Integridad** | Claves foráneas compuestas `(id, user_id)`: un registro no puede apuntar a datos de otro usuario. `CHECK` en montos, largos, fechas y formatos. |
| **Funciones SQL** | `SECURITY INVOKER` (corren con la RLS del usuario) y `search_path = ''`. Las funciones internas están revocadas para `anon` y `authenticated`. |
| **Secretos** | La clave de Gemini vive solo como secreto de Supabase. El navegador solo recibe la *publishable key*, que es pública por diseño. `.env` está ignorado por git. |
| **Edge Function** | Valida la sesión (`auth.getUser`), lee con el token del usuario, **solo lee** (no escribe datos financieros), limita tamaño, historial y mensajes por hora, y trata los textos del usuario como datos. |
| **Registro por chat** | El modelo solo *propone* un movimiento; la app lo guarda únicamente tras la confirmación del usuario, y la propuesta se valida en el servidor. |
| **Navegador** | CSP en el build de producción, sin `innerHTML`/`eval`, redirecciones internas validadas, `Referrer-Policy` estricta. |

## Cómo volver a verificar

1. **Dependencias y secretos:** `npm audit` y buscar claves en el historial de git.
2. **Aislamiento entre usuarios:** ejecutar `supabase/tests/rls_isolation.sql` en el SQL Editor (no deja datos: termina con `ROLLBACK`).
3. **Security Advisor:** Supabase → Advisors → Security (debe quedar sin errores).
4. **Acceso anónimo:** con la publishable key, `GET /rest/v1/<tabla>` debe responder `401`.

## Configuración recomendada en Supabase (manual)

- **Desactivar registros nuevos** (Authentication → Sign In / Providers → *Allow new users to sign up*): Cashly es de uso personal.
- **Activar MFA (TOTP)** en tu cuenta.
- **Leaked password protection** (si tu plan lo permite).
- **Confirm email:** reactivarlo si alguna vez se habilitan registros.
- Si despliegas en un dominio: añadirlo a *URL Configuration → Redirect URLs* y definir el secreto `ALLOWED_ORIGINS` de la función.

## Al publicar en internet

La CSP por `<meta>` no puede incluir `frame-ancestors`. Configura estas cabeceras en el hosting:
`Content-Security-Policy` (con `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`.
