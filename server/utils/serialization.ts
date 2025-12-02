/**
 * Utilitários para serialização de dados para tRPC
 * Converte objetos Date para strings ISO para evitar erros de serialização
 */

/**
 * Serializa recursivamente todos os objetos Date em um objeto/array
 */
export function serializeDates<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Se for um Date, converter para ISO string
  if (data instanceof Date) {
    return data.toISOString() as T;
  }

  // Se for um array, serializar cada item
  if (Array.isArray(data)) {
    return data.map(item => serializeDates(item)) as T;
  }

  // Se for um objeto, serializar cada propriedade
  if (typeof data === "object") {
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeDates(value);
    }
    return serialized as T;
  }

  // Para outros tipos (string, number, boolean, etc), retornar como está
  return data;
}



