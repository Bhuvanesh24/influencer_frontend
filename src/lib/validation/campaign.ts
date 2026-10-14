import { z } from 'zod';

const money = (label: string) =>
  z
    .string()
    .min(1, `Enter the ${label}`)
    .refine((v) => Number(v) > 0, `Enter the ${label}`);

/**
 * Create Campaign form — mirrors the backend's `createCampaignSchema` (a discriminated union on
 * `type`), flattened so one react-hook-form instance can hold both paths; the refinements apply
 * each type's required fields.
 */
export const campaignFormSchema = z
  .object({
    type: z.enum(['BrandInvite', 'OpenApplication']),
    name: z.string().trim().min(3, 'At least 3 characters').max(255),
    brief: z.string().trim().min(10, 'At least 10 characters').max(5000),
    productDescription: z.string().max(2000),
    contentType: z.string().min(1, 'Pick a content type'),
    targetNiches: z.array(z.string()),
    targetLanguages: z.array(z.string()),
    hashtags: z.array(z.string()),
    postingDeadline: z.date({ message: 'Pick a posting deadline' }),
    negotiationAllowed: z.boolean(),
    requiresDraftApproval: z.boolean(),
    // Brand-Invite
    totalBudget: z.string(),
    targetInfluencerCount: z.string(),
    // Open Application
    budgetPerCreator: z.string(),
    maxCreators: z.string(),
    applicationDeadline: z.date().nullable(),
    minFollowerCount: z.string(),
    minEngagementRate: z.string(),
    autoAccept: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const require = (ok: boolean, path: string, message: string) => {
      if (!ok) ctx.addIssue({ code: 'custom', path: [path], message });
    };
    require(v.postingDeadline.getTime() > Date.now(), 'postingDeadline', 'Pick a date in the future');
    if (v.type === 'BrandInvite') {
      require(money('total budget').safeParse(v.totalBudget).success, 'totalBudget', 'Enter the total budget');
      require(Number(v.targetInfluencerCount) >= 1, 'targetInfluencerCount', 'At least 1 creator');
    } else {
      require(money('budget').safeParse(v.budgetPerCreator).success, 'budgetPerCreator', 'Enter the budget per creator');
      require(Number(v.maxCreators) >= 1, 'maxCreators', 'At least 1 creator');
      require(!!v.applicationDeadline && v.applicationDeadline.getTime() > Date.now(), 'applicationDeadline', 'Pick a date in the future');
      require(
        !v.applicationDeadline || v.applicationDeadline.getTime() <= v.postingDeadline.getTime(),
        'applicationDeadline',
        'Applications should close before the posting deadline',
      );
      require(v.minEngagementRate === '' || (Number(v.minEngagementRate) >= 0 && Number(v.minEngagementRate) <= 100), 'minEngagementRate', 'A percentage from 0 to 100');
    }
  });

export type CampaignFormInput = z.infer<typeof campaignFormSchema>;
