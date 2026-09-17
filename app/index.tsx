import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import {
  Alert,
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

import { PrimaryButton } from '../components/PrimaryButton';
import { SuggestionChips } from '../components/SuggestionChips';
import { FREE_ANALYSIS_LIMIT } from '../lib/constants/subscription';
import { useSession } from '../lib/store';
import { colors, font, radius, shadow, spacing } from '../lib/theme';

const PLACEHOLDER = '例：緑のモンスターはどこ？ / 一番カロリーが低いお菓子は？';

export default function HomeScreen() {
  const {
    image,
    setImage,
    query,
    setQuery,
    loading,
    error,
    clearError,
    runAnalysis,
    openPaywall,
    hasApiKey,
    isPremium,
    remainingUses,
    hasReachedLimit,
    billingReady,
  } = useSession();

  const pickFromLibrary = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('写真ライブラリへのアクセスが必要です', '設定アプリから許可してください。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setImage({ uri: a.uri, width: a.width, height: a.height });
    }
  }, [setImage]);

  const takePhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('カメラへのアクセスが必要です', '設定アプリから許可してください。');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setImage({ uri: a.uri, width: a.width, height: a.height });
    }
  }, [setImage]);

  const onSubmit = useCallback(async () => {
    const ok = await runAnalysis();
    if (ok) router.push('/result');
  }, [runAnalysis]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={16}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {billingReady && (
            <View style={styles.header}>
              {!isPremium ? (
                <View style={styles.usageRow}>
                  <Text style={styles.usageText}>
                    無料残り {remainingUses}/{FREE_ANALYSIS_LIMIT} 回
                  </Text>
                  <Pressable onPress={() => void openPaywall()} style={styles.upgradeChip}>
                    <Text style={styles.upgradeChipText}>プレミアム</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>プレミアム利用中</Text>
                </View>
              )}
            </View>
          )}

          {hasReachedLimit && (
            <View style={styles.limitCard}>
              <Text style={styles.limitTitle}>無料枠を使い切りました</Text>
              <Text style={styles.limitBody}>
                プレミアムに加入すると、何度でも棚を解析できます。
              </Text>
              <PrimaryButton label="プレミアムで続ける" onPress={() => void openPaywall()} />
            </View>
          )}

          {!hasApiKey && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>⚠️ APIキー未設定</Text>
              <Text style={styles.warningBody}>
                .env に EXPO_PUBLIC_ANTHROPIC_API_KEY を設定して開発サーバーを再起動してください。詳しくは
                README をご覧ください。
              </Text>
            </View>
          )}

          <Text style={styles.sectionLabel}>1. 棚の写真</Text>
          {image ? (
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: image.uri }} style={styles.imagePreview} contentFit="cover" />
              <View style={styles.imageActionsRow}>
                <Pressable style={styles.smallAction} onPress={takePhoto}>
                  <Text style={styles.smallActionText}>📷 撮り直す</Text>
                </Pressable>
                <Pressable style={styles.smallAction} onPress={pickFromLibrary}>
                  <Text style={styles.smallActionText}>🖼️ 選び直す</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.pickerCard}>
              <Text style={styles.pickerEmoji}>📸</Text>
              <Text style={styles.pickerTitle}>棚の写真を用意しよう</Text>
              <Text style={styles.pickerSubtitle}>商品パッケージがはっきり写るように撮ってね</Text>
              <View style={styles.pickerButtonsRow}>
                <PrimaryButton label="写真を撮る" onPress={takePhoto} variant="primary" />
              </View>
              <View style={styles.pickerButtonsRow}>
                <PrimaryButton label="ライブラリから選ぶ" onPress={pickFromLibrary} variant="secondary" />
              </View>
            </View>
          )}

          <Text style={styles.sectionLabel}>2. 要望</Text>
          <View style={styles.inputCard}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={PLACEHOLDER}
              placeholderTextColor={colors.inkFaint}
              style={styles.input}
              multiline
            />
          </View>
          <SuggestionChips onPick={setQuery} />

          {error && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={clearError}>
                <Text style={styles.errorDismiss}>閉じる</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.submitWrap}>
            <PrimaryButton
              label={hasReachedLimit ? 'プレミアムで続ける' : 'さがす'}
              onPress={hasReachedLimit ? () => void openPaywall() : onSubmit}
              loading={loading}
              disabled={hasReachedLimit ? false : !image || !query.trim()}
            />
            {loading && (
              <Text style={styles.loadingHint}>AIが棚を確認しています…（数秒〜10秒ほど）</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    marginBottom: spacing.sm,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  usageText: {
    ...font.caption,
    color: colors.inkSoft,
  },
  upgradeChip: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  upgradeChipText: {
    ...font.tiny,
    color: colors.accentDeep,
  },
  premiumBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.goodSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  premiumBadgeText: {
    ...font.tiny,
    color: colors.good,
  },
  limitCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  limitTitle: { ...font.bodyStrong, color: colors.accentDeep },
  limitBody: { ...font.caption, color: colors.inkSoft, lineHeight: 18 },
  warningCard: {
    backgroundColor: colors.highlightSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  warningTitle: { ...font.bodyStrong, color: '#8A6400' },
  warningBody: { ...font.caption, color: '#8A6400', lineHeight: 18 },
  sectionLabel: {
    ...font.subtitle,
    color: colors.inkSoft,
    marginTop: spacing.sm,
  },
  pickerCard: {
    borderWidth: 2,
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
  },
  pickerEmoji: { fontSize: 36 },
  pickerTitle: { ...font.title, fontSize: 17, color: colors.ink },
  pickerSubtitle: { ...font.caption, color: colors.inkFaint, marginBottom: spacing.sm, textAlign: 'center' },
  pickerButtonsRow: {
    width: '100%',
    marginTop: spacing.xs,
  },
  imagePreviewWrap: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    ...shadow.card,
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  imageActionsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  smallAction: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingVertical: 10,
    alignItems: 'center',
  },
  smallActionText: { ...font.caption, color: colors.ink },
  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 64,
  },
  input: {
    ...font.body,
    color: colors.ink,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  errorCard: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  errorText: {
    ...font.caption,
    color: colors.danger,
    flex: 1,
    lineHeight: 18,
  },
  errorDismiss: {
    ...font.tiny,
    color: colors.danger,
    textDecorationLine: 'underline',
  },
  submitWrap: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  loadingHint: {
    ...font.caption,
    color: colors.inkFaint,
    textAlign: 'center',
  },
});
