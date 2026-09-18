import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getSuggestions } from '../lib/i18n';
import { colors, font, radius, spacing } from '../lib/theme';

interface Props {
  onPick: (text: string) => void;
}

export function SuggestionChips({ onPick }: Props) {
  const suggestions = getSuggestions();

  return (
    <View style={styles.wrap}>
      {suggestions.map((s) => (
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
