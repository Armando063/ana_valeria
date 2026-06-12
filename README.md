# Invitación XV Años (Frontend)

Archivos creados en `invitation/`:

- `index.html` - plantilla principal
- `styles.css` - estilos
- `app.js` - lógica (countdown, galería, RSVP)

Pasos para probar localmente:

1. Abrir un servidor local en la carpeta `invitation` (por ejemplo `python3 -m http.server 8000`).
2. Navegar a `http://localhost:8000`.

Reemplazar imágenes en `invitation/images/` por las fotos reales. Nombres usados: `cover.jpg`, `photo1.jpg`, `photo2.jpg`, `photo3.jpg`.

Integración con Google Drive (opcional):

- Crea un proyecto en Google Cloud Console y habilita Drive API.
- Crea credenciales OAuth 2.0 (Client ID) para aplicación web y copia `CLIENT_ID` y `API_KEY`.
- Edita `app.js` y reemplaza `GAPI_CLIENT_ID` y `GAPI_API_KEY` con tus valores.
- El flujo pedirá inicio de sesión y subirá un archivo JSON con la confirmación a la carpeta `Invitaciones-XV-Respuestas` en Drive.

Agregar recordatorio en calendario:

- Si el invitado confirma, se mostrará un enlace para abrir Google Calendar con el evento pre-llenado y un enlace para descargar un archivo `.ics` que pueden importar en su smartphone u otras apps de calendario.

Notas:

- Para mostrar el mapa con más funcionalidades puedes reemplazar el `iframe` con la API de Google Maps (requiere API key).
- Ajusta textos, horarios, ubicación y cuentas de regalo según necesites.
