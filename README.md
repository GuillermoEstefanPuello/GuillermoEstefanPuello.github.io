# Guillermo Estefan Puello · Portafolio profesional

Portafolio estático de software, calidad y datos, con StarBound Software Factory y DEVGEP+ V9.

Sitio: https://guillermoestefanpuello.github.io/

HTML, CSS y JavaScript sin compilación ni dependencias de ejecución. Incluye doce proyectos con estado y procedencia visual diferenciados, veintitrés credenciales revisadas y diecinueve tecnologías con logos locales. Las imágenes DEMO, conceptuales y de prototipos no acreditan resultados reales ni funcionalidades implementadas.

## Desarrollo y pruebas

Puede abrirse index.html directamente o servirse con un servidor HTTP local. Las fuentes de Google preexistentes tienen alternativas locales; los logos y recursos gráficos se sirven desde este repositorio.

```powershell
python -B -m http.server 8769 --bind 127.0.0.1
node --test tests/portfolio.test.cjs tests/projects.test.cjs tests/technologies.test.cjs
```

El contador se actualiza diariamente mediante el workflow existente; conserva su fecha visible y no representa información en tiempo real. No ejecutar manualmente el actualizador durante una prueba de interfaz.

## Publicación

GitHub Pages utiliza main y la raíz del repositorio, con HTTPS. La auditoría de publicación se realiza sobre una lista explícita de archivos. Los originales, respaldos, manifiestos internos, rutas personales y evidencias temporales de QA permanecen fuera del repositorio público.

Licencias y procedencia de logos: [SOURCES](assets/technologies/SOURCES.md). Estado de release y recuperación: [PORTAFOLIO-GEP-009](docs/PORTAFOLIO-GEP-009.md).
