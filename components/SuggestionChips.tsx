import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, spacing } from '../lib/theme';

const SUGGESTIONS = [
  '緑のモンスターはどこ？',
  '一番カロリーが低いお菓子は？',
  '黄色いパッケージはどれ？',
  '眠い、一番効くのはどれ？',
  'じゃがりこはどこ？',
  '甘いものが欲しい',
];

interface Props {
  onPick: (text: string) => void;
}

export function SuggestionChips({ onPick }: Props) {
  return (
    <View style={styles.wrap}>
      {SUGGESTIONS.map((s) => (
        <Pressable key={s} onPress={() => onPick(s)} style={styles.chip}>
          <Text style={styles.chipText}>{s}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    ...font.caption,
    color: colors.inkSoft,
  },
});
