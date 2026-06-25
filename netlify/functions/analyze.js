// netlify/functions/analyze.js
// Recibe texto extraído del PDF y lo analiza con OpenRouter con fallback automático.

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

const SYSTEM_PROMPT = `Sos un contador público con 20 años de experiencia explicando balances a dueños de PyMEs y empresas que no tienen formación contable. Tu trabajo es traducir el lenguaje técnico contable a español claro, directo y sin jerga.

Siempre respondés ÚNICAMENTE con un objeto JSON válido, sin markdown, sin texto extra antes o después. El JSON tiene exactamente esta estructura:

{
  "alerts": [
    {
      "name": "Liquidez corriente",
      "value": "1.8x",
      "status": "ok|warn|danger",
      "label": "SALUDABLE|ATENCIÓN|CRÍTICO",
      "description": "Explicación en una oración, para alguien sin formación contable."
    }
  ],
  "summary": "Párrafo de 3-5 oraciones explicando la situación general de la empresa en lenguaje simple. Empezá con lo más importante. Sin tecnicismos.",
  "highlights": ["punto positivo 1", "punto positivo 2"],
  "concerns": ["preocupación 1", "preocupación 2"],
  "recommendations": ["recomendación accionable 1", "recomendación accionable 2", "recomendación accionable 3"]
}

Incluí entre 3 y 5 alertas. Cubrí: liquidez, endeudamiento, rentabilidad, capital de trabajo, y cualquier otra métrica relevante. Si no podés calcular una métrica, omitila. Los valores en "value" deben ser números concretos. El lenguaje debe ser el de un buen amigo contador, no el de un informe técnico.`;

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
      max_tokens: 1500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analizá este balance y generá el JSON con el diagnóstico para el dueño de la empresa.\n\nCONTENIDO DEL BALANCE:\n${pdfText}`,
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

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Método no permitido." }) };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "API key no configurada en el servidor." }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Body inválido." }) };
  }

  const { pdfText, preferredModel } = body;

  if (!pdfText || pdfText.trim().length < 50) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "No se pudo extraer texto del PDF. Asegurate de que el PDF tenga texto seleccionable (no sea una imagen escaneada sin OCR)." }),
    };
  }

  // Truncate to avoid token limits (keep first 12000 chars ~3000 tokens)
  const truncated = pdfText.slice(0, 12000);

  const startModel = preferredModel && ALL_MODELS.includes(preferredModel)
    ? preferredModel
    : FREE_MODELS[0];

  const queue = [startModel, ...ALL_MODELS.filter((m) => m !== startModel)];

  let lastError = "";
  for (const model of queue) {
    try {
      const { text, model: usedModel } = await callOpenRouter(apiKey, model, truncated);

      const clean = text.replace(/```json|```/g, "").trim();
      const result = JSON.parse(clean);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ result, modelUsed: usedModel }),
      };
    } catch (err) {
      lastError = err.message;
      console.warn(`Model ${model} failed: ${err.message} — trying next...`);
    }
  }

  return {
    statusCode: 502,
    headers,
    body: JSON.stringify({
      error: `No se pudo obtener análisis con ningún modelo disponible. Último error: ${lastError}`,
    }),
  };
};
