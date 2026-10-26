import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const BRAZILIAN_AREA_CODES = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99',
]);

export function normalizeBrazilianPhone(value: string): string | null {
  const input = value.trim();
  if (!input || !/^\+?[\d\s().-]+$/.test(input)) {
    return null;
  }

  let digits = input.replace(/\D/g, '');
  if (
    (input.startsWith('+') && digits.startsWith('55')) ||
    (digits.length > 11 && digits.startsWith('55'))
  ) {
    digits = digits.slice(2);
  }

  if (digits.length !== 10 && digits.length !== 11) {
    return null;
  }

  const areaCode = digits.slice(0, 2);
  const subscriberNumber = digits.slice(2);
  const isMobile = subscriberNumber.length === 9 && subscriberNumber.startsWith('9');
  const isLandline =
    subscriberNumber.length === 8 && /^[2-5]/.test(subscriberNumber);

  if (!BRAZILIAN_AREA_CODES.has(areaCode) || (!isMobile && !isLandline)) {
    return null;
  }

  return `+55${digits}`;
}

export const brazilianPhoneValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null =>
  !control.value ||
  (typeof control.value === 'string' && normalizeBrazilianPhone(control.value) !== null)
    ? null
    : { brazilianPhone: true };
