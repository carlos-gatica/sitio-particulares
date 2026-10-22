# Carlos Gatica Construcciones — sitio para particulares

Sitio de una sola unidad de negocio (reparaciones, remodelaciones y construcción menor) con
cotizaciones por correo y WhatsApp, y un **panel de administración** para cambiar el contenido sin tocar código.

## Qué se puede hacer desde el panel (`/admin`)
| Sección | Para qué sirve |
|---|---|
| **Cotizaciones** | Ver las solicitudes recibidas |
| **Servicios** | Agregar, editar, ordenar, ocultar o quitar servicios. Cada uno puede tener foto o video propio y un **portafolio de proyectos realizados** (fotos, videos o links de YouTube) |
| **Banner** | Carrusel de la portada con fotos y videos de proyectos, con título, subtítulo y enlace opcionales |
| **Ajustes** | Textos de la portada, número de WhatsApp, Instagram y Facebook |

En la portada, cada tarjeta de "Nuestros servicios" lleva a su página de detalle (`/servicio/<nombre>`), que muestra
la descripción y la galería de proyectos con visor ampliado.

## Stack
- Node.js + Express + EJS
- PostgreSQL en Supabase (las tablas se crean solas al primer arranque)
- Supabase Storage para fotos y videos (subida directa desde el navegador)
- Resend (correo) + CallMeBot (WhatsApp)
- Panel con login (usuario y clave) y sesión por cookie firmada
- Deploy en Vercel (plan Hobby)

## Variables de entorno
Ver `.env.example`. Las nuevas respecto de la versión anterior:

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API → *Project URL* |
| `SUPABASE_SERVICE_ROLE_KEY` | Misma pantalla, llave **service_role** (secreta; solo va en Vercel, nunca en el código) |
| `SUPABASE_BUCKET` | Opcional. Nombre del bucket; por defecto `media` (se crea solo) |
| `SESSION_SECRET` | Opcional, recomendado. Texto largo y aleatorio para firmar la sesión |

`ADMIN_USER` y `ADMIN_PASSWORD` se mantienen, pero ahora se usan en la pantalla `/admin/login`
(se acabó el cuadro emergente de Basic Auth).

## Fotos y videos: límites
- Fotos: se reducen en el navegador (máx. 1920 px) antes de subir. JPG, PNG, WEBP o GIF.
- Videos: hasta **50 MB** (tope del plan gratuito de Supabase), MP4 o WEBM. Para videos largos, pega un **link de YouTube**.
- El plan gratuito de Supabase tiene 1 GB de almacenamiento en total.

## Probar en tu computador
```
npm install
cp .env.example .env     # y completar los valores
npm run dev              # http://localhost:3000   (panel: /admin/login)
```

## Estructura
```
config/servicios.js   → catálogo inicial (solo se usa para cargar los 8 servicios la primera vez y como respaldo)
db/pool.js            → conexión y creación de tablas
lib/                  → sesión, almacenamiento, medios, contenido, ajustes
routes/               → rutas públicas (index, servicio, cotizacion, seo) y del panel (admin-*)
views/                → plantillas EJS (views/admin = panel)
public/js/            → carrusel, visor ampliado y subida de archivos
services/             → correo (Resend) y WhatsApp (CallMeBot)
```

## Pendientes conocidos
- Dominio propio en Vercel y verificarlo en Resend (hoy el correo usa el dominio de pruebas).
- Revisar los textos de cada servicio con la voz real del negocio (se editan desde el panel).
- Reemplazar los íconos placeholder de `public/img/iconos/` o subir foto propia a cada servicio.
