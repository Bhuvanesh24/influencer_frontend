import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from '@/lib/validation/auth';

describe('loginSchema', () => {
  it('accepts a valid email/password pair', () => {
    const result = loginSchema.safeParse({ email: 'brand@example.com', password: 'anything' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'anything' });
    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('rejects an empty email', () => {
    const result = forgotPasswordSchema.safeParse({ email: '' });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('rejects a password under 8 characters', () => {
    const result = resetPasswordSchema.safeParse({ password: 'a1', confirmPassword: 'a1' });
    expect(result.success).toBe(false);
  });

  it('rejects a password without a digit', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'longenough',
      confirmPassword: 'longenough',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'longenough1',
      confirmPassword: 'longenough2',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid, matching password', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'longenough1',
      confirmPassword: 'longenough1',
    });
    expect(result.success).toBe(true);
  });
});
