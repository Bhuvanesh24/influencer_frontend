import { apiClient } from '@/lib/api/client';
import { IS_MOCK_API, mockDelay } from '@/lib/api/mock-mode';
import type { FollowerRange } from '@/components/ui/Badge';
import type { ContentType } from '@/lib/constants';

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

/**
 * PROVISIONAL — mirrors the field list in prompt.md §6.2's wizard table (steps 1–4 all hit this
 * one endpoint per the spec: "call the relevant PUT/POST per step rather than batching"). Exact
 * field names/enums need reconciling against `frontend_prompt.md` once available.
 */
export interface CreatorProfileUpdate {
  creatorTitle?: string;
  bio?: string;
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  dateOfBirth?: string;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  languages?: string[];
  niches?: string[];
  instagramHandle?: string;
  instagramFollowerRange?: FollowerRange;
  youtubeChannelUrl?: string;
  youtubeSubscriberRange?: FollowerRange;
  featuredReelUrl?: string;
}

export async function updateCreatorProfile(input: CreatorProfileUpdate): Promise<void> {
  if (IS_MOCK_API) {
    await mockDelay(undefined);
    return;
  }
  await apiClient.put('/creators/me/profile', input);
}

function toFormFile(uri: string, name: string) {
  const extension = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  return { uri, name, type: `image/${extension === 'jpg' ? 'jpeg' : extension}` };
}

export async function uploadProfilePhoto(localUri: string): Promise<{ url: string }> {
  if (IS_MOCK_API) {
    return mockDelay({ url: localUri });
  }
  const formData = new FormData();
  // React Native's FormData accepts {uri,name,type} for file fields — not represented in the DOM
  // FormData types, hence the cast.
  formData.append('photo', toFormFile(localUri, 'profile.jpg') as unknown as Blob);
  const { data } = await apiClient.post<ApiEnvelope<{ url: string }>>(
    '/creators/me/profile-photo',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data;
}

export async function uploadCoverPhotos(localUris: string[]): Promise<{ urls: string[] }> {
  if (IS_MOCK_API) {
    return mockDelay({ urls: localUris });
  }
  const formData = new FormData();
  localUris.forEach((uri, i) => {
    formData.append('photos', toFormFile(uri, `cover-${i}.jpg`) as unknown as Blob);
  });
  const { data } = await apiClient.post<ApiEnvelope<{ urls: string[] }>>(
    '/creators/me/cover-photos',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data;
}

export interface CreatePackageInput {
  title: string;
  contentType: ContentType;
  quantity: number;
  price: number;
  description?: string;
}

export async function createPackage(input: CreatePackageInput): Promise<{ id: string }> {
  if (IS_MOCK_API) {
    return mockDelay({ id: 'mock-package-1' });
  }
  const { data } = await apiClient.post<ApiEnvelope<{ id: string }>>('/creators/me/packages', input);
  return data.data;
}
