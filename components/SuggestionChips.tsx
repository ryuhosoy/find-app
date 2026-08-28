import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, spacing } from '../lib/theme';
import type { AppMode } from '../lib/types';

const SUGGESTIONS: Record<AppMode, string[]> = {
  search: ['緑のモンスターはどこ？', '黄色いパッケージはどれ？', 'じゃがりこはどこ？', '一番安いお菓子は？'],
  recommend: ['一番カロリーが低いお菓子は？', '眠い、一番効くのはどれ？', '甘いものが欲しい', '小腹満たしにいいのは？'],
};

interface Props {
  mode: AppMode;
  onPick: (text: string) => void;
}

export function SuggestionChips({ mode, onPick }: Props) {
  return (
    <View style={styles.wrap}>
      {SUGGESTIONS[mode].map((s) => (
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
