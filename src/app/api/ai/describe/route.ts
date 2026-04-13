import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt requerido' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY no está definida en .env.local');
      return NextResponse.json({ error: 'Clave de Anthropic no configurada' }, { status: 500 });
    }

    const systemInstruction = `Eres un redactor experto en e-commerce para Latinoamerica. 
Recibirás información de un producto (nombre, negocio, categoría, precio).
Tu tarea es generar una descripción corta (máximo 40 palabras), atractiva y persuasiva para un catálogo digital.
Sigue estas reglas:
- Tono cercano y profesional.
- Enfócate en el beneficio.
- NO menciones el precio en la descripción.
- NO uses comillas ni introducciones como "Aquí tienes...".
- Responde SOLO con el texto de la descripción.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 250,
        system: systemInstruction,
        messages: [
          { role: 'user', content: `Genera la descripción para: ${prompt}` }
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API respondió con error:', JSON.stringify(data));
      return NextResponse.json(
        { error: data.error?.message || 'Error de la API de Anthropic' },
        { status: response.status }
      );
    }

    const description = data.content?.[0]?.text?.trim() || '';

    return NextResponse.json({ description });
  } catch (error: any) {
    console.error('Error interno en /api/ai/describe:', error.message);
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}
