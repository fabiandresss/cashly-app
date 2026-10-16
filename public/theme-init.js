// Aplica el tema antes de pintar para evitar el destello claro.
// Vive como archivo externo para poder usar una CSP sin 'unsafe-inline' en scripts.
try {
  var t = localStorage.getItem('cashly-theme')
  var dark = t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  if (dark) document.documentElement.classList.add('dark')
} catch {
  /* sin almacenamiento disponible: se usa el tema por defecto */
}
