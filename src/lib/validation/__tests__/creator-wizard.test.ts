import {
  firstPackageStepSchema,
  identityStepSchema,
  languagesNichesStepSchema,
  phoneStepSchema,
} from '@/lib/validation/creator-wizard';

describe('identityStepSchema', () => {
  it('rejects someone under 16', () => {
    const under16 = new Date();
    under16.setFullYear(under16.getFullYear() - 10);
    const result = identityStepSchema.safeParse({
      creatorTitle: 'Fitness Creator',
      bio: '',
      gender: 'female',
      dateOfBirth: under16,
    });
    expect(result.success).toBe(false);
  });

  it('accepts a 20-year-old', () => {
    const twenty = new Date();
    twenty.setFullYear(twenty.getFullYear() - 20);
    const result = identityStepSchema.safeParse({
      creatorTitle: 'Fitness Creator',
      bio: 'I make fitness content',
      gender: 'female',
      dateOfBirth: twenty,
    });
    expect(result.success).toBe(true);
  });
});

describe('languagesNichesStepSchema', () => {
  it('rejects more than 5 niches', () => {
    const result = languagesNichesStepSchema.safeParse({
      languages: ['Hindi'],
      niches: ['Fashion', 'Beauty', 'Fitness', 'Food', 'Travel', 'Technology'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts up to 5 niches', () => {
    const result = languagesNichesStepSchema.safeParse({
      languages: ['Hindi'],
      niches: ['Fashion', 'Beauty', 'Fitness', 'Food', 'Travel'],
    });
    expect(result.success).toBe(true);
  });
});

describe('phoneStepSchema', () => {
  it('rejects a number not starting with 6-9', () => {
    expect(phoneStepSchema.safeParse({ phone: '1234567890' }).success).toBe(false);
  });

  it('accepts a valid Indian mobile number', () => {
    expect(phoneStepSchema.safeParse({ phone: '9876543210' }).success).toBe(true);
  });
});

describe('firstPackageStepSchema', () => {
  it('rejects a zero price', () => {
    const result = firstPackageStepSchema.safeParse({
      title: 'Reel',
      contentType: 'reel',
      quantity: 1,
      price: '0',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid package', () => {
    const result = firstPackageStepSchema.safeParse({
      title: 'Reel',
      contentType: 'reel',
      quantity: 1,
      price: '5000',
    });
    expect(result.success).toBe(true);
  });
});
