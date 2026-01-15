import { useState, useRef, useEffect } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IIcon from 'react-native-vector-icons/Ionicons';
import { screenWidth } from "./functions";

let showToastFunc: (opts: any) => void;
export const Toastx = () => {
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' | 'warning'; duration?: number; icon?: string } | null>(null);
  const [opacity] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(-24));
  const inset = useSafeAreaInsets();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const theme = {
    success: { bg: '#e8f7ef', text: '#0f5132', border: '#b7e4c7', icon: 'checkmark-circle' },
    error: { bg: '#fdecec', text: '#842029', border: '#f5c2c7', icon: 'alert-circle' },
    info: { bg: '#e7f1ff', text: '#0a4fa3', border: '#cfe2ff', icon: 'information-circle' },
    warning: { bg: '#fff4e5', text: '#9c5700', border: '#ffe0b2', icon: 'alert' },
    default: { bg: '#1f2937', text: '#f9fafb', border: '#374151', icon: 'information-circle' }
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -24, duration: 200, useNativeDriver: true })
    ]).start(() => setToast(null));
  };

  useEffect(() => {
    showToastFunc = (opts) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast(opts);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true })
      ]).start();

      const dur = opts.duration && opts.duration > 0 ? opts.duration : 3500;
      timerRef.current = setTimeout(() => {
        hideToast();
      }, dur);
    };

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!toast) return null;

  const palette = theme[toast.type ?? 'default'];
  const iconName = toast.icon ?? palette.icon;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        zIndex: 1000,
        position: 'absolute',
        left: 0,
        right: 0,
        top: inset.top + 24,
        alignItems: 'center',
        opacity,
        transform: [{ translateY }]
      }}>
      <Pressable
        onPress={hideToast}
        style={{
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: 1,
          paddingHorizontal: 14,
          paddingVertical: 12,
          minWidth: screenWidth / 1.2,
          maxWidth: screenWidth - 32,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,

          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 12,
          elevation: 6,
        }}>
        <IIcon name={iconName} size={22} color={palette.text} />
        <Text style={{ color: palette.text, fontWeight: '600', flex: 1, lineHeight: 20 }}>
          {toast.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
};
Toastx.show = ({ message, type, duration = 5500, icon }: { message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number, icon?: string }) => {
  if (showToastFunc) {
    showToastFunc({ message, type, duration, icon });
  } else {
    console.warn('Toast is not mounted yet.');
  }
};

//*************************
//
// 
type NotificationOptions = {
  title?: string;
  message: React.ReactElement | string;
  duration?: number;
  type?: 'success' | 'error' | 'info' | 'warning' | 'default';
  icon?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  onPress?: () => void;
};

let showInappNotificationFunc: (opts: NotificationOptions) => void;

export class InappNotification {
  public static NotificationComponent = () => {
    const [notification, setNotification] = useState<NotificationOptions | null>(null);
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-40)).current;
    const inset = useSafeAreaInsets();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const colors = {
      success: { bg: '#e8f7ef', text: '#0f5132', icon: 'checkmark-circle' },
      error: { bg: '#fdecec', text: '#842029', icon: 'alert-circle' },
      info: { bg: '#e7f1ff', text: '#0a4fa3', icon: 'information-circle' },
      warning: { bg: '#fff4e5', text: '#9c5700', icon: 'alert' },
      default: { bg: '#1f2937', text: '#f9fafb', icon: 'information-circle' },
    };

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const hideNotification = () => {
      clearTimer();
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -40, duration: 180, useNativeDriver: true }),
      ]).start(() => setNotification(null));
    };

    const showNotification = (opts: NotificationOptions) => {
      clearTimer();
      setNotification(opts);
      opacity.setValue(0);
      translateY.setValue(-40);

      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();

      const duration = opts.duration && opts.duration > 0 ? opts.duration : 4000;
      if (duration > 0) {
        timerRef.current = setTimeout(hideNotification, duration);
      }
    };

    useEffect(() => {
      showInappNotificationFunc = showNotification;
      return clearTimer;
    }, []);

    if (!notification) return null;
    const palette = colors[notification.type ?? 'default'];

    return (
      <Animated.View
        pointerEvents="box-none"
        style={[
          stylexs.container,
          { top: inset.top + 12, opacity, transform: [{ translateY }] },
        ]}
      >
        <Pressable
          onPress={() => {
            notification.onPress?.();
            hideNotification();
          }}
          style={[stylexs.notification, { backgroundColor: palette.bg }]}
        >
          <View style={stylexs.content}>
            <View style={stylexs.iconContainer}>
              <View style={[stylexs.iconBackground, { backgroundColor: `${palette.text}12` }]}>
                <IIcon name={notification.icon ?? palette.icon} size={20} color={palette.text} />
              </View>
            </View>

            <View style={stylexs.textContent}>
              {notification.title ? (
                <Text style={[stylexs.title, { color: palette.text }]}>{notification.title}</Text>
              ) : null}
              {typeof notification.message === 'string' ? (
                <Text style={[stylexs.message, { color: palette.text }]}>{notification.message}</Text>
              ) : (
                notification.message
              )}

              {notification.actionLabel ? (
                <TouchableOpacity
                  style={stylexs.actionButton}
                  onPress={() => {
                    notification.onActionPress?.();
                    hideNotification();
                  }}
                >
                  <Text style={[stylexs.actionLabel, { color: palette.text }]}>
                    {notification.actionLabel}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity onPress={hideNotification} style={stylexs.closeButton}>
              <IIcon name="close" size={18} color={palette.text} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  public static show = (options: NotificationOptions) => {
    showInappNotificationFunc?.(options);
  };
}
const stylexs = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  notification: {
    width: screenWidth - 24,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  content: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { marginRight: 12 },
  iconBackground: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: { flex: 1, gap: 4 },
  title: { fontSize: 15, fontWeight: '700' },
  message: { fontSize: 14, lineHeight: 20 },
  actionButton: { alignSelf: 'flex-start', marginTop: 6 },
  actionLabel: { fontSize: 14, fontWeight: '600' },
  closeButton: { padding: 6, marginLeft: 10 },
});
//***********************************
//
//