import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import IIcon from 'react-native-vector-icons/Ionicons';
import { _http_request, hostServer, llStorage, logReport } from '../funcs/functions';
import { Loaderx, bottomsheet_renderBackdrop } from '../funcs/functions_stateful';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import * as RNIap from 'react-native-iap';

type CoinPack = {
  id: string;
  label: string;
  coins: number;
  sku: string;
  highlight?: string;
  description?: string;
  color: string;
};

export const Screen_Coin = ({ navigation }: { navigation: any }) => {
  const profile = llStorage.currentProfile.get()?.currentUser;

  // IMPORTANT: Coins are digital goods -> do not offer card checkout on iOS/Android to avoid policy violations.
  const allowCardCheckout = false;

  const purchaseSheetRef = useRef<BottomSheet>(null);
  const purchaseSheetSnap = useMemo(() => ['35%', '60%'], []);

  // Your real SKUs must exist in Play Console / App Store Connect
  const coinPacks: CoinPack[] = useMemo(
    () => [
      { id: 'starter', label: 'Starter', coins: 20, sku: 'com.placeholder.coin.starter', color: '#609dff' },
      { id: 'popular', label: 'Popular', coins: 60, sku: 'com.placeholder.coin.popular', highlight: 'Best value', color: '#7cff62' },
      { id: 'power', label: 'Power', coins: 120, sku: 'com.placeholder.coin.power', color: '#ff6767' },
      { id: 'whale', label: 'Whale', coins: 250, sku: 'com.placeholder.coin.whale', highlight: 'Top up big', color: '#fff460' },
    ],
    []
  );

  const IAP_SKUS = useMemo(() => coinPacks.map(p => p.sku), [coinPacks]);

  const [selectedPack, setSelectedPack] = useState<CoinPack | null>(coinPacks[0] ?? null);

  const [iapReady, setIapReady] = useState(false);
  const [iapProductsBySku, setIapProductsBySku] = useState<Record<string, RNIap.Product>>({});
  const [iapLoading, setIapLoading] = useState(false);

  const [pendingPack, setPendingPack] = useState<CoinPack | null>(null);

  const balance = profile?.user_effect?.coins ?? 0;

  const storePriceForPack = useCallback(
    (pack: CoinPack) => {
      const p = iapProductsBySku[pack.sku];
      // iOS/Android fields vary slightly by lib/version; keep fallback
      return (p as any)?.localizedPrice || (p as any)?.oneTimePurchaseOfferDetails?.formattedPrice || '';
    },
    [iapProductsBySku]
  );

  const formatPrice = useCallback(
    (pack: CoinPack) => {
      const storePrice = storePriceForPack(pack);
      if (storePrice) return `${storePrice} total`;
      return '...';
    },
    [storePriceForPack]
  );

  // ---------- IAP Init ----------
  useEffect(() => {
    let mounted = true;

    const initIap = async () => {
      try {
        setIapLoading(true);
        const ok = await RNIap.initConnection();
        if (!ok) throw new Error('IAP connection failed');

        if (Platform.OS === 'android') {
          // Clears pending/failed purchases so they can be repurchased
          await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
        }

        // Fetch product metadata (pricing/title)
        const products = await RNIap.getProducts({ skus: IAP_SKUS });

        if (!mounted) return;

        const map: Record<string, RNIap.Product> = {};
        (products ?? []).forEach(p => {
          map[(p as any).productId || (p as any).sku] = p;
        });

        setIapProductsBySku(map);
        setIapReady(true);
      } catch (error) {
        if (!mounted) return;
        setIapReady(false);
        logReport({
          type: 'iap',
          useraction: 'init',
          logMessage: 'Failed to initialize IAP',
          stackTrace: error,
        });
      } finally {
        if (mounted) setIapLoading(false);
      }
    };

    initIap();

    return () => {
      mounted = false;
      try {
        RNIap.endConnection();
      } catch {}
    };
  }, [IAP_SKUS]);

  // ---------- IAP Listeners (REQUIRED) ----------
  useEffect(() => {
    const subUpdated = RNIap.purchaseUpdatedListener(async purchase => {
      // purchase can be emitted even if user left/reopened app
      try {
        setIapLoading(true);

        const receipt = (purchase as any)?.transactionReceipt;
        const purchaseToken = (purchase as any)?.purchaseToken;
        const productId = (purchase as any)?.productId || (purchase as any)?.sku;

        // Ensure we know which pack this is for
        const pack = pendingPack || coinPacks.find(p => p.sku === productId) || null;
        if (!pack) throw new Error('Unknown product purchased');

        if (!receipt && !purchaseToken) throw new Error('Missing receipt/token');

        Loaderx.show();

        // You MUST validate on backend:
        // - Android: purchaseToken + productId (+ packageName) -> Play Developer API verify
        // - iOS: transactionReceipt -> App Store verification / server API
        const res = await _http_request({
          reqType: 'POST',
          customApiUrl: `${hostServer()}/api/secure/gateway/coin/iap/verify`,
          bodyArray: {
            product_id: pack.id,
            sku: pack.sku,
            platform: Platform.OS,
            receipt: receipt ?? null,
            purchaseToken: purchaseToken ?? null,
            transactionId: (purchase as any)?.transactionId ?? null,
          },
        });

        if (res?.code !== 200) {
          throw new Error(res?.message ?? 'Verification failed');
        }

        // VERY IMPORTANT: coins are consumable
        await RNIap.finishTransaction({ purchase, isConsumable: true });

        await llStorage.currentProfile.load();

        setTimeout(() => {
          Loaderx.hide();
          Alert.alert('Success', res?.message ?? 'Coins added!');
          purchaseSheetRef.current?.close();
          navigation.goBack();
        }, 400);
      } catch (error: any) {
        Loaderx.hide();
        Alert.alert('IAP Error', error?.message ?? 'Unable to complete purchase.');
        logReport({
          type: 'iap',
          useraction: 'purchaseUpdated',
          logMessage: 'IAP purchase handler failed',
          stackTrace: error,
        });
      } finally {
        setPendingPack(null);
        setIapLoading(false);
      }
    });

    const subError = RNIap.purchaseErrorListener(error => {
      setPendingPack(null);
      setIapLoading(false);
      Loaderx.hide();
      Alert.alert('Purchase failed', error?.message ?? 'Please try again.');
      logReport({
        type: 'iap',
        useraction: 'purchaseError',
        logMessage: 'IAP purchase error',
        stackTrace: error,
      });
    });

    return () => {
      subUpdated.remove();
      subError.remove();
    };
  }, [coinPacks, navigation, pendingPack]);

  // ---------- Card checkout (only if allowed) ----------
  const handleBuyViaHttp = async () => {
    if (!selectedPack) return;

    if (!allowCardCheckout) {
      Alert.alert('Unavailable', 'Card payments are not available for this purchase on this platform.');
      return;
    }

    try {
      Loaderx.show();
      const res: any = await _http_request({
        reqType: 'POST',
        customApiUrl: `${hostServer()}/api/secure/gateway/coin/card`,
        bodyArray: { product_id: selectedPack.id, length: selectedPack.coins },
      });

      if (res?.code === 200) {
        await llStorage.currentProfile.load();
        setTimeout(() => {
          Loaderx.hide();
          Alert.alert('Success', res?.message ?? 'Coins added!');
          navigation.goBack();
        }, 400);
      } else {
        Loaderx.hide();
        Alert.alert('Payment failed', res?.message ?? 'Please try again.');
      }
    } catch (error: any) {
      Loaderx.hide();
      Alert.alert('Error', 'Network error. Please try again.');
      logReport({
        type: 'http',
        useraction: 'coin card purchase',
        logMessage: 'Network error during coin purchase',
        stackTrace: error,
      });
    }
  };

  // ---------- IAP Purchase (ONLY initiate here) ----------
  const handleBuyViaIap = async () => {
    if (!selectedPack) return;

    if (!iapReady) {
      Alert.alert('Unavailable', 'In-app purchases are not ready yet.');
      return;
    }

    // Must have product present from store fetch (optional but safer)
    if (!iapProductsBySku[selectedPack.sku]) {
      Alert.alert('Unavailable', 'This product is not available in the store yet.');
      return;
    }

    try {
      setIapLoading(true);
      setPendingPack(selectedPack);

      // Do NOT read receipt here; listener receives the real purchase.
      await RNIap.requestPurchase({
        sku: selectedPack.sku,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      });
    } catch (error: any) {
      setPendingPack(null);
      setIapLoading(false);
      Alert.alert('IAP Error', error?.message ?? 'Unable to start purchase.');
      logReport({
        type: 'iap',
        useraction: 'requestPurchase',
        logMessage: 'IAP requestPurchase failed',
        stackTrace: error,
      });
    }
  };

  if (!selectedPack) {
    return (
      <LinearGradient colors={['#0f0b14', '#131325', '#0f111a']} style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading coin packs...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f0b14', '#131325', '#0f111a']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Coins</Text>
          <Text style={styles.title}>Boost visibility, send spotlights, stand out.</Text>
          <Text style={styles.subtitle}>Current balance: {balance} coins</Text>
        </View>

        <View style={styles.packGrid}>
          {coinPacks.map(pack => {
            const isSelected = pack.id === selectedPack.id;
            return (
              <TouchableOpacity
                key={pack.id}
                activeOpacity={0.9}
                onPress={() => setSelectedPack(pack)}
                style={[
                  styles.packCard,
                  { borderColor: pack.color },
                  isSelected && { backgroundColor: 'rgba(255,255,255,0.06)', shadowColor: pack.color },
                ]}
              >
                <View style={styles.packHeader}>
                  <Text style={[styles.packLabel, { color: pack.color }]}>{pack.label}</Text>
                  {pack.highlight && (
                    <View style={[styles.badge, { backgroundColor: pack.color }]}>
                      <Text style={styles.badgeText}>{pack.highlight}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.packCoins}>{pack.coins} coins</Text>
                <Text style={styles.packPrice}>{formatPrice(pack)}</Text>

                <View style={styles.packFooter}>
                  <IIcon name="flash-outline" size={16} color={pack.color} />
                  <Text style={styles.packFooterText}>Faster matches</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          activeOpacity={0.92}
          style={[styles.ctaButton, { backgroundColor: selectedPack.color }]}
          onPress={() => purchaseSheetRef.current?.expand()}
        >
          <Text style={styles.ctaText}>Purchase {selectedPack.coins} coins</Text>
          <Text style={styles.ctaSubtext}>{formatPrice(selectedPack)}</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Purchases are final. Coins may be used for boosts, spotlights, and premium actions.
        </Text>
      </ScrollView>

      <BottomSheet
        ref={purchaseSheetRef}
        index={-1}
        snapPoints={purchaseSheetSnap}
        backdropComponent={bottomsheet_renderBackdrop}
        enablePanDownToClose
      >
        <BottomSheetView style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>Choose payment method</Text>
          <Text style={styles.sheetSubtitle}>
            {selectedPack.coins} coins • {formatPrice(selectedPack)}
          </Text>

          {allowCardCheckout && (
            <TouchableOpacity
              style={[styles.sheetButton, styles.sheetButtonPrimary]}
              onPress={handleBuyViaHttp}
              disabled={iapLoading}
            >
              <Text style={styles.sheetButtonTextPrimary}>Pay with card</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.sheetButton,
              styles.sheetButtonSecondary,
              (!iapReady || iapLoading) && styles.sheetButtonDisabled,
            ]}
            onPress={handleBuyViaIap}
            disabled={!iapReady || iapLoading}
          >
            <Text style={styles.sheetButtonTextSecondary}>
              {iapReady ? 'Pay with in-app purchase' : 'IAP unavailable'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetCancel} onPress={() => purchaseSheetRef.current?.close()}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  hero: { marginBottom: 24 },
  kicker: { color: '#9ca3af', fontSize: 12, letterSpacing: 1 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 6 },
  subtitle: { color: '#cbd5e1', fontSize: 14, marginTop: 6 },
  packGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  packCard: {
    flexBasis: '48%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  packHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  packLabel: { fontSize: 15, fontWeight: '700' },
  packCoins: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 10 },
  packPrice: { color: '#e5e7eb', fontSize: 14, marginTop: 6 },
  packFooter: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  packFooterText: { color: '#cbd5e1', fontSize: 13 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  badgeText: { color: '#0f0b14', fontWeight: '700', fontSize: 11 },
  ctaButton: { padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 16 },
  ctaText: { color: '#0f0b14', fontSize: 17, fontWeight: '800' },
  ctaSubtext: { color: '#0f0b14', fontSize: 13, marginTop: 4 },
  disclaimer: { color: '#9ca3af', fontSize: 12, lineHeight: 16, textAlign: 'center' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#9ca3af', fontSize: 16 },

  sheetContainer: { padding: 20 },
  sheetTitle: { color: '#111827', fontSize: 18, fontWeight: '700' },
  sheetSubtitle: { color: '#6b7280', fontSize: 13, marginTop: 6, marginBottom: 16 },
  sheetButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  sheetButtonPrimary: { backgroundColor: '#111827' },
  sheetButtonSecondary: { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  sheetButtonDisabled: { opacity: 0.5 },
  sheetButtonTextPrimary: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  sheetButtonTextSecondary: { color: '#111827', fontSize: 15, fontWeight: '700' },
  sheetCancel: { alignItems: 'center', marginTop: 6 },
  sheetCancelText: { color: '#6b7280', fontSize: 14 },
});
