import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import IIcon from 'react-native-vector-icons/Ionicons';
import { _http_request, hostServer, llStorage } from '../funcs/functions';
import { Loaderx } from '../funcs/functions_stateful';

// Colors for tiers - will use dynamically based on tier count
const TIER_COLORS = ['#F25F7F', '#D4AF37', '#5B8DEF', '#34C759'];


export const Screen_Subscribe = ({ route, navigation }: { route: any; navigation: any }) => {
  const __product_MAPPER = llStorage.purchasing_product?.get()?.mainsub;

  // Get all tier keys from the mapper
  const tierKeys = Object.keys(__product_MAPPER || {});

  // Get profile data
  const getProfile = llStorage.currentProfile.get()?.currentUser;
  const activeSubscription = getProfile?.user_effect?.has_active_subscription ?? false;
  const userCurrentTier = getProfile?.user_effect?.subscription_plan;

  // Initialize selected tier based on user's current subscription
  const [selectedTier, setSelectedTier] = useState<string>(() => {
    if (activeSubscription && userCurrentTier && tierKeys.includes(userCurrentTier)) {
      return userCurrentTier;
    }
    return route?.params?.tab || (tierKeys[0] || '');
  });

  // Initialize selected billing cycle based on available options
  const [selectedDuration, setSelectedDuration] = useState<string>(() => {
    const tierItems = __product_MAPPER?.[selectedTier] || [];
    return tierItems[0]?.description || '';
  });

  // Build tier data dynamically
  const tiers = useMemo(() => {
    const tierData: Record<string, any> = {};

    tierKeys.forEach((tierKey, index) => {
      const tierItems = __product_MAPPER?.[tierKey] || [];

      // Group prices by description
      const prices: Record<string, string> = {};
      tierItems.forEach((item: any) => {
        prices[item.description] = item.price;
      });

      // Generate features based on tier
      const features = generateFeatures(tierKey);

      tierData[tierKey] = {
        name: tierKey.toUpperCase(),
        color: TIER_COLORS[index] || '#F25F7F',
        features,
        prices,
        id: tierKey
      };
    });

    return tierData;
  }, [__product_MAPPER]);

  // Update selected duration when tier changes
  useEffect(() => {
    const tierItems = __product_MAPPER?.[selectedTier] || [];
    if (tierItems.length > 0) {
      setSelectedDuration(tierItems[0]?.description);
    }
  }, [selectedTier]);

  const handleSubscribe = () => {
    const actionName = (globalThis as any)?.http_namer?.pushSubscribe ?? 'pushSubscribe';
    Loaderx.show();

    // Find the selected product item
    const tierItems = __product_MAPPER?.[selectedTier] || [];
    const selectedItem = tierItems.find((item: any) => item.description === selectedDuration);

    if (!selectedItem) {
      Loaderx.hide();
      Alert.alert('Error', 'Selected plan not available');
      return;
    }

    _http_request({
      customApiUrl: hostServer() + "/api/core/v1/pushSubscribe",
      reqType: 'POST',
      bodyArray: {
        action: actionName,
        tier: selectedTier,
        whentype: selectedDuration,
        product_id: selectedItem.id
      }
    }).then((fg: any) => {
      if (fg?.code === 200) {
        llStorage.currentProfile.load().then(() => {
          setTimeout(() => {
            Loaderx.hide();
            navigation.goBack();
          }, 800);
        });
      } else {
        Loaderx.hide();
        Alert.alert(fg?.message ?? 'There has been an error.');
      }
    });
  };

  // Get available billing cycles for selected tier
  const getAvailableCycles = () => {
    const tierItems = __product_MAPPER?.[selectedTier] || [];
    return tierItems.map((item: any) => item.description);
  };

  return (
    <LinearGradient colors={['#0f0b14', '#171126', '#0f111a']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>Upgrade</Text>
          <Text style={styles.heroTitle}>Unlock more matches & visibility</Text>
          <Text style={styles.heroSubtitle}>Pick the plan that matches your pace.</Text>
        </View>

        <View style={styles.tierRow}>
          {tierKeys.map((tierKey) => {
            const tier = tiers[tierKey];
            const isSelected = selectedTier === tierKey;
            const isLocked = activeSubscription && userCurrentTier === tierKey;
            const isActive = activeSubscription && userCurrentTier === tierKey;

            return (
              <TouchableOpacity
                key={tierKey}
                activeOpacity={0.9}
                disabled={isLocked}
                onPress={() => setSelectedTier(tierKey)}
                style={[
                  styles.tierCard,
                  { borderColor: tier.color },
                  isSelected && { backgroundColor: 'rgba(255,255,255,0.05)', shadowColor: tier.color },
                  isLocked && styles.tierCardDisabled,
                ]}
              >
                <View style={styles.tierHeader}>
                  <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
                  {isActive && (
                    <View style={[styles.badge, { backgroundColor: tier.color }]}>
                      <Text style={styles.badgeText}>Active</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.tierId}>{tierKey}</Text>
                <Text style={styles.tierPrice}>
                  {tier.prices[getAvailableCycles()[0]] || ''}
                </Text>
                <View style={styles.tierFooter}>
                  <IIcon name="sparkles-outline" size={16} color={tier.color} />
                  <Text style={styles.tierFooterText}>Priority matching</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>What's included</Text>
          <Text style={styles.sectionHint}>Tailored to {tiers[selectedTier]?.name}</Text>
        </View>

        <View style={styles.benefitList}>
          {tiers[selectedTier]?.features.length === 0 ? (
            <Text style={styles.emptyBenefit}>Benefits coming soon.</Text>
          ) : (
            tiers[selectedTier]?.features.map((benefit: string, index: number) => (
              <View key={index} style={styles.benefitItem}>
                <View style={[styles.benefitIcon, { backgroundColor: tiers[selectedTier].color }]}>
                  <IIcon name="checkmark" size={12} color="#0f0b14" />
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Billing cadence</Text>
        <View style={styles.cycleRow}>
          {getAvailableCycles().map((cycle: string) => {
            const isSelected = selectedDuration === cycle;
            return (
              <TouchableOpacity
                key={cycle}
                onPress={() => setSelectedDuration(cycle)}
                style={[
                  styles.cyclePill,
                  isSelected && { backgroundColor: tiers[selectedTier].color, borderColor: tiers[selectedTier].color },
                ]}
              >
                <Text style={[styles.cycleText, isSelected && styles.cycleTextSelected]}>
                  {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                </Text>
                <Text style={[styles.cyclePrice, isSelected && styles.cycleTextSelected]}>
                  {tiers[selectedTier]?.prices[cycle] || ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          activeOpacity={0.92}
          style={[styles.ctaButton, { backgroundColor: tiers[selectedTier]?.color }]}
          onPress={handleSubscribe}
        >
          <Text style={styles.ctaText}>Start {tiers[selectedTier]?.name}</Text>
          <Text style={styles.ctaSubtext}>
            {tiers[selectedTier]?.prices[selectedDuration] || ''}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Payments are charged to your account. Auto-renews unless canceled 24 hours before renewal.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
};

// Helper function to generate features based on tier
const generateFeatures = (tierKey: string): string[] => {
  const features: Record<string, string[]> = {
    plus: [
      'Priority in matchmaking',
      '2 super likes per day',
      'See who liked you',
      'Unlimited matches',
      'Profile boost once a weekly'
    ],
    vip: [
      'All Plus features',
      'Unlimited super likes',
      'Travel mode',
      'Priority customer support'
    ]
  };

  // Default features for unknown tiers
  return features[tierKey] || [
    'Priority matching',
    'Enhanced visibility',
    'Exclusive features'
  ];
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  hero: { marginBottom: 24 },
  heroKicker: { color: '#9ca3af', fontSize: 12, letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '700', marginTop: 6 },
  heroSubtitle: { color: '#cbd5e1', fontSize: 14, marginTop: 6 },
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
  tierId: { color: '#9ca3af', marginTop: 4, fontSize: 13 },
  tierPrice: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 10 },
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
  cycleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  cyclePill: {
    flexBasis: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2f3040',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  cycleText: { color: '#e5e7eb', fontWeight: '700' },
  cycleTextSelected: { color: '#0f0b14' },
  cyclePrice: { color: '#cbd5e1', marginTop: 4, fontSize: 13 },
  ctaButton: { padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 16 },
  ctaText: { color: '#0f0b14', fontSize: 17, fontWeight: '800' },
  ctaSubtext: { color: '#0f0b14', fontSize: 13, marginTop: 4 },
  disclaimer: { color: '#9ca3af', fontSize: 12, lineHeight: 16, textAlign: 'center' },
});