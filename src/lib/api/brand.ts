import { apiClient } from '@/lib/api/client';
import { IS_MOCK_API, mockDelay } from '@/lib/api/mock-mode';

/** PROVISIONAL — mirrors prompt.md §6.2's Brand Profile Setup field list (1:1 with `PUT
 * /brands/me/profile` per the spec). Reconcile against `frontend_prompt.md` once available. */
export interface BrandProfileUpdate {
  companyName: string;
  website?: string;
  industry: string;
  description: string;
  country: string;
  phone: string;
  gstin?: string;
  showBrandNameInCollabs: boolean;
}

export async function updateBrandProfile(input: BrandProfileUpdate): Promise<void> {
  if (IS_MOCK_API) {
    await mockDelay(undefined);
    return;
  }
  await apiClient.put('/brands/me/profile', input);
}

export async function uploadBrandLogo(localUri: string): Promise<{ url: string }> {
  if (IS_MOCK_API) {
    return mockDelay({ url: localUri });
  }
  const extension = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const formData = new FormData();
  formData.append('logo', {
    uri: localUri,
    name: 'logo.jpg',
    type: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
  } as unknown as Blob);
  const { data } = await apiClient.post<{ success: true; data: { url: string } }>(
    '/brands/me/logo',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data;
}
