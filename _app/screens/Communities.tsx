import React, { useLayoutEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../funcs/static';
import { useHeaderHeight } from '@react-navigation/elements';

type Community = {
    id: string;
    name: string;
    description: string;
    icon: string;
    gradient: [string, string];
    members: number;
    category: string;
    members_list?: Person[];
};

type Person = {
    id: string;
    name: string;
    age: number;
    avatar: string;
    location: string;
    interests: string[];
    isFavorite?: boolean;
};

export function Screen_communities({ navigation, route }: { navigation: any, route: any }) {
    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
    const [favorites, setFavorites] = useState<string[]>([]);

    // Pseudo JSON data for communities
    const communities = useMemo<Community[]>(() => [
        {
            id: 'c1',
            name: 'Music Lovers',
            description: 'For those who live for music',
            icon: 'musical-notes',
            gradient: ['#ff006e', '#8338ec'],
            members: 2341,
            category: 'Interests',
            members_list: [
                { id: 'p1', name: 'Alex', age: 26, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', location: 'Portland, OR', interests: ['indie rock', 'concerts'], isFavorite: false },
                { id: 'p2', name: 'Jordan', age: 24, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', location: 'Austin, TX', interests: ['hip hop', 'production'], isFavorite: false },
                { id: 'p3', name: 'Casey', age: 28, avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=80', location: 'Brooklyn, NY', interests: ['jazz', 'vinyl'], isFavorite: false },
            ]
        },
        {
            id: 'c2',
            name: 'LGBTQ+',
            description: 'Celebrating pride and community',
            icon: 'rainbow',
            gradient: ['#ff0000', '#ff7f00'],
            members: 5234,
            category: 'Community',
            members_list: [
                { id: 'p4', name: 'Morgan', age: 25, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80', location: 'San Francisco, CA', interests: ['pride events', 'activism'], isFavorite: false },
                { id: 'p5', name: 'Riley', age: 27, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80', location: 'Los Angeles, CA', interests: ['theater', 'art'], isFavorite: false },
                { id: 'p6', name: 'Taylor', age: 26, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80', location: 'Seattle, WA', interests: ['hiking', 'gaming'], isFavorite: false },
            ]
        },
        {
            id: 'c3',
            name: 'Fitness Enthusiasts',
            description: 'Active lifestyle and wellness',
            icon: 'fitness',
            gradient: ['#00d4ff', '#0099ff'],
            members: 3567,
            category: 'Lifestyle',
            members_list: [
                { id: 'p7', name: 'Jordan', age: 29, avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80', location: 'Miami, FL', interests: ['gym', 'running'], isFavorite: false },
                { id: 'p8', name: 'Chris', age: 27, avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80', location: 'Denver, CO', interests: ['yoga', 'hiking'], isFavorite: false },
                { id: 'p9', name: 'Avery', age: 26, avatar: 'https://images.unsplash.com/photo-1500930855697-b586d89ba3ee?auto=format&fit=crop&w=200&q=80', location: 'Boston, MA', interests: ['cycling', 'CrossFit'], isFavorite: false },
            ]
        },
        {
            id: 'c4',
            name: 'Foodies & Chefs',
            description: 'Culinary adventures and dining',
            icon: 'restaurant',
            gradient: ['#ff6b6b', '#ee5a6f'],
            members: 2890,
            category: 'Interests',
            members_list: [
                { id: 'p10', name: 'Sam', age: 25, avatar: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=200&q=80', location: 'New Orleans, LA', interests: ['cooking', 'wine'], isFavorite: false },
                { id: 'p11', name: 'Jamie', age: 28, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80', location: 'San Diego, CA', interests: ['sushi', 'baking'], isFavorite: false },
                { id: 'p12', name: 'Blake', age: 27, avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=80', location: 'Chicago, IL', interests: ['BBQ', 'farm-to-table'], isFavorite: false },
            ]
        },
        {
            id: 'c5',
            name: 'Tech & Startups',
            description: 'Innovation and entrepreneurship',
            icon: 'code-slash',
            gradient: ['#667eea', '#764ba2'],
            members: 4123,
            category: 'Professional',
            members_list: [
                { id: 'p13', name: 'Quinn', age: 28, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', location: 'San Jose, CA', interests: ['AI', 'startups'], isFavorite: false },
                { id: 'p14', name: 'Casey', age: 26, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', location: 'Seattle, WA', interests: ['cloud tech', 'open source'], isFavorite: false },
                { id: 'p15', name: 'Riley', age: 29, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80', location: 'Austin, TX', interests: ['crypto', 'venture'], isFavorite: false },
            ]
        },
        {
            id: 'c6',
            name: 'Artists & Creatives',
            description: 'Painters, writers, and makers',
            icon: 'brush',
            gradient: ['#f093fb', '#f5576c'],
            members: 1956,
            category: 'Interests',
            members_list: [
                { id: 'p16', name: 'Morgan', age: 27, avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80', location: 'Los Angeles, CA', interests: ['painting', 'gallery'], isFavorite: false },
                { id: 'p17', name: 'Alex', age: 24, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80', location: 'NYC, NY', interests: ['illustration', 'design'], isFavorite: false },
                { id: 'p18', name: 'Jordan', age: 26, avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80', location: 'Portland, OR', interests: ['poetry', 'crafts'], isFavorite: false },
            ]
        },
        {
            id: 'c7',
            name: 'Adventure Seekers',
            description: 'Travel and outdoor exploration',
            icon: 'compass',
            gradient: ['#4facfe', '#00f2fe'],
            members: 3412,
            category: 'Lifestyle',
            members_list: [
                { id: 'p19', name: 'Casey', age: 29, avatar: 'https://images.unsplash.com/photo-1500930855697-b586d89ba3ee?auto=format&fit=crop&w=200&q=80', location: 'Boulder, CO', interests: ['rock climbing', 'camping'], isFavorite: false },
                { id: 'p20', name: 'Jordan', age: 27, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80', location: 'Moab, UT', interests: ['hiking', 'backpacking'], isFavorite: false },
                { id: 'p21', name: 'Blake', age: 28, avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=80', location: 'Asheville, NC', interests: ['kayaking', 'travel'], isFavorite: false },
            ]
        },
        {
            id: 'c8',
            name: 'Pet Lovers',
            description: 'For those who adore furry friends',
            icon: 'paw',
            gradient: ['#fa709a', '#fee140'],
            members: 2567,
            category: 'Interests',
            members_list: [
                { id: 'p22', name: 'Riley', age: 25, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', location: 'Portland, OR', interests: ['dogs', 'rescue'], isFavorite: false },
                { id: 'p23', name: 'Morgan', age: 26, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', location: 'Seattle, WA', interests: ['cats', 'veterinary'], isFavorite: false },
                { id: 'p24', name: 'Alex', age: 27, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80', location: 'Austin, TX', interests: ['exotic pets', 'wildlife'], isFavorite: false },
            ]
        },
    ], []);

    const renderCommunityCard = ({ item }: { item: Community }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedCommunity(item)}
            style={styles.communityCard}
        >
            <LinearGradient
                colors={item.gradient as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.communityGradient}
            >
                <IonIcon name={item.icon} size={40} color="#fff" />
            </LinearGradient>
            <View style={styles.communityInfo}>
                <Text style={styles.communityName}>{item.name}</Text>
                <Text style={styles.communityDesc}>{item.description}</Text>
                <Text style={styles.communityMeta}>{item.members.toLocaleString()} members</Text>
            </View>
            <IonIcon name="chevron-forward" size={24} color="#d1d5db" />
        </TouchableOpacity>
    );

    const renderPersonCard = ({ item }: { item: Person }) => (
        <View style={styles.personCard}>
            <Image source={{ uri: item.avatar }} style={styles.personAvatar} />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.personOverlay}
            />
            <View style={styles.personInfo}>
                <Text style={styles.personName}>{item.name}, {item.age}</Text>
                <Text style={styles.personLocation}>{item.location}</Text>
            </View>
            <View style={styles.personActions}>
                <TouchableOpacity
                    style={styles.likeButton}
                    onPress={() => {
                        setFavorites(prev => 
                            prev.includes(item.id) 
                                ? prev.filter(id => id !== item.id)
                                : [...prev, item.id]
                        );
                    }}
                >
                    <IonIcon 
                        name={favorites.includes(item.id) ? "heart" : "heart-outline"} 
                        size={28} 
                        color={favorites.includes(item.id) ? colors.primaryBtn : '#fff'}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.passButton}>
                    <IonIcon name="close" size={28} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitleAlign: 'left',
            headerTitle: () => <View>
                <Text style={styles.greeting}>{selectedCommunity ? selectedCommunity.name : 'Communities'}</Text>
                <Text style={styles.subtitle}>
                    {selectedCommunity ? `Explore ${selectedCommunity.members.toLocaleString()} members` : 'Find your people'}
                </Text>
            </View>,
            headerLeft: selectedCommunity ? () => (
                <TouchableOpacity
                    style={{ paddingLeft: 10 }}
                    onPress={() => setSelectedCommunity(null)}
                >
                    <IonIcon name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
            ) : undefined,
        });
    }, [selectedCommunity, navigation]);

    const headerHeight = useHeaderHeight();

    if (selectedCommunity) {
        return (
            <View style={[{ flex: 1, paddingTop: headerHeight }]}>
                <LinearGradient colors={['#f6f7fb', '#ffffff']} style={{ flex: 1 }}>
                    <FlatList
                        data={selectedCommunity.members_list || []}
                        keyExtractor={(item) => item.id}
                        renderItem={renderPersonCard}
                        numColumns={2}
                        columnWrapperStyle={styles.personGrid}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        scrollEnabled={true}
                    />
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={[{ flex: 1, paddingTop: headerHeight }]}>
            <LinearGradient colors={['#f6f7fb', '#ffffff']} style={{ flex: 1 }}>
                <FlatList
                    data={communities}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCommunityCard}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
                />
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
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
    communityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        marginVertical: 8,
        marginHorizontal: 10,
        padding: 14,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    communityGradient: {
        width: 64,
        height: 64,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    communityInfo: {
        flex: 1,
    },
    communityName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 2,
    },
    communityDesc: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 4,
    },
    communityMeta: {
        fontSize: 12,
        color: '#9ca3af',
        fontWeight: '600',
    },
    personGrid: {
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginBottom: 10,
        gap: 10,
    },
    personCard: {
        flex: 1,
        height: 280,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    personAvatar: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    personOverlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
    },
    personInfo: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        paddingHorizontal: 12,
    },
    personName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    personLocation: {
        fontSize: 13,
        color: '#e5e7eb',
    },
    personActions: {
        position: 'absolute',
        bottom: 12,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 12,
    },
    likeButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    passButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
});
