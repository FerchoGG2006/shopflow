import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt requerido' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY no está definida en .env.local');
      return NextResponse.json({ error: 'Clave de IA no configurada en el servidor' }, { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          parts: [
            {
              text: `Eres un redactor experto en e-commerce para Latinoamérica. Genera una descripción corta (máximo 40 palabras), atractiva y persuasiva para un catálogo digital. No menciones el precio. Responde SOLO con la descripción, sin comillas.\n\nProducto: ${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API respondió con error:', JSON.stringify(data));
      return NextResponse.json(
        { error: data.error?.message || 'Error de la API de Gemini' },
        { status: response.status }
      );
    }

    const description =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return NextResponse.json({ description });
  } catch (error: any) {
    console.error('Error interno en /api/ai/describe:', error.message);
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}
