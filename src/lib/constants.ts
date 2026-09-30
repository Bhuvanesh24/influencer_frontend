/**
 * Standardised lists shared between the Creator Profile Wizard and the Discover filter sheet
 * (prompt.md §6.2 step 3: "hardcode the 20-niche / 12-language sets from the BRD as constants
 * shared with the Discover filter"). The exact 20/12 item sets aren't spelled out verbatim in
 * prompt.md — this is a reasonable, India-market-relevant set standing in for the BRD's list;
 * reconcile against the real BRD/`frontend_prompt.md` enum before shipping (flagged in
 * SPRINTS.md's Deviations log).
 */
export const NICHES = [
  'Fashion',
  'Beauty',
  'Fitness',
  'Food',
  'Travel',
  'Technology',
  'Gaming',
  'Finance',
  'Education',
  'Comedy',
  'Lifestyle',
  'Parenting',
  'Health & Wellness',
  'Music',
  'Dance',
  'Sports',
  'Photography',
  'Art & Design',
  'Business',
  'Vlogging',
] as const;

export const LANGUAGES = [
  'Hindi',
  'English',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Marathi',
  'Gujarati',
  'Bengali',
  'Punjabi',
  'Urdu',
  'Odia',
] as const;

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

export const CONTENT_TYPES = [
  { value: 'reel', label: 'Reel' },
  { value: 'post', label: 'Post' },
  { value: 'story', label: 'Story' },
  { value: 'youtube_video', label: 'YouTube Video' },
  { value: 'shorts', label: 'Shorts' },
  { value: 'live', label: 'Live' },
  { value: 'ugc_video', label: 'UGC Video' },
  { value: 'ugc_photo', label: 'UGC Photo' },
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number]['value'];
