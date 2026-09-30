import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Plus, User, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { uploadCoverPhotos, uploadProfilePhoto } from '@/lib/api/creator';
import { getApiErrorMessage } from '@/lib/api/client';
import { useCreatorWizardStore } from '@/lib/auth/creator-wizard-store';
import { toast } from '@/lib/toast';

const MAX_COVER_PHOTOS = 3;

export function Step5Photos({ onNext }: { onNext: () => void }) {
  const { colors } = useAppTheme();
  const wizard = useCreatorWizardStore();
  const [profileUri, setProfileUri] = useState(wizard.data.profilePhotoUri);
  const [coverUris, setCoverUris] = useState(wizard.data.coverPhotoUris);

  async function pickProfilePhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled) return;

    const cropped = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 400, height: 400 } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
    );
    setProfileUri(cropped.uri);
  }

  async function pickCoverPhoto() {
    if (coverUris.length >= MAX_COVER_PHOTOS) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });
    if (result.canceled) return;
    setCoverUris((prev) => [...prev, result.assets[0].uri]);
  }

  function removeCoverPhoto(uri: string) {
    setCoverUris((prev) => prev.filter((u) => u !== uri));
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!profileUri) throw new Error('Add a profile photo to continue');
      await uploadProfilePhoto(profileUri);
      if (coverUris.length > 0) {
        await uploadCoverPhotos(coverUris);
      }
    },
    onSuccess: () => {
      wizard.update({ profilePhotoUri: profileUri, coverPhotoUris: coverUris });
      onNext();
    },
    onError: (error) => toast.error('Could not upload photos', getApiErrorMessage(error)),
  });

  return (
    <View className="gap-6">
      <Text variant="h1" weight="bold">
        Add your photos
      </Text>

      <View className="items-center gap-2">
        <Pressable onPress={pickProfilePhoto} accessibilityRole="button" accessibilityLabel="Add profile photo">
          {profileUri ? (
            <Image source={{ uri: profileUri }} style={{ width: 120, height: 120, borderRadius: 60 }} />
          ) : (
            <View className="h-[120px] w-[120px] items-center justify-center rounded-full border border-dashed border-border bg-base">
              <User size={36} color={colors.text.muted} />
            </View>
          )}
          <View className="absolute -bottom-1 -right-1 rounded-full bg-brand p-2">
            <Plus size={14} color="#FFFFFF" />
          </View>
        </Pressable>
        <Text variant="bodySm" weight="medium">
          Profile photo (required)
        </Text>
      </View>

      <View className="gap-2">
        <Text variant="bodySm" weight="medium" color="secondary">
          Cover photos (up to {MAX_COVER_PHOTOS}, optional)
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {coverUris.map((uri) => (
            <View key={uri} className="relative">
              <Image source={{ uri }} style={{ width: 88, height: 88, borderRadius: 12 }} />
              <Pressable
                onPress={() => removeCoverPhoto(uri)}
                accessibilityRole="button"
                accessibilityLabel="Remove cover photo"
                className="absolute -right-1.5 -top-1.5 rounded-full bg-danger p-1"
              >
                <X size={12} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
          {coverUris.length < MAX_COVER_PHOTOS && (
            <Pressable
              onPress={pickCoverPhoto}
              accessibilityRole="button"
              accessibilityLabel="Add cover photo"
              className="h-[88px] w-[88px] items-center justify-center rounded-md border border-dashed border-border bg-base"
            >
              <Plus size={22} color={colors.text.muted} />
            </Pressable>
          )}
        </View>
      </View>

      <Button size="lg" loading={mutation.isPending} onPress={() => mutation.mutate()}>
        Continue
      </Button>
    </View>
  );
}
