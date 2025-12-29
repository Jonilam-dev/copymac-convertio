# Image Converter Pro - copymac-convertio

Herramienta profesional para convertir imágenes sin límites. Soporta múltiples formatos y ofrece ampliación con IA.

## 🚀 Características

- ✨ **Conversión Universal**: WEBP, PNG, JPG, GIF, AVIF, TIFF
- 🎨 **Sin Restricciones**: Sube todas las imágenes que necesites
- 🤖 **Ampliación con IA**: Escala imágenes 2x o 4x con mejor calidad
- 🌓 **Tema Dark/Light**: Cambia entre modo claro y oscuro
- 🔒 **Privacidad**: Los archivos se eliminan automáticamente después de 24 horas
- ⚡ **Procesamiento local**: Conversión rápida en el servidor

## 📦 Instalación

```bash
# Clonar el repositorio
git clone <tu-repo-url>
cd CopyImagen

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🛠️ Tecnologías

- **Next.js 14** - Framework React
- **Sharp** - Procesamiento de imágenes de alto rendimiento
- **Lucide React** - Iconos modernos
- **Tailwind CSS** - Estilos (integrado en globals.css)

## 🌐 Despliegue en Vercel

1. Sube tu código a GitHub
2. Importa el proyecto en Vercel
3. Vercel detectará automáticamente Next.js
4. Despliega

**Nota**: Para producción en Vercel, considera usar almacenamiento externo (Vercel Blob, AWS S3) en lugar del sistema de archivos local, ya que Vercel usa sistemas de archivos efímeros.

## 🤖 Integración de IA para Upscaling

El endpoint `/api/upscale` está preparado para integrar servicios de IA. Actualmente usa resize de alta calidad con Sharp.

### Para mejorar con IA real:

**Opción 1: Replicate (Real-ESRGAN)**
```bash
npm install replicate
```

Agrega a `.env.local`:
```
REPLICATE_API_TOKEN=tu_token_aqui
```

**Opción 2: Stability AI**
Similar configuración con su API

**Opción 3: Modelo personalizado**
Despliega tu propio modelo Real-ESRGAN en un servidor GPU

## 📝 Variables de Entorno

Crea un archivo `.env.local` en la raíz:

```env
# Para AI Upscaling (opcional)
REPLICATE_API_TOKEN=your_token_here

# Para almacenamiento en producción (opcional)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_BUCKET_NAME=your_bucket
```

## 🗂️ Estructura del Proyecto

```
CopyImagen/
├── app/
│   ├── api/
│   │   ├── convert/
│   │   │   └── route.js      # API de conversión
│   │   └── upscale/
│   │       └── route.js      # API de ampliación IA
│   ├── globals.css           # Estilos globales
│   ├── layout.jsx            # Layout principal
│   └── page.jsx              # Página principal
├── public/
│   └── uploads/              # Archivos temporales (24h)
├── next.config.js
├── package.json
└── README.md
```

## ⚙️ Scripts

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm start` - Servidor de producción
- `npm run lint` - Linter

## 🔐 Seguridad y Privacidad

- Los archivos se almacenan temporalmente en el servidor
- Sistema de limpieza automática elimina archivos después de 24 horas
- No se almacena información del usuario
- Procesamiento del lado del servidor para mayor seguridad

## 📄 Licencia

Uso interno - Todos los derechos reservados

## 🤝 Contribuir

Este es un proyecto interno. Para sugerencias o problemas, contacta al equipo de desarrollo.
