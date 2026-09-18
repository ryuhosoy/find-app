import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { t } from '../lib/i18n';
import { colors, font, radius, shadow, spacing } from '../lib/theme';
import { Badge } from './Badge';

interface Props {
  name: string;
  reason?: string;
  emphasis?: boolean;
  /** 候補リストなど、短い注記のみの表示 */
  compact?: boolean;
}

export function ProductCard({ name, reason, emphasis, compact }: Props) {
  return (
    <View style={[styles.card, emphasis && styles.cardEmphasis, emphasis && shadow.card]}>
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Badge label={t('aiJudgment')} tone="neutral" />
      </View>

      {reason ? <Text style={styles.reason}>{reason}</Text> : null}

      {!compact && <Text style={styles.disclaimer}>{t('productDisclaimer')}</Text>}
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
  disclaimer: {
    ...font.tiny,
    color: colors.inkFaint,
    lineHeight: 16,
  },
});
