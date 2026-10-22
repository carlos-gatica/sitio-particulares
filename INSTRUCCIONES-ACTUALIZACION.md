# Cómo poner esta versión en tu sitio

## 1. Copiar los archivos
Descomprime el ZIP y copia **todo su contenido encima** de la carpeta de tu proyecto
(`C:\Users\JCarlos\Documents\negocios\TRACK\sitio-particulares`), aceptando reemplazar.
No hay dependencias nuevas: **no necesitas `npm install`** para desplegar.

Se elimina un archivo que ya no se usa: `middleware/basicAuth.js` (bórralo si queda en tu carpeta).

## 2. Sacar `.idea` de GitHub (una sola vez)
En la terminal de WebStorm:
```
git rm -r --cached .idea
```

## 3. Configurar Supabase Storage y Vercel
1. Supabase → tu proyecto → **Project Settings → API**: copia el **Project URL** y la llave **service_role**.
2. Vercel → proyecto → **Settings → Environment Variables**: agrega
   - `SUPABASE_URL` = el Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = la llave service_role
   - `SESSION_SECRET` = un texto largo y aleatorio (opcional, recomendado)
   - (`ADMIN_USER` y `ADMIN_PASSWORD` ya los tienes)
3. El bucket `media` se crea solo la primera vez que subes un archivo.
   Si diera error, créalo a mano: Supabase → **Storage → New bucket** → nombre `media` → marcar **Public**.

## 4. Subir los cambios
```
git add .
git commit -m "Panel admin: banner, servicios editables y portafolio"
git push origin main
```
Vercel despliega solo. Las tablas nuevas se crean en la primera visita y los 8 servicios actuales se cargan automáticamente.

## 5. Primer uso
1. Entra a `https://carlos-gatica.vercel.app/admin/login` con tu `ADMIN_USER` y `ADMIN_PASSWORD`.
2. **Ajustes**: pon tus links reales de Instagram y Facebook (mientras estén vacíos, los íconos no se muestran).
3. **Servicios**: abre cada uno, sube su foto o video y agrega proyectos al portafolio.
4. **Banner**: sube las fotos o videos del carrusel de la portada.

## Si algo falla
- *"Falta configurar el almacenamiento"* al subir → faltan `SUPABASE_URL` o `SUPABASE_SERVICE_ROLE_KEY` en Vercel (y redesplegar).
- *"Supabase rechazó el archivo"* → revisa que el bucket exista y sea público, y que el video pese menos de 50 MB.
- No puedes entrar al panel → revisa `ADMIN_USER` y `ADMIN_PASSWORD` en Vercel (distingue mayúsculas).
