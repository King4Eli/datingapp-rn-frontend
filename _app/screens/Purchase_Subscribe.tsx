import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Animated, Dimensions, Linking } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import IIcon from 'react-native-vector-icons/Ionicons';
import { _http_request, cacheStorage, hostServer, logReport, parseCategoryProducts } from '../funcs/functions';
import { Loaderx, bottomsheet_renderBackdrop } from '../funcs/functions_stateful';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { namer } from '../funcs/static';

const TIER_COLORS = ['#F25F7F', '#D4AF37', '#5B8DEF', '#34C759'];

const normalizePayload = (payload: any) => {
  if (!payload || typeof payload !== 'object') return null;
  if (typeof payload === 'object') return payload;
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

const extractFeatureText = (feature: any): string | null => {
  if (typeof feature === 'string') return feature.trim() || null;
  if (!feature || typeof feature !== 'object') return null;
  const isEnabled = feature?.e ?? feature?.enabled ?? true;
  const text = feature?.d ?? feature?.description ?? feature?.text ?? '';
  return isEnabled && typeof text === 'string' ? text.trim() || null : null;
};

const extractFeaturesFromTierItem = (tierItem: any): string[] => {
  // Direct description.features array
  if (tierItem?.description?.features && Array.isArray(tierItem.description.features)) {
    const features = tierItem.description.features
      .map(extractFeatureText)
      .filter(Boolean) as string[];
    if (features.length) return features;
  }

  // Fallback to meta_data if exists
  const metaData = normalizePayload(tierItem?.meta_data);
  if (metaData?.features && Array.isArray(metaData.features)) {
    const features = metaData.features
      .map(extractFeatureText)
      .filter(Boolean) as string[];
    if (features.length) return features;
  }

  return [];
};

const getCycleLabel = (variant: any): string => {
  // Use metadata.cycle first
  if (variant?.metadata?.cycle) {
    const cycle = variant.metadata.cycle.trim();
    if (cycle) return cycle;
  }

  // Fallback to variant name
  if (variant?.name) {
    const name = variant.name.trim();
    if (name) return name;
  }

  return 'Billing cycle';
};

const formatPrice = (price: any): string => {
  const amount = Number(price);
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
};

export const Screen_PurchaseSubscribe = ({ route, navigation }: { route: any; navigation: any }) => {
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<string>(() => route?.params?.tab || '');
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [productDetails, setProductDetails] = useState<{ sku: string; variantId?: number } | null>(null);

  const paymentSheetRef = useRef<BottomSheet>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = Dimensions.get('window');
  const cycleItemWidth = Math.min(180, Math.max(140, Math.round(screenWidth * 0.45)));
  const cycleSidePadding = Math.max(16, Math.round((screenWidth - cycleItemWidth) / 2));

  // Load data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [rawProducts, userProfile] = await Promise.all([
          cacheStorage.getProducts().then(raw => parseCategoryProducts(raw, namer.productCategoryName.mainsub)),
          cacheStorage.getCurrentUserProfile()
        ]);
        if (mounted) {
          setProducts(rawProducts);
          setProfile(userProfile);
        }
      } catch {
        if (mounted) {
          setProducts(null);
          setProfile(null);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const tierKeys = useMemo(() =>
    products?.map((tier: any) => tier.name?.trim()).filter(Boolean) ?? [],
    [products]
  );

  const activeSubscription = profile?.user_effect?.has_active_subscription ?? false;
  const userCurrentTier = profile?.user_effect?.subscription_plan;

  const getTierKeyByName = useCallback((planName?: string) => {
    if (!planName || !products) return '';
    const normalized = planName.toLowerCase().trim();
    const match = products.find((tier: any) =>
      tier.name?.toLowerCase().trim() === normalized
    );
    return match?.name?.trim() ?? '';
  }, [products]);

  const activeTierKey = activeSubscription ? getTierKeyByName(userCurrentTier) : '';

  // Set initial tier
  useEffect(() => {
    if (!selectedTier) {
      setSelectedTier(activeTierKey || tierKeys[0] || '');
    }
  }, [activeTierKey, tierKeys, selectedTier]);

  const currentTier = products?.find((tier: any) => tier.name?.trim() === selectedTier) || null;
  const currentVariants = currentTier?.variants ?? [];

  const currentTierFeatures = extractFeaturesFromTierItem(currentTier || {});

  // Set initial variant
  useEffect(() => {
    if (currentVariants.length) {
      setSelectedVariantId(currentVariants[0]?.id ?? null);
    } else {
      setSelectedVariantId(null);
    }
  }, [currentVariants]);

  const selectedVariant = currentVariants.find((v: any) => v.id === selectedVariantId) || currentVariants[0] || null;

  const getTierColor = useCallback((tierKey: string) =>
    TIER_COLORS[tierKeys.indexOf(tierKey)] || '#F25F7F',
    [tierKeys]
  );

  const handleSubscribe = (paymentMethod: 'iap' | 'card') => {
    Loaderx.show();
    if (paymentMethod === 'iap') {
      Loaderx.hide();
      Alert.alert('Info', 'IAP payment method is currently unavailable. Please try the credit card option or contact support.');
      return;
    }

    _http_request({
      customApiUrl: `${hostServer()}/api/secure/gateway/subscribe`,
      reqType: 'POST',
      bodyArray: {
        s_sku: productDetails?.sku,
        s_duration_int: productDetails?.variantId,
      }
    }).then((fg: any) => {
      Loaderx.hide();
      if (fg?.code === 301 && fg?.type === "external" && fg?.url) {
        Linking.openURL(fg.url).catch(() => {
          Alert.alert('Payment Error', 'Unable to open payment page. Please try again.');
        });
      } else {
        Alert.alert('Payment Error', fg?.message ?? 'There has been an error.');
      }
    });
  };

  const openPaymentSheet = () => {
    if (!selectedVariantId || !selectedVariant) return;
    paymentSheetRef.current?.snapToIndex(0);
  };

  return (
    <LinearGradient colors={['#0f0b14', '#171126', '#0f111a']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Tier Selection */}
        <View style={styles.tierRow}>
          {tierKeys.map((tierKey: any) => {
            const tierData = products?.find((tier: any) => tier.name?.trim() === tierKey);
            const tierColor = getTierColor(tierKey);
            const isSelected = selectedTier === tierKey;
            const isActive = activeSubscription && activeTierKey === tierKey;
            const tierFeatures = extractFeaturesFromTierItem(tierData || {});
            const tierHighlight = tierFeatures[0] || tierData?.variants?.[0]?.metadata?.cycle || tierData?.name || '';

            return (
              <TouchableOpacity
                key={tierKey}
                activeOpacity={0.9}
                disabled={isActive}
                onPress={() => setSelectedTier(tierKey)}
                style={[
                  styles.tierCard,
                  { borderColor: tierColor },
                  isSelected && { backgroundColor: 'rgba(255,255,255,0.05)', shadowColor: tierColor },
                  isActive && styles.tierCardDisabled,
                ]}
              >
                <View style={styles.tierHeader}>
                  <Text style={[styles.tierName, { color: tierColor }]}>
                    {tierKey.toUpperCase()}
                  </Text>
                  {isActive && (
                    <View style={[styles.badge, { backgroundColor: tierColor }]}>
                      <Text style={styles.badgeText}>Active</Text>
                    </View>
                  )}
                </View>
                <View style={styles.tierFooter}>
                  <IIcon name="sparkles-outline" size={16} color={tierColor} />
                  <Text style={styles.tierFooterText}>{tierHighlight}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Benefits Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>What's included</Text>
          <Text style={styles.sectionHint}>
            Tailored to {selectedTier.toUpperCase()}
          </Text>
        </View>

        <View style={styles.benefitList}>
          {currentTierFeatures.length === 0 ? (
            <Text style={styles.emptyBenefit}>Benefits coming soon.</Text>
          ) : (
            currentTierFeatures.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <View style={[styles.benefitIcon, { backgroundColor: getTierColor(selectedTier) }]}>
                  <IIcon name="checkmark" size={12} color="#0f0b14" />
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))
          )}
        </View>

        {/* Billing Cycles */}
        <Text style={styles.sectionTitle}>Billing cadence</Text>
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.cycleRow, { paddingHorizontal: cycleSidePadding }]}
          snapToInterval={cycleItemWidth + 12}
          decelerationRate="fast"
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
          scrollEventThrottle={16}
        >
          {currentVariants.map((variant: any, index: number) => {
            const isSelected = selectedVariantId === variant.id;
            const tierColor = getTierColor(selectedTier);
            const inputRange = [
              (index - 1) * (cycleItemWidth + 12),
              index * (cycleItemWidth + 12),
              (index + 1) * (cycleItemWidth + 12),
            ];
            const scale = scrollX.interpolate({ inputRange, outputRange: [0.92, 1.05, 0.92], extrapolate: 'clamp' });
            const opacity = scrollX.interpolate({ inputRange, outputRange: [0.7, 1, 0.7], extrapolate: 'clamp' });

            return (
              <Animated.View key={variant.id} style={{ transform: [{ scale }], opacity, paddingTop: 20 }}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedVariantId(variant.id);
                    openPaymentSheet();
                    setProductDetails({
                      sku: currentTier?.sku,
                      variantId: variant.id,
                    });
                  }}
                  style={[
                    styles.cyclePill,
                    { width: cycleItemWidth, marginRight: 12 },
                    isSelected && { backgroundColor: tierColor, borderColor: tierColor },
                  ]}
                >
                  <Text style={[styles.cycleText, isSelected && styles.cycleTextSelected]}>
                    {getCycleLabel(variant)}
                  </Text>
                  <Text style={[styles.cyclePrice, isSelected && styles.cycleTextSelected]}>
                    <Text style={{ fontSize: 20, fontWeight: '700' }}>${formatPrice(variant.price)}</Text> / {getCycleLabel(variant)}
                  </Text>
                  {variant.metadata?.discount && (
                    <Text style={[styles.discountBadge, isSelected && styles.discountBadgeSelected]}>
                      {variant.metadata.discount}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.ScrollView>

        <Text style={styles.disclaimer}>
          Payments are charged to your account. Auto-renews unless canceled 24 hours before renewal.
        </Text>
      </ScrollView>

      {/* Payment Sheet */}
      <BottomSheet
        ref={paymentSheetRef}
        index={-1}
        enablePanDownToClose
        snapPoints={['55%']}
        backdropComponent={bottomsheet_renderBackdrop}
      >
        <BottomSheetView style={styles.sheetContainer}>
          <SafeAreaView edges={['bottom']}>
            <Text style={styles.sheetTitle}>Choose payment method</Text>
            <Text style={styles.sheetSubtitle}>
              {selectedTier.toUpperCase()} - {selectedVariant ? getCycleLabel(selectedVariant) : ''} - ${formatPrice(selectedVariant?.price)}
            </Text>

            <View style={styles.sheetDetails}>
              {[
                { label: 'Plan', value: selectedTier.toUpperCase() },
                { label: 'Billing Cycle', value: selectedVariant ? getCycleLabel(selectedVariant) : '' },
                { label: 'Price', value: `$${formatPrice(selectedVariant?.price)}` }
              ].map(({ label, value }) => (
                <View key={label} style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>{label}</Text>
                  <Text style={styles.sheetValue}>{value}</Text>
                </View>
              ))}
              {selectedVariant?.metadata?.discount && (
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Discount</Text>
                  <Text style={[styles.sheetValue, { color: '#10b981' }]}>{selectedVariant.metadata.discount}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={[styles.sheetButton, styles.sheetButtonPrimary]} onPress={() => handleSubscribe('iap')}>
              <Text style={styles.sheetButtonTextPrimary}>Pay with in-app purchase</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.sheetButton, styles.sheetButtonSecondary]} onPress={() => handleSubscribe('card')}>
              <Text style={styles.sheetButtonTextSecondary}>Pay with credit card</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetCancel} onPress={() => paymentSheetRef.current?.close()}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </BottomSheetView>
      </BottomSheet>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  tierRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  tierCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  tierCardDisabled: { opacity: 0.45 },
  tierHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tierName: { fontSize: 16, fontWeight: '700' },
  tierFooter: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tierFooterText: { color: '#cbd5e1', fontSize: 13 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  badgeText: { color: '#0f0b14', fontWeight: '700', fontSize: 11 },
  sectionHeader: { marginBottom: 8 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  sectionHint: { color: '#9ca3af', fontSize: 13 },
  benefitList: { borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', padding: 14, marginBottom: 20 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  benefitIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  benefitText: { color: '#e5e7eb', fontSize: 15, flex: 1 },
  emptyBenefit: { color: '#9ca3af', fontSize: 14 },
  cycleRow: { flexDirection: 'row', marginBottom: 24 },
  cyclePill: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2f3040',
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
  },
  cycleText: { color: '#e5e7eb', fontWeight: '700', textAlign: 'center' },
  cycleTextSelected: { color: '#0f0b14' },
  cyclePrice: { color: '#cbd5e1', marginTop: 4, fontSize: 13, textAlign: 'center' },
  discountBadge: {
    fontSize: 10,
    color: '#10b981',
    marginTop: 4,
    textAlign: 'center',
  },
  discountBadgeSelected: {
    color: '#0f0b14',
  },
  disclaimer: { color: '#9ca3af', fontSize: 12, lineHeight: 16, textAlign: 'center' },
  sheetContainer: { padding: 20 },
  sheetTitle: { color: '#111827', fontSize: 18, fontWeight: '700' },
  sheetSubtitle: { color: '#6b7280', fontSize: 13, marginTop: 6, marginBottom: 12 },
  sheetDetails: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sheetLabel: { color: '#6b7280', fontSize: 12 },
  sheetValue: { color: '#111827', fontSize: 13, fontWeight: '700' },
  sheetButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  sheetButtonPrimary: { backgroundColor: '#111827' },
  sheetButtonSecondary: { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  sheetButtonTextPrimary: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  sheetButtonTextSecondary: { color: '#111827', fontSize: 15, fontWeight: '700' },
  sheetCancel: { alignItems: 'center', marginTop: 6 },
  sheetCancelText: { color: '#6b7280', fontSize: 14 },
});