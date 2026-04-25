import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth-store';
import type { Database } from '@/lib/database.types';
import { uploadDogPhoto } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

type DogSize = Database['public']['Enums']['dog_size'];
type DogEnergy = Database['public']['Enums']['dog_energy'];

const SIZES: DogSize[] = ['Small', 'Medium', 'Large'];
const ENERGIES: DogEnergy[] = ['Chill', 'Medium', 'High'];

export default function OnboardingScreen() {
  const session = useAuth((s) => s.session);

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [size, setSize] = useState<DogSize>('Medium');
  const [energy, setEnergy] = useState<DogEnergy>('Medium');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return <Redirect href="/" />;
  }

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Photo access is required to upload your dog.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return setError('Your dog needs a name');
    if (!breed.trim()) return setError('What breed?');
    if (!photoUri) return setError('Please add a photo of your dog');
    setError(null);
    setBusy(true);
    try {
      // 1. Create the dog row (gets us an id to use in the storage path)
      const { data: inserted, error: insertError } = await supabase
        .from('dogs')
        .insert({
          owner_id: session.user.id,
          name: name.trim(),
          breed: breed.trim(),
          size,
          energy,
        })
        .select('id')
        .single();
      if (insertError || !inserted) {
        throw new Error(insertError?.message ?? 'Failed to create dog');
      }

      // 2. Upload photo using the new dog's id in the path
      const publicUrl = await uploadDogPhoto({
        userId: session.user.id,
        dogId: inserted.id,
        localUri: photoUri,
      });

      // 3. Patch the dog row with photo URLs
      const { error: updateError } = await supabase
        .from('dogs')
        .update({
          primary_photo_url: publicUrl,
          photos: [publicUrl],
        })
        .eq('id', inserted.id);
      if (updateError) throw new Error(updateError.message);

      router.replace('/generate-video');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      setError(msg);
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Tell us about your dog</Text>
          <Text style={styles.subtitle}>
            This is what other owners will see when you come up in their deck.
          </Text>

          <Pressable
            style={[styles.photoSlot, photoUri && styles.photoSlotFilled]}
            onPress={pickPhoto}
            disabled={busy}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
            ) : (
              <>
                <Text style={styles.photoEmoji}>📷</Text>
                <Text style={styles.photoLabel}>Add a photo</Text>
              </>
            )}
          </Pressable>

          <Field label="Name">
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Biscuit"
              placeholderTextColor="#5a5a60"
              editable={!busy}
              maxLength={40}
            />
          </Field>

          <Field label="Breed">
            <TextInput
              style={styles.input}
              value={breed}
              onChangeText={setBreed}
              placeholder="Golden Retriever"
              placeholderTextColor="#5a5a60"
              editable={!busy}
            />
          </Field>

          <Field label="Size">
            <SegmentedChoice
              options={SIZES}
              value={size}
              onChange={setSize}
              disabled={busy}
            />
          </Field>

          <Field label="Energy">
            <SegmentedChoice
              options={ENERGIES}
              value={energy}
              onChange={setEnergy}
              disabled={busy}
            />
          </Field>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              busy && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.primaryText}>Start swiping</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SegmentedChoice<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(opt)}
            disabled={disabled}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 8,
  },
  subtitle: {
    color: '#9a9aa0',
    fontSize: 15,
    marginBottom: 8,
  },
  photoSlot: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#1a1a20',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2a2a30',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoSlotFilled: {
    borderStyle: 'solid',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  photoLabel: {
    color: '#9a9aa0',
    fontSize: 16,
    fontWeight: '600',
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    color: '#9a9aa0',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#1a1a20',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a30',
  },
  segmented: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1a1a20',
    borderWidth: 1,
    borderColor: '#2a2a30',
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  segmentText: {
    color: '#9a9aa0',
    fontSize: 15,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#000',
  },
  primaryButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  error: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '500',
  },
});
