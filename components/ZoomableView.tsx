import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

interface Props {
  children: React.ReactNode;
  width: number;
  height: number;
  /** 変わったタイミングでズーム位置をリセット（モーダル再表示など） */
  resetKey?: string | number | boolean;
}

/**
 * iOS の ScrollView ネイティブズームでピンチ拡大。
 * Expo Go でも動作し、追加ネイティブモジュール不要。
 */
export function ZoomableView({ children, width, height, resetKey }: Props) {
  return (
    <ScrollView
      key={String(resetKey ?? 'zoom')}
      style={[styles.container, { width, height }]}
      contentContainerStyle={[styles.contentContainer, { width, height }]}
      maximumZoomScale={4}
      minimumZoomScale={1}
      centerContent
      bouncesZoom
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ width, height }}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
