import { useLocalSearchParams, router, Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth-store';
import { useMessages } from '@/lib/queries/useMessages';
import { useInsertMessage } from '@/lib/queries/useInsertMessage';
import { useNpcReply } from '@/lib/queries/useNpcReply';
import { supabase } from '@/lib/supabase';
import { colors, fonts, tracking, radii } from '@/lib/theme';

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function TypingDots() {
  const dots = useRef([new Animated.Value(0.3), new Animated.Value(0.3), new Animated.Value(0.3)]).current;
  useEffect(() => {
    const loops = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [dots]);
  return (
    <View style={styles.typingDotsRow}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={[styles.typingDot, { opacity: dot }]} />
      ))}
    </View>
  );
}

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const session = useAuth((s) => s.session);
  const { data: messages = [] } = useMessages(matchId);
  const insertMessage = useInsertMessage();
  const npcReply = useNpcReply();
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!matchId) return;
    const channel = supabase
      .channel('chat:' + matchId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: 'match_id=eq.' + matchId },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, queryClient]);

  if (!session) {
    return <Redirect href="/" />;
  }

  async function handleSend() {
    const body = inputText.trim();
    if (!body || !matchId) return;
    setInputText('');
    await insertMessage.mutateAsync({ matchId, senderId: session!.user.id, body });
    npcReply.mutate({ matchId });
  }

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const showTyping =
    npcReply.isPending && lastMessage?.sender_id === session.user.id;

  const hasInput = inputText.trim().length > 0;
  const sendDisabled = !hasInput || insertMessage.isPending;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/matches'))}
            hitSlop={12}
          >
            <Text style={styles.back}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Chat</Text>
          <View style={styles.headerSpacer} />
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item, index }) => {
            const isOwn = item.sender_id === session.user.id;
            const showName =
              !isOwn && (index === 0 || messages[index - 1].sender_id !== item.sender_id);
            return (
              <View style={[styles.bubbleWrap, isOwn ? styles.bubbleWrapOwn : styles.bubbleWrapOther]}>
                {showName && item.sender_name && (
                  <Text style={styles.senderName}>{item.sender_name.toUpperCase()}</Text>
                )}
                <View
                  style={[
                    styles.bubble,
                    isOwn ? styles.bubbleOwn : styles.bubbleOther,
                  ]}
                >
                  <Text style={[styles.bubbleText, isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther]}>
                    {item.body}
                  </Text>
                </View>
                <Text style={styles.timestamp}>{formatTime(item.created_at)}</Text>
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            showTyping ? (
              <View style={[styles.bubbleWrap, styles.bubbleWrapOther]}>
                <View style={[styles.bubble, styles.bubbleOther, styles.typingBubble]}>
                  <TypingDots />
                </View>
              </View>
            ) : null
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message..."
            placeholderTextColor={colors.textMute}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            multiline
          />
          {hasInput ? (
            <Pressable
              style={[styles.sendButton, sendDisabled && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={sendDisabled}
              accessibilityLabel="Send message"
            >
              <Text style={[styles.sendArrow, sendDisabled && styles.sendArrowDisabled]}>↑</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  back: {
    color: colors.textSoft,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontFamily: fonts.displayHeavy,
    letterSpacing: tracking.tightDisplay,
  },
  headerSpacer: {
    width: 60,
  },
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  bubbleWrap: {
    marginVertical: 4,
    marginHorizontal: 16,
    maxWidth: '75%',
  },
  bubbleWrapOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubbleWrapOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    color: colors.textMute,
    fontSize: 10,
    fontFamily: fonts.mono,
    letterSpacing: tracking.monoLoose,
    textTransform: 'uppercase',
    marginBottom: 2,
    marginLeft: 4,
  },
  timestamp: {
    color: colors.textMute,
    fontSize: 10,
    fontFamily: fonts.mono,
    letterSpacing: tracking.mono,
    marginTop: 4,
  },
  bubble: {
    borderRadius: radii.bubble,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOwn: {
    backgroundColor: colors.surfaceElevated,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextOwn: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
  },
  bubbleTextOther: {
    color: colors.text,
    fontFamily: fonts.body,
  },
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
    borderRadius: radii.bubble,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceHover,
  },
  sendArrow: {
    color: colors.accentInk,
    fontFamily: fonts.bodyBold,
    fontSize: 18,
  },
  sendArrowDisabled: {
    color: colors.textMute,
  },
  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textSoft,
  },
});
