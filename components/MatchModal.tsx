import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Dog } from '@/lib/demo-dogs';

type Props = {
  visible: boolean;
  dog: Dog | null;
  yourDogName?: string;
  onClose: () => void;
};

export function MatchModal({ visible, dog, yourDogName = 'Your pup', onClose }: Props) {
  if (!dog) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>It&apos;s a match!</Text>
          <Text style={styles.subtitle}>
            {yourDogName} and {dog.name} both want to play.
          </Text>

          <View style={styles.photos}>
            <View style={[styles.photoWrap, styles.photoLeft]}>
              <View style={styles.photoPlaceholder}>
                <Text style={styles.placeholderEmoji}>🐾</Text>
              </View>
            </View>
            <View style={[styles.photoWrap, styles.photoRight]}>
              <Image
                source={{ uri: dog.photo }}
                style={styles.photo}
                contentFit="cover"
                transition={200}
              />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={onClose}
          >
            <Text style={styles.primaryText}>Say hi to {dog.ownerName}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={onClose}
          >
            <Text style={styles.secondaryText}>Keep swiping</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#15151b',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#2a2a30',
  },
  title: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#bfbfc8',
    fontSize: 16,
    textAlign: 'center',
  },
  photos: {
    flexDirection: 'row',
    marginVertical: 12,
    height: 140,
  },
  photoWrap: {
    width: 120,
    height: 140,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#15151b',
  },
  photoLeft: {
    marginRight: -20,
    transform: [{ rotate: '-6deg' }],
    backgroundColor: '#2a2a30',
  },
  photoRight: {
    transform: [{ rotate: '6deg' }],
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a30',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  primaryButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  primaryText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  secondaryText: {
    color: '#9a9aa0',
    fontWeight: '600',
    fontSize: 15,
  },
  buttonPressed: {
    opacity: 0.75,
  },
});
