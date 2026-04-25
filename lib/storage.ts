import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/**
 * Upload a local image (from expo-image-picker) to Supabase Storage.
 *
 * Platform-aware because file handling differs between native and web:
 * - Native: open the URI via expo-file-system's File class and get an ArrayBuffer
 * - Web: fetch() the blob: or data: URI directly and get a Blob
 *
 * Returns the public URL of the uploaded object.
 */
export async function uploadDogPhoto({
  userId,
  dogId,
  localUri,
}: {
  userId: string;
  dogId: string;
  localUri: string;
}): Promise<string> {
  const fileName = `photo-${Date.now()}.jpg`;
  const path = `${userId}/${dogId}/${fileName}`;

  let body: ArrayBuffer | Blob;
  let contentType = 'image/jpeg';

  if (Platform.OS === 'web') {
    const response = await fetch(localUri);
    body = await response.blob();
    contentType = (body as Blob).type || contentType;
  } else {
    const file = new File(localUri);
    body = await file.arrayBuffer();
  }

  const { error } = await supabase.storage
    .from('dog-photos')
    .upload(path, body, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from('dog-photos').getPublicUrl(path);
  return data.publicUrl;
}
