import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontSizes, Spacing } from '../constants/theme';
import { chatAboutPerfume, PerfumeChatMessage, PerfumeResult } from '../services/api';
import { trackScreenView, trackChatMessageSent } from '../services/analytics';

type ChatRow = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function PerfumeChatScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ perfume?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const perfume = useMemo<PerfumeResult | null>(() => {
    if (!params.perfume || Array.isArray(params.perfume)) return null;
    try {
      return JSON.parse(params.perfume) as PerfumeResult;
    } catch {
      return null;
    }
  }, [params.perfume]);

  const [messages, setMessages] = useState<ChatRow[]>(() => {
    if (!perfume) {
      return [{ id: 'welcome', role: 'assistant', content: 'I could not load perfume details for chat.' }];
    }
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Ask me anything about ${perfume.brand} ${perfume.name} - notes, performance, seasons, occasions, layering, or alternatives.`,
      },
    ];
  });

  useEffect(() => {
    trackScreenView('perfume_chat');
  }, []);

  const canSend = Boolean(input.trim()) && !sending && Boolean(perfume);

  const onSend = async () => {
    if (!canSend || !perfume) return;
    const question = input.trim();
    setInput('');
    setError(null);

    trackChatMessageSent();
    const userMessage: ChatRow = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: question,
    };
    setMessages((prev) => [...prev, userMessage]);
    setSending(true);

    try {
      const history: PerfumeChatMessage[] = messages
        .filter((msg) => msg.id !== 'welcome')
        .map((msg) => ({ role: msg.role, content: msg.content }));
      const answer = await chatAboutPerfume(perfume, question, history);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: answer },
      ]);
    } catch (err: any) {
      setError(err?.message || 'Failed to get response. Please try again.');
    } finally {
      setSending(false);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 40);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Ask About This Perfume</Text>
          {perfume ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {perfume.brand} {perfume.name}
            </Text>
          ) : null}
        </View>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 10, android: 0 })}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chat}
          contentContainerStyle={[styles.chatContent, { paddingBottom: Spacing.xl }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text style={msg.role === 'user' ? styles.userText : styles.assistantText}>
                {msg.content}
              </Text>
            </View>
          ))}

          {sending ? (
            <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble]}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything about this perfume..."
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            multiline
            maxLength={600}
            editable={!sending && Boolean(perfume)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            activeOpacity={0.8}
            onPress={onSend}
            disabled={!canSend}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(200,148,60,0.25)',
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  title: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 2,
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    maxWidth: '92%',
  },
  chat: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  messageBubble: {
    maxWidth: '86%',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(200,148,60,0.2)',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primaryDark,
  },
  assistantText: {
    color: Colors.text,
    fontSize: FontSizes.md,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
    fontSize: FontSizes.md,
    lineHeight: 22,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(200,148,60,0.2)',
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 130,
    minHeight: 44,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 1,
    fontSize: FontSizes.md,
    color: Colors.text,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  errorText: {
    marginTop: Spacing.sm,
    color: '#ff8f8f',
    fontSize: FontSizes.sm,
    alignSelf: 'center',
  },
});
