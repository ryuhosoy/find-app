import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, radius } from '../lib/theme';

type Tone = 'good' | 'info' | 'neutral' | 'accent' | 'warning';

interface Props {
  label: string;
  tone?: Tone;
}

const TONE_STYLES: Record<Tone, { bg: string; fg: string }> = {
  good: { bg: colors.goodSoft, fg: colors.good },
  info: { bg: colors.infoSoft, fg: colors.info },
  neutral: { bg: colors.surfaceMuted, fg: colors.inkSoft },
  accent: { bg: colors.accentSoft, fg: colors.accentDeep },
  warning: { bg: colors.highlightSoft, fg: '#8A6400' },
};

export function Badge({ label, tone = 'neutral' }: Props) {
  const t = TONE_STYLES[tone];
  return (
    <View style={[styles.wrap, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    ...font.tiny,
  },
});
