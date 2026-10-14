import dayjs from 'dayjs';

import type { ContentType } from '@/lib/constants';
import type { DealStatus } from '@/lib/deal-status';
import type { TrustScore } from '@/lib/theme';

import {
  calcFees,
  emptyDb,
  money,
  type MockBrand,
  type MockCreator,
  type MockDb,
  type MockDeal,
  type MockPackage,
  type MockStatusLog,
} from './db';

/**
 * DEV-ONLY demo data. Every person, company, amount and conversation here is made up and is
 * only reachable in mock mode. Dates are relative to the moment the data is seeded.
 */

export const DEMO_PASSWORD = 'demo1234';

export const DEMO_ACCOUNTS = {
  creator: { email: 'creator@demo.findcollab.app', userId: 'user-aanya' },
  brand: { email: 'brand@demo.findcollab.app', userId: 'user-monsoon' },
} as const;

/** `days` from now (negative = past), plus optional hours. */
function at(days: number, hours = 0): string {
  return dayjs().add(days, 'day').add(hours, 'hour').toISOString();
}

const PLATFORM_OF: Record<ContentType, MockPackage['platform']> = {
  reel: 'instagram',
  post: 'instagram',
  story: 'instagram',
  youtube_video: 'youtube',
  youtube_shorts: 'youtube',
  youtube_live: 'youtube',
  ugc_video: null,
  ugc_photo: null,
};

