import React, { useState, useLayoutEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LoadingGif } from '../funcs/functions_stateful';
import IIcon from 'react-native-vector-icons/Ionicons';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { styles, namer } from '../funcs/static';
import { ScrollView } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { _http_request, help, llStorage, screenWidth } from '../funcs/functions';
import { useHeaderHeight } from '@react-navigation/elements';
import FastImage from 'react-native-fast-image';
import Svg, { Circle } from 'react-native-svg';

const style = StyleSheet.create({
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
})

export function Screen_profile({ navigation }: { navigation: any }) {
    const __MAPPER = llStorage.CONFIG.get()?.mapper;
    const __product_MAPPER = llStorage.purchasing_product?.get()?.mainsub;
    const tierKeys = Object.keys(__product_MAPPER || {});

    // Get profile data
    const [getProfile, setgetProfile] = useState(llStorage.currentProfile.get()?.currentUser);
    const activeSubscription = getProfile?.user_effect?.has_active_subscription ?? false;
    const userCurrentTier = getProfile?.user_effect?.subscription_plan;


    // Colors for tiers - will use dynamically based on tier count
    const TIER_COLORS = ['#F25F7F', '#D4AF37', '#5B8DEF', '#34C759'];
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

    // Build tier data dynamically
    const tiers = useMemo(() => {
        const tierData: Record<string, any> = {};

        tierKeys.forEach((tierKey, index) => {
            const tierItems = __product_MAPPER?.[tierKey] || [];
            console.log(__product_MAPPER)
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


    const sqlmapper = {} as any;
    const headerHeight = useHeaderHeight();

    const userVerified = getProfile?.user_verified === 1 ? true : false;

    const userSubscriptionStep1 = activeSubscription && getProfile?.user_effect?.subscription_plan === "plus";
    const userSubscriptionStep2 = activeSubscription && getProfile?.user_effect?.subscription_plan === "vip";    //const smallPrk = getProfile.liltab;


    const profileCompletion = useMemo(() => {
        const checkpoints = [
            getProfile?.user_bio_about?.length >= 3,
            (getProfile?.user_image ?? []).length >= 3,
            (getProfile?.user_bio_prompt ?? []).length >= 0,

            // !!getProfile?.user_bio_job,
            // !!getProfile?.user_bio_school,

            //!!getProfile?.user_bio_highesteducation,
            //!!getProfile?.user_interest?.length,
        ];
        const score = checkpoints.filter(Boolean).length;
        console.log(score, checkpoints);
        return Math.round((score / checkpoints.length) * 100);
    }, [getProfile]);



    useFocusEffect(React.useCallback(() => {
        setgetProfile(llStorage.currentProfile.get()?.currentUser);
    }, []));

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTransparent: true,
            headerRight: () => (<View style={{ paddingRight: 5 }}>
                <Pressable style={{ marginRight: 5 }} onPress={() => { navigation.push(namer.navigation.settings); }}>
                    <MIcon name="cog-outline" size={32} color="#333333" />
                </Pressable>
            </View>),
        });
    }, []);

    const CircularProgress = ({ size = 108, strokeWidth = 2, progress = 0, color = '#ff6363' }) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const strokeDashoffset = circumference - (progress / 100) * circumference;

        return (
            <Svg width={size} height={size} style={{ position: 'absolute' }}>
                {/* Background Circle */}
                <Circle
                    stroke="#e0e0e0"
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                {/* Progress Circle */}
                <Circle
                    stroke={color}
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
        );
    };



    if (getProfile === null) {
        return <LoadingGif />
    }

    return (
        <View style={[styles.container, { paddingHorizontal: 0, paddingTop: headerHeight, }]}>
            <View style={styles.zcircle1} />
            <View style={styles.zcircle2} />
            <View style={styles.zcircle3} />
            <ScrollView showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.conainerScrollView, { paddingBottom: 10 }]}>
                <View style={{ gap: 10 }}>
                    <View style={{ gap: 10 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
                            <Pressable onPress={async () => { navigation.push(namer.navigation.editprofile); }}>
                                <View style={{ position: 'relative', width: 108, height: 108, alignItems: 'center', justifyContent: 'center' }}>
                                    {/* Circular Progress */}
                                    <CircularProgress progress={profileCompletion} />

                                    {/* Profile Image */}
                                    <View style={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: 50,
                                        borderWidth: 2,
                                        borderColor: profileCompletion === 100 ? '#ff6363' : 'transparent',
                                        overflow: 'hidden',
                                    }}>
                                        <FastImage
                                            style={{ width: '100%', height: '100%' }}
                                            resizeMode='cover'
                                            source={{ uri: String(__MAPPER?.img_domain[0] + (getProfile?.user_image?.[0]?.p ?? "")) }}
                                        />
                                    </View>

                                    {/* Verified Badge */}
                                    {userVerified && (
                                        <View style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            backgroundColor: 'white',
                                            borderRadius: 50,
                                        }}>
                                            <IIcon name="checkmark-done-circle-sharp" size={32} color="#4F8EF7" />
                                        </View>
                                    )}
                                </View>
                            </Pressable>

                            <View style={{ gap: 15 }}>
                                <Text style={{ fontSize: 16, fontWeight: 600, }}>{getProfile?.user_fullname}, {help.getageFromDOB(getProfile?.user_bio_dob)}</Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: "row", gap: 5 }}>
                            <Pressable onPress={() => { navigation.push(namer.navigation.editprofile); }} style={[ag.bi,]}>
                                <Text>Edit Profile</Text>
                            </Pressable>
                            {!userVerified && <Pressable onPress={() => { navigation.push(namer.navigation.editprofile); }}
                                style={[ag.bi, { backgroundColor: "#b683e9ff", borderWidth: 0 }]}>
                                <MIcon name="camera" size={22} color="#204586ff" />
                                <Text style={{ color: "#fff", fontSize: 12, lineHeight: 15 }}>Verify Account</Text>
                            </Pressable>}
                        </View>
                    </View>


                    <View style={[styles.card, stylesx.powerCard]}>
                        <View style={stylesx.powerHeader}>
                            <View>
                                <Text style={stylesx.sectionTitle}>Power-ups</Text>
                                <Text style={stylesx.sectionHint}>Use coins to boost, spotlight, or message first.</Text>
                            </View>
                            <TouchableOpacity
                                style={stylesx.coinPill}
                                onPress={() => navigation.push(namer.navigation.coin)}
                            >
                                <View style={stylesx.coinRow}>
                                    <IIcon name="cash-outline" size={18} color="#0f0b14" />
                                    <Text style={stylesx.coinAmount}>{getProfile?.user_stats?.cointoken ?? 0} coins</Text>
                                </View>
                                <Text style={stylesx.coinAction}>Top up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>


                    {!userSubscriptionStep2 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }} >

                        {!userSubscriptionStep1 && tierKeys.map((tierKey, key) => {
                            const tier = tiers[tierKey];
                            const color = [['#000000', '#00000080'], ['#FF9E00', '#FF9E0080']]
                            const icon = ["diamond-outline", "crown-outline"]

                            return (
                                <LinearGradient key={key}
                                    colors={color[key]}
                                    style={stylesx.featureCard}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}>
                                    <View style={{ padding: 16 }}>
                                        <View style={stylesx.cardHeader}>
                                            <Text style={stylesx.cardTitle}>{tier.name}</Text>
                                            <MIcon name={icon[key]} size={20} color="#fff" />
                                        </View>

                                        <View style={stylesx.featuresList}>
                                            {(sqlmapper?.payment_plan?.subscribe?.[1]?.features ?? []).map((feature: any, index: any) => (
                                                <View key={index} style={stylesx.featureItem}>
                                                    <IIcon name="checkmark-circle" size={16} color="#fff" />
                                                    <Text style={stylesx.featureText}>{feature}</Text>
                                                </View>
                                            ))}
                                        </View>

                                        <TouchableOpacity style={stylesx.upgradeButton}
                                            onPress={() => navigation.push(namer.navigation.subscription)} >
                                            <Text style={stylesx.upgradeButtonText}>Upgrade</Text>
                                        </TouchableOpacity>
                                    </View>
                                </LinearGradient>

                            )
                        })}
                    </ScrollView>}


                    {!activeSubscription && <View style={styles.card}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <MIcon name='fire' size={30} />
                            <Text style={{ fontSize: 20, fontWeight: 600 }}>7 days streak</Text>
                        </View>
                        <View style={{ paddingLeft: 30 }}>
                            <Text>Keep it up! You are doing great.</Text>
                            <Text style={{ fontSize: 13, color: "grey" }}>Come back tomorrow to keep it going.</Text>
                        </View>
                        <View style={{ flexDirection: "row", paddingVertical: 10, justifyContent: "space-between" }}>
                            {[
                                { name: "fire", size: 30, },
                                { name: "fire", size: 30, },
                                { name: "fire", size: 30, },
                                { name: "fire", size: 30, },
                                { name: "fire", size: 30, },
                                { name: "fire", size: 30, },
                                { name: "gift", size: 25, },
                            ].map((icon, i) => (<View key={i} style={{
                                width: 45, height: 45,
                                borderWidth: 0.2, borderRadius: 25,
                                justifyContent: "center", alignItems: "center",
                                backgroundColor: "#fff",
                                // iOS shadow
                                shadowColor: "#000",
                                shadowOffset: { width: 2, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                            }}><MIcon name={icon.name} size={icon.size} color={i < (getProfile?.user_effect?.streakcount ?? 1) ? "orange" : "grey"} /></View>))}
                        </View>


                    </View>}


                </View>
            </ScrollView>



        </View >
    );
}

