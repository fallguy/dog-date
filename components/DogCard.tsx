import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import type { Dog } from '@/lib/demo-dogs';

type Props = {
  dog: Dog;
};

export function DogCard({ dog }: Props) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: dog.photo }}
        style={styles.photo}
        contentFit="cover"
        transition={200}
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.92)']}
        locations={[0, 0.55, 1]}
        style={styles.overlay}
      />

      <View style={styles.distanceBadge}>
        <Text style={styles.distanceText}>{dog.distanceMiles} mi</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{dog.name}</Text>
          <Text style={styles.age}>{dog.ageYears}</Text>
        </View>

        <Text style={styles.breed}>
          {dog.breed} · {dog.size} · {dog.energy} energy
        </Text>

        <Text style={styles.bio} numberOfLines={2}>
          {dog.bio}
        </Text>

        <View style={styles.tagRow}>
          {dog.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.owner}>
          <View style={styles.ownerDot} />
          <Text style={styles.ownerText}>
            with {dog.ownerName} · {dog.ownerBio}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: '#1a1a20',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  distanceBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  distanceText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  name: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  age: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '400',
    marginBottom: 4,
  },
  breed: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '500',
  },
  bio: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    lineHeight: 20,
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  owner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.25)',
  },
  ownerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
  },
  ownerText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    flex: 1,
  },
});
