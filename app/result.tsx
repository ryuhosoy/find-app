import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImagePreviewModal } from '../components/ImagePreviewModal';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProductCard } from '../components/ProductCard';
import { CanvasBox, ShelfCanvas } from '../components/ShelfCanvas';
import { useSession } from '../lib/store';
import { colors, font, radius, shadow, spacing } from '../lib/theme';

export default function ResultScreen() {
  const { result, query, setImage, resetResult } = useSession();
  const [previewOpen, setPreviewOpen] = useState(false);

  const boxes: CanvasBox[] = useMemo(() => {
    if (!result) return [];
    if (result.recommended) {
      return [
        {
          key: 'recommended',
          box: result.recommended.box_2d,
          kind: 'primary',
        },
      ];
    }
    return result.matches.map((m, i) => ({
      key: `match-${i}`,
      box: m.box_2d,
      kind: 'primary' as const,
    }));
  }, [result]);

  const otherCandidates = useMemo(() => {
    if (!result?.recommended) return [];
    const recName = result.recommended.name;
    const seen = new Set<string>();
    return result.matches.filter((m) => {
      if (m.name === recName) return false;
      if (seen.has(m.name)) return false;
      seen.add(m.name);
      return true;
    });
  }, [result]);

  if (!result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>結果がありません。トップに戻ってやり直してください。</Text>
          <PrimaryButton label="トップへ戻る" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    );
  }

  const goRetry = () => {
    resetResult();
    router.back();
  };

  const goNewPhoto = () => {
    resetResult();
    setImage(null);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← 戻る</Text>
          </Pressable>
        </View>

        <Text style={styles.queryLabel}>「{query}」</Text>

        <ShelfCanvas
          imageUri={result.imageUri}
          imageWidth={result.imageWidth}
          imageHeight={result.imageHeight}
          boxes={boxes}
          onPress={() => setPreviewOpen(true)}
        />

        <ImagePreviewModal
          visible={previewOpen}
          imageUri={result.imageUri}
          imageWidth={result.imageWidth}
          imageHeight={result.imageHeight}
          boxes={boxes}
          onClose={() => setPreviewOpen(false)}
        />

        {!result.recommended && (
          <View style={styles.answerCard}>
            <Text style={styles.answerText}>{result.answer || (result.notFound ? '見つかりませんでした。' : '')}</Text>
          </View>
        )}

        {result.notFound && (
          <View style={styles.notFoundCard}>
            <Text style={styles.notFoundTitle}>🙈 見つかりませんでした</Text>
            <Text style={styles.notFoundBody}>
              言葉を変えてみるか、パッケージがはっきり写る角度でもう一度撮影してみてください。
            </Text>
          </View>
        )}

        {result.recommended && (
          <>
            <Text style={styles.sectionLabel}>🎯 イチオシ</Text>
            <ProductCard
              name={result.recommended.name}
              reason={result.recommended.reason}
              emphasis
            />
          </>
        )}

        {otherCandidates.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>比較した他の候補</Text>
            <View style={styles.candidateList}>
              {otherCandidates.map((m, i) => (
                <ProductCard
                  key={`${m.name}-${i}`}
                  name={m.name}
                  reason={m.note}
                  compact
                />
              ))}
            </View>
          </>
        )}

        {!result.recommended && result.matches.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>見つかった商品</Text>
            <View style={styles.candidateList}>
              {result.matches.map((m, i) => (
                <ProductCard key={`${m.name}-${i}`} name={m.name} reason={m.note} />
              ))}
            </View>
          </>
        )}

        <View style={styles.actionsRow}>
          <View style={styles.actionHalf}>
            <PrimaryButton label="もう一度きく" onPress={goRetry} variant="secondary" />
          </View>
          <View style={styles.actionHalf}>
            <PrimaryButton label="写真を変える" onPress={goNewPhoto} variant="ghost" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { paddingVertical: 6, paddingRight: spacing.sm },
  backText: { ...font.bodyStrong, color: colors.accentDeep },
  queryLabel: {
    ...font.title,
    fontSize: 19,
    color: colors.ink,
  },
  answerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.card,
  },
  answerText: {
    ...font.body,
    color: colors.ink,
    lineHeight: 22,
  },
  notFoundCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  notFoundTitle: { ...font.bodyStrong, color: colors.ink },
  notFoundBody: { ...font.caption, color: colors.inkSoft, lineHeight: 18 },
  sectionLabel: {
    ...font.subtitle,
    color: colors.inkSoft,
    marginTop: spacing.sm,
  },
  candidateList: {
    gap: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionHalf: { flex: 1 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  emptyText: {
    ...font.body,
    color: colors.inkSoft,
    textAlign: 'center',
  },
});
