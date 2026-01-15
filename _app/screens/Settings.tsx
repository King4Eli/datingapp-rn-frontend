import React, { useState, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Linking, Alert, Share, TouchableOpacity, TextInput, Platform, Animated, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { sessionManager } from '../funcs/SessionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, namer, styles } from '../funcs/static';
import { __init__app, _http_request, hostServer, llStorage } from '../funcs/functions';
import appJson from '../../app.json';
import RNRestart from 'react-native-restart';
import DeviceInfo from 'react-native-device-info';
import { SafeAreaView } from 'react-native-safe-area-context';
import IIcon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { CBottomSheet, CBottomSheetRef } from '../funcs/customBottomSheet';
import { InappNotification, Toastx } from '../funcs/customNotification';
import { CarouselRef, ControlledCarousel } from '../funcs/customCarousel';


// Modern color palette
const MODERN_COLORS = {
  primary: '#FF3B6B',
  secondary: '#6C63FF',
  accent: '#4ECDC4',
  background: '#F8F9FF',
  surface: '#FFFFFF',
  text: '#1F1F1F',
  textSecondary: '#666666',
  textTertiary: '#999999',
  border: '#E8E9FF',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  premium: '#FFD166',
  dark: '#121212',
  overlay: 'rgba(0, 0, 0, 0.5)',
};






export function Screen_settings({ navigation }: { navigation: any }) {
  const [getProfile, setProfile] = useState(llStorage.currentProfile.get()?.currentUser);
  const __MAPPER = llStorage.CONFIG.get()?.mapper;

  const [getAllowOnlyVerified, setAllowOnlyVerified] = useState(getProfile?.messagefromonlyverified ?? false);
  const [getSnoozeAccount, setSnoozeAccount] = useState(getProfile?.snooze ?? false);

  const activeSubscription = getProfile?.user_effect?.has_active_subscription ?? false;
  const userSubscriptionStep1 = activeSubscription && getProfile?.user_effect?.subscription_plan === "plus";
  const userSubscriptionStep2 = activeSubscription && getProfile?.user_effect?.subscription_plan === "vip";

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  // Use the correct ref type
  const bottomSheetRef_notifications = useRef<CBottomSheetRef>(null);
  const bottomSheetRef_feedback = useRef<CBottomSheetRef>(null);
  const bottomSheetRef_support = useRef<CBottomSheetRef>(null);
  const bottomSheetRef_payment = useRef<CBottomSheetRef>(null);
  const bottomSheetRef_null = useRef<CBottomSheetRef>(null);
  const bottomSheetRef_email = useRef<CBottomSheetRef>(null);
  const bottomSheetRef_phone = useRef<CBottomSheetRef>(null);

  // Profile header with modern design
  const ProfileHeader = () => (
    <Animated.View style={[modernStyles.profileHeader, { opacity: headerOpacity }]}>
      <LinearGradient
        colors={['#FF3B6B', '#FF6B8B']}
        style={modernStyles.profileGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={modernStyles.profileInfo}>
          <View style={modernStyles.avatarContainer}>
            <View style={modernStyles.avatar}>
              <Text style={modernStyles.avatarText}>
                {getProfile?.user_name?.charAt(0) || 'U'}
              </Text>
            </View>
            {activeSubscription && (
              <View style={modernStyles.premiumBadge}>
                <Feather name="star" size={12} color="#FFF" />
              </View>
            )}
          </View>
          <View style={modernStyles.profileDetails}>
            <Text style={modernStyles.profileName}>{getProfile?.user_fullname || 'User'}</Text>


          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  // Modern card component
  const ModernCard = ({ children, style, gradient = false }: any) => (
    gradient ? (
      <LinearGradient
        colors={['#6C63FF', '#8B63FF']}
        style={[modernStyles.card, modernStyles.cardGradient, style]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {children}
      </LinearGradient>
    ) : (
      <View style={[modernStyles.card, style]}>
        {children}
      </View>
    )
  );

  // Modern option item
  const ModernOption = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    danger = false,
    premium = false
  }: any) => (
    <TouchableOpacity
      style={modernStyles.optionItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={modernStyles.optionLeft}>
        <View style={[
          modernStyles.optionIcon,
          danger && modernStyles.optionIconDanger,
          premium && modernStyles.optionIconPremium
        ]}>
          <IIcon
            name={icon}
            size={20}
            color={danger ? MODERN_COLORS.error : premium ? MODERN_COLORS.premium : MODERN_COLORS.primary}
          />
        </View>
        <View style={modernStyles.optionContent}>
          <Text style={[
            modernStyles.optionTitle,
            danger && modernStyles.optionTitleDanger
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={modernStyles.optionSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightElement || (
        <IIcon name="chevron-forward" size={20} color={MODERN_COLORS.textTertiary} />
      )}
    </TouchableOpacity>
  );

  // Modern switch item
  const ModernSwitch = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
    premiumLock = false
  }: any) => (
    <View style={modernStyles.switchItem}>
      <View style={modernStyles.switchLeft}>
        <View style={modernStyles.switchIcon}>
          <IIcon name={icon} size={20} color={MODERN_COLORS.primary} />
        </View>
        <View style={modernStyles.switchContent}>
          <Text style={modernStyles.switchTitle}>{title}</Text>
          {subtitle && (
            <Text style={modernStyles.switchSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={() => {
          if (premiumLock && !userSubscriptionStep2) {
            Toastx.show({
              type: "warning",
              message: "Upgrade to VIP to unlock this feature",
              duration: 3000
            });
            navigation.push(namer.navigation.coin, { tab: "vip" });
          } else {
            onValueChange(!value);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={[
          modernStyles.switchTrack,
          value && modernStyles.switchTrackActive,
          premiumLock && !userSubscriptionStep2 && modernStyles.switchTrackDisabled
        ]}>
          <View style={[
            modernStyles.switchThumb,
            value && modernStyles.switchThumbActive
          ]} />
        </View>
      </TouchableOpacity>
    </View>
  );

  // Modern section header
  const ModernSection = ({ title, icon, children }: any) => (
    <View style={modernStyles.section}>
      <View style={modernStyles.sectionHeader}>
        <View style={modernStyles.sectionIcon}>
          <IIcon name={icon} size={18} color={MODERN_COLORS.primary} />
        </View>
        <Text style={modernStyles.sectionTitle}>{title}</Text>
      </View>
      <ModernCard>
        {children}
      </ModernCard>
    </View>
  );

  // Quick actions bar
  const QuickActions = () => (
    <View style={modernStyles.quickActions}>
      <TouchableOpacity
        style={modernStyles.quickAction}
        onPress={() => bottomSheetRef_support.current?.open({
          sheetHeight: 0.9,
        })}
      >
        <LinearGradient
          colors={['#6C63FF', '#8B63FF']}
          style={modernStyles.quickActionIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="help-circle" size={20} color="#FFF" />
        </LinearGradient>
        <Text style={modernStyles.quickActionText}>Support</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={modernStyles.quickAction}
        onPress={() => bottomSheetRef_feedback.current?.open({
          sheetHeight: 0.9,
        })}
      >
        <LinearGradient
          colors={['#34C759', '#4CD964']}
          style={modernStyles.quickActionIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="message-square" size={20} color="#FFF" />
        </LinearGradient>
        <Text style={modernStyles.quickActionText}>Feedback</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={modernStyles.quickAction}
        onPress={async () => {
          await Share.share({
            title: `Join me on ${appJson?.displayName}!`,
            message: `I'm using ${appJson?.displayName} to meet amazing people. Join me!`,
          });
        }}
      >
        <LinearGradient
          colors={['#FF3B6B', '#FF6B8B']}
          style={modernStyles.quickActionIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="share-2" size={20} color="#FFF" />
        </LinearGradient>
        <Text style={modernStyles.quickActionText}>Share</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={modernStyles.quickAction}
        onPress={() => bottomSheetRef_payment.current?.open({
          sheetHeight: 0.9,
        })}
      >
        <LinearGradient
          colors={['#FFD166', '#FFB347']}
          style={modernStyles.quickActionIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="crown" size={20} color="#FFF" />
        </LinearGradient>
        <Text style={modernStyles.quickActionText}>Premium</Text>
      </TouchableOpacity>
    </View>
  );


  // Email Change Flow Component
  const EmailChangeFlow = ({
    currentEmail,
    onComplete,
    onCancel
  }: {
    currentEmail: string,
    onComplete: () => void,
    onCancel: () => void
  }) => {
    const [step, setStep] = useState(0);
    const [newEmail, setNewEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const carouselRef = useRef<CarouselRef>(null);

    const steps = [
      {
        title: "Change Email",
        subtitle: "Enter your new email address",
        content: (
          <View style={modernStyles.flowContainer}>
            <View style={modernStyles.currentInfo}>
              <Text style={modernStyles.currentLabel}>Current Email</Text>
              <Text style={modernStyles.currentValue}>{currentEmail}</Text>
            </View>

            <View style={modernStyles.inputGroup}>
              <Text style={modernStyles.inputLabel}>New Email Address</Text>
              <TextInput
                style={modernStyles.input}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none" multiline
                value={newEmail}
                onChangeText={(text) => {
                  setNewEmail(text);
                  setError('');
                }}
                editable={!isLoading}
              />
            </View>

            {error ? <Text style={modernStyles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[
                modernStyles.primaryButton,
                (!newEmail || isLoading) && modernStyles.buttonDisabled
              ]}
              onPress={async () => {
                if (!newEmail || newEmail === currentEmail) {
                  setError("Please enter a different email address");
                  return;
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(newEmail)) {
                  setError("Please enter a valid email address");
                  return;
                }

                setIsLoading(true);
                setError('');

                try {
                  const response = await _http_request({
                    customApiUrl: hostServer() + "/api/core/v1/pushNewEmail",
                    reqType: 'POST',
                    bodyArray: {
                      oldemail: currentEmail,
                      newemail: newEmail,
                      rnc: "1",
                    }
                  });

                  if (response?.code === 200) {
                    setSuccessMessage("Verification code sent to your new email");
                    carouselRef.current?.goToNext();
                  } else {
                    setError(response?.message || "Failed to send verification");
                  }
                } catch (err) {
                  setError("Network error. Please try again.");
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={!newEmail || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={modernStyles.primaryButtonText}>Send Verification Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={modernStyles.secondaryButton}
              onPress={onCancel}
            >
              <Text style={modernStyles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )
      },
      {
        title: "Verify Email",
        subtitle: "Enter the 6-digit code sent to your new email",
        content: (
          <View style={modernStyles.flowContainer}>
            <View style={modernStyles.infoBox}>
              <IIcon name="mail-outline" size={24} color={MODERN_COLORS.primary} />
              <Text style={modernStyles.infoText}>
                Code sent to: <Text style={{ fontWeight: 'bold' }}>{newEmail}</Text>
              </Text>
            </View>

            <View style={modernStyles.inputGroup}>
              <Text style={modernStyles.inputLabel}>Verification Code</Text>
              <TextInput
                style={modernStyles.input}
                placeholder="Enter 6-digit code"
                keyboardType="number-pad"
                maxLength={6}
                value={verificationCode}
                onChangeText={(text) => {
                  setVerificationCode(text.replace(/[^0-9]/g, ''));
                  setError('');
                }}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={modernStyles.resendButton}
              onPress={async () => {
                setIsLoading(true);
                try {
                  const response = await _http_request({
                    customApiUrl: hostServer() + "/api/core/v1/pushNewEmail",
                    reqType: 'POST',
                    bodyArray: {
                      oldemail: currentEmail,
                      newemail: newEmail,
                      rnc: "1",
                    }
                  });

                  if (response?.code === 200) {
                    Toastx.show({ type: "success", message: "New code sent!" });
                  }
                } catch (err) {
                  Toastx.show({ type: "error", message: "Failed to resend code" });
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              <Text style={modernStyles.resendButtonText}>Resend Code</Text>
            </TouchableOpacity>

            {error ? <Text style={modernStyles.errorText}>{error}</Text> : null}
            {successMessage ? <Text style={modernStyles.successText}>{successMessage}</Text> : null}

            <View style={modernStyles.buttonRow}>
              <TouchableOpacity
                style={[modernStyles.secondaryButton, { flex: 1 }]}
                onPress={() => carouselRef.current?.goToPrevious()}
              >
                <Text style={modernStyles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  modernStyles.primaryButton,
                  { flex: 1 },
                  (verificationCode.length !== 6 || isLoading) && modernStyles.buttonDisabled
                ]}
                onPress={async () => {
                  if (verificationCode.length !== 6) {
                    setError("Please enter a valid 6-digit code");
                    return;
                  }

                  setIsLoading(true);
                  try {
                    const response = await _http_request({
                      customApiUrl: hostServer() + "/api/core/v1/pushNewEmail",
                      reqType: 'POST',
                      bodyArray: {
                        oldemail: currentEmail,
                        newemail: newEmail,
                        vcode: verificationCode,
                      }
                    });

                    if (response?.code === 200) {
                      Toastx.show({
                        type: "success",
                        message: "Email updated successfully!"
                      });
                      onComplete();
                    } else {
                      setError(response?.message || "Invalid verification code");
                    }
                  } catch (err) {
                    setError("Network error. Please try again.");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={verificationCode.length !== 6 || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={modernStyles.primaryButtonText}>Verify & Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )
      }
    ];
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ControlledCarousel
          ref={carouselRef}
          pages={steps.map((stepConfig, index) => (
            <View key={index} style={{ flex: 1, paddingHorizontal: 10 }}>
              <View style={modernStyles.flowHeader}>
                <Text style={modernStyles.flowTitle}>{stepConfig.title}</Text>
                <Text style={modernStyles.flowSubtitle}>{stepConfig.subtitle}</Text>
              </View>
              {stepConfig.content}
            </View>
          ))}
          initialPage={0}
          onPageChange={setStep}
        />

        <View style={modernStyles.stepIndicator}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                modernStyles.stepDot,
                index === step && modernStyles.stepDotActive
              ]}
            />
          ))}
        </View>
      </KeyboardAvoidingView>
    );
  };

  // Phone Change Flow Component (similar structure, but for phone)
  const PhoneChangeFlow = ({
    currentPhone,
    onComplete,
    onCancel
  }: {
    currentPhone: string,
    onComplete: () => void,
    onCancel: () => void
  }) => {
    const [step, setStep] = useState(0);
    const [newPhone, setNewPhone] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const carouselRef = useRef<CarouselRef>(null);

    const steps = [
      {
        title: "Change Phone",
        subtitle: "Enter your new phone number",
        content: (
          <View style={modernStyles.flowContainer}>
            <View style={modernStyles.currentInfo}>
              <Text style={modernStyles.currentLabel}>Current Phone</Text>
              <Text style={modernStyles.currentValue}>{currentPhone}</Text>
            </View>

            <View style={modernStyles.inputGroup}>
              <Text style={modernStyles.inputLabel}>New Phone Number</Text>
              <TextInput
                style={modernStyles.input}
                placeholder="+1 555 000 0000"
                keyboardType="phone-pad"
                autoCapitalize="none"
                value={newPhone}
                onChangeText={(text) => {
                  setNewPhone(text);
                  setError('');
                }}
                editable={!isLoading}
              />
            </View>

            {error ? <Text style={modernStyles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[
                modernStyles.primaryButton,
                (!newPhone || isLoading) && modernStyles.buttonDisabled
              ]}
              onPress={async () => {

                const trimmedPhone = newPhone.trim();
                if (!trimmedPhone || trimmedPhone === currentPhone) {
                  setError("Please enter a different phone number");
                  return;
                }

                setIsLoading(true);
                setError('');

                try {
                  const response = await _http_request({
                    customApiUrl: hostServer() + "/api/core/v1/pushNewPhonenumber",
                    reqType: 'POST',
                    bodyArray: {
                      oldpnumber: currentPhone,
                      newpnumber: trimmedPhone,
                      rnc: "1",
                    }
                  });

                  if (response?.code === 200) {
                    setSuccessMessage("Verification code sent to your new phone");
                    carouselRef.current?.goToNext();
                  } else {
                    setError(response?.message || "Failed to send verification");
                  }
                } catch (err) {
                  setError("Network error. Please try again.");
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={!newPhone || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={modernStyles.primaryButtonText}>Send Verification Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={modernStyles.secondaryButton}
              onPress={onCancel}
            >
              <Text style={modernStyles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )
      },
      {
        title: "Verify Phone",
        subtitle: "Enter the 6-digit code sent to your new phone",
        content: (
          <View style={modernStyles.flowContainer}>
            <View style={modernStyles.infoBox}>
              <IIcon name="call-outline" size={24} color={MODERN_COLORS.primary} />
              <Text style={modernStyles.infoText}>
                Code sent to: <Text style={{ fontWeight: 'bold' }}>{newPhone}</Text>
              </Text>
            </View>

            <View style={modernStyles.inputGroup}>
              <Text style={modernStyles.inputLabel}>Verification Code</Text>
              <TextInput
                style={modernStyles.input}
                placeholder="Enter 6-digit code"
                keyboardType="number-pad"
                maxLength={6}
                value={verificationCode}
                onChangeText={(text) => {
                  setVerificationCode(text.replace(/[^0-9]/g, ''));
                  setError('');
                }}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={modernStyles.resendButton}
              onPress={async () => {

                setIsLoading(true);
                try {
                  const response = await _http_request({
                    customApiUrl: hostServer() + "/api/core/v1/pushNewPhonenumber",
                    reqType: 'POST',
                    bodyArray: {
                      oldpnumber: currentPhone,
                      newpnumber: newPhone.trim(),
                      rnc: "1",
                    }
                  });

                  if (response?.code === 200) {
                    Toastx.show({ type: "success", message: "New code sent!" });
                  }
                } catch (err) {
                  Toastx.show({ type: "error", message: "Failed to resend code" });
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              <Text style={modernStyles.resendButtonText}>Resend Code</Text>
            </TouchableOpacity>

            {error ? <Text style={modernStyles.errorText}>{error}</Text> : null}
            {successMessage ? <Text style={modernStyles.successText}>{successMessage}</Text> : null}

            <View style={modernStyles.buttonRow}>
              <TouchableOpacity
                style={[modernStyles.secondaryButton, { flex: 1 }]}
                onPress={() => carouselRef.current?.goToPrevious()}
              >
                <Text style={modernStyles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  modernStyles.primaryButton,
                  { flex: 1 },
                  (verificationCode.length !== 6 || isLoading) && modernStyles.buttonDisabled
                ]}
                onPress={async () => {

                  if (verificationCode.length !== 6) {
                    setError("Please enter a valid 6-digit code");
                    return;
                  }

                  setIsLoading(true);
                  try {
                    const response = await _http_request({
                      customApiUrl: hostServer() + "/api/core/v1/pushNewPhonenumber",
                      reqType: 'POST',
                      bodyArray: {
                        oldpnumber: currentPhone,
                        newpnumber: newPhone.trim(),
                        vcode: verificationCode,
                      }
                    });

                    if (response?.code === 200) {
                      Toastx.show({
                        type: "success",
                        message: "Phone number updated successfully!"
                      });
                      onComplete();
                    } else {
                      setError(response?.message || "Invalid verification code");
                    }
                  } catch (err) {
                    setError("Network error. Please try again.");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={verificationCode.length !== 6 || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={modernStyles.primaryButtonText}>Verify & Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )
      }
    ];

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ControlledCarousel
          ref={carouselRef}
          pages={steps.map((stepConfig, index) => (
            <View key={index} style={{ flex: 1, paddingHorizontal: 10 }}>
              <View style={modernStyles.flowHeader}>
                <Text style={modernStyles.flowTitle}>{stepConfig.title}</Text>
                <Text style={modernStyles.flowSubtitle}>{stepConfig.subtitle}</Text>
              </View>
              {stepConfig.content}
            </View>
          ))}
          initialPage={0}
          onPageChange={setStep}
        />

        <View style={modernStyles.stepIndicator}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                modernStyles.stepDot,
                index === step && modernStyles.stepDotActive
              ]}
            />
          ))}
        </View>
      </KeyboardAvoidingView>
    );
  };





  // FIXED: All onPress handlers now properly reference the refs
  return (
    <View style={modernStyles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          <ProfileHeader />

          <View style={[styles.container, { paddingBottom: 30, backgroundColor: MODERN_COLORS.background }]}>
            {/* Quick Actions */}
            <QuickActions />

            {/* Account Settings Section */}
            <ModernSection title="Account" icon="person-outline">
              <ModernOption
                icon="mail-outline"
                title="Email Address"
                subtitle={getProfile?.user_email}
                onPress={() => {
                  bottomSheetRef_email.current?.open({
                    sheetHeight: 0.7,
                    stylexj: { paddingHorizontal: 0 }
                  });
                }}
              />
              <ModernOption
                icon="call-outline"
                title="Phone Number"
                subtitle={getProfile?.user_phonenumber}
                onPress={() => {
                  bottomSheetRef_phone.current?.open({
                    sheetHeight: 0.7,
                    stylexj: { paddingHorizontal: 0 }
                  });
                }}
              />
              <ModernOption
                icon="notifications-outline"
                title="Push Notifications"
                subtitle="Manage alerts and preferences"
                onPress={() => {
                  bottomSheetRef_notifications.current?.open({
                    sheetHeight: 0.9,
                    onClose: () => {
                      return;
                      // _http_request({
                      //   reqType: 'POST',
                      //   bodyArray: {
                      //     //action: //http_namer?.pushSettings,
                      //     sddta: (llStorage.currentProfile.get()?.currentUser?.settings)
                      //   }
                      // });
                    }
                  });
                }}
              />
            </ModernSection>

            {/* Discovery & Preferences Section */}
            <ModernSection title="Discovery" icon="compass-outline">
              <ModernSwitch
                icon="shield-checkmark-outline"
                title="Verified Users Only"
                subtitle="Only receive messages from verified accounts"
                value={getAllowOnlyVerified}
                onValueChange={setAllowOnlyVerified}
                premiumLock={!userSubscriptionStep2}
              />
              <ModernSwitch
                icon="moon-outline"
                title="Snooze Dating"
                subtitle="Temporarily hide your profile"
                value={getSnoozeAccount}
                onValueChange={setSnoozeAccount}
              />
            </ModernSection>

            {/* Privacy & Safety Section */}
            <ModernSection title="Privacy & Safety" icon="shield-outline">
              <ModernOption
                icon="lock-closed-outline"
                title="Privacy Settings"
                subtitle="Control who sees your profile"
                onPress={() => Toastx.show({ type: "info", message: "Privacy settings coming soon!" })}
              />
              <ModernOption
                icon="flag-outline"
                title="Blocked Users"
                subtitle="Manage your block list"
                onPress={() => Toastx.show({ type: "info", message: "Blocked users list coming soon!" })}
              />
              <ModernOption
                icon="warning-outline"
                title="Safety Center"
                subtitle="Learn about dating safely"
                onPress={() => Linking.openURL(hostServer() + "/static_page/tnc.php")}
                rightElement={<IIcon size={20} name='open-outline' />}
              />
            </ModernSection>

            {/* Legal Section */}
            <ModernSection title="Legal" icon="document-text-outline">
              <ModernOption
                icon="reader-outline"
                title="Terms of Service"
                onPress={() => Linking.openURL(hostServer() + "/static_page/tnc.php")}
                rightElement={<IIcon size={20} name='open-outline' />}
              />
              <ModernOption
                icon="shield-checkmark-outline"
                title="Privacy Policy"
                onPress={() => Linking.openURL(hostServer() + "/static_page/privacy.php")}
                rightElement={<IIcon size={20} name='open-outline' />}
              />
              <ModernOption
                icon="download-outline"
                title="Download Your Data"
                subtitle="Get a copy of your personal information"
                onPress={() => {
                  Alert.alert(
                    "Download Data",
                    "Your data will be prepared and sent to your email. This may take a few minutes.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Request Download",
                        onPress: () => {
                          Toastx.show({
                            type: "success",
                            message: "Data download requested. You'll receive an email when it's ready."
                          });
                        }
                      },
                    ]
                  );
                }}
              />
            </ModernSection>

            {/* App Section */}
            <ModernSection title="App" icon="phone-portrait-outline">
              <ModernOption
                icon="color-palette-outline"
                title="Appearance"
                subtitle="Light/Dark mode"
                onPress={() => Toastx.show({ type: "info", message: "Theme settings coming soon!" })}
              />
              <ModernOption
                icon="language-outline"
                title="Language"
                subtitle="English (US)"
                onPress={() => Toastx.show({ type: "info", message: "Language settings coming soon!" })}
              />
            </ModernSection>

            {/* Developer Options (Hidden unless enabled) */}

            <ModernSection title="Developer" icon="code-slash-outline">
              <ModernOption
                icon="construct-outline"
                title="Debug Tools"
                onPress={() => bottomSheetRef_null.current?.open({
                  sheetHeight: 0.7,
                })}
              />
            </ModernSection>


            {/* Logout & Delete Section */}
            <View style={modernStyles.dangerSection}>
              <ModernCard>
                <ModernOption
                  icon="log-out-outline"
                  title="Log Out"
                  onPress={async () => {
                    await AsyncStorage.removeItem(namer.storage.sessionId);
                    sessionManager.updateSession({ x_omi_payload: null, x_omi_payload_hash: null });
                    navigation.canGoBack() ? navigation.goBack() : null;
                  }}
                  danger
                />
                <Pressable onPress={() => {
                  Alert.alert(
                    "Delete Account?",
                    "This action cannot be undone. All your data will be permanently deleted.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => {
                          Toastx.show({ type: "error", message: "Account deletion requested" });
                        }
                      },
                    ]
                  );
                }}
                ><Text style={{ color: "#ff7a7aff", textAlign: "center", marginTop: 20 }}>Delete account !!</Text></Pressable>
              </ModernCard>
            </View>

            {/* App Version */}
            <View style={modernStyles.versionContainer}>
              <Text style={modernStyles.versionText}>
                {appJson?.displayName} v{DeviceInfo.getVersion()} ({appJson?.appversion})
              </Text>
              <Text style={modernStyles.buildText}>
                Build {DeviceInfo.getBuildNumber()} • Bundle {appJson?.bundlebuildnumber}
              </Text>
            </View>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>

      {/* Custom Bottom Sheets */}
      <CBottomSheet ref={bottomSheetRef_notifications}>
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <Text style={modernStyles.sectionTitle}>Notifications</Text>
          {/* Add notification content here */}
        </View>
      </CBottomSheet>

      <CBottomSheet ref={bottomSheetRef_email} >
        <EmailChangeFlow
          currentEmail={getProfile?.user_email || ''}
          onComplete={async () => {
            // Refresh profile data
            await __init__app({ doAgain: true });
            bottomSheetRef_email.current?.close();
            setProfile(llStorage.currentProfile.get()?.currentUser);

          }}
          onCancel={() => bottomSheetRef_email.current?.close()}
        />
      </CBottomSheet>

      <CBottomSheet ref={bottomSheetRef_phone}>
        <PhoneChangeFlow
          currentPhone={getProfile?.user_phonenumber || ''}
          onComplete={async () => {
            // Refresh profile data
            await __init__app({ doAgain: true });
            bottomSheetRef_phone.current?.close();
            setProfile(llStorage.currentProfile.get()?.currentUser);
          }}
          onCancel={() => bottomSheetRef_phone.current?.close()}
        />
      </CBottomSheet>

      <CBottomSheet ref={bottomSheetRef_payment}>
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <Text style={modernStyles.sectionTitle}>Payments</Text>
          {/* Add payment content here */}
        </View>
      </CBottomSheet>

      <CBottomSheet ref={bottomSheetRef_feedback}>
        <View style={{ flex: 1 }}>
          <Text style={modernStyles.sectionTitle}>Feedback</Text>
          {/* Add feedback content here */}
        </View>
      </CBottomSheet>

      <CBottomSheet ref={bottomSheetRef_support}>
        <View style={{ flex: 1 }}>
          <Text style={modernStyles.sectionTitle}>Support</Text>
          {/* Add support content here */}
        </View>
      </CBottomSheet>

      <CBottomSheet ref={bottomSheetRef_null}>
        <View style={{ flex: 1 }}>
          <Text style={modernStyles.sectionTitle}>Debug Tools</Text>
          <ScrollView style={[modernStyles.dangerSection, { flex: 1 }]} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            <Pressable style={modernStyles.dangerSection} onPress={async () => {
              await __init__app({ doAgain: true });
              setProfile(llStorage.currentProfile.get()?.currentUser);
              Toastx.show({ type: "info", message: "__init__app updated successfully" });
            }}>
              <Text>reload update __init__app fun </Text>
            </Pressable>

            <Pressable style={modernStyles.dangerSection} onPress={() => { Linking.openURL(__MAPPER?.img_domain[0]); }}>
              <Text>Image url: {__MAPPER?.img_domain[0]}</Text>
            </Pressable>

            <Pressable style={modernStyles.dangerSection} onPress={async () => {
              Linking.openURL(
                hostServer() + '/admin/admin_user_detail.php?id=' + llStorage.currentProfile.get()?.currentUser?.user_id
              );
            }}>
              <Text>Profile admin url:{"\n"}{hostServer()}</Text>
            </Pressable>

            <Pressable style={modernStyles.dangerSection} onPress={async () => {
              InappNotification.show({
                title: 'Message Sent',
                message: 'Your message has been delivered successfully.',
                type: 'error',
                duration: 4000,
              });
            }}>
              <Text>INAPP notify</Text>
            </Pressable>

            <Pressable style={modernStyles.dangerSection} onPress={() => {
              RNRestart.restart();
            }}>
              <Text>reload app</Text>
            </Pressable>

            <Pressable style={modernStyles.dangerSection} onPress={async () => {
              navigation.navigate("zz_nofile");
            }}>
              <Text>Testing null page</Text>
            </Pressable>

            <Text style={modernStyles.dangerSection}>bundle ID: {DeviceInfo.getBundleId()}</Text>

          </ScrollView>
        </View>
      </CBottomSheet>
    </View>
  );
}

// Modern Styles
const modernStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  profileHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  profileGradient: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: MODERN_COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  flowContainer: {
    gap: 20,
  },
  flowHeader: {
    marginBottom: 24,
  },
  flowTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: MODERN_COLORS.text,
    marginBottom: 8,
  },
  flowSubtitle: {
    fontSize: 16,
    color: MODERN_COLORS.textSecondary,
  },
  currentInfo: {
    backgroundColor: MODERN_COLORS.border,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  currentLabel: {
    fontSize: 12,
    color: MODERN_COLORS.textSecondary,
    marginBottom: 4,
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: MODERN_COLORS.text,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: MODERN_COLORS.text,
  },
  input: {
    backgroundColor: MODERN_COLORS.surface,
    borderWidth: 1,
    borderColor: MODERN_COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: MODERN_COLORS.text,
  },
  primaryButton: {
    backgroundColor: MODERN_COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: MODERN_COLORS.surface,
    borderWidth: 1,
    borderColor: MODERN_COLORS.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: MODERN_COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: MODERN_COLORS.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  successText: {
    color: MODERN_COLORS.success,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: MODERN_COLORS.border,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: MODERN_COLORS.text,
    flex: 1,
  },
  resendButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    color: MODERN_COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MODERN_COLORS.border,
  },
  stepDotActive: {
    backgroundColor: MODERN_COLORS.primary,
    width: 12,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: MODERN_COLORS.premium,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileDetails: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  editProfileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: MODERN_COLORS.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: MODERN_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: MODERN_COLORS.text,
  },
  card: {
    backgroundColor: MODERN_COLORS.surface,
    borderRadius: 18,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: MODERN_COLORS.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardGradient: {
    borderWidth: 0,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: MODERN_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionIconDanger: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  optionIconPremium: {
    backgroundColor: 'rgba(255, 209, 102, 0.1)',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MODERN_COLORS.text,
    marginBottom: 2,
  },
  optionTitleDanger: {
    color: MODERN_COLORS.error,
  },
  optionSubtitle: {
    fontSize: 13,
    color: MODERN_COLORS.textSecondary,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: MODERN_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  switchContent: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MODERN_COLORS.text,
    marginBottom: 2,
  },
  switchSubtitle: {
    fontSize: 13,
    color: MODERN_COLORS.textSecondary,
  },
  switchTrack: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: MODERN_COLORS.border,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: MODERN_COLORS.primary,
  },
  switchTrackDisabled: {
    backgroundColor: MODERN_COLORS.textTertiary,
  },
  switchThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: MODERN_COLORS.surface,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  dangerSection: {
    marginTop: 8,
    marginBottom: 32,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  versionText: {
    fontSize: 14,
    color: MODERN_COLORS.textSecondary,
    marginBottom: 4,
  },
  buildText: {
    fontSize: 11,
    color: MODERN_COLORS.textTertiary,
  },
});

export default Screen_settings;
