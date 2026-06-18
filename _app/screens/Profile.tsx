import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import IIcon from 'react-native-vector-icons/Ionicons';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { cacheStorage, help, llStorage, logReport, parseCategoryProducts, screenWidth } from '../funcs/functions';
import { namer, resourceMap } from '../funcs/static';

const PLAN_UI: Record<string, { icon: string; color: string; cardColors: string[] }> = {
    plus: { icon: 'diamond-outline', color: '#111827', cardColors: ['#111827', '#374151'] },
    vip: { icon: 'crown-outline', color: '#92400e', cardColors: ['#f59e0b', '#b45309'] },
    free: { icon: 'account-heart-outline', color: '#64748b', cardColors: ['#334155', '#0f172a'] },
};

const getPlanUi = (plan?: string | null) => PLAN_UI[String(plan ?? '').trim().toLowerCase()] ?? PLAN_UI.free;

export function Screen_profile({ navigation }: { navigation: any }) {
    const headerHeight = useHeaderHeight();
    const [profile, setProfile] = useState<any>(null);
    const [mainSubProducts, setMainSubProducts] = useState<any[]>([]);

    const mapper = llStorage.CONFIG.get()?.mapper;
    const imageDomain = mapper?.img_domain?.[0] ?? mapper?.img_domain?.[2] ?? '';
    const consumableProducts: any[] = [];

    const profileCore = profile?.profile ?? {};
    const images = Array.isArray(profileCore?.images) ? profileCore.images : [];
    const userVerified = Boolean(profileCore?.verified ?? profile?.user_verified);
    const displayName = profileCore?.fullname ?? profile?.user_fullname ?? 'Your profile';
    const displayAge = help.getageFromDOB(profileCore?.dob ?? profile?.user_bio_dob ?? '');
    const firstImagePath = images?.[0]?.p ?? images?.[0]?.uri ?? '';
    const firstImageUri = firstImagePath ? (firstImagePath.startsWith('http') ? firstImagePath : `${imageDomain}${firstImagePath}`) : '';
    const bioText = String(profileCore?.about ?? profile?.user_bio_about ?? '').trim();

    const subscriptionState = help.getSubscriptionState(profile);
    const activeSubscription = subscriptionState.hasActive;
    const subscriptionPlanUi = getPlanUi(subscriptionState.tier);

    const visibleMainSubProducts = useMemo(() => {
        if (subscriptionState.isVip) return [];
        if (subscriptionState.isPlus) {
            return mainSubProducts.filter((tier: any) => String(tier?.name ?? '').trim().toLowerCase() === 'vip');
        }
        return mainSubProducts;
    }, [mainSubProducts, subscriptionState.isPlus, subscriptionState.isVip]);

    const profileCompletion = useMemo(() => {
        const checkpoints = [
            String(profile?.user_bio_about ?? profileCore?.about ?? '').trim().length >= 3,
            images.length >= 3,
            (profile?.user_bio_prompt ?? []).length > 0,
        ];
        const score = checkpoints.filter(Boolean).length;
        return Math.round((score / checkpoints.length) * 100);
    }, [images.length, profile, profileCore?.about]);

    useFocusEffect(
        React.useCallback(() => {
            let mounted = true;

            (async () => {
                try {
                    const [products, freshProfile] = await Promise.all([
                        (async () => {
                            const raw = await cacheStorage.getProducts();
                            return parseCategoryProducts(raw, namer.productCategoryName.mainsub);
                        })(),
                        cacheStorage.getCurrentUserProfile(),
                    ]);

                    if (mounted) {
                        setMainSubProducts(Array.isArray(products) ? products : []);
                        setProfile(freshProfile);
                    }
                } catch {
                    if (mounted) {
                        setMainSubProducts([]);
                        setProfile(null);
                    }
                }
            })();

            return () => {
                mounted = false;
            };
        }, []),
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTransparent: true,
            headerTitle: '',
            headerRight: () => (
                <Pressable style={stylesx.headerButton} onPress={() => navigation.navigate(namer.navigation.settings)}>
                    <MIcon name="cog-outline" size={25} color="#263238" />
                </Pressable>
            ),
        });
    }, [navigation]);

    if (profile === null) {
        return (
            <View style={stylesx.loadingWrap}>
                <LottieView source={resourceMap.lottie.infinityLoading} autoPlay loop style={{ width: 220, height: 220 }} />
            </View>
        );
    }

    return (
        <View style={stylesx.root}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={stylesx.scrollContent}>

                {/* ── Hero ── */}
                <View style={[stylesx.hero, { height: 260 + headerHeight }]}>
                    {firstImageUri ? (
                        <FastImage
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                            resizeMode="cover"
                            source={{ uri: firstImageUri }}
                            onError={() => logReport({ type: 'http -image', logMessage: 'Image load', url: firstImageUri, useraction: 'Image Load', stackTrace: null })}
                        />
                    ) : (
                        <View style={stylesx.heroEmpty}>
                            <MIcon name="account-heart-outline" size={80} color="#e8546f" />
                        </View>
                    )}

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.72)']}
                        style={[stylesx.heroGradient, { paddingBottom: 20 }]}>
                        <View style={stylesx.heroNameRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={stylesx.heroName} numberOfLines={1}>
                                    {displayName}{displayAge ? `, ${displayAge}` : ''}
                                </Text>
                                {userVerified && (
                                    <View style={stylesx.heroVerified}>
                                        <IIcon name="checkmark-done-circle-sharp" size={15} color="#60a5fa" />
                                        <Text style={stylesx.heroVerifiedText}>Verified</Text>
                                    </View>
                                )}
                            </View>
                            <View style={stylesx.heroPlanBadge}>
                                <MIcon name={subscriptionPlanUi.icon} size={13} color="#fff" />
                                <Text style={stylesx.heroPlanBadgeText}>
                                    {activeSubscription ? `${subscriptionState.plan} ${subscriptionState.variant ?? ''}`.trim() : 'Free'}
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* ── Content ── */}
                <View style={stylesx.content}>

                    {/* Action buttons */}
                    <View style={stylesx.actionRow}>
                        <ProfileAction icon="square-edit-outline" label="Edit Profile" onPress={() => navigation.navigate(namer.navigation.editprofile)} />
                        {!userVerified && (
                            <ProfileAction icon="camera-outline" label="Verify Account" secondary onPress={() => navigation.navigate(namer.navigation.editprofile)} />
                        )}
                    </View>

                    {/* Profile completion */}
                    <View style={stylesx.card}>
                        <View style={stylesx.completionHeaderRow}>
                            <Text style={stylesx.sectionTitle}>Profile strength</Text>
                            <Text style={stylesx.completionPct}>{profileCompletion}%</Text>
                        </View>
                        <View style={stylesx.progressTrack}>
                            <View style={[stylesx.progressFill, { width: `${profileCompletion}%` as any }]} />
                        </View>
                        {profileCompletion < 100 && (
                            <Text style={stylesx.completionHint}>
                                {profileCompletion === 0 && 'Add a bio, photos, and prompts to get more matches'}
                                {profileCompletion === 33 && 'Add at least 3 photos and write some prompts'}
                                {profileCompletion === 67 && 'Write a few prompts to stand out'}
                            </Text>
                        )}
                    </View>

                    {/* Bio */}
                    {bioText.length > 0 && (
                        <View style={stylesx.card}>
                            <SectionHeader title="About me" />
                            <Text style={stylesx.bioText} numberOfLines={4}>{bioText}</Text>
                        </View>
                    )}

                    {/* Power-ups */}
                    <View style={stylesx.card}>
                        <SectionHeader title="Power-ups" hint="Boost, spotlight, or message first." />
                        {consumableProducts.length > 0 ? (
                            <View style={stylesx.powerGrid}>
                                {consumableProducts.map((product: any, index: number) => (
                                    <Pressable
                                        key={product?.sku ?? product?.name ?? index}
                                        style={stylesx.productPill}
                                        onPress={() => navigation.navigate(namer.navigation.consumables, { productcategory: namer.productCategoryName.superlike })}>
                                        <MIcon name={index % 2 === 0 ? 'heart' : 'chatbubble-ellipses'} size={22} color="#e8546f" />
                                        <View>
                                            <Text style={stylesx.productLabel}>{product?.name}</Text>
                                            <Text style={stylesx.productCount}>{product?.count ?? 0} available</Text>
                                        </View>
                                    </Pressable>
                                ))}
                            </View>
                        ) : (
                            <Pressable
                                style={stylesx.powerEmpty}
                                onPress={() => navigation.navigate(namer.navigation.consumables, { productcategory: namer.productCategoryName.superlike })}>
                                <View style={stylesx.powerEmptyIcon}>
                                    <MIcon name="star-four-points-outline" size={24} color="#e8546f" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={stylesx.powerEmptyTitle}>No power-ups active</Text>
                                    <Text style={stylesx.powerEmptyText}>Open the shop to add one when you need a lift.</Text>
                                </View>
                                <MIcon name="chevron-right" size={24} color="#94a3b8" />
                            </Pressable>
                        )}
                    </View>

                    {/* Streak */}
                    <View style={stylesx.card}>
                        <SectionHeader title="7 day streak" hint="Come back tomorrow to keep it going." icon="fire" />
                        <View style={stylesx.streakRow}>
                            {Array.from({ length: 7 }).map((_, index) => {
                                const isActive = index < (profile?.user_effect?.streakcount ?? 1);
                                return (
                                    <View key={index} style={[stylesx.streakDot, isActive && stylesx.streakDotActive]}>
                                        <MIcon name={index === 6 ? 'gift-outline' : 'fire'} size={index === 6 ? 21 : 23} color={isActive ? '#f59e0b' : '#94a3b8'} />
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* Plan cards — full-bleed horizontal scroll outside padded content */}
                {visibleMainSubProducts.length > 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={[
                            stylesx.planCardsContent,
                            visibleMainSubProducts.length === 1 && stylesx.singlePlanCardsContent,
                        ]}>
                        {visibleMainSubProducts.map((tier: any, index: number) => {
                            const tierName = String(tier?.name ?? '').trim();
                            const tierUi = getPlanUi(tierName);
                            const isCurrentTier = activeSubscription && subscriptionState.tier === tierName.toLowerCase();
                            const features = (tier?.description?.features ?? [])
                                .filter((feature: any) => feature?.e !== false && String(feature?.d ?? '').trim().length > 0)
                                .map((feature: any) => feature.d)
                                .slice(0, 4);

                            return (
                                <LinearGradient
                                    key={tier?.sku ?? index}
                                    colors={tierUi.cardColors}
                                    style={[stylesx.planCard, visibleMainSubProducts.length === 1 && stylesx.singlePlanCard]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}>
                                    <View style={stylesx.planHeader}>
                                        <Text style={stylesx.planTitle}>{tierName || 'Upgrade'}</Text>
                                        <MIcon name={tierUi.icon} size={22} color="#fff" />
                                    </View>

                                    <View style={stylesx.featuresList}>
                                        {features.length > 0 ? features.map((feature: string, featureIndex: number) => (
                                            <View key={`${feature}-${featureIndex}`} style={stylesx.featureItem}>
                                                <IIcon name="checkmark-circle" size={16} color="#fff" />
                                                <Text style={stylesx.featureText}>{feature}</Text>
                                            </View>
                                        )) : (
                                            <Text style={stylesx.featureText}>No features configured</Text>
                                        )}
                                    </View>

                                    <TouchableOpacity
                                        style={[stylesx.upgradeButton, isCurrentTier && stylesx.currentPlanButton]}
                                        disabled={isCurrentTier}
                                        onPress={() => navigation.navigate(namer.navigation.subscription, { tab: tier?.name })}>
                                        <Text style={stylesx.upgradeButtonText}>{isCurrentTier ? 'Current plan' : 'Upgrade'}</Text>
                                    </TouchableOpacity>
                                </LinearGradient>
                            );
                        })}
                    </ScrollView>
                )}

            </ScrollView>
        </View>
    );
}

