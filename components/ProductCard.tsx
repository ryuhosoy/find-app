import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, shadow, spacing } from '../lib/theme';
import type { Confidence } from '../lib/types';
import { Badge } from './Badge';

interface Props {
  name: string;
  reason?: string;
  confidence: Confidence;
  emphasis?: boolean;
  /** 候補リストなど、短い注記のみの表示 */
  compact?: boolean;
}

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: '確信度: 高',
  medium: '確信度: 中',
  low: '確信度: 低（見え方によっては別商品の可能性）',
};

export function ProductCard({ name, reason, confidence, emphasis, compact }: Props) {
  return (
    <View style={[styles.card, emphasis && styles.cardEmphasis, emphasis && shadow.card]}>
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Badge label="🤖 AI判断" tone="neutral" />
      </View>

      {reason ? <Text style={styles.reason}>{reason}</Text> : null}

      <Text style={styles.confidence}>{CONFIDENCE_LABEL[confidence]}</Text>

      {!compact && (
        <Text style={styles.disclaimer}>
          商品名・理由・数値はAIの判断です。正確な情報は必ずパッケージをご確認ください。
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
