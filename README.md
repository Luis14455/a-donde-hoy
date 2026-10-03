# A Donde Hoy

Te decimos a dónde ir a comer cerca de ti, en segundos.

- `index.html`: la app web completa (un solo archivo). Usa tu ubicación, busca lugares cercanos y te recomienda uno con dos alternativas.
- `server/worker.js`: servidor opcional para Cloudflare Workers que consulta Google Places (calificaciones, precio, abierto ahora) sin exponer la clave.
- `server/COMO-CONECTAR-GOOGLE.md`: pasos para conectar Google Places.

Sin el servidor, la app usa datos gratuitos de OpenStreetMap. Si no hay ubicación ni internet, muestra lugares de ejemplo inventados.

Se publica con GitHub Pages desde la rama `main`.
