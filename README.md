# Cashly

Aplicación web de finanzas personales: ingresos, gastos, presupuestos, estadísticas y un asistente con IA.

## Stack

React · TypeScript (strict) · Vite · Tailwind CSS · Supabase · Recharts · Google Gemini · n8n

## Inicio rápido

```bash
npm install
cp .env.example .env   # completa con las credenciales de Supabase
npm run dev
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Chequeo de tipos y build de producción |
| `npm run lint` | Linter (oxlint) |

## Estructura

```
src/
  components/ui/      componentes reutilizables
  components/layout/  shell de la aplicación
  pages/              páginas por ruta
  lib/                utilidades y configuración
  hooks/ · types/
```

## Seguridad

Las claves de servicios externos (Gemini, n8n) nunca van en el frontend. Solo se usa la `anon key` de Supabase, protegida con RLS.
