import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, shadow, spacing } from '../lib/theme';
import type { Confidence, DbNutrition } from '../lib/types';
import { Badge } from './Badge';

interface Props {
  name: string;
  reason?: string;
  confidence: Confidence;
  db: DbNutrition | null;
  emphasis?: boolean;
}

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: '確信度: 高',
  medium: '確信度: 中',
  low: '確信度: 低（見え方によっては別商品の可能性）',
};

function NutritionRow({ db }: { db: DbNutrition }) {
  const items: { label: string; value: string }[] = [];
  if (db.calories_kcal !== null) items.push({ label: 'カロリー', value: `${db.calories_kcal}kcal` });
  if (db.caffeine_mg !== null) items.push({ label: 'カフェイン', value: `${db.caffeine_mg}mg` });
  if (db.sugar_g !== null) items.push({ label: '糖質', value: `${db.sugar_g}g` });
  if (db.price_yen !== null) items.push({ label: '価格目安', value: `¥${db.price_yen}` });

  if (items.length === 0) return null;

  return (
    <View style={styles.nutritionRow}>
      {items.map((it) => (
        <View key={it.label} style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{it.value}</Text>
          <Text style={styles.nutritionLabel}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function ProductCard({ name, reason, confidence, db, emphasis }: Props) {
  return (
    <View style={[styles.card, emphasis && styles.cardEmphasis, emphasis && shadow.card]}>
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        {db ? (
          <Badge label="🗄️ 自社DB確認済み" tone="good" />
        ) : (
          <Badge label="🤖 AI推定（参考値）" tone="neutral" />
        )}
      </View>

      {reason ? <Text style={styles.reason}>{reason}</Text> : null}

      {db && <NutritionRow db={db} />}

      <View style={styles.footerRow}>
        {db && db.tags.length > 0 && (
          <View style={styles.tagRow}>
            {db.tags.slice(0, 3).map((t) => (
              <Badge key={t} label={t} tone="info" />
            ))}
          </View>
        )}
        <Text style={styles.confidence}>{CONFIDENCE_LABEL[confidence]}</Text>
      </View>

      {!db && (
        <Text style={styles.disclaimer}>
          この商品は自社DBに未登録のため、数値はAIの一般知識による概算です。正確な値は必ずパッケージをご確認ください。
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  cardEmphasis: {
    borderColor: colors.accent,
    borderWidth: 1.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  name: {
    ...font.title,
    fontSize: 17,
    color: colors.ink,
    flex: 1,
  },
  reason: {
    ...font.body,
    color: colors.inkSoft,
    lineHeight: 21,
  },
  nutritionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  nutritionItem: {
    minWidth: 68,
  },
  nutritionValue: {
    ...font.bodyStrong,
    color: colors.ink,
  },
  nutritionLabel: {
    ...font.tiny,
    color: colors.inkFaint,
    marginTop: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  confidence: {
    ...font.tiny,
    color: colors.inkFaint,
  },
  disclaimer: {
    ...font.tiny,
    color: colors.inkFaint,
    lineHeight: 16,
  },
});
