# Cómo conectar A Donde Hoy con Google Places

Con esto la app muestra **calificaciones reales, número de reseñas, precio y si está abierto ahora**.
Sin esto, la app sigue funcionando con OpenStreetMap (gratis, sin calificaciones).

## Lo que cuesta
- Cada búsqueda de la app hace 2 consultas a Google ("Nearby Search Enterprise", porque pide calificación, precio y horario).
- Google da **1,000 consultas gratis al mes** de ese tipo, o sea unas **500 búsquedas gratis al mes**.
- Después cuesta unos **35 dólares por cada 1,000 consultas**, es decir unos 70 dólares por cada 1,000 búsquedas.
- Fuente: [precios de Google Maps Platform](https://developers.google.com/maps/billing-and-pricing/pricing).
- Recomendación: pon una **alerta de presupuesto** en Google Cloud (por ejemplo 10 dólares) para que no haya sorpresas.

## Paso 1: la clave de Google (lo haces tú, unos 10 minutos)
1. Entra a https://console.cloud.google.com y crea un proyecto llamado "A Donde Hoy".
2. Activa la facturación (pide tarjeta; no cobra mientras estés dentro de lo gratis).
3. En "APIs y servicios", activa **Places API (New)**.
4. En "Credenciales", crea una **clave de API** y restríngela a "Places API (New)".
5. Guarda la clave en un lugar seguro. **No la pegues en el chat ni en la página web.**

## Paso 2: el servidor (Cloudflare Workers, gratis)
El archivo `worker.js` de esta carpeta es el servidor. Guarda la clave en secreto y le pasa a la app solo los datos.
1. Crea una cuenta gratis en https://dash.cloudflare.com.
2. Ve a "Workers y Pages" → "Crear" → "Crear Worker", llámalo `adondehoy`, y pega el contenido de `worker.js`.
3. En la configuración del Worker → "Variables y secretos", agrega el secreto `GOOGLE_PLACES_KEY` con tu clave.
4. Cuando la página web esté publicada, agrega la variable `ALLOWED_ORIGIN` con su dirección (por ejemplo `https://adondehoy.netlify.app`).
5. Copia la dirección del Worker, algo como `https://adondehoy.TU-USUARIO.workers.dev`.

## Paso 3: conectar la app
En `index.html`, busca esta línea y pon la dirección del Worker:

```js
const CONFIG = { placesEndpoint: "https://adondehoy.TU-USUARIO.workers.dev" };
```

Si Google falla, la app cae sola a OpenStreetMap.

## Nota sobre las reglas de Google
Google exige mostrar que los datos vienen de Google Maps (la app ya lo dice al pie) y no permite guardar sus datos por largo tiempo. Por eso el servidor no guarda nada.