const stylesx = StyleSheet.create({
    powerCard: {
        gap: 14,
        backgroundColor: '#fafafa',
    },

    powerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    coinPill: {
        backgroundColor: '#ffeec2',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'flex-end',
    },
    coinRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    coinAmount: {
        fontWeight: '700',
        color: '#0f0b14',
    },
    coinAction: {
        fontSize: 12,
        color: '#7a5200',
        marginTop: 2,
    },





 

    featureCard: {
        width: screenWidth * 0.90,
        flex: 1, // Set fixed height instead of flex
        borderRadius: 16,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 4,
        color: '#333',
    },
    statItem: {
        width: (screenWidth - 48) / 3,
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderColor: "#ccc",
        borderWidth: .6,
        justifyContent: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    statAction: {
        fontSize: 11,
        color: '#4F8EF7',
        fontWeight: '500',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    featuresList: {
        marginBottom: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    featureText: {
        fontSize: 14,
        color: '#fff',
        marginLeft: 8,
    },
    upgradeButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: 'center',
    },
    upgradeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    sectionCard: {
        gap: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f1f1f',
    },
    sectionHint: {
        color: '#6b6b6b',
        fontSize: 12,
    },
    sectionTag: {
        backgroundColor: '#fef1f3',
        color: '#f95f62',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        fontWeight: '600',
        fontSize: 12,
    },
    progressTrack: {
        height: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 999,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#f95f62',
        borderRadius: 999,
    },
});

const ag = StyleSheet.create({
    aj: {
        backgroundColor: '#4a90e2',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',

        // 👇 grid-friendly tweaks
        width: '48%',         // forces 2 per row
        marginBottom: 12,
    },
    bi: {
        paddingHorizontal: 12, paddingVertical: 2, borderRadius: 10, borderWidth: 2,
        borderColor: "#bac", flexDirection: "row",
        alignItems: "center", gap: 5, justifyContent: "center"
    }
});
