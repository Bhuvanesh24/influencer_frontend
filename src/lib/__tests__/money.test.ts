import { formatMoney } from '@/lib/money';

describe('formatMoney', () => {
  it('formats a Decimal string without trailing zero paise', () => {
    expect(formatMoney('4500.00')).toBe('₹4,500');
  });

  it('uses Indian digit grouping', () => {
    expect(formatMoney('1250000')).toBe('₹12,50,000');
  });

  it('keeps paise when they are not zero', () => {
    expect(formatMoney('99.5')).toBe('₹99.50');
  });

  it('accepts a number', () => {
    expect(formatMoney(0)).toBe('₹0');
  });

  it('falls back to zero for missing or unparseable input', () => {
    expect(formatMoney(null)).toBe('₹0');
    expect(formatMoney('abc')).toBe('₹0');
  });
});
