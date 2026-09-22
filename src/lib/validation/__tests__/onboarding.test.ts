import { bankSetupSchema, roleSelectionSchema } from '@/lib/validation/onboarding';

describe('roleSelectionSchema', () => {
  it('rejects a display name under 2 characters', () => {
    const result = roleSelectionSchema.safeParse({ accountType: 'creator', displayName: 'A' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid creator selection', () => {
    const result = roleSelectionSchema.safeParse({ accountType: 'creator', displayName: 'Priya' });
    expect(result.success).toBe(true);
  });
});

const validBank = {
  accountHolderName: 'Priya Sharma',
  accountNumber: '123456789012',
  confirmAccountNumber: '123456789012',
  ifscCode: 'HDFC0001234',
  bankName: 'HDFC Bank',
  addUpi: false,
  upiId: '',
};

describe('bankSetupSchema', () => {
  it('accepts a fully valid submission with no UPI', () => {
    expect(bankSetupSchema.safeParse(validBank).success).toBe(true);
  });

  it('rejects a malformed IFSC code', () => {
    const result = bankSetupSchema.safeParse({ ...validBank, ifscCode: 'BADCODE' });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched account numbers', () => {
    const result = bankSetupSchema.safeParse({ ...validBank, confirmAccountNumber: '999999999999' });
    expect(result.success).toBe(false);
  });

  it('rejects addUpi=true with an empty UPI id', () => {
    const result = bankSetupSchema.safeParse({ ...validBank, addUpi: true, upiId: '' });
    expect(result.success).toBe(false);
  });

  it('accepts addUpi=true with a valid UPI id', () => {
    const result = bankSetupSchema.safeParse({ ...validBank, addUpi: true, upiId: 'priya@okhdfcbank' });
    expect(result.success).toBe(true);
  });
});
