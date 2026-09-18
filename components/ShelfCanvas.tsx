import { Image } from 'expo-image';
import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';

import { t } from '../lib/i18n';
import { colors, radius } from '../lib/theme';
import type { Box2D } from '../lib/types';

export interface CanvasBox {
  key: string;
  box: Box2D;
  kind: 'primary' | 'secondary';
}

interface Props {
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  boxes: CanvasBox[];
  onPress?: () => void;
  /** 親で幅が決まっている場合（モーダル等）。省略時は onLayout で計測 */
  layoutWidth?: number;
}

/** 0-1 正規化座標 → CSS パーセント */
const pct = (n: number) => `${(n * 100).toFixed(2)}%` as unknown as `${number}%`;

export function ShelfCanvas({
  imageUri,
  imageWidth,
  imageHeight,
  boxes,
  onPress,
  layoutWidth: layoutWidthProp,
}: Props) {
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const containerWidth = layoutWidthProp ?? measuredWidth;
  const aspectRatio = imageWidth > 0 && imageHeight > 0 ? imageWidth / imageHeight : 1;
  const displayHeight = containerWidth > 0 ? containerWidth / aspectRatio : 0;

  const onLayout = (e: LayoutChangeEvent) => {
    if (layoutWidthProp != null) return;
    const w = e.nativeEvent.layout.width;
    if (w > 0) setMeasuredWidth(w);
  };

  const drawOrder = [...boxes].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'secondary' ? -1 : 1));

  const wrapStyle = [
    styles.wrap,
    layoutWidthProp == null && { aspectRatio },
    layoutWidthProp != null && containerWidth > 0 && { width: containerWidth, height: displayHeight },
  ];

  const canvas =
    containerWidth > 0 ? (
      <View style={{ width: containerWidth, height: displayHeight }}>
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="fill" transition={150} />
        {drawOrder.map((b) => {
          const [x1, y1, x2, y2] = b.box;
          const isPrimary = b.kind === 'primary';

          return (
            <View
              key={b.key}
              pointerEvents="none"
              style={[
                styles.box,
                {
                  left: pct(x1),
                  top: pct(y1),
                  width: pct(Math.max(x2 - x1, 0)),
                  height: pct(Math.max(y2 - y1, 0)),
                },
                isPrimary ? styles.boxPrimary : styles.boxSecondary,
              ]}
            />
          );
        })}
      </View>
    ) : null;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onLayout={onLayout}
        style={({ pressed }) => [...wrapStyle, pressed && styles.wrapPressed]}
        accessibilityRole="button"
        accessibilityLabel={t('resultImageA11y')}
      >
        {canvas}
      </Pressable>
    );
  }

  return (
    <View style={wrapStyle} onLayout={onLayout}>
      {canvas}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  wrapPressed: {
    opacity: 0.92,
  },
  box: {
    position: 'absolute',
    borderRadius: 10,
  },
  boxPrimary: {
    borderWidth: 3,
    borderColor: colors.overlayRecommend,
  },
  boxSecondary: {
    borderWidth: 2,
    borderColor: colors.overlayCandidate,
    borderStyle: 'dashed',
  },
});
