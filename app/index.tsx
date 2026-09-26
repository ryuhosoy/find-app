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
import { t } from '../lib/i18n';
import { useSession } from '../lib/store';
import { colors, font, radius, shadow, spacing } from '../lib/theme';

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
    plan,
    usageLimit,
    remainingUses,
    hasReachedLimit,
    billingReady,
  } = useSession();

  const usageLabel =
    plan === 'weekly'
      ? t('planRemainingWeekly', { remaining: remainingUses, limit: usageLimit })
      : plan === 'monthly'
        ? t('planRemainingMonthly', { remaining: remainingUses, limit: usageLimit })
        : t('freeRemaining', { remaining: remainingUses, limit: usageLimit });

  const limitTitle = isPremium ? t('planLimitTitle') : t('freeLimitTitle');
  const limitBody = isPremium ? t('planLimitBody') : t('freeLimitBody');

  const pickFromLibrary = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('photoLibraryPermissionTitle'), t('photoLibraryPermissionBody'));
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
      Alert.alert(t('cameraPermissionTitle'), t('cameraPermissionBody'));
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
            <View>
              <View style={styles.usageRow}>
                <Text style={styles.usageText}>{usageLabel}</Text>
                {!isPremium ? (
                  <Pressable onPress={() => void openPaywall()} style={styles.upgradeChip}>
                    <Text style={styles.upgradeChipText}>{t('premium')}</Text>
                  </Pressable>
                ) : (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>{t('premiumActive')}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {hasReachedLimit && (
            <View style={styles.limitCard}>
              <Text style={styles.limitTitle}>{limitTitle}</Text>
              <Text style={styles.limitBody}>{limitBody}</Text>
              <PrimaryButton label={t('continueWithPremium')} onPress={() => void openPaywall()} />
            </View>
          )}

          {!hasApiKey && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>{t('apiKeyMissingTitle')}</Text>
              <Text style={styles.warningBody}>{t('apiKeyMissingBody')}</Text>
            </View>
          )}

          <Text style={styles.sectionLabel}>{t('sectionPhoto')}</Text>
          {image ? (
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: image.uri }} style={styles.imagePreview} contentFit="cover" />
              <View style={styles.imageActionsRow}>
                <Pressable style={styles.smallAction} onPress={takePhoto}>
                  <Text style={styles.smallActionText}>{t('retakePhoto')}</Text>
                </Pressable>
                <Pressable style={styles.smallAction} onPress={pickFromLibrary}>
                  <Text style={styles.smallActionText}>{t('rechoosePhoto')}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.pickerCard}>
              <Text style={styles.pickerEmoji}>📸</Text>
              <Text style={styles.pickerTitle}>{t('pickerTitle')}</Text>
              <Text style={styles.pickerSubtitle}>{t('pickerSubtitle')}</Text>
              <View style={styles.pickerButtonsRow}>
                <PrimaryButton label={t('takePhoto')} onPress={takePhoto} variant="primary" />
              </View>
              <View style={styles.pickerButtonsRow}>
                <PrimaryButton
                  label={t('pickFromLibrary')}
                  onPress={pickFromLibrary}
                  variant="secondary"
                />
              </View>
            </View>
          )}

          <Text style={styles.sectionLabel}>{t('sectionQuery')}</Text>
          <View style={styles.inputCard}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('queryPlaceholder')}
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
                <Text style={styles.errorDismiss}>{t('dismiss')}</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.submitWrap}>
            <PrimaryButton
              label={hasReachedLimit ? t('continueWithPremium') : t('search')}
              onPress={hasReachedLimit ? () => void openPaywall() : onSubmit}
              loading={loading}
              disabled={hasReachedLimit ? false : !image || !query.trim()}
            />
            {loading && <Text style={styles.loadingHint}>{t('loadingHint')}</Text>}
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
