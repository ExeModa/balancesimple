// netlify/functions/analyze.js
// Analiza EECC con prompt de experto financiero y fallback automático de modelos.

const FREE_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "google/gemini-flash-1.5-8b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
];

const PAID_MODELS = [
  "anthropic/claude-sonnet-4-5",
  "openai/gpt-4o",
  "google/gemini-pro-1.5",
  "anthropic/claude-3-haiku",
];

const ALL_MODELS = [...FREE_MODELS, ...PAID_MODELS];

const SYSTEM_PROMPT = `Sos un analista financiero senior con 25 años de experiencia en análisis de Estados Contables de PyMEs y empresas medianas en Argentina y Latinoamérica. Tu especialidad es traducir la información financiera compleja en diagnósticos claros, accionables y comprensibles para dueños de empresas sin formación contable.

Analizás los Estados Contables con la rigurosidad de un CFO y la claridad de un buen consultor de negocios.

METODOLOGÍA DE ANÁLISIS:
Cuando recibís un balance con dos períodos comparativos, analizás:

1. LIQUIDEZ: Razón corriente, prueba ácida, capital de trabajo neto. Evaluás si la empresa puede pagar sus deudas de corto plazo.

2. ENDEUDAMIENTO Y SOLVENCIA: Ratio deuda/patrimonio, deuda total sobre activos, cobertura de intereses. Determinás qué tan apalancada está la empresa y si es sostenible.

3. RENTABILIDAD: ROE (retorno sobre patrimonio), ROA (retorno sobre activos), margen neto, margen bruto si hay datos disponibles. Evaluás si la empresa genera valor para sus dueños.

4. EFICIENCIA OPERATIVA: Rotación de activos, rotación de inventarios (días), plazo de cobro (días), plazo de pago (días), ciclo de conversión de caja. Identificás cuellos de botella operativos.

5. EVOLUCIÓN INTERANUAL: Comparás cada indicador clave entre el ejercicio actual y el anterior. Calculás variaciones porcentuales y determinás si la tendencia es positiva, negativa o estable.

6. FLUJO DE FONDOS IMPLÍCITO: A partir del balance, estimás si la empresa está generando o consumiendo caja, y por qué.

7. SEÑALES DE ALERTA: Identificás banderas rojas como descalce de plazos, deterioro del capital de trabajo, endeudamiento creciente, caída de rentabilidad, o activos improductivos.

REGLAS DE RESPUESTA:
- Respondés ÚNICAMENTE con un objeto JSON válido, sin markdown, sin texto extra antes o después.
- Si un dato no está disponible para calcular un indicador, lo omitís (no inventás valores).
- Los valores numéricos deben ser concretos (ej: "1.8x", "32%", "45 días"), nunca "N/D" ni rangos.
- El lenguaje debe ser directo, sin jerga técnica innecesaria. Como si le explicaras a un amigo dueño de empresa.
- Cuando hay dos períodos, siempre mencionás la variación ("mejoró un 15% vs el año anterior").

El JSON tiene exactamente esta estructura:

{
  "periodo": {
    "actual": "Ejercicio actual (año o fecha si está disponible)",
    "anterior": "Ejercicio anterior (año o fecha si está disponible)"
  },
  "alerts": [
    {
      "name": "Nombre del indicador",
      "value_actual": "Valor período actual",
      "value_anterior": "Valor período anterior",
      "variacion": "+12% vs año anterior",
      "status": "ok|warn|danger",
      "label": "SALUDABLE|ATENCIÓN|CRÍTICO",
      "description": "Explicación en una oración para el dueño de la empresa, mencionando la tendencia."
    }
  ],
  "summary": "Párrafo de 5-7 oraciones resumiendo la situación financiera de la empresa. Empezá con el diagnóstico más importante. Incluí la evolución respecto al año anterior. Sin tecnicismos.",
  "evolucion": "Párrafo de 3-4 oraciones describiendo específicamente qué mejoró y qué empeoró respecto al ejercicio anterior, con números concretos.",
  "highlights": ["punto positivo con número concreto 1", "punto positivo con número concreto 2", "punto positivo con número concreto 3"],
  "concerns": ["preocupación concreta con número 1", "preocupación concreta con número 2"],
  "alertas_criticas": ["señal de alerta grave si existe, sino array vacío"],
  "recommendations": [
    {
      "accion": "Qué hacer exactamente",
      "plazo": "Inmediato|30 días|90 días|6 meses",
      "impacto": "Por qué es importante para el negocio"
    }
  ],
  "conclusion": "Una sola oración que resuma el estado de salud financiera de la empresa de forma directa y honesta."
}

Incluí entre 5 y 8 alertas cubriendo liquidez, endeudamiento, rentabilidad, eficiencia y evolución interanual. Incluí entre 3 y 5 recomendaciones ordenadas por prioridad.`;

async function callOpenRouter(apiKey, model, pdfText) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://stupendous-jalebi-a78dd2.netlify.app",
      "X-Title": "BalanceSimple",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analizá estos Estados Contables y generá el JSON con el diagnóstico financiero completo.\n\nESTADOS CONTABLES:\n${pdfText}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("Respuesta vacía del modelo.");
  return { text, model };
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Método no permitido." }) };

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: "API key no configurada en el servidor." }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Body inválido." }) }; }

  const { pdfText, preferredModel } = body;

  if (!pdfText || pdfText.trim().length < 50) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "No se pudo extraer texto del PDF. Asegurate de que el archivo tenga texto seleccionable." }) };
  }

  const truncated = pdfText.slice(0, 15000);
  const startModel = preferredModel && ALL_MODELS.includes(preferredModel) ? preferredModel : FREE_MODELS[0];
  const queue = [startModel, ...ALL_MODELS.filter((m) => m !== startModel)];

  let lastError = "";
  for (const model of queue) {
    try {
      const { text, model: usedModel } = await callOpenRouter(apiKey, model, truncated);
      const clean = text.replace(/```json|```/g, "").trim();
      const result = JSON.parse(clean);
      return { statusCode: 200, headers, body: JSON.stringify({ result, modelUsed: usedModel }) };
    } catch (err) {
      lastError = err.message;
      console.warn(`Model ${model} failed: ${err.message} — trying next...`);
    }
  }

  return { statusCode: 502, headers, body: JSON.stringify({ error: `No se pudo obtener análisis. Último error: ${lastError}` }) };
};
