# Guía de Despliegue - copymac-convertio

Esta guía te ayudará a subir el proyecto a GitHub y desplegarlo en Vercel.

## 📋 Prerrequisitos

- Cuenta de GitHub
- Cuenta de Vercel (puedes usar tu cuenta de GitHub para iniciar sesión)
- Git instalado en tu computadora

## 🔧 Paso 1: Inicializar Git y Conectar con GitHub

### 1.1 Inicializar el repositorio local

Abre una terminal en el directorio del proyecto y ejecuta:

```bash
git init
git add .
git commit -m "Initial commit: copymac-convertio image converter"
```

### 1.2 Crear un repositorio en GitHub

1. Ve a [GitHub](https://github.com)
2. Haz clic en "New repository" (botón verde)
3. Nombra tu repositorio (ejemplo: `copymac-convertio`)
4. **NO inicialices** con README, .gitignore o licencia (ya los tenemos)
5. Haz clic en "Create repository"

### 1.3 Conectar tu repositorio local con GitHub

GitHub te mostrará los comandos necesarios. Ejecuta:

```bash
git remote add origin https://github.com/TU_USUARIO/copymac-convertio.git
git branch -M main
git push -u origin main
```

Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub.

## 🚀 Paso 2: Desplegar en Vercel

### Opción A: Desde el Dashboard de Vercel (Recomendado)

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "Add New Project"
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente que es un proyecto Next.js
5. **No necesitas cambiar ninguna configuración** (usa los valores por defecto)
6. Haz clic en "Deploy"

### Opción B: Desde la Terminal con Vercel CLI

```bash
# Instalar Vercel CLI (solo la primera vez)
npm install -g vercel

# Desplegar
vercel

# Para desplegar a producción
vercel --prod
```

## ⚠️ Importante para Producción

### Almacenamiento de Archivos

El sistema actual guarda archivos en `public/uploads`, lo cual funciona en desarrollo pero **NO en Vercel**, ya que Vercel usa un sistema de archivos de solo lectura.

Para producción, tienes dos opciones:

#### Opción 1: Vercel Blob Storage (Recomendado)

1. Instala el paquete:
```bash
npm install @vercel/blob
```

2. Actualiza `app/api/convert/route.js` y `app/api/upscale/route.js` para usar Vercel Blob:

```javascript
import { put } from '@vercel/blob';

// En lugar de writeFile, usa:
const blob = await put(filename, outputBuffer, {
  access: 'public',
  addRandomSuffix: false,
});

return NextResponse.json({
  url: blob.url,
  // ...
});
```

3. Los archivos se eliminarán automáticamente después de 24h si configuras lifecy policies en Vercel.

#### Opción 2: AWS S3

Si prefieres usar S3, necesitarás:

```bash
npm install @aws-sdk/client-s3
```

Y configurar las credenciales en Vercel como variables de entorno.

### Variables de Entorno en Vercel

Si decides usar servicios externos (IA, S3, etc.):

1. En tu proyecto en Vercel, ve a "Settings" > "Environment Variables"
2. Agrega las variables necesarias:
   - `REPLICATE_API_TOKEN` (para IA upscaling)
   - `AWS_ACCESS_KEY_ID` (para S3)
   - Etc.

## 🔄 Actualizaciones Futuras

Cada vez que hagas cambios:

```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

Vercel desplegará automáticamente los cambios.

## 🧪 Testing Local antes de Desplegar

Siempre prueba localmente primero:

```bash
# Desarrollo
npm run dev

# Build de producción local
npm run build
npm start
```

## 📌 Checklist Final

Antes de desplegar a producción:

- [ ] Código funciona localmente
- [ ] `.gitignore` está configurado correctamente
- [ ] Decidiste qué usar para almacenamiento (Local/Vercel Blob/S3)
- [ ] Variables de entorno configuradas en Vercel
- [ ] Build de producción ejecutado sin errores
- [ ] README.md actualizado con información del proyecto

## 🆘 Troubleshooting

### Error: "Failed to write file"
- Vercel usa filesystem de solo lectura
- Solución: Implementa Vercel Blob o S3

### Error: "Module not found: sharp"
- Vercel debería instalar sharp automáticamente
- Si falla, especifica la plataforma: `npm install --platform=linux --arch=x64 sharp`

### Los archivos no se eliminan después de 24h
- El cleanup actual es "lazy" (se ejecuta cuando hay nuevas conversiones)
- Para producción, usa Vercel Cron Jobs o AWS Lambda scheduled events

## 📚 Recursos Adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Vercel](https://vercel.com/docs)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [Sharp para Vercel](https://github.com/lovell/sharp/issues/3654)

---

**¡Listo!** Tu aplicación estará disponible en `https://tu-proyecto.vercel.app`
