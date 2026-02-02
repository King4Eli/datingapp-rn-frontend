import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet, Animated, Easing, FlatList, ScrollView, Image, ActivityIndicator } from 'react-native';
import { _http_request, help, hostServer, llStorage, screenWidth } from '../funcs/functions';
import { useFocusEffect } from '@react-navigation/native';
import { LoadingGif } from '../funcs/functions_stateful';
import { styles, namer, resourceMap } from '../funcs/static';
import IIcon from 'react-native-vector-icons/Ionicons';
import { BlurView } from '@react-native-community/blur';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useHeaderHeight } from '@react-navigation/elements';
import FastImage from 'react-native-fast-image';
import LottieView from 'lottie-react-native';

export function Screen_likes({ navigation }: { navigation: any }) {
    const __MAPPER = llStorage.CONFIG.get()?.mapper;

    const getProfile = llStorage.currentProfile.get()?.currentUser;
    const activeSubscription = getProfile?.user_effect?.has_active_subscription ?? false;
    const userSubscriptionStep1 = activeSubscription && getProfile?.user_effect?.subscription_plan === "plus";
    const userSubscriptionStep2 = activeSubscription && getProfile?.user_effect?.subscription_plan === "vip";

    const headerHeight = useHeaderHeight();
    const [getNewLikes, setNewLikes] = useState<any>(null);
    const [activeFilter, setActiveFilter] = useState<'all' | 'verifiedOnly' | 'newestfirst'>('all');
    const [layout, setLayout] = useState({
        numColumns: 2,
        itemWidth: 0,
        itemHeight: 0
    });
    const LIKES_PAGE_SIZE = 12;
    const [visibleLikes, setVisibleLikes] = useState<number>(LIKES_PAGE_SIZE);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const totalLikesCount = useMemo(() => (getNewLikes?.length ?? 0), [getNewLikes]);
    const verifiedCount = useMemo(() => (getNewLikes ?? []).filter((x: any) => x?.verified || x?.user_verfied === 1).length, [getNewLikes]);
    const nearestDistance = useMemo(() => {
        const distances = (getNewLikes ?? []).map((x: any) => Number(x?.distance)).filter((d: number) => !isNaN(d));
        return distances.length > 0 ? Math.min(...distances) : null;
    }, [getNewLikes]);



    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitleAlign: 'left',
            headerTitle: () => <View style={{ alignItems: "center", flexDirection: "row", gap: 5 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', textTransform: "capitalize" }}>{"See who likes you"}</Text>
            </View>,
        });
    }, [activeSubscription]);





    // Calculate responsive layout
    const calculateLayout = (screenWidth: number) => {
        const padding = 24; // Total horizontal padding (12 + 12)
        const gap = 12; // Gap between items
        const minItemWidth = 160; // Minimum width for each item

        const numColumns = Math.max(2, Math.floor((screenWidth - padding) / (minItemWidth + gap)));
        const itemWidth = (screenWidth - padding - ((numColumns - 1) * gap)) / numColumns;
        const itemHeight = itemWidth * 1.5; // Maintain aspect ratio

        setLayout({
            numColumns,
            itemWidth,
            itemHeight
        });
    };

    const bounceAnimx = (new Animated.Value(0));
    const bounceInterpolatex = bounceAnimx.interpolate({
        inputRange: [0, 0.6, 1],
        outputRange: [0, -25, 0]
    });

    // Start bounce animation
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounceAnimx, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(bounceAnimx, {
                    toValue: 0,
                    duration: 800,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true,
                }),
            ]),
            { iterations: 2 }
        ).start();
    });

    // Initial layout calculation and on dimension change
    useEffect(() => {
        calculateLayout(screenWidth);

        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            calculateLayout(window.width);
        });

        return () => subscription?.remove();
    }, []);

    const isSuperlike = (item: any) => {
        return item?.is_superlike === true || item?.match_status === 5 || item?.match_status === '5';
    };

    const getDateMs = (item: any) => {
        const dateStr = item?.LikedUserDate;
        const parsed = dateStr ? Date.parse(dateStr) : NaN;
        return isNaN(parsed) ? 0 : parsed;
    };
    const filteredLikes = useMemo(() => {
        let list = Array.isArray(getNewLikes) ? [...getNewLikes] : [];
        if (activeFilter === 'verifiedOnly') {
            list = list.filter((x: any) => x?.verified || x?.user_verfied === 1);
        } else if (activeFilter === 'newestfirst') {
            list = list.sort((a: any, b: any) => {
                return getDateMs(b) - getDateMs(a);
            });
        }
        return list;
    }, [activeFilter, getNewLikes]);

    const processedLikes = useMemo(() => {
        const maxItems = activeSubscription ? visibleLikes : 8;
        return filteredLikes.slice(0, maxItems);
    }, [activeSubscription, filteredLikes, visibleLikes]);

    const filteredLikesCount = filteredLikes.length;

    const handleEndReached = useCallback(() => {
        if (!activeSubscription) {
            navigation.push(namer.navigation.subscription);
            return;
        }
        setTimeout(() => {
            if (visibleLikes >= filteredLikesCount) return;
            setIsLoadingMore(true);
            setVisibleLikes((prev) => {
                if (prev >= filteredLikesCount) return prev;
                return Math.min(prev + LIKES_PAGE_SIZE, filteredLikesCount || prev + LIKES_PAGE_SIZE);
            });
        }, 1000);
    }, [activeSubscription, filteredLikesCount, navigation, visibleLikes]);

    useEffect(() => {
        setVisibleLikes(LIKES_PAGE_SIZE);
        setIsLoadingMore(false);
    }, [activeFilter]);

    useEffect(() => {
        // Stop the spinner once we've applied the new slice
        if (visibleLikes >= filteredLikesCount) {
            setIsLoadingMore(false);
        }
    }, [filteredLikesCount, visibleLikes]);

    // Fetch new likes when screen is focused
    useFocusEffect(React.useCallback(() => {
        _http_request({
            reqType: 'POST',
            customApiUrl: hostServer() + "/api/core/v1/getLikes",
        }).then((response: any) => {
            setTimeout(() => {
                setNewLikes((prev: any) => {
                    const incoming = response?.likedlist;
                    if (incoming === null || incoming === undefined || !Array.isArray(incoming)) {
                        return prev ?? [];
                    }
                    return incoming;
                });
            }, getNewLikes ? 0 : 1000);
        }).finally(() => { });
    }, []));

    if (getNewLikes === null) {
        return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}><LottieView source={resourceMap.lottie.infinityLoading} autoPlay loop style={{ width: 220, height: 220 }} /></View>
    }

    return (
        <View style={[styles.container, { paddingTop: headerHeight }]}>

            <View style={styles.zcircle1} />
            <View style={styles.zcircle2} />
            <View style={styles.zcircle3} />
            {getNewLikes.length > 0 ? (
                <>
                    <FlatList key={`likesList-${layout.numColumns}`}
                        onEndReached={handleEndReached}
                        onEndReachedThreshold={0.1}
                        data={processedLikes}
                        keyExtractor={(item, index) => item?.likedUserId || index.toString()}
                        numColumns={layout.numColumns}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={<View style={{ gap: 12, marginBottom: 12 }}>
                            <View style={{ backgroundColor: '#0f172a', borderRadius: 16, padding: 14, overflow: 'hidden' }}>
                                <View style={styles.zcircle1} />
                                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>You have {totalLikesCount} likes</Text>

                                <View style={{ marginTop: 10 }}>
                                    <Pressable onPress={() => navigation.push(namer.navigation.subscription)} style={{ flex: 1, backgroundColor: '#1d4ed8', borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <MaterialCommunityIcons name="lightning-bolt-outline" size={18} color="#fff" />
                                        <Text style={{ color: '#fff', fontWeight: '700' }}>{activeSubscription ? 'Boost visibility' : 'Unlock all likes'}</Text>
                                    </Pressable>
                                </View>
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                {[
                                    { id: 'all', label: 'Super Likes' },
                                    { id: 'newestfirst', label: 'Most Recent' },
                                    { id: 'verifiedOnly', label: 'Verified only' },

                                ].map((f) => {
                                    const active = activeFilter === f.id;
                                    return (
                                        <Pressable key={f.id} onPress={() => setActiveFilter(f.id as any)} style={{
                                            paddingHorizontal: 12,
                                            paddingVertical: 9,
                                            borderRadius: 16,
                                            borderWidth: 1,
                                            borderColor: active ? '#1d4ed8' : '#e5e7eb',
                                            backgroundColor: active ? '#e0e7ff' : '#f8fafc'
                                        }}>
                                            <Text style={{ color: active ? '#1d4ed8' : '#334155', fontWeight: '600', fontSize: 12 }}>{f.label}</Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        </View>}
                        renderItem={({ item, index }) => (
                            <View style={{ width: layout.itemWidth, marginRight: (index % layout.numColumns) < (layout.numColumns - 1) ? 12 : 0 }}>
                                <Pressable style={[stylesoy.card, { width: '100%', height: layout.itemHeight, position: "relative" }]}
                                    onPress={() => {
                                        navigation.push(
                                            activeSubscription ? namer.navigation.peoplesOnePerson : namer.navigation.subscription, {
                                            getOnePersonId: item?.likedUserId,
                                            likedMatchedId: item?.likedMatchedId
                                        });
                                    }}>
                                    <View style={{ flex: 1, }}>
                                        <View style={{ flex: 1 }}>
                                            <FastImage style={stylesoy.image}
                                                source={{ cache: FastImage.cacheControl.immutable, uri: __MAPPER?.img_domain[0] + item?.likedUserImages?.p }} />
                                            {!activeSubscription && <BlurView
                                                pointerEvents="none"
                                                style={StyleSheet.absoluteFill}
                                                blurType="light"
                                                blurAmount={15}
                                                reducedTransparencyFallbackColor="white"
                                            />}
                                        </View>
                                        <View style={stylesoy.topChips}>
                                            {isSuperlike(item) && (
                                                <View style={[stylesoy.pill, { backgroundColor: '#e11d48', opacity: 0.9 }]}>
                                                    <IIcon name="diamond" size={17} color="#fff" />
                                                    <Text style={[stylesoy.pillText, { color: '#fff' }]}>Super Like</Text>
                                                </View>
                                            )}
                                            {item?.verified && (
                                                <View style={[stylesoy.pill, { borderRadius: 15, paddingHorizontal: 3, paddingVertical: 3 }]}>
                                                    <IIcon name="checkmark-done-circle-sharp" size={20} color="rgb(100, 128, 254)" style={{ backgroundColor: "#fff", borderRadius: 15 }} />
                                                </View>
                                            )}
                                            {item?.distance && (
                                                <View style={stylesoy.pill}>
                                                    <IIcon name="location-outline" size={12} color="#fff" />
                                                    <Text style={stylesoy.pillText}>{item.distance} km</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={stylesoy.infoContainer}>
                                            <Text style={stylesoy.name}>{item?.likedUserFullname[0] + '*'.repeat(Math.max(0, item?.likedUserFullname?.length - 1))},  {help.getageFromDOB(item?.likedUserDob)}</Text>
                                        </View>
                                    </View>
                                </Pressable>
                            </View>
                        )}
                        ListEmptyComponent={<View style={{ paddingVertical: 30, alignItems: 'center' }}>
                            <Text style={{ color: '#475569' }}>No likes match this filter.</Text>
                        </View>}
                        ListFooterComponent={isLoadingMore ? (
                            <View style={{ alignItems: 'center', paddingVertical: 12, width: '100%' }}>
                                <ActivityIndicator size="small" color="#1d4ed8" />
                                <Text style={{ marginTop: 6, color: '#475569', fontSize: 12 }}>Loading more likes...</Text>
                            </View>
                        ) : null}
                        // Optional performance optimizations:
                        initialNumToRender={10}
                        maxToRenderPerBatch={5}
                        windowSize={5}
                        removeClippedSubviews={false}
                    />

                    {!activeSubscription && <View style={{ position: "absolute", bottom: 24, left: 0, right: 0, alignItems: "center" }}>
                        <Animated.View style={{ transform: [{ translateY: bounceInterpolatex }] }}><Pressable
                            style={[styles.pressableButton, { flexDirection: "row", borderRadius: 20, alignItems: "center", justifyContent: "center", gap: 6 }]}
                            onPress={() => navigation.push(namer.navigation.coin)}>
                            <MaterialCommunityIcons name="heart-outline" size={24} color="#fff" />

                            <Text style={styles.pressableButtonText}>See who likes you</Text>
                        </Pressable></Animated.View>
                    </View>}

                </>
            ) : (
                <View style={stylesoy.emptyState}>
                    <MaterialCommunityIcons name="heart-outline" size={48} color="#ccc" />
                    <Text style={stylesoy.emptyText}>No new likes yet</Text>
                    <Text style={stylesoy.emptySubtext}>New likes will appear here</Text>
                </View>
            )}

        </View>
    );
}

const stylesoy = StyleSheet.create({


    card: {
        borderRadius: 8,
        backgroundColor: '#fff', marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        backgroundColor: '#454545ff',
    },
    topChips: {
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pillText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    infoContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
    },
    name: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 4,
    },
    cbsheet_press: {
        padding: 12,
    }
});
