import { CartItem, Business } from '@/types';

export function formatCurrency(amount: number, currency: string): string {
  if (currency === 'COP') {
    return `$${amount.toLocaleString('es-CO')}`;
  }
  return new Intl.NumberFormat('es', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((s, i) => s + (i.product.price * i.quantity), 0);
}

export function calculateCartCount(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.quantity, 0);
}

export function buildWhatsAppMessage({
  business,
  items,
  customerName,
  deliveryType,
  deliveryAddress,
  paymentMethod,
  notes,
}: {
  business: Business;
  items: CartItem[];
  customerName: string;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  paymentMethod: 'cash' | 'transfer' | 'online';
  notes?: string;
}): string {
  const line = '────────────────────';
  const currency = business.currency || 'COP';
  const total = calculateCartTotal(items);

  let message = `*📦 NUEVO PEDIDO - ${business.name}*\n${line}\n\n`;

  message += `*Cliente:* ${customerName}\n`;
  message += `*Entrega:* ${deliveryType === 'delivery' ? '🚀 Domicilio' : '🏠 Recoger en local'}\n`;
  if (deliveryType === 'delivery' && deliveryAddress) {
    message += `*Dirección:* ${deliveryAddress}\n`;
  }
  
  const paymentLabels = { cash: '💵 Efectivo', transfer: '🏦 Transferencia', online: '💳 Pago en línea' };
  message += `*Pago:* ${paymentLabels[paymentMethod]}\n`;

  message += `\n*🛒 PRODUCTOS:*\n`;
  items.forEach(item => {
    message += `• ${item.quantity}x ${item.product.name} (_${formatCurrency(item.product.price, currency)}_)\n`;
  });

  message += `\n${line}\n`;
  message += `*TOTAL: ${formatCurrency(total, currency)}*\n`;
  message += `${line}\n`;

  if (notes) {
    message += `\n*Notas:*\n${notes}\n`;
  }

  message += `\n_Pedido generado por ShopFlow_`;

  return encodeURIComponent(message);
}

export function buildWhatsAppURL(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${message}`;
}
