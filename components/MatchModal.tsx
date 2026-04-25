import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Dog } from '@/lib/demo-dogs';
import { colors, fonts, radii, tracking } from '@/lib/theme';

type Props = {
  visible: boolean;
  dog: Dog | null;
  yourDogName?: string;
  onClose: () => void;
  onSayHi?: () => void;
};

export function MatchModal({
  visible,
  dog,
  yourDogName = 'Your pup',
  onClose,
  onSayHi,
}: Props) {
  if (!dog) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.outer}>
        <View style={styles.card}>
          <View style={styles.photoRegion}>
            <Image
              source={{ uri: dog.photo }}
              style={styles.fill}
              contentFit="cover"
              transition={200}
            />

            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              locations={[0.5, 1]}
              style={styles.fill}
              pointerEvents="none"
            />

            <View style={styles.photoOverlay} pointerEvents="none">
              <Text style={styles.eyebrow}>MATCHED</Text>
              <Text style={styles.headline} numberOfLines={2}>
                {`${yourDogName} & ${dog.name}`}
              </Text>
            </View>
          </View>

          <View style={styles.body}>
            <Text style={styles.subtitle}>You both swiped right.</Text>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={onSayHi ?? onClose}
            >
              <Text style={styles.primaryText}>{`Say hi to ${dog.ownerName}`}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              onPress={onClose}
            >
              <Text style={styles.secondaryText}>Keep swiping</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.bg,
    borderRadius: radii.cardLarge,
    overflow: 'hidden',
  },
  photoRegion: {
    width: '100%',
    aspectRatio: 4 / 5,
    position: 'relative',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  photoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    paddingBottom: 16,
  },
  eyebrow: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: tracking.monoLoose,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  headline: {
    marginTop: 6,
    fontFamily: fonts.displayHeavy,
    fontSize: 30,
    lineHeight: 32,
    color: colors.text,
    letterSpacing: tracking.tightDisplay,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 12,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textSoft,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: radii.frame,
  },
  primaryText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.accentInk,
    letterSpacing: tracking.body,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSoft,
  },
  pressed: {
    opacity: 0.75,
  },
});
