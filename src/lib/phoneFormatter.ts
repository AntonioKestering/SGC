/**
 * Formata um número de telefone para o padrão (00) 00000-0000
 * @param phone - Número de telefone sem formatação (apenas dígitos)
 * @returns Telefone formatado ou string vazia se inválido
 */
export function formatPhone(phone?: string): string {
  if (!phone) return '';
  
  // Remove tudo que não é dígito
  const digits = phone.replace(/\D/g, '');
  
  // Se não tiver 11 dígitos, retorna como está
  if (digits.length !== 11) return phone;
  
  // Formata como (00) 00000-0000
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
