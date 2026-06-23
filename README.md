# BalanceSimple 📊

> **Tu balance contable en palabras que cualquiera entiende.**

Herramienta web que usa inteligencia artificial para traducir un balance contable en lenguaje claro, accesible para dueños de PyMEs y empresas sin formación contable.

---

## ¿Qué problema resuelve?

La mayoría de los dueños de PyMEs reciben su balance una vez al año, no lo entienden, y lo archivan sin leerlo. Eso genera decisiones financieras sin información real.

**BalanceSimple** resuelve eso: el cliente sube su balance en PDF y recibe, en segundos, un diagnóstico en lenguaje simple con alertas de semáforo, un resumen de la situación de su empresa y recomendaciones concretas sobre qué hacer.

---

## ¿Cómo funciona?

```
Cliente sube PDF → Claude API lee y analiza → App muestra diagnóstico visual
```

1. El usuario arrastra o sube el PDF de su balance
2. La app lo envía a la API de Claude (modelo `claude-sonnet-4-6`)
3. La IA extrae métricas clave y genera el análisis en JSON estructurado
4. La app muestra los resultados con alertas visuales (verde / amarillo / rojo)

---

## Qué genera el análisis

- **Alertas de semáforo** — Liquidez corriente, endeudamiento, rentabilidad, capital de trabajo y otras métricas relevantes, cada una con estado (saludable / atención / crítico) y explicación en lenguaje simple
- **Panorama general** — Resumen de 3 a 5 oraciones explicando la situación de la empresa sin tecnicismos
- **Puntos fuertes y puntos a mejorar** — Lista clara de qué está funcionando bien y qué no
- **Qué hacer ahora** — Recomendaciones accionables para el dueño de la empresa

---

## Herramientas de IA utilizadas

| Herramienta | Uso |
|-------------|-----|
| **Claude API** (`claude-sonnet-4-6`) | Lectura del PDF, extracción de métricas y generación del análisis en lenguaje natural |
| **Claude.ai** | Ideación del proyecto, diseño de prompts y revisión de la lógica de análisis |

---

## Estructura del repositorio

```
balancesimple/
├── balance-simple.html   # Aplicación completa (HTML + CSS + JS en un solo archivo)
└── README.md             # Este archivo
```

La app es un único archivo HTML autocontenido. No requiere instalación ni dependencias externas.

---

## Cómo usar la app

### Opción A — Versión desplegada (recomendada)

Accedé a la app en: **https://stupendous-jalebi-a78dd2.netlify.app/**

> ⚠️ La app requiere una API key de Anthropic para funcionar. Si la usás desde el deploy propio, asegurate de tener configurada la autenticación.

### Opción B — Correr localmente

1. Descargá el archivo `balance-simple.html`
2. Abrilo en cualquier navegador moderno (Chrome, Firefox, Edge)
3. Subí un PDF de balance contable
4. Hacé click en **Analizar balance →**

> **Nota:** La app se conecta directamente a la API de Anthropic. Para uso en producción, se recomienda pasar las llamadas a la API por un backend propio para no exponer credenciales en el cliente.

---

## Limitaciones conocidas

- Solo procesa PDFs con texto seleccionable (no funciona con balances escaneados sin OCR)
- El análisis es orientativo y no reemplaza el criterio de un contador matriculado
- La precisión del análisis depende de la calidad y completitud del balance subido

---

## Contexto académico

Este proyecto fue desarrollado como **Trabajo Final Integrador** de la:

> **Diplomatura en IA Aplicada a Entornos Digitales de Gestión**
> FCE-UBA · Cohorte 2026

---

## Disclaimer

El análisis generado por esta herramienta es orientativo y fue producido por inteligencia artificial. No reemplaza el criterio de un contador público matriculado. Consultá siempre a tu profesional de confianza antes de tomar decisiones financieras.
