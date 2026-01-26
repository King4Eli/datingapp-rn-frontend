import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import IIcon from 'react-native-vector-icons/Ionicons';
import { _http_request, hostServer, llStorage, logReport } from '../funcs/functions';
import { Loaderx } from '../funcs/functions_stateful';

type CoinPack = {
  id: string;
  label: string;
  coins?: number;
  price?: number;
  description?: string;
  highlight?: string;
  color: string;
};

const fallbackCoinPacks: CoinPack[] = [
  { id: 'starter', label: 'Starter', coins: 20, color: '#609dff' },
  { id: 'popular', label: 'Popular', coins: 60, highlight: 'Best value', color: '#7cff62' },
  { id: 'power', label: 'Power', coins: 120, color: '#ff6767' },
  { id: 'whale', label: 'Whale', coins: 250, highlight: 'Top up big', color: '#fff460' },
];

export const Screen_Coin = ({ navigation }: { navigation: any }) => {
  const profile = llStorage.currentProfile.get()?.currentUser;
  const __product_MAPPER = llStorage.purchasing_product?.get()?.onetime?.cointoken?.[0];

  const COIN_PRICE = Number(__product_MAPPER?.price ?? 0.1);

  const formatPrice = (pack: CoinPack) => {
    if (typeof pack.price === 'number' && Number.isFinite(pack.price)) {
      return `$${pack.price.toFixed(2)} total`;
    }
    if (typeof pack.coins === 'number') {
      const price = Math.max(0.01, Number((pack.coins * COIN_PRICE).toFixed(2)));
      return `$${price.toFixed(2)} total`;
    }
    return 'Contact support';
  };

  const balance = profile?.user_effect?.coins ?? 0;

  const coinPacks = useMemo<CoinPack[]>(() => {
    const onceProducts = Array.isArray(__product_MAPPER) ? __product_MAPPER : [];
    if (onceProducts.length === 0) {
      return fallbackCoinPacks;
    }

    // For now, return fallback since you don't have the transformation logic
    return fallbackCoinPacks;
  }, [__product_MAPPER]); // Add dependency

  // Initialize selectedPack when coinPacks changes
  const [selectedPack, setSelectedPack] = useState<CoinPack | null>(null);

  useEffect(() => {
    if (coinPacks.length > 0 && !selectedPack) {
      setSelectedPack(coinPacks[0]);
    }
  }, [coinPacks, selectedPack]);

  const price = useMemo(() => {
    if (!selectedPack) return '';
    return formatPrice(selectedPack);
  }, [selectedPack]);

  const handleBuy = () => {
    if (!selectedPack) {
      Alert.alert('Error', 'Please select a coin pack');
      return;
    }

    const payload: Record<string, any> = { product_id: selectedPack.id };
    if (selectedPack.coins) payload.length = selectedPack.coins;

    Loaderx.show();
    _http_request({
      reqType: 'POST',
      customApiUrl: `${hostServer()}/api/secure/gateway/coin`,
      bodyArray: payload,
    }).then((res: any) => {
      if (res?.code === 200) {
        llStorage.currentProfile.load().then(() => {
          setTimeout(() => {
            Loaderx.hide();
            Alert.alert('Success', res?.message ?? 'Coins added!');
            navigation.goBack();
          }, 700);
        });
      } else {
        Loaderx.hide();
        Alert.alert('Payment failed', res?.message ?? 'Please try again.');
      }
    }).catch((error: any) => {
      Loaderx.hide();
      Alert.alert('Error', 'Network error. Please try again.');
      logReport({
        type: 'http',
        useraction: 'coin purchase',
        logMessage: 'Network error during coin purchase',
        stackTrace: error
      });
    });
  };

  // Early return if no packs are available
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
          {coinPacks.map((pack) => {
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
                {typeof pack.coins === 'number' ? (
                  <Text style={styles.packCoins}>{pack.coins} coins</Text>
                ) : (
                  <Text style={styles.packCoins}>{pack.label}</Text>
                )}
                {pack.description ? <Text style={styles.packMeta}>{pack.description}</Text> : null}
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
          onPress={handleBuy}
        >
          <Text style={styles.ctaText}>
            {selectedPack.coins ? `Purchase ${selectedPack.coins} coins` : `Purchase ${selectedPack.label}`}
          </Text>
          <Text style={styles.ctaSubtext}>{price}</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Payments are charged to your account. Purchases are final. Coins may be used for boosts, spotlights, and
          premium actions.
        </Text>
      </ScrollView>
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
  packMeta: { color: '#9ca3af', fontSize: 12, marginTop: 6 },
  packPrice: { color: '#e5e7eb', fontSize: 14, marginTop: 6 },
  packFooter: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  packFooterText: { color: '#cbd5e1', fontSize: 13 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  badgeText: { color: '#0f0b14', fontWeight: '700', fontSize: 11 },
  ctaButton: { padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 16 },
  ctaText: { color: '#0f0b14', fontSize: 17, fontWeight: '800' },
  ctaSubtext: { color: '#0f0b14', fontSize: 13, marginTop: 4 },
  disclaimer: { color: '#9ca3af', fontSize: 12, lineHeight: 16, textAlign: 'center' },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 16
  },
}); 