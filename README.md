# PAVEDIRT

Ciclocomputador para ruta y montaña — *Asfalto o tierra, vos decidís.*

## Estructura del Proyecto

- `index.html`: Landing page principal de PAVEDIRT con presentación del producto y taller autorizado.
- `marca.html`: Guía de identidad visual, tipografía, paleta de colores y componentes.
- `app/`: Aplicación Web Progresiva (PWA) del ciclocomputador:
  - `app/index.html`: Contenedor PWA con importmaps (React 18, Lucide React, Supabase).
  - `app/app.bundle.js`: Lógica del ciclocomputador (GPS, métricas, perfiles de bici y sensores).
  - `app/manifest.json` y `app/sw.js`: Configuración de Service Worker y funcionamiento offline.
- `profiles-setup.sql`: Script SQL para inicializar la tabla `profiles` con RLS en Supabase.
- `firebase.json` y `.firebaserc`: Configuración para despliegue en Firebase Hosting.

## Ejecución Local

Para probar la web y la PWA localmente:

```bash
npx serve .
```

Abre `http://localhost:3000` en tu navegador. Para abrir la app directamente visita `http://localhost:3000/app/`.

## Despliegue en Firebase Hosting

El proyecto está vinculado al proyecto de Firebase `pavedirt`:

```bash
npx firebase deploy --only hosting
```
