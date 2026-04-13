import { BusinessCategory } from '@/types';

interface GenerateDescriptionParams {
  productName: string;
  price: number;
  currency: string;
  category: BusinessCategory;
  businessName: string;
}

export async function generateProductDescription(
  params: GenerateDescriptionParams
): Promise<string> {
  const { productName, price, currency, category, businessName } = params;

  const prompt = `${productName} - negocio: ${businessName} (${category}) - precio: ${price} ${currency}`;

  const response = await fetch('/api/ai/describe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Error al generar descripción');
  }

  const data = await response.json();
  return data.description || '';
}

export async function generateBusinessDescription(
  businessName: string,
  category: BusinessCategory
): Promise<string> {
  const response = await fetch('/api/ai/describe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `Negocio llamado "${businessName}" de categoría ${category}`,
    }),
  });
  if (!response.ok) throw new Error('Error al generar descripción');
  const data = await response.json();
  return data.description || '';
}