export function seedDb(): MockDb {
  const d = emptyDb();
  const created = at(-120);

  // ---- Users, creators, brands ---------------------------------------------------------------

  function addUser(id: string, email: string, accountType: 'creator' | 'brand', displayName: string) {
    d.users.push({
      id,
      email,
      password: DEMO_PASSWORD,
      accountType,
      displayName,
      profilePhotoUrl: null,
      hasBankAccount: true,
      phoneVerified: accountType === 'creator',
      createdAt: created,
    });
  }

  function addCreator(
    id: string,
    userId: string,
    displayName: string,
    email: string,
    fields: Partial<MockCreator> & {
      niches: string[];
      languages: string[];
      state: string;
      city: string;
      trustScore: TrustScore;
    },
  ) {
    addUser(userId, email, 'creator', displayName);
    d.creators.push({
      id,
      userId,
      creatorTitle: null,
      bio: null,
      gender: null,
      dateOfBirth: null,
      country: 'India',
      district: null,
      instagramHandle: null,
      instagramFollowerRange: null,
      youtubeChannelUrl: null,
      youtubeSubscriberRange: null,
      featuredReelUrl: null,
      coverPhotos: [],
      phoneNumber: '98450' + String(d.creators.length).padStart(5, '0'),
      phoneVerified: true,
      isAvailable: true,
      trustScorePoints: fields.trustScore === 'high' ? 80 : fields.trustScore === 'medium' ? 40 : 5,
      instagramEngagementRate: null,
      verificationStatus: 'pending',
      totalCompletedCollabs: 0,
      createdAt: created,
      ...fields,
    });
  }

  function addBrand(id: string, userId: string, email: string, fields: Partial<MockBrand> & { companyName: string }) {
    addUser(userId, email, 'brand', fields.companyName);
    d.brands.push({
      id,
      userId,
      brandWebsite: null,
      industry: null,
      description: null,
      country: 'India',
      phone: null,
      gstin: null,
      logoUrl: null,
      showBrandNameInCollabs: true,
      createdAt: created,
      ...fields,
    });
  }

  addCreator('cr-aanya', DEMO_ACCOUNTS.creator.userId, 'Aanya Rao', DEMO_ACCOUNTS.creator.email, {
    creatorTitle: 'Food & travel creator',
    bio: 'Slow travel, street food and the stories behind them. Based in Bengaluru, filming across South India.',
    gender: 'female',
    dateOfBirth: '1997-04-18T00:00:00.000Z',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    languages: ['English', 'Kannada', 'Hindi'],
    niches: ['Food', 'Travel', 'Lifestyle'],
    instagramHandle: 'aanya.eats.out',
    instagramFollowerRange: 'range_50k_100k',
    instagramEngagementRate: '4.80',
    trustScore: 'high',
    verificationStatus: 'verified',
    totalCompletedCollabs: 2,
  });

  const others: [string, string, string, Parameters<typeof addCreator>[4]][] = [
    ['cr-kabir', 'user-kabir', 'Kabir Sethi', {
      creatorTitle: 'Home cook', bio: 'Weeknight recipes that need one pan and no fuss.', gender: 'male',
      state: 'Delhi', city: 'New Delhi', languages: ['Hindi', 'English'], niches: ['Food', 'Lifestyle'],
      instagramHandle: 'kabircooks', instagramFollowerRange: 'range_10k_50k', instagramEngagementRate: '6.10',
      trustScore: 'medium', totalCompletedCollabs: 1,
    }],
    ['cr-meera', 'user-meera', 'Meera Iyer', {
      creatorTitle: 'Wellness & yoga', bio: 'Morning routines, mobility and mindful eating.', gender: 'female',
      state: 'Tamil Nadu', city: 'Chennai', languages: ['Tamil', 'English'], niches: ['Health & Wellness', 'Fitness'],
      instagramHandle: 'meera.moves', instagramFollowerRange: 'range_100k_500k', instagramEngagementRate: '3.20',
      trustScore: 'high', totalCompletedCollabs: 9,
    }],
    ['cr-rohan', 'user-rohan', 'Rohan Desai', {
      creatorTitle: 'Tech reviews', bio: 'Honest gadget reviews in Hindi and English.', gender: 'male',
      state: 'Maharashtra', city: 'Pune', languages: ['Hindi', 'English', 'Marathi'], niches: ['Technology', 'Gaming'],
      instagramHandle: 'rohan.reviews', instagramFollowerRange: 'range_10k_50k',
      youtubeChannelUrl: 'https://youtube.com/@rohanreviews', youtubeSubscriberRange: 'range_100k_500k',
      instagramEngagementRate: '2.90', trustScore: 'high', totalCompletedCollabs: 14,
    }],
    ['cr-ishita', 'user-ishita', 'Ishita Banerjee', {
      creatorTitle: 'Fashion & beauty', bio: 'Everyday outfits and skincare that works in humid weather.', gender: 'female',
      state: 'West Bengal', city: 'Kolkata', languages: ['Bengali', 'English', 'Hindi'], niches: ['Fashion', 'Beauty'],
      instagramHandle: 'ishita.wears', instagramFollowerRange: 'range_50k_100k', instagramEngagementRate: '5.40',
      trustScore: 'medium', totalCompletedCollabs: 3,
    }],
    ['cr-arjun', 'user-arjun', 'Arjun Nair', {
      creatorTitle: 'Travel photographer', bio: 'Backwaters, hills and the people who live there.', gender: 'male',
      state: 'Kerala', city: 'Kochi', languages: ['Malayalam', 'English'], niches: ['Travel', 'Photography'],
      instagramHandle: 'arjun.frames', instagramFollowerRange: 'range_10k_50k', instagramEngagementRate: '7.30',
      trustScore: 'medium', totalCompletedCollabs: 2,
    }],
    ['cr-sana', 'user-sana', 'Sana Qureshi', {
      creatorTitle: 'Comedy & everyday life', bio: 'Sketches about families, offices and Hyderabad traffic.', gender: 'female',
      state: 'Telangana', city: 'Hyderabad', languages: ['Urdu', 'Hindi', 'Telugu', 'English'], niches: ['Comedy', 'Lifestyle'],
      instagramHandle: 'sana.says', instagramFollowerRange: 'range_500k_1m', instagramEngagementRate: '8.90',
      trustScore: 'high', totalCompletedCollabs: 21,
    }],
    ['cr-dev', 'user-dev', 'Dev Malhotra', {
      creatorTitle: 'Fitness coach', bio: 'Strength training for beginners.', gender: 'male',
      state: 'Maharashtra', city: 'Mumbai', languages: ['Hindi', 'English'], niches: ['Fitness', 'Sports'],
      instagramHandle: 'devlifts', instagramFollowerRange: 'range_1k_10k', instagramEngagementRate: '3.80',
      trustScore: 'low', totalCompletedCollabs: 1,
    }],
  ];
  for (const [id, userId, name, fields] of others) {
    addCreator(id, userId, name, `${userId.replace('user-', '')}@creators.example`, fields);
  }

  addBrand('br-monsoon', DEMO_ACCOUNTS.brand.userId, DEMO_ACCOUNTS.brand.email, {
    companyName: 'Monsoon Tea Co.',
    brandWebsite: 'https://monsoontea.example',
    industry: 'Food',
    description: 'Small-batch Indian teas, sourced direct from estates in Assam and the Nilgiris.',
    phone: '+919876543210',
  });
  addBrand('br-kettle', 'user-kettle', 'hello@kettleandcrumb.example', {
    companyName: 'Kettle & Crumb', industry: 'Food', description: 'Neighbourhood bakery chain in Bengaluru.',
  });
  addBrand('br-coastline', 'user-coastline', 'team@coastline.example', {
    companyName: 'Coastline Outdoors', industry: 'Travel', description: 'Rain gear and trekking kit.',
  });
  addBrand('br-lumen', 'user-lumen', 'pr@lumen.example', {
    companyName: 'Lumen Skincare', industry: 'Beauty', description: 'Minimal skincare for humid climates.',
    // Creators see "A Brand" until a deal with Lumen is underway.
    showBrandNameInCollabs: false,
  });

  // ---- Packages ------------------------------------------------------------------------------

  function addPackage(
    id: string,
    creatorProfileId: string,
    title: string,
    contentType: ContentType,
    quantity: number,
    price: number,
    description: string | null = null,
    isActive = true,
  ) {
    d.packages.push({
      id,
      creatorProfileId,
      title,
      contentType,
      quantity,
      price: money(price),
      description,
      inclusions: [],
      platform: PLATFORM_OF[contentType],
      recommendedMin: null,
      recommendedMax: null,
      isActive,
      createdAt: created,
    });
  }

  addPackage('pk-aanya-reel', 'cr-aanya', 'Single reel', 'reel', 1, 12000, 'One 30–60s reel, one round of edits, posted within 7 days.');
  addPackage('pk-aanya-story', 'cr-aanya', 'Story set', 'story', 3, 6000, 'Three stories over one day with a link sticker.');
  addPackage('pk-aanya-bundle', 'cr-aanya', 'Reel + stories bundle', 'reel', 2, 20000, null, false);
  addPackage('pk-kabir-reel', 'cr-kabir', 'Recipe reel', 'reel', 1, 15000, 'A full recipe featuring your product.');
  addPackage('pk-kabir-ugc', 'cr-kabir', 'UGC cooking video', 'ugc_video', 1, 9000, 'Raw footage for your own ads.');
  addPackage('pk-meera-story', 'cr-meera', 'Story set', 'story', 3, 8000);
  addPackage('pk-meera-reel', 'cr-meera', 'Routine reel', 'reel', 1, 25000);
  addPackage('pk-rohan-yt', 'cr-rohan', 'Dedicated review', 'youtube_video', 1, 45000, '8–12 minute review with a pinned link.');
  addPackage('pk-rohan-shorts', 'cr-rohan', 'Shorts', 'youtube_shorts', 2, 18000);
  addPackage('pk-ishita-reel', 'cr-ishita', 'Styling reel', 'reel', 1, 14000);
  addPackage('pk-ishita-post', 'cr-ishita', 'Carousel post', 'post', 1, 9000);
  addPackage('pk-arjun-post', 'cr-arjun', 'Photo series', 'post', 3, 11000, 'Three edited photos, full usage rights for 6 months.');
  addPackage('pk-arjun-ugc', 'cr-arjun', 'UGC photo pack', 'ugc_photo', 10, 7000);
  addPackage('pk-sana-reel', 'cr-sana', 'Sketch reel', 'reel', 1, 60000);
  addPackage('pk-dev-reel', 'cr-dev', 'Workout reel', 'reel', 1, 5000);

  // ---- Deals ---------------------------------------------------------------------------------

  let dealCounter = 1040;
  function addDeal(
    id: string,
    brandProfileId: string,
    creatorProfileId: string,
    packageId: string,
    path: [DealStatus, number][],
    extra: Partial<MockDeal> = {},
  ): MockDeal {
    const pkg = d.packages.find((p) => p.id === packageId)!;
    const offered = Number(extra.offeredAmount ?? pkg.price);
    const fees = calcFees(offered);
    const brandUser = d.brands.find((b) => b.id === brandProfileId)!.userId;
    const creatorUser = d.creators.find((c) => c.id === creatorProfileId)!.userId;
    const statusLog: MockStatusLog[] = path.map(([status, day], i) => ({
      id: `${id}-log-${i}`,
      fromStatus: i === 0 ? null : path[i - 1][0],
      toStatus: status,
      // Brands send, pay and verify; creators accept, decline and submit.
      changedBy: ['request_sent', 'active', 'verified', 'completed', 'disputed'].includes(status) ? brandUser : creatorUser,
      reason: null,
      createdAt: at(day),
    }));
    const [first] = path;
    const status = path[path.length - 1][0];
    const timeOf = (s: DealStatus) => path.find(([st]) => st === s)?.[1];
    const deal: MockDeal = {
      id,
      dealNumber: `FC-${dealCounter++}`,
      brandProfileId,
      creatorProfileId,
      campaignId: null,
      packageId,
      status,
      chatState: ['active', 'post_submitted', 'verified', 'disputed'].includes(status)
        ? 'OPEN'
        : status === 'completed'
          ? 'ARCHIVED'
          : 'LOCKED',
      contentType: pkg.contentType,
      brief: 'Show the product naturally in your usual style. Mention the launch offer in the caption and tag our handle.',
      referenceMaterials: [],
      offeredAmount: money(offered),
      ...fees,
      counterOfferAmount: null,
      counterOfferRounds: 0,
      postingDeadline: at(first[1] + 10),
      requiresDraftApproval: false,
      requestExpiresAt: at(first[1] + 3),
      acceptedAt: timeOf('accepted') !== undefined ? at(timeOf('accepted')!) : null,
      postSubmittedAt: timeOf('post_submitted') !== undefined ? at(timeOf('post_submitted')!) : null,
      verifiedAt: timeOf('verified') !== undefined ? at(timeOf('verified')!) : null,
      completedAt: timeOf('completed') !== undefined ? at(timeOf('completed')!) : null,
      cancelledAt: null,
      cancellationReason: null,
      brandNotes: null,
      createdAt: at(first[1]),
      updatedAt: at(path[path.length - 1][1]),
      statusLog: statusLog.reverse(),
      submissions: [],
      drafts: [],
      escrow: null,
      disputes: [],
      reviews: [],
      performanceReports: [],
      ...extra,
    };
    const paidAt = timeOf('active');
    if (paidAt !== undefined) {
      deal.escrow = {
        id: `${id}-escrow`,
        offeredAmount: deal.offeredAmount,
        brandSideFee: deal.brandSideFee,
        creatorSideFee: deal.creatorSideFee,
        amount: fees.brandTotalCost,
        status: status === 'completed' || status === 'verified' ? 'released' : status === 'disputed' ? 'disputed' : 'held',
        paymentMethod: 'razorpay',
        paymentGatewayTxnId: `pay_demo${id.replace(/\W/g, '')}`,
        lockedAt: at(paidAt),
        releasedAt: deal.completedAt,
        refundedAt: null,
      };
    }
    const submittedAt = timeOf('post_submitted');
    if (submittedAt !== undefined) {
      deal.submissions.push({
        id: `${id}-sub`,
        postUrl: 'https://www.instagram.com/reel/demo' + id.replace(/\W/g, ''),
        screenshotUrl: null,
        platform: 'instagram',
        submittedAt: at(submittedAt),
        verificationDeadline: at(submittedAt + 2),
        verifiedByBrand: status === 'completed',
        autoApproved: false,
        verifiedAt: deal.verifiedAt,
      });
    }
    d.deals.push(deal);
    return deal;
  }

  // Aanya (demo creator)
  addDeal('deal-1', 'br-kettle', 'cr-aanya', 'pk-aanya-reel', [['request_sent', -0.1]], {
    brief: 'We are opening a new outlet in Indiranagar. Visit, try the cardamom bun and film a reel about it.',
    requestExpiresAt: at(2.8),
  });
  addDeal('deal-2', 'br-lumen', 'cr-aanya', 'pk-aanya-story', [['request_sent', -1]], {
    brief: 'Three stories showing your morning routine with our SPF gel. Keep it honest — no scripted claims.',
    requestExpiresAt: at(1.6),
  });
  addDeal('deal-3', 'br-monsoon', 'cr-aanya', 'pk-aanya-bundle', [['request_sent', -0.2]], {
    brief: 'A reel and two stories around our new monsoon masala chai. Ideal setting: a rainy evening at home.',
    offeredAmount: '20000.00',
    requestExpiresAt: at(2.7),
    requiresDraftApproval: true,
    brandNotes: 'Please avoid showing other beverage brands in frame.',
  });
  addDeal('deal-4', 'br-monsoon', 'cr-aanya', 'pk-aanya-reel', [['request_sent', -9], ['accepted', -8.5], ['active', -8]], {
    brief: 'One reel brewing our Assam breakfast blend — show the loose leaf and the colour of the brew.',
    postingDeadline: at(5),
    referenceMaterials: ['https://monsoontea.example/press-kit'],
  });
  addDeal('deal-5', 'br-coastline', 'cr-aanya', 'pk-aanya-story', [['request_sent', -16], ['accepted', -15], ['active', -14], ['post_submitted', -0.25]], {
    brief: 'Stories from your weekend trek wearing the Coastline rain shell.',
  });
  addDeal('deal-6', 'br-monsoon', 'cr-aanya', 'pk-aanya-bundle', [['request_sent', -48], ['accepted', -47], ['active', -46], ['post_submitted', -40], ['verified', -39], ['completed', -39]], {
    offeredAmount: '20000.00',
    brief: 'Launch content for our first-flush Darjeeling.',
    reviews: [
      { id: 'rv-6b', reviewerRole: 'brand', rating: 5, comment: 'Beautiful work, delivered early.', createdAt: at(-38) },
      { id: 'rv-6c', reviewerRole: 'creator', rating: 5, comment: 'Clear brief and quick payment.', createdAt: at(-38) },
    ],
    performanceReports: [
      { id: 'pr-6', reportType: 'seven_day', views: 84200, likes: 6100, comments: 212, shares: 340, saves: 890, reach: 61000, submittedAt: at(-32) },
    ],
  });
  addDeal('deal-7', 'br-kettle', 'cr-aanya', 'pk-aanya-reel', [['request_sent', -30], ['accepted', -29], ['active', -28], ['post_submitted', -22], ['verified', -21], ['completed', -21]], {
    brief: 'Reel featuring our sourdough range.',
    reviews: [{ id: 'rv-7b', reviewerRole: 'brand', rating: 4, comment: 'Great reel, a day late.', createdAt: at(-20) }],
  });
  addDeal('deal-8', 'br-coastline', 'cr-aanya', 'pk-aanya-reel', [['request_sent', -60], ['expired', -57]]);

  // Monsoon Tea (demo brand) with other creators
  addDeal('deal-9', 'br-monsoon', 'cr-kabir', 'pk-kabir-reel', [['request_sent', -12], ['accepted', -11], ['active', -11], ['post_submitted', -1]], {
    brief: 'A chai-time snack recipe featuring our masala chai.',
  });
  addDeal('deal-10', 'br-monsoon', 'cr-meera', 'pk-meera-story', [['request_sent', -2], ['accepted', -1]], {
    brief: 'Stories about a calming evening routine with our chamomile blend.',
  });
  addDeal('deal-11', 'br-monsoon', 'cr-rohan', 'pk-rohan-shorts', [['request_sent', -1.5]], {
    brief: 'Two shorts testing our smart kettle — brew temperatures for green vs black tea.',
    counterOfferAmount: '22000.00',
    counterOfferRounds: 1,
    requestExpiresAt: at(1.5),
  });
  addDeal('deal-12', 'br-monsoon', 'cr-ishita', 'pk-ishita-reel', [['request_sent', -10], ['accepted', -9], ['active', -9]], {
    brief: 'A styling reel for our festive gift box — show the packaging.',
    requiresDraftApproval: true,
    postingDeadline: at(6),
    drafts: [
      { id: 'dr-12-1', fileUrl: 'https://picsum.photos/seed/findcollab-draft-1/600/900', status: 'changes_requested', brandFeedback: 'Lovely! Could the box be in frame a bit longer at the start?', round: 1, submittedAt: at(-5), reviewedAt: at(-4) },
      { id: 'dr-12-2', fileUrl: 'https://picsum.photos/seed/findcollab-draft-2/600/900', status: 'pending', brandFeedback: null, round: 2, submittedAt: at(-0.5), reviewedAt: null },
    ],
  });
  addDeal('deal-13', 'br-monsoon', 'cr-arjun', 'pk-arjun-post', [['request_sent', -70], ['accepted', -69], ['active', -68], ['post_submitted', -60], ['verified', -59], ['completed', -59]], {
    brief: 'Photo series at a Nilgiris tea estate.',
    reviews: [{ id: 'rv-13b', reviewerRole: 'brand', rating: 5, comment: 'Stunning photos.', createdAt: at(-58) }],
  });
  addDeal('deal-14', 'br-monsoon', 'cr-dev', 'pk-dev-reel', [['request_sent', -20], ['rejected', -19]]);

  // ---- Campaigns -----------------------------------------------------------------------------

  const campaignBase = {
    productDescription: null,
    hashtags: [] as string[],
    targetLanguages: [] as string[],
    minFollowerCount: null,
    minEngagementRate: null,
    budgetPerCreator: null,
    maxCreators: null,
    applicationDeadline: null,
    autoAccept: false,
    negotiationAllowed: true,
    requiresDraftApproval: false,
    usedSlots: 0,
    spentAmount: '0.00',
    refundedAmount: '0.00',
  };
  d.campaigns.push(
    {
      ...campaignBase,
      id: 'cp-chai-launch',
      campaignNumber: 'CP-2041',
      brandProfileId: 'br-monsoon',
      status: 'active',
      type: 'BrandInvite',
      name: 'Monsoon chai launch',
      productDescription: 'Masala chai blend with ginger and black pepper.',
      brief: 'Creators share a rainy-day chai moment. Mention the 15% launch code CHAI15.',
      contentType: 'reel',
      hashtags: ['#MonsoonChai', '#ChaiTime'],
      targetLanguages: ['English', 'Hindi'],
      targetNiches: ['Food', 'Lifestyle'],
      targetInfluencerCount: 5,
      totalBudget: '100000.00',
      spentAmount: '8000.00',
      postingDeadline: at(14),
      createdAt: at(-6),
    },
    {
      ...campaignBase,
      id: 'cp-gift-boxes',
      campaignNumber: 'CP-2042',
      brandProfileId: 'br-monsoon',
      status: 'active',
      type: 'OpenApplication',
      name: 'Festive gift boxes',
      productDescription: 'Four-tin gift box for Diwali.',
      brief: 'Unbox the festive gift box and pair a tea with a sweet. Warm, family setting preferred.',
      contentType: 'reel',
      hashtags: ['#GiftWithMonsoon'],
      targetLanguages: ['English', 'Hindi'],
      targetNiches: ['Food', 'Lifestyle', 'Fashion'],
      targetInfluencerCount: 10,
      totalBudget: '100000.00',
      budgetPerCreator: '10000.00',
      maxCreators: 10,
      applicationDeadline: at(10),
      postingDeadline: at(25),
      createdAt: at(-1),
    },
    {
      ...campaignBase,
      id: 'cp-winter',
      campaignNumber: 'CP-2043',
      brandProfileId: 'br-monsoon',
      status: 'draft',
      type: 'BrandInvite',
      name: 'Winter blends',
      brief: 'Cosy winter content around our cinnamon and clove blend.',
      contentType: 'story',
      targetNiches: ['Food'],
      targetInfluencerCount: 4,
      totalBudget: '40000.00',
      postingDeadline: at(60),
      createdAt: at(-0.5),
    },
    {
      ...campaignBase,
      id: 'cp-weekend-bakes',
      campaignNumber: 'CP-1980',
      brandProfileId: 'br-kettle',
      status: 'active',
      type: 'OpenApplication',
      name: 'Weekend bakes',
      brief: 'Visit any Kettle & Crumb outlet on a weekend and film your favourite bake.',
      contentType: 'reel',
      targetLanguages: ['English', 'Kannada'],
      targetNiches: ['Food'],
      targetInfluencerCount: 15,
      totalBudget: '120000.00',
      budgetPerCreator: '8000.00',
      maxCreators: 15,
      applicationDeadline: at(5),
      postingDeadline: at(20),
      autoAccept: true,
      usedSlots: 7,
      createdAt: at(-8),
    },
    {
      ...campaignBase,
      id: 'cp-monsoon-treks',
      campaignNumber: 'CP-1991',
      brandProfileId: 'br-coastline',
      status: 'active',
      type: 'OpenApplication',
      name: 'Monsoon treks',
      brief: 'Take the Coastline rain shell on a monsoon trek and show how it holds up.',
      contentType: 'story',
      targetLanguages: ['English'],
      targetNiches: ['Travel', 'Sports'],
      targetInfluencerCount: 6,
      totalBudget: '72000.00',
      budgetPerCreator: '12000.00',
      maxCreators: 6,
      applicationDeadline: at(3),
      postingDeadline: at(18),
      minFollowerCount: 10000,
      createdAt: at(-4),
    },
    {
      ...campaignBase,
      id: 'cp-glow-serum',
      campaignNumber: 'CP-1995',
      brandProfileId: 'br-lumen',
      status: 'active',
      type: 'OpenApplication',
      name: 'Glow serum launch',
      brief: 'Two weeks with our vitamin C serum: day 1 and day 14 stories.',
      contentType: 'story',
      targetNiches: ['Beauty', 'Fashion'],
      targetInfluencerCount: 8,
      totalBudget: '80000.00',
      budgetPerCreator: '10000.00',
      maxCreators: 8,
      applicationDeadline: at(7),
      postingDeadline: at(30),
      requiresDraftApproval: true,
      createdAt: at(-2),
    },
  );

  // Brand-invite campaign: Meera's accepted deal and an outstanding invite to Sana.
  d.deals.find((x) => x.id === 'deal-10')!.campaignId = 'cp-chai-launch';
  const sanaInvite = addDeal('deal-15', 'br-monsoon', 'cr-sana', 'pk-sana-reel', [['request_sent', -0.5]], {
    brief: 'Monsoon chai launch: a sketch about the office chai break. Mention the code CHAI15.',
    campaignId: 'cp-chai-launch',
    offeredAmount: '55000.00',
    requestExpiresAt: at(2.5),
  });
  d.campaignCreators.push(
    { id: 'cc-1', campaignId: 'cp-chai-launch', creatorProfileId: 'cr-meera', dealId: 'deal-10', offeredAmount: '8000.00', addedAt: at(-2) },
    { id: 'cc-2', campaignId: 'cp-chai-launch', creatorProfileId: 'cr-sana', dealId: sanaInvite.id, offeredAmount: '55000.00', addedAt: at(-0.5) },
  );

  d.applications.push(
    { id: 'ap-1', campaignId: 'cp-gift-boxes', creatorProfileId: 'cr-kabir', packageId: 'pk-kabir-reel', pitchNote: 'I can pair each tea with a quick homemade mithai recipe.', status: 'pending', reviewedAt: null, reviewNote: null, dealId: null, appliedAt: at(-0.6) },
    { id: 'ap-2', campaignId: 'cp-gift-boxes', creatorProfileId: 'cr-ishita', packageId: 'pk-ishita-reel', pitchNote: 'Festive styling with the box as the centrepiece.', status: 'pending', reviewedAt: null, reviewNote: null, dealId: null, appliedAt: at(-0.3) },
    { id: 'ap-3', campaignId: 'cp-gift-boxes', creatorProfileId: 'cr-dev', packageId: 'pk-dev-reel', pitchNote: null, status: 'declined', reviewedAt: at(-0.2), reviewNote: 'Looking for food and lifestyle creators this time.', dealId: null, appliedAt: at(-0.9) },
    { id: 'ap-4', campaignId: 'cp-monsoon-treks', creatorProfileId: 'cr-aanya', packageId: 'pk-aanya-story', pitchNote: 'I am doing the Kudremukh trek next weekend — perfect timing for rain.', status: 'pending', reviewedAt: null, reviewNote: null, dealId: null, appliedAt: at(-1) },
  );

  // ---- Messages ------------------------------------------------------------------------------

  const thread = (dealId: string, from: string, to: string, lines: [0 | 1, string, number][]) => {
    lines.forEach(([who, content, day], i) => {
      d.messages.push({
        id: `${dealId}-msg-${i}`,
        dealId,
        senderId: who === 0 ? from : to,
        receiverId: who === 0 ? to : from,
        content,
        readReceipt: i === lines.length - 1 ? 'delivered' : 'read',
        isReported: false,
        createdAt: at(day),
      });
    });
  };
  thread('deal-4', 'user-monsoon', 'user-aanya', [
    [0, 'Hi Aanya! Payment is in escrow. The press kit link has our product shots if you need them.', -7.9],
    [1, 'Thank you! Planning to shoot this weekend while it rains.', -7.5],
    [0, 'Perfect. Could you mention that the leaves are hand-rolled?', -7.4],
    [1, 'Will do. I will share the post link here once it is live.', -2],
  ]);
  thread('deal-5', 'user-coastline', 'user-aanya', [
    [0, 'Hope the trek went well!', -13],
    [1, 'It poured the whole way — the jacket did great. Stories are up, submitted the link.', -0.25],
  ]);
  thread('deal-9', 'user-monsoon', 'user-kabir', [
    [0, 'Looking forward to the recipe!', -10],
    [1, 'Reel is live. Made chai-spiced banana bread.', -1],
  ]);
  thread('deal-12', 'user-monsoon', 'user-ishita', [
    [1, 'Uploaded the second draft with a longer opening shot of the box.', -0.5],
  ]);

  // ---- Notifications -------------------------------------------------------------------------

  const notify = (userId: string, type: string, title: string, body: string, day: number, dealId: string | null, isRead = false, campaignId: string | null = null) =>
    d.notifications.push({ id: `nt-${d.notifications.length + 1}`, userId, type, title, body, dealId, campaignId, isRead, createdAt: at(day) });

  notify('user-aanya', 'collab_request', 'New collab request', 'Monsoon Tea Co. sent a request for Reel + stories bundle worth ₹20,000.', -0.2, 'deal-3');
  notify('user-aanya', 'collab_request', 'New collab request', 'Kettle & Crumb sent a request for Single reel worth ₹12,000.', -0.1, 'deal-1');
  notify('user-aanya', 'collab_request', 'New collab request', 'A brand sent a request for Story set worth ₹6,000.', -1, 'deal-2', true);
  notify('user-aanya', 'payment_prompt', 'Deal is active', 'Payment for FC-1043 is in escrow. Post by the deadline.', -8, 'deal-4', true);
  notify('user-aanya', 'payout_released', 'Payment released', 'Your payment for FC-1045 has been released.', -39, 'deal-6', true);
  notify('user-monsoon', 'post_submitted', 'Post submitted for review', 'Kabir Sethi submitted the post for FC-1048. Verify within 48 hours.', -1, 'deal-9');
  notify('user-monsoon', 'collab_request', 'Counter-offer received', 'Rohan Desai proposed ₹22,000 for FC-1050.', -1.4, 'deal-11');
  notify('user-monsoon', 'collab_accepted', 'Collab accepted', 'Meera Iyer accepted your request. Pay to start the collab.', -1, 'deal-10');
  notify('user-monsoon', 'campaign_update', 'New applications', 'Two creators applied to Festive gift boxes.', -0.3, null, false, 'cp-gift-boxes');
  notify('user-monsoon', 'system', 'Draft ready for review', 'Ishita Banerjee uploaded draft 2 for FC-1051.', -0.5, 'deal-12', true);

  // ---- Wallet --------------------------------------------------------------------------------

  d.payoutAccounts.push(
    { id: 'pa-aanya-bank', userId: 'user-aanya', accountType: 'bank_account', upiId: null, bankName: 'HDFC Bank', accountNumber: '50100234567812', ifscCode: 'HDFC0001234', accountHolderName: 'Aanya Rao', isPrimary: true, isVerified: true, createdAt: created },
    { id: 'pa-aanya-upi', userId: 'user-aanya', accountType: 'upi', upiId: 'aanya@okhdfc', bankName: null, accountNumber: null, ifscCode: null, accountHolderName: null, isPrimary: false, isVerified: true, createdAt: created },
    { id: 'pa-monsoon-bank', userId: 'user-monsoon', accountType: 'bank_account', upiId: null, bankName: 'ICICI Bank', accountNumber: '000405012345', ifscCode: 'ICIC0000004', accountHolderName: 'Monsoon Tea Co.', isPrimary: true, isVerified: true, createdAt: created },
  );
  for (const deal of d.deals.filter((x) => x.status === 'completed')) {
    d.payouts.push({
      id: `po-${deal.id}`,
      creatorProfileId: deal.creatorProfileId,
      dealId: deal.id,
      offeredAmount: deal.offeredAmount,
      creatorSideFee: deal.creatorSideFee,
      amount: deal.creatorPayout,
      // deal-7's payout is held for a manual check, so the wallet shows that state too.
      status: deal.id === 'deal-7' ? 'pending' : 'completed',
      isOnHold: deal.id === 'deal-7',
      holdReason: deal.id === 'deal-7' ? 'Routine check on the payout account before release.' : null,
      failedReason: null,
      payoutMethod: 'bank_account',
      createdAt: deal.completedAt!,
      completedAt: deal.id === 'deal-7' ? null : dayjs(deal.completedAt!).add(1, 'day').toISOString(),
    });
  }

  // ---- Saved lists, stats --------------------------------------------------------------------

  d.savedLists.push(
    { id: 'sl-food', brandProfileId: 'br-monsoon', name: 'Food creators', creatorProfileIds: ['cr-aanya', 'cr-kabir'], createdAt: at(-30) },
    { id: 'sl-festive', brandProfileId: 'br-monsoon', name: 'Festive shortlist', creatorProfileIds: ['cr-meera', 'cr-ishita', 'cr-sana'], createdAt: at(-5) },
  );
  d.statsSubmissions.push({
    id: 'st-aanya-1',
    creatorProfileId: 'cr-aanya',
    instagramFollowers: 72000,
    instagramEngRate: '4.80',
    instagramAvgLikes: 3100,
    instagramAvgComments: 140,
    youtubeSubscribers: null,
    youtubeAvgViews: null,
    screenshotUrls: [],
    verificationStatus: 'verified',
    reviewNotes: null,
    submittedAt: at(-30),
    reviewedAt: at(-28),
  });

  return d;
}
