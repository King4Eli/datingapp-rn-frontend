import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Animated, Easing, Modal, PanResponder, StyleProp, Text, TouchableOpacity, TouchableWithoutFeedback, View, ViewStyle } from "react-native";
import { screenHeight } from "./functions";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type CBottomSheetOptions = {
  onClose?: () => void;
  sheetHeight?: number; // fraction of screen height
  stylexj?: StyleProp<ViewStyle>;
  closeLabel?: React.ReactElement;
};

export type CBottomSheetRef = {
  open: (opts: CBottomSheetOptions) => void;
  close: () => void;
};

type CBottomSheetProps = {
  children?: React.ReactNode;
};

export const CBottomSheet = forwardRef<CBottomSheetRef, CBottomSheetProps>(({ children }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sheetOptions, setSheetOptions] = useState<CBottomSheetOptions | null>(null);

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const sheetHeightPixels = useMemo(() => {
    const fraction = Math.min(Math.max(sheetOptions?.sheetHeight ?? 0.65, 0.25), 0.95);
    return screenHeight * fraction;
  }, [sheetOptions?.sheetHeight]);

  const handleOpen = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: sheetHeightPixels,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      })
    ]).start(() => {
      sheetOptions?.onClose?.();
      setIsOpen(false);
      setSheetOptions(null);
    });
  };

  useEffect(() => {
    if (isOpen && sheetOptions) {
      translateY.setValue(sheetHeightPixels);
      handleOpen();
    }
  }, [isOpen, sheetHeightPixels]);

  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => {
        const next = Math.min(Math.max(0, g.dy), sheetHeightPixels);
        translateY.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const shouldClose = g.dy > sheetHeightPixels * 0.3 || g.vy > 1.2;
        if (shouldClose) {
          handleClose();
        } else {
          handleOpen();
        }
      }
    }), [sheetHeightPixels, sheetOptions]);

  useImperativeHandle(ref, () => ({
    open: (opts: CBottomSheetOptions) => {
      setSheetOptions(opts);
      setIsOpen(true);
    },
    close: handleClose
  }));

  const sheetStylexj = (sheetOptions?.stylexj || {}) as ViewStyle;

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', opacity: backdropOpacity }} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#fff',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          height: sheetHeightPixels,
          transform: [{ translateY }],
          paddingBottom: Number(sheetStylexj?.paddingBottom ?? 16) + insets.bottom,
        }, sheetOptions?.stylexj]}>
        <View {...panResponder.panHandlers} style={{ paddingTop: 10, paddingBottom: 6 }}>
          <View style={{ width: 48, height: 5, backgroundColor: '#2d3340', borderRadius: 3, alignSelf: 'center' }} />
        </View>

        {sheetOptions?.closeLabel && (
          <TouchableOpacity
            onPress={handleClose}
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.15)',
            }}
          >
            <Text style={{ color: '#0e1116', fontWeight: '700' }}>{sheetOptions?.closeLabel}</Text>
          </TouchableOpacity>
        )}

        <View style={[{ flex: 1, paddingHorizontal: sheetStylexj?.paddingHorizontal ?? 16 }, sheetOptions?.stylexj]}>
          {children}
        </View>
      </Animated.View>
    </Modal>
  );
});