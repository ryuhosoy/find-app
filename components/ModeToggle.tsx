import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, spacing } from '../lib/theme';
import type { AppMode } from '../lib/types';

interface Option {
  mode: AppMode;
  title: string;
  subtitle: string;
  emoji: string;
}

const OPTIONS: Option[] = [
  { mode: 'search', title: 'さがす', subtitle: '色や名前でピンポイント検索', emoji: '🔎' },
  { mode: 'recommend', title: 'えらんで', subtitle: '条件に合う一番を提案', emoji: '✨' },
];

interface Props {
  value: AppMode;
  onChange: (mode: AppMode) => void;
}

export function ModeToggle({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const active = opt.mode === value;
        return (
          <Pressable
            key={opt.mode}
            onPress={() => onChange(opt.mode)}
            style={[styles.card, active && styles.cardActive]}
          >
            <Text style={styles.emoji}>{opt.emoji}</Text>
            <Text style={[styles.title, active && styles.titleActive]}>{opt.title}</Text>
            <Text style={[styles.subtitle, active && styles.subtitleActive]}>{opt.subtitle}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  cardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  emoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  title: {
    ...font.bodyStrong,
    color: colors.ink,
    marginBottom: 2,
  },
  titleActive: {
    color: colors.accentDeep,
  },
  subtitle: {
    ...font.caption,
    color: colors.inkFaint,
  },
  subtitleActive: {
    color: colors.accentDeep,
    opacity: 0.8,
  },
});
