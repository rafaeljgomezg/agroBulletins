import { FormControl } from '@angular/forms';
import { brazilianPhoneValidator, normalizeBrazilianPhone } from './brazil-phone';

describe('Brazilian phone validation', () => {
  it('normalizes mobile numbers with Brazilian formatting and country code', () => {
    expect(normalizeBrazilianPhone('(11) 91234-5678')).toBe('+5511912345678');
    expect(normalizeBrazilianPhone('+55 (11) 91234-5678')).toBe('+5511912345678');
    expect(normalizeBrazilianPhone('55 11 91234 5678')).toBe('+5511912345678');
  });

  it('accepts a Brazilian landline and DDD 55 without mistaking it for the country code', () => {
    expect(normalizeBrazilianPhone('(21) 2345-6789')).toBe('+552123456789');
    expect(normalizeBrazilianPhone('(55) 99912-3456')).toBe('+5555999123456');
  });

  it('rejects invalid DDDs, international numbers, and malformed Brazilian numbers', () => {
    expect(normalizeBrazilianPhone('(20) 91234-5678')).toBeNull();
    expect(normalizeBrazilianPhone('+1 (415) 555-2671')).toBeNull();
    expect(normalizeBrazilianPhone('(11) 81234-5678')).toBeNull();
    expect(normalizeBrazilianPhone('abcdefghij')).toBeNull();
  });

  it('provides a form validation error for invalid numbers', () => {
    expect(brazilianPhoneValidator(new FormControl('(11) 91234-5678'))).toBeNull();
    expect(brazilianPhoneValidator(new FormControl('(20) 91234-5678'))).toEqual({
      brazilianPhone: true,
    });
    expect(brazilianPhoneValidator(new FormControl(''))).toBeNull();
  });
});