const ProfileAction = ({ icon, label, secondary, onPress }: { icon: string; label: string; secondary?: boolean; onPress: () => void }) => (
    <Pressable style={[stylesx.profileAction, secondary && stylesx.profileActionSecondary]} onPress={onPress}>
        <MIcon name={icon} size={20} color={secondary ? '#7c3aed' : '#fff'} />
        <Text style={[stylesx.profileActionText, secondary && stylesx.profileActionTextSecondary]}>{label}</Text>
    </Pressable>
);

const SectionHeader = ({ title, hint, icon }: { title: string; hint?: string; icon?: string }) => (
    <View style={stylesx.sectionHeader}>
        {icon && (
            <View style={stylesx.sectionIcon}>
                <MIcon name={icon} size={20} color="#e8546f" />
            </View>
        )}
        <View style={{ flex: 1 }}>
            <Text style={stylesx.sectionTitle}>{title}</Text>
            {!!hint && <Text style={stylesx.sectionHint}>{hint}</Text>}
        </View>
    </View>
);

const stylesx = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        paddingBottom: 28,
    },
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    headerButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        marginRight: 10,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 3,
    },

    // Hero
    hero: {
        width: '100%',
        backgroundColor: '#f1f5f9',
        overflow: 'hidden',
    },
    heroEmpty: {
        ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
    },
    heroGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
        justifyContent: 'flex-end',
        paddingHorizontal: 18,
    },
    heroNameRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
    },
    heroName: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '900',
        lineHeight: 30,
    },
    heroVerified: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    heroVerifiedText: {
        color: '#93c5fd',
        fontSize: 12,
        fontWeight: '700',
    },
    heroPlanBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 999,
        paddingHorizontal: 11,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    heroPlanBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'capitalize',
    },

    // Content area
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 12,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    profileAction: {
        flex: 1,
        minHeight: 48,
        borderRadius: 16,
        backgroundColor: '#e8546f',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 7,
    },
    profileActionSecondary: {
        backgroundColor: '#f5f3ff',
        borderWidth: 1,
        borderColor: '#ddd6fe',
    },
    profileActionText: {
        color: '#fff',
        fontWeight: '900',
    },
    profileActionTextSecondary: {
        color: '#7c3aed',
    },

    // Card
    card: {
        borderRadius: 22,
        backgroundColor: '#fff',
        padding: 16,
        gap: 12,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 3,
    },

    // Profile completion
    completionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    completionPct: {
        color: '#e8546f',
        fontSize: 16,
        fontWeight: '900',
    },
    progressTrack: {
        height: 7,
        borderRadius: 999,
        backgroundColor: '#f1f5f9',
        overflow: 'hidden',
    },
    progressFill: {
        height: 7,
        borderRadius: 999,
        backgroundColor: '#e8546f',
    },
    completionHint: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 17,
    },

    // Bio
    bioText: {
        color: '#334155',
        fontSize: 14,
        lineHeight: 21,
        fontWeight: '500',
    },

    // Section header
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sectionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff1f5',
    },
    sectionTitle: {
        color: '#0f172a',
        fontSize: 17,
        fontWeight: '900',
    },
    sectionHint: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 3,
    },

    // Power-ups
    powerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    productPill: {
        flexGrow: 1,
        minWidth: 140,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    productLabel: {
        color: '#0f172a',
        fontSize: 14,
        fontWeight: '900',
        textTransform: 'capitalize',
    },
    productCount: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
    },
    powerEmpty: {
        minHeight: 76,
        borderRadius: 18,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    powerEmptyIcon: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff1f5',
    },
    powerEmptyTitle: {
        color: '#0f172a',
        fontSize: 14,
        fontWeight: '900',
    },
    powerEmptyText: {
        color: '#64748b',
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2,
        fontWeight: '600',
    },

    // Plan cards
    planCardsContent: {
        gap: 10,
        paddingHorizontal: 16,
        marginTop: 12,
    },
    singlePlanCardsContent: {
        flexGrow: 1,
    },
    planCard: {
        width: screenWidth * 0.8,
        borderRadius: 22,
        padding: 16,
        minHeight: 220,
        justifyContent: 'space-between',
    },
    singlePlanCard: {
        width: undefined,
        flex: 1,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    planTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '900',
        textTransform: 'capitalize',
    },
    featuresList: {
        gap: 8,
        marginVertical: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    featureText: {
        flex: 1,
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 18,
    },
    upgradeButton: {
        minHeight: 44,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.22)',
    },
    currentPlanButton: {
        backgroundColor: 'rgba(255,255,255,0.34)',
    },
    upgradeButtonText: {
        color: '#fff',
        fontWeight: '900',
    },

    // Streak
    streakRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    streakDot: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    streakDotActive: {
        backgroundColor: '#fffbeb',
        borderColor: '#fde68a',
    },
});
