/**
 * Formata CPF ou CNPJ baseado na quantidade de dígitos
 * CPF: XXX.XXX.XXX-XX (11 dígitos)
 * CNPJ: XX.XXX.XXX/XXXX-XX (14 dígitos)
 */
export function formatCpfCnpj(value?: string): string {
  if (!value) return '';

  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, '');

  // Se não tiver dígitos, retorna vazio
  if (digits.length === 0) return '';

  // CPF: 11 dígitos
  if (digits.length <= 11) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  // CNPJ: 14 dígitos
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/**
 * Remove formatação de CPF/CNPJ, retornando apenas dígitos
 */
export function removeCpfCnpjFormatting(value?: string): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Valida CPF com algoritmo de dígito verificador
 * @param cpf - CPF em qualquer formato (com ou sem formatação)
 * @returns true se CPF é válido
 */
export function isValidCpf(cpf?: string): boolean {
  if (!cpf) return false;

  const digits = cpf.replace(/\D/g, '');

  // Deve ter exatamente 11 dígitos
  if (digits.length !== 11) return false;

  // Rejeita sequências repetidas (00000000000, 11111111111, etc)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Calcula primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(digits[9]) !== firstDigit) return false;

  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(digits[10]) !== secondDigit) return false;

  return true;
}

/**
 * Valida CNPJ com algoritmo de dígito verificador
 * @param cnpj - CNPJ em qualquer formato (com ou sem formatação)
 * @returns true se CNPJ é válido
 */
export function isValidCnpj(cnpj?: string): boolean {
  if (!cnpj) return false;

  const digits = cnpj.replace(/\D/g, '');

  // Deve ter exatamente 14 dígitos
  if (digits.length !== 14) return false;

  // Rejeita sequências repetidas (00000000000000, 11111111111111, etc)
  if (/^(\d)\1{13}$/.test(digits)) return false;

  // Calcula primeiro dígito verificador
  let sum = 0;
  const multipliers1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * multipliers1[i];
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(digits[12]) !== firstDigit) return false;

  // Calcula segundo dígito verificador
  sum = 0;
  const multipliers2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * multipliers2[i];
  }
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(digits[13]) !== secondDigit) return false;

  return true;
}

/**
 * Valida CPF ou CNPJ automaticamente baseado na quantidade de dígitos
 */
export function isValidCpfOrCnpj(value?: string): boolean {
  if (!value) return false;

  const digits = value.replace(/\D/g, '');

  if (digits.length === 11) {
    return isValidCpf(digits);
  }

  if (digits.length === 14) {
    return isValidCnpj(digits);
  }

  return false;
}

/**
 * Retorna label apropriado baseado na quantidade de dígitos
 */
export function getCpfCnpjLabel(value?: string): string {
  if (!value) return 'CPF/CNPJ';

  const digits = value.replace(/\D/g, '');

  if (digits.length <= 11) {
    return 'CPF';
  }

  return 'CNPJ';
}
