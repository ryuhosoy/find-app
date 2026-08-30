import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, radius, spacing } from '../lib/theme';
import { CanvasBox, ShelfCanvas } from './ShelfCanvas';
import { ZoomableView } from './ZoomableView';

interface Props {
  visible: boolean;
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  boxes: CanvasBox[];
  onClose: () => void;
}

export function ImagePreviewModal({
  visible,
  imageUri,
  imageWidth,
  imageHeight,
  boxes,
  onClose,
}: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const { displayWidth, displayHeight } = useMemo(() => {
    const horizontalPad = spacing.md * 2;
    const footerHeight = 88 + insets.bottom;
    const topSpace = insets.top + spacing.md;
    const maxWidth = windowWidth - horizontalPad;
    const maxHeight = windowHeight - topSpace - footerHeight;

    const ratio = imageWidth > 0 && imageHeight > 0 ? imageHeight / imageWidth : 1;
    let w = maxWidth;
    let h = w * ratio;
    if (h > maxHeight) {
      h = maxHeight;
      w = h / ratio;
    }
    return { displayWidth: w, displayHeight: h };
  }, [windowWidth, windowHeight, imageWidth, imageHeight, insets.top, insets.bottom]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="閉じる"
        />

        <SafeAreaView style={styles.safe} edges={['top', 'bottom']} pointerEvents="box-none">
          <View style={styles.imageArea} pointerEvents="box-none">
            <View style={styles.imageSlot} pointerEvents="auto">
              <ZoomableView
                resetKey={visible ? imageUri : undefined}
                width={displayWidth}
                height={displayHeight}
              >
                <View style={[styles.imageWrap, { width: displayWidth, height: displayHeight }]}>
                  <ShelfCanvas
                    imageUri={imageUri}
                    imageWidth={imageWidth}
                    imageHeight={imageHeight}
                    boxes={boxes}
                    layoutWidth={displayWidth}
                  />
                </View>
              </ZoomableView>
            </View>
          </View>

          <View style={styles.footer} pointerEvents="box-none">
            <Pressable
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="閉じる"
            >
              <Text style={styles.closeText}>✕ 閉じる</Text>
            </Pressable>
            <Text style={styles.hint}>2本指でピンチして拡大・縮小</Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 14, 10, 0.92)',
  },
  safe: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  imageArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  closeBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  closeText: {
    ...font.bodyStrong,
    color: colors.surface,
  },
  hint: {
    ...font.caption,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});
