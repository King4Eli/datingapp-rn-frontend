import React, { useLayoutEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../funcs/static';
import { useHeaderHeight } from '@react-navigation/elements';

type Story = {
    id: string;
    name: string;
    avatar: string;
    isLive?: boolean;
};

type Post = {
    id: string;
    name: string;
    time: string;
    avatar: string;
    text: string;
    tags: string[];
    image?: string;
    likes: number;
    comments: number;
    bookmarked?: boolean;
};

export function Screen_social({ navigation, route }: { navigation: any, route: any }) {
    const filters = useMemo(() => ['For you', 'Nearby', 'Creative', 'Nightlife', 'Foodies'], []);
    const [activeFilter, setActiveFilter] = useState(filters[0]);

    // Static placeholders to make the screen feel alive.
    const stories = useMemo<Story[]>(() => [
        { id: 's1', name: 'You', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80' },
        { id: 's2', name: 'Sam', avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=80', isLive: true },
        { id: 's3', name: 'Nia', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80' },
        { id: 's4', name: 'Andre', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80', isLive: true },
        { id: 's5', name: 'Mei', avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80' },
    ], []);

    const posts = useMemo<Post[]>(() => [
        {
            id: 'p1',
            name: 'Sasha Bloom',
            time: '5m ago · Downtown',
            avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
            text: 'Golden hour walks with good music. Any rooftop spots I should try next?',
            tags: ['sunset', 'city', 'rooftop'],
            image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
            likes: 324,
            comments: 48,
            bookmarked: true,
        },
        {
            id: 'p2',
            name: 'Arjun Patel',
            time: '18m ago · Arts District',
            avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80',
            text: 'New latte art obsession unlocked. Who is up for a slow Saturday café crawl?',
            tags: ['coffee', 'local gems'],
            image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
            likes: 201,
            comments: 23,
        },
        {
            id: 'p3',
            name: 'Jasmine',
            time: '1h ago · Riverwalk',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
            text: 'Trying to sketch every day this week. Drop your favorite prompts below.',
            tags: ['art', 'daily challenge'],
            likes: 97,
            comments: 14,
        },
    ], []);

    const renderStory = ({ item }: { item: Story }) => (
        <View key={item.id} style={styles.storyItem}>
            <LinearGradient
                colors={item.isLive ? ['#ff5f6d', '#ffc371'] : ['#d1d5db', '#f3f4f6']}
                style={styles.storyRing}
            >
                <Image source={{ uri: item.avatar }} style={styles.storyAvatar} />
                {item.isLive && (
                    <View style={styles.liveBadge}>
                        <Text style={styles.liveText}>LIVE</Text>
                    </View>
                )}
            </LinearGradient>
            <Text style={styles.storyName} numberOfLines={1}>{item.name}</Text>
        </View>
    );

    const renderPost = ({ item }: { item: Post }) => (
        <View style={[styles.card,]}>
            <View style={styles.cardHeader}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={styles.cardHeaderText}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.time}>{item.time}</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconButton}>
                        <IonIcon name="bookmark" size={20} color={item.bookmarked ? colors.primaryBtn : '#9ca3af'} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <IonIcon name="ellipsis-horizontal" size={22} color="#111827" />
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.postText}>{item.text}</Text>

            <View style={styles.tagRow}>
                {item.tags.map(tag => (
                    <View key={tag} style={styles.tagChip}>
                        <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                ))}
            </View>

            {item.image && (
                <View style={styles.mediaWrapper}>
                    <Image source={{ uri: item.image }} style={styles.media} />
                    <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)']} style={styles.mediaOverlay} />
                    <View style={styles.mediaActions}>
                        <TouchableOpacity style={styles.mediaButton}>
                            <IonIcon name="play-circle" size={24} color="#fff" />
                            <Text style={styles.mediaButtonText}>Moments</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.mediaButton}>
                            <IonIcon name="chatbubble-ellipses" size={20} color="#fff" />
                            <Text style={styles.mediaButtonText}>DM</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View style={styles.cardFooter}>
                <View style={styles.footerGroup}>
                    <IonIcon name="heart" size={20} color={colors.primaryBtn} />
                    <Text style={styles.footerText}>{item.likes}</Text>
                </View>
                <View style={styles.footerGroup}>
                    <IonIcon name="chatbubble-outline" size={20} color="#4b5563" />
                    <Text style={styles.footerText}>{item.comments}</Text>
                </View>
                <View style={styles.footerGroup}>
                    <IonIcon name="share-social-outline" size={20} color="#4b5563" />
                    <Text style={styles.footerText}>Share</Text>
                </View>
            </View>
        </View>
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitleAlign: 'left',
            headerTitle: () => <View>
                <Text style={styles.greeting}>Social</Text>
                <Text style={styles.subtitle}>See what everyone is up to</Text>
            </View>,

            headerRight: () =>
                <View style={{ paddingHorizontal: 10 }}>
                    <TouchableOpacity style={styles.ctaButton}>
                        <IonIcon name="add" size={22} color="#fff" />
                        <Text style={styles.ctaText}>Post</Text>
                    </TouchableOpacity>
                </View>
        });
    });



    const headerHeight = useHeaderHeight();
    return (
        <View style={[{ flex: 1, paddingTop: headerHeight, position: "relative" }]}>
            <LinearGradient colors={['#f6f7fb', '#ffffff']} style={{ flex: 1 }}>


                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPost}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 15, paddingHorizontal: 10 }}
                    ListHeaderComponent={(
                        <View>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.storiesRow}
                            >
                                {stories.map(story => {
                                    return renderStory({ item: story });
                                })}
                            </ScrollView>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={[styles.filterRow]}
                            >
                                {filters.map(filter => {
                                    const isActive = filter === activeFilter;
                                    return (
                                        <TouchableOpacity
                                            key={filter}
                                            style={[styles.filterChip, isActive && styles.filterChipActive]}
                                            onPress={() => setActiveFilter(filter)}
                                        >
                                            <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{filter}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}
                />
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#eef2ff',
    },
    container: {
        flex: 1,
        paddingHorizontal: 14,
        paddingTop: 4,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    greeting: {
        fontSize: 26,
        fontWeight: '800',
        color: '#0f172a',
    },
    subtitle: {
        color: '#6b7280',
        marginTop: 2,
        fontSize: 13,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.primaryBtn,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        shadowColor: '#f95464',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
    },
    ctaText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    storiesRow: {
        paddingVertical: 8,
        gap: 14,
        paddingRight: 4,
    },
    storyItem: {
        alignItems: 'center',
        width: 72,
    },
    storyRing: {
        width: 64,
        height: 64,
        borderRadius: 32,
        padding: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    storyAvatar: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#e5e7eb',
    },
    storyName: {
        marginTop: 6,
        fontSize: 12,
        color: '#374151',
    },
    liveBadge: {
        position: 'absolute',
        bottom: -6,
        backgroundColor: '#ef4444',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fff',
    },
    liveText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.4,
    },
    filterRow: {
        paddingVertical: 4,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    filterChipActive: {
        backgroundColor: '#111827',
        borderColor: '#111827',
        shadowColor: '#111827',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    filterText: {
        color: '#4b5563',
        fontWeight: '600',
    },
    filterTextActive: {
        color: '#fff',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 14,
        marginTop: 14,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 5,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#e5e7eb',
    },
    cardHeaderText: {
        flex: 1,
        marginLeft: 10,
    },
    name: {
        fontWeight: '800',
        fontSize: 16,
        color: '#111827',
    },
    time: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        padding: 6,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
    },
    postText: {
        marginTop: 12,
        fontSize: 15,
        color: '#111827',
        lineHeight: 21,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    tagChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#eef2ff',
    },
    tagText: {
        color: '#4f46e5',
        fontWeight: '700',
        fontSize: 12,
    },
    mediaWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 12,
        position: 'relative',
        backgroundColor: '#e5e7eb',
    },
    media: {
        width: '100%',
        height: 210,
    },
    mediaOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    mediaActions: {
        position: 'absolute',
        right: 12,
        bottom: 12,
        flexDirection: 'row',
        gap: 10,
    },
    mediaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 12,
    },
    mediaButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    footerGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        color: '#111827',
        fontWeight: '700',
    },
});
