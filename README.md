# BalanceSimple 📊

> **Análisis financiero de renta variable, con criterio de analista buy-side, en segundos.**

Herramienta web que usa inteligencia artificial para leer los estados financieros de una empresa cotizante (10-K, 20-F, reporte anual o earnings release) y devolver un diagnóstico de inversión claro: salud financiera, calidad de resultados, alertas críticas y una recomendación concreta de comprar, mantener o vender.

---

## ¿Qué problema resuelve?

Leer un balance, un estado de resultados o un 10-K requiere formación técnica que la mayoría de los inversores minoristas no tiene. Esto genera decisiones de inversión basadas en intuición o en opiniones de terceros, en lugar de en el análisis directo de los fundamentos de la empresa.

**BalanceSimple** democratiza el acceso a un primer nivel de análisis fundamental: el inversor sube el reporte financiero en PDF y recibe, en segundos, un diagnóstico con análisis fundamental, valuación relativa, salud financiera, calidad de resultados, alertas de riesgo y un plan de acción.

Funciona con estados financieros de cualquier empresa cotizante en cualquier bolsa del mundo, bajo US GAAP, IFRS o GAAP local.

---

## ¿Cómo funciona?

```
Usuario sube PDF → PDF.js extrae el texto en el navegador →
Netlify Function envía el texto a OpenRouter → el modelo de IA analiza
y devuelve JSON estructurado → la app renderiza el diagnóstico visual
```

1. El usuario elige un modelo de IA y sube el PDF del reporte financiero.
2. PDF.js extrae el texto del documento directamente en el navegador (el archivo nunca sale del dispositivo del usuario).
3. El texto se envía a una Netlify Function (`analyze.js`), que contiene el prompt de sistema y reenvía la solicitud a OpenRouter.
4. Si el modelo elegido no está disponible, el backend reintenta automáticamente con hasta 8 modelos distintos.
5. La app muestra el diagnóstico: alertas de semáforo, evolución interanual, calidad de resultados, alertas críticas, plan de acción y conclusión de inversión.

---

## Qué genera el análisis

- **Alertas de semáforo** (6 a 8) — Fundamentales, salud financiera, calidad de resultados y momentum/valuación, cada una con valor actual, valor anterior, variación y estado (saludable / atención / crítico).
- **Panorama general y evolución interanual** — Diagnóstico narrativo con cifras concretas y comparación contra el período anterior.
- **Calidad de resultados** — Evaluación de divergencias GAAP vs. non-GAAP, compensación en acciones (SBC) y accruals.
- **Alertas críticas** — Detección automática de hasta 13 condiciones de riesgo específicas (ej. cobertura de intereses < 2x, SBC > 10% de ingresos, Deuda neta/EBITDA > 4x).
- **Plan de acción** — Recomendaciones para el inversor ordenadas por plazo (Inmediato / 30 días / 90 días / 6 meses).
- **Conclusión** — Tesis de inversión directa: comprar, mantener o vender.

---

## Herramientas de IA utilizadas

| Herramienta | Uso |
|-------------|-----|
| **Claude.ai** (Anthropic) | Ideación del proyecto, diseño del prompt de sistema y generación del código mediante Vibe Coding |
| **OpenRouter** | Enrutamiento de las solicitudes de análisis hacia el modelo elegido por el usuario, con fallback automático entre modelos |
| **Gemini 2.0 Flash / Llama 3.3 70B** (gratuitos) y **Claude Sonnet 4.5 / GPT-4o** (de pago) | Modelos disponibles para el análisis, seleccionables por el usuario |
| **PDF.js** (Mozilla) | Extracción de texto del PDF directamente en el navegador, sin subir el archivo original a ningún servidor |
| **Netlify Functions** | Backend serverless que protege la API key de OpenRouter y nunca la expone en el cliente |

---

## Estructura del repositorio

```
balancesimple/
├── balance-simple.html          # Frontend (HTML + CSS + JS en un solo archivo)
├── netlify/
│   └── functions/
│       └── analyze.js           # Backend serverless: prompt de sistema + llamada a OpenRouter
└── README.md                    # Este archivo
```

---

## Cómo usar la app

### Opción A — Versión desplegada (recomendada)

Accedé a la app en: **https://stupendous-jalebi-a78dd2.netlify.app/**

### Opción B — Correr el proyecto propio

1. Cloná este repositorio.
2. Desplegalo en Netlify (o ejecutá `netlify dev` localmente).
3. Configurá la variable de entorno `OPENROUTER_API_KEY` en Netlify con tu API key de [OpenRouter](https://openrouter.ai).
4. Abrí la app, elegí un modelo, subí un PDF con texto seleccionable y hacé click en **Analizar Reporte Financiero →**.

> La API key nunca se expone en el navegador: vive únicamente como variable de entorno del lado del servidor (Netlify Function).

---

## Limitaciones conocidas

- Solo procesa PDFs con texto seleccionable (no funciona con reportes escaneados sin OCR).
- No tiene acceso a datos de mercado en tiempo real (cotización, capitalización); los ratios de valuación solo se calculan si esos datos figuran en el propio documento.
- El análisis es estático: no compara automáticamente con pares sectoriales.
- El análisis es orientativo y no reemplaza el criterio de un analista financiero matriculado.

---

## Contexto académico

Este proyecto fue desarrollado como **Trabajo Final Integrador** de la:

> **Diplomatura en IA Aplicada a Entornos Digitales de Gestión**
> FCE-UBA · Cohorte 2026

---

## Disclaimer

El análisis generado por esta herramienta es orientativo y fue producido por inteligencia artificial. No constituye asesoramiento financiero ni recomendación de inversión. Las decisiones de inversión implican riesgos. Consultá siempre a un asesor financiero matriculado antes de tomar decisiones de compra o venta de activos.
