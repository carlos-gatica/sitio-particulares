# Sitio Particulares

Sitio de una sola unidad de negocio para servicios a particulares (pintura, gasfitería, electricidad, remodelaciones, etc.)

## Stack
- Node.js + Express + EJS
- PostgreSQL en Supabase
- Resend (correo) + CallMeBot (WhatsApp)
- Basic Auth propio para `/admin/cotizaciones`
- Deploy en Vercel (plan Hobby)

## Configuración local

1. Instalar dependencias:
   ```
   npm install
   ```
2. Copiar `.env.example` a `.env` y completar los valores reales:
   ```
   cp .env.example .env
   ```
3. Levantar el servidor en modo desarrollo:
   ```
   npm run dev
   ```
4. Abrir `http://localhost:3000`

## Variables de entorno necesarias

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión de Supabase (Settings → Database → Connection string) |
| `RESEND_API_KEY` | API key de Resend |
| `NOTIFICATION_EMAIL_TO` | Correo que recibe las notificaciones de cotización |
| `NOTIFICATION_EMAIL_FROM` | Remitente verificado en Resend |
| `CALLMEBOT_PHONE` | Número de WhatsApp registrado en CallMeBot (formato 569XXXXXXXX) |
| `CALLMEBOT_APIKEY` | API key entregada por CallMeBot |
| `ADMIN_USER` / `ADMIN_PASSWORD` | Credenciales del panel `/admin/cotizaciones` |
| `SITE_NAME` | Nombre visible del sitio |

## Estructura

```
config/servicios.js   → catálogo de servicios (agregar/editar/quitar servicios aquí)
routes/                → rutas Express
views/                 → vistas EJS
public/                → CSS, JS e imágenes (reemplaza los íconos en public/img/iconos)
services/              → integraciones Resend y CallMeBot
db/pool.js             → conexión Postgres y creación de tabla
```

## Próximos pasos pendientes (a definir contigo)
- Crear el proyecto en Supabase y obtener `DATABASE_URL`
- Verificar un dominio o usar el de pruebas en Resend
- Registrar el número en CallMeBot y obtener el apikey
- Crear repo en GitHub y conectar a Vercel
- Reemplazar los íconos placeholder en `public/img/iconos/`
