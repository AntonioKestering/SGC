// src/lib/dateTimeFormatter.ts

/**
 * Converte uma string ISO 8601 para formato datetime-local (YYYY-MM-DDTHH:mm)
 * Necessário para inputs de tipo datetime-local no HTML5
 */
export function convertToDatetimeLocal(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Formata uma data para exibição em pt-BR
 */
export function formatDatePtBR(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

/**
 * Formata uma hora para exibição em pt-BR
 */
export function formatTimePtBR(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formata data e hora completas para exibição em pt-BR
 */
export function formatDateTimePtBR(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
