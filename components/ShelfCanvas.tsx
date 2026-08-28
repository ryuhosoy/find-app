import { Image } from 'expo-image';
import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius } from '../lib/theme';
import type { Box2D } from '../lib/types';

export interface CanvasBox {
  key: string;
  box: Box2D;
  label: string;
  kind: 'primary' | 'secondary';
}

interface Props {
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  boxes: CanvasBox[];
}

/** 0-1 正規化座標 → CSS パーセント */
const pct = (n: number) => `${(n * 100).toFixed(2)}%` as unknown as `${number}%`;

export function ShelfCanvas({ imageUri, imageWidth, imageHeight, boxes }: Props) {
  const [containerWidth, setContainerWidth] = useState(0);
  const ratio = imageWidth > 0 && imageHeight > 0 ? imageHeight / imageWidth : 1;
  const displayHeight = containerWidth * ratio;

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  // 見切れて重ならないよう、上端に近い枠だけラベルを内側下向きに出す
  const secondariesFirst = [...boxes].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'secondary' ? -1 : 1));

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      {containerWidth > 0 && (
        <View style={{ width: containerWidth, height: displayHeight }}>
          <Image
            source={{ uri: imageUri }}
            style={StyleSheet.absoluteFill}
            // コンテナ縦横比は画像と一致させているので fill で 1:1。cover だと端が切れて枠がズレる
            contentFit="fill"
            transition={150}
          />
          {secondariesFirst.map((b) => {
            const [x1, y1, x2, y2] = b.box;
            const isPrimary = b.kind === 'primary';
            const labelBelow = y1 < 0.09; // 上端近くなら枠の内側上に表示

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
              >
                <View
                  style={[
                    styles.labelWrap,
                    labelBelow ? styles.labelInside : styles.labelAbove,
                    isPrimary ? styles.labelPrimary : styles.labelSecondary,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.labelText, isPrimary ? styles.labelTextPrimary : styles.labelTextSecondary]}
                  >
                    {isPrimary ? `🎯 ${b.label}` : b.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
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
  box: {
    position: 'absolute',
    borderRadius: 10,
  },
  boxPrimary: {
    borderWidth: 3,
    borderColor: colors.overlayRecommend,
    backgroundColor: 'rgba(255, 107, 61, 0.16)',
  },
  boxSecondary: {
    borderWidth: 2,
    borderColor: colors.overlayCandidate,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(156, 146, 127, 0.08)',
  },
  labelWrap: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    maxWidth: 180,
  },
  labelAbove: {
    left: 0,
    top: -26,
  },
  labelInside: {
    left: 4,
    top: 4,
  },
  labelPrimary: {
    backgroundColor: colors.overlayRecommend,
  },
  labelSecondary: {
    backgroundColor: 'rgba(33, 26, 20, 0.72)',
  },
  labelText: {
    ...font.tiny,
  },
  labelTextPrimary: {
    color: colors.surface,
  },
  labelTextSecondary: {
    color: colors.surface,
  },
});
