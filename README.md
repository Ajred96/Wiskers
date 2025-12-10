# 🐾 Wiskers — Videojuego 2D en Phaser 3
Wiskers es un videojuego 2D desarrollado con **Phaser 3** y empaquetado con **Vite**. Este documento explica cómo clonar el proyecto, instalar dependencias y ejecutar el juego correctamente.

## 🚀 1. Requisitos previos
Antes de ejecutar el proyecto, asegúrese de tener instalado:
- **Node.js** (versión recomendada: 18 o superior)
- **npm** (incluido con Node)
- Un navegador moderno (Chrome, Firefox, Edge, etc.)

Verificar instalación:
```bash
node -v
npm -v
```

## 📥 2. Clonar el repositorio
Clone el repositorio con:
```bash
git clone git@github.com:Ajred96/Wiskers.git
```

Entre al directorio del proyecto:
```bash
cd Wiskers
```

## 📦 3. Instalar dependencias
Ejecute:
```bash
npm install
```

Esto instalará paquetes esenciales como Phaser y Vite.

## ▶️ 4. Ejecutar el juego en modo desarrollo
Ejecute:
```bash
npm run dev
```

La terminal mostrará algo como:
```
VITE vX.X.X ready in XXX ms
➜ Local: http://localhost:5173/
```

Abra la URL mostrada y el juego iniciará automáticamente.  
Si aparece otro puerto (5174, 5175, etc.), simplemente entre a ese.

## 🛠️ 5. Compilar el proyecto (opcional)
Para generar la versión optimizada:
```bash
npm run build
```

Esto creará la carpeta:
```
/dist
```

Para previsualizarla:
```bash
npm run preview
```

## 📁 6. Estructura del proyecto
```
Wiskers/
│
├── index.html           # Archivo principal HTML
├── main.js              # Inicialización de Phaser y escenas
├── package.json         # Dependencias y scripts
│
├── public/              # Archivos estáticos
│
└── src/
    ├── assets/          # Imágenes, sprites, fondos
    ├── prefabs/         # Clases y objetos reutilizables
    ├── scenes/          # Escenas del juego (menú, nivel, etc.)
    └── systems/         # Lógica interna del juego
```

## 🎮 7. Controles del juego
- **Moverse**: Flechas del teclado (izquierda y derecha y abajo)
- **Saltar**: Barra espaciadora
- **Interactuar con la Escotilla**: Tecla E
- **Atacar**: Tecla X

## 🧩 8. Problemas comunes
- El juego no inicia al abrir `index.html` directamente; debe ejecutarse mediante Vite (`npm run dev`).
- Si el puerto está ocupado, Vite asignará otro automáticamente.
- Si no se reconoce el comando `npm`, Node.js no está instalado correctamente.

## ✅ 9. Información adicional
El proyecto funciona correctamente con Vite en modo desarrollo y producción.  
Se recomienda usar `npm run dev` para probar cambios en tiempo real.
