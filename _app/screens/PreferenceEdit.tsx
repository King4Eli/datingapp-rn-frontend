import React, { useCallback, useLayoutEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import IIcon from 'react-native-vector-icons/Ionicons';
import { Loaderx } from '../funcs/functions_stateful';
import RadioGroup from 'react-native-radio-buttons-group';
import RangeSlider from 'rn-range-slider';
import { namer, styles } from '../funcs/static';
import { _http_request, help, hostServer, llStorage } from '../funcs/functions';
import { AccordionItem } from '../funcs/customAccordion';
import { Toastx } from '../funcs/customNotification';
import { useHeaderHeight } from '@react-navigation/elements';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabMode = 'basics' | 'more';

export function Screen_editpreference({ navigation }: { navigation: any }) {
    const __MAPPER = llStorage.CONFIG.get()?.mapper;
    const currentProfile = llStorage.currentProfile.get()?.currentUser;
    const headerHeight = useHeaderHeight();
    const hasPremium = currentProfile?.user_effect?.has_active_subscription ?? false;

    const [activeTab, setActiveTab] = useState<TabMode>('basics');

    const [getMinAge, setMinAge] = useState(currentProfile?.user_preference_minimum_age?.toString() ?? '19');
    const [getMaxAge, setMaxAge] = useState(currentProfile?.user_preference_maximum_age?.toString() ?? '47');
    const [getGender, setGender] = useState(currentProfile?.user_preference_gender?.toString() ?? '-99');
    const [getChildren, setChildren] = useState<string>(currentProfile?.user_preference_children?.toString() ?? '-99');
    const [getSmoking, setSmoking] = useState(currentProfile?.user_preference_smoking?.toString() ?? '-99');
    const [getDrinking, setDrinking] = useState(currentProfile?.user_preference_drinking?.toString() ?? '-99');
    const [getRelationshipGoal, setRelationshipGoal] = useState(currentProfile?.user_preference_relationshipgoal?.toString() ?? '-99');

    const [getHighEducation, setHighEducation] = useState(currentProfile?.user_preference_highesteducation?.toString() ?? '-99');
    const [getEthnicity, setEthnicity] = useState(currentProfile?.user_preference_ethnicity?.toString() ?? '-99');
    const [getLanguages, setLanguages] = useState(currentProfile?.user_preference_languages?.toString() ?? '-99');
    const [getPets, setPets] = useState(currentProfile?.user_preference_pet?.toString() ?? '-99');
    const [getBodyType, setBodyType] = useState(currentProfile?.user_preference_bodytype?.toString() ?? '-99');
    const [getReligion, setReligion] = useState(currentProfile?.user_preference_religion?.toString() ?? '-99');

    const [getDistance, setDistance] = useState<{ miles: number; km: string }>({
        miles: currentProfile?.user_preference_distance ?? 25,
        km: help.milesToKM(currentProfile?.user_preference_distance)?.toString() ?? 'Unknown',
    });

    const radioButtons = {
        getGender: [...Object.entries(__MAPPER?.bio_gender ?? {}), ['-99', "Don't matter"]] as [string, string][],
        getChildren: [...Object.entries(__MAPPER?.bio_children ?? {}), ['-99', "Don't matter"]] as [string, string][],
        getSmoking: [...Object.entries(__MAPPER?.bio_smoking ?? {}), ['-99', "Don't matter"]] as [string, string][],
        getDrinking: [...Object.entries(__MAPPER?.bio_drinking ?? {}), ['-99', "Don't matter"]] as [string, string][],
        getRelationshipGoal: [...Object.entries(__MAPPER?.bio_intent ?? {}), ['-99', "Don't matter"]] as [string, string][],
        getHighEducation: [...Object.entries(__MAPPER?.bio_education ?? {}), ['-99', "Don't matter"]] as [string, string][],
        getEthnicity: [...Object.entries(__MAPPER?.bio_ethnicity ?? {}), ['-99', "Don't matter"]] as [string, string][],
        getPets: [...Object.entries(__MAPPER?.bio_pets ?? {}), ['-99', "Don't matter"]] as [string, string][],
        getBodyType: [...Object.entries(__MAPPER?.bio_bodytype ?? {}), ['-99', "Don't matter"]] as [string, string][],
        getReligion: [...Object.entries(__MAPPER?.bio_religion ?? {}), ['-99', "Don't matter"]] as [string, string][],
        getLanguages: [...Object.entries(__MAPPER?.bio_language ?? {}), ['-99', "Don't matter"]] as [string, string][],
    };

    const savePreferences = useCallback(async () => {
        Loaderx.show();
        _http_request({
            customApiUrl: hostServer() + '/api/core/v1/pushProfile',
            reqType: 'POST',
            bodyArray: {
                min_age: getMinAge,
                max_age: getMaxAge,
                pref_smoking: getSmoking,
                pref_drinking: getDrinking,
                pref_children: getChildren,
                pref_ethnicity: getEthnicity,
                pref_pet: getPets,
                pref_religion: getReligion,
                pref_bodytype: getBodyType,
                pref_highesteducation: getHighEducation,
                pref_relationshipgoal: getRelationshipGoal,
                pref_languages: getLanguages,
                pref_gender: getGender,
                pref_distance: getDistance.miles,
            },
        })
            .then((response) => {
                if (response?.code === 200) {
                    Toastx.show({ type: 'success', message: response?.message ?? 'Preferences updated!' });
                    llStorage.currentProfile.load();
                    navigation.goBack();
                } else {
                    Toastx.show({
                        type: response?.code === 203 ? 'info' : 'error',
                        message: response?.message ?? 'Error updating preference!',
                    });
                }
            })
            .finally(() => {
                Loaderx.hide();
            });
    }, [
        getBodyType,
        getChildren,
        getDistance.miles,
        getDrinking,
        getEthnicity,
        getGender,
        getHighEducation,
        getLanguages,
        getMaxAge,
        getMinAge,
        getPets,
        getRelationshipGoal,
        getReligion,
        getSmoking,
        navigation,
    ]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitleAlign: 'center',
            headerTransparent: true,
            headerTitle: () => <Text style={{ fontSize: 18, fontWeight: '700' }}>Edit Preferences</Text>,
            headerRight: () => (
                <Pressable style={{ gap: 3, paddingRight: 10 }} onPress={savePreferences}>
                    <Text style={[styles.pressableButtonText, { fontSize: 14, fontWeight: '500', color: '#0369a1' }]}>Save</Text>
                </Pressable>
            ),
        });
    }, [navigation, savePreferences]);

    const renderRadioAccordion = (
        title: string,
        selectedId: string,
        options: [string, string][],
        onPress: (id: string) => void,
        subtitlePrefix?: string
    ) => (
        <AccordionItem
            title={title}
            subtitle={`${subtitlePrefix ?? ''}${options.find(([key]) => key === selectedId)?.[1] || 'Not set'}`}
            Content={() => (
                <View>
                    <RadioGroup
                        labelStyle={{ fontSize: 16, textTransform: 'capitalize' }}
                        radioButtons={options.map(([key, value]) => ({ id: key, label: value, value }))}
                        containerStyle={{ alignItems: 'flex-start' }}
                        onPress={onPress}
                        selectedId={selectedId}
                    />
                </View>
            )}
        />
    );

    return (
        <SafeAreaView style={[styles.container, localStyles.root, { paddingTop: headerHeight + 10 }]} edges={['bottom']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.conainerScrollView, localStyles.contentContainer]}>
             

                <View style={localStyles.tabWrap}>
                    <Pressable style={[localStyles.tabBtn, activeTab === 'basics' && localStyles.tabBtnActive]} onPress={() => setActiveTab('basics')}>
                        <Text style={[localStyles.tabText, activeTab === 'basics' && localStyles.tabTextActive]}>Basics</Text>
                    </Pressable>
                    <Pressable style={[localStyles.tabBtn, activeTab === 'more' && localStyles.tabBtnActive]} onPress={() => setActiveTab('more')}>
                        <Text style={[localStyles.tabText, activeTab === 'more' && localStyles.tabTextActive]}>More</Text>
                        {!hasPremium && <IIcon name="lock-closed" size={13} color="#64748b" />}
                    </Pressable>
                </View>

                {activeTab === 'basics' ? (
                    <View style={{ gap: 12 }}>
                        <View style={[styles.editprofile_inputborder, localStyles.card]}> 
                            <Text style={localStyles.inputTitle}>Age range</Text>
                            <Text style={localStyles.inputSubTitle}>Between {getMinAge} - {getMaxAge}</Text>
                            <RangeSlider
                                style={{ width: '100%', height: 30 }}
                                low={parseInt(getMinAge) ?? 18}
                                high={parseInt(getMaxAge) ?? 25}
                                min={18}
                                max={100}
                                step={1}
                                floatingLabel={true}
                                minRange={2}
                                onValueChanged={(low: number, high: number) => {
                                    if (low.toString() !== getMinAge) setMinAge(low.toString());
                                    if (high.toString() !== getMaxAge) setMaxAge(high.toString());
                                }}
                                renderThumb={() => <View style={styles.slider_thumb} />}
                                renderRail={() => <View style={styles.slider_rail} />}
                                renderRailSelected={() => <View style={styles.slider_railSelected} />}
                            />
                        </View>

                        <View style={[styles.editprofile_inputborder, localStyles.card]}>
                            <Text style={localStyles.inputTitle}>{`Distance from you (${currentProfile?.user_location?.city || 'your area'})`}</Text>
                            <Text style={localStyles.inputSubTitle}>
                                {getDistance.miles > 100 ? 'No limit on distance.' : `${getDistance.miles} miles from you`}
                            </Text>
                            <RangeSlider
                                disableRange={true}
                                style={{ width: '100%', height: 30 }}
                                low={getDistance.miles ?? 55}
                                high={getDistance.miles ?? 60}
                                min={5}
                                max={105}
                                step={5}
                                onValueChanged={(va: number) => {
                                    if (va !== getDistance.miles) {
                                        setDistance({ miles: va, km: help.milesToKM(va)?.toString() ?? 'n/a' });
                                    }
                                }}
                                renderThumb={() => <View style={styles.slider_thumb} />}
                                renderRail={() => <View style={styles.slider_rail} />}
                                renderRailSelected={() => <View style={styles.slider_railSelected} />}
                            />
                        </View>

                        {renderRadioAccordion('What gender are you interested in?', getGender, radioButtons.getGender, setGender)}
                        {renderRadioAccordion('What are your intentions?', getRelationshipGoal, radioButtons.getRelationshipGoal, setRelationshipGoal)}
                    </View>
                ) : (
                    <View style={{ gap: 12 }}>
                        {!hasPremium ? (
                            <View style={localStyles.paywallCard}>
                                <View style={localStyles.paywallIconWrap}>
                                    <IIcon name="sparkles" size={22} color="#f59e0b" />
                                </View>
                                <Text style={localStyles.paywallTitle}>Unlock More filters</Text>
                                <Text style={localStyles.paywallSubTitle}>
                                    Premium unlocks advanced matching by habits, lifestyle, education, ethnicity, religion, pets, and more.
                                </Text>
                                <Pressable style={localStyles.upgradeBtn} onPress={() => navigation.push(namer.navigation.subscription)}>
                                    <Text style={localStyles.upgradeBtnText}>Upgrade to Premium</Text>
                                </Pressable>
                            </View>
                        ) : null}

                        <View pointerEvents={hasPremium ? 'auto' : 'none'} style={!hasPremium ? localStyles.moreDisabledBlock : undefined}>
                            {renderRadioAccordion('Should they have kids?', getChildren, radioButtons.getChildren, setChildren)}
                            {renderRadioAccordion('Should they drink?', getDrinking, radioButtons.getDrinking, setDrinking)}
                            {renderRadioAccordion('Should they smoke?', getSmoking, radioButtons.getSmoking, setSmoking)}
                            {renderRadioAccordion('Preferred ethnicity?', getEthnicity, radioButtons.getEthnicity, setEthnicity)}
                            {renderRadioAccordion('Should they have pet(s)?', getPets, radioButtons.getPets, setPets)}
                            {renderRadioAccordion('Preferred religion?', getReligion, radioButtons.getReligion, setReligion)}
                            {renderRadioAccordion('Preferred highest education?', getHighEducation, radioButtons.getHighEducation, setHighEducation)}
                            {renderRadioAccordion('Preferred body type?', getBodyType, radioButtons.getBodyType, setBodyType)}
                            {renderRadioAccordion('Preferred language?', getLanguages, radioButtons.getLanguages, setLanguages)}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const localStyles = StyleSheet.create({
    root: {
        paddingHorizontal: 0,
        backgroundColor: '#f3f7fb',
    },
    contentContainer: {
        gap: 12,
    },
    heroCard: {
        backgroundColor: '#0f172a',
        borderRadius: 18,
        padding: 16,
        marginHorizontal: 10,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    heroBadge: {
        backgroundColor: '#0ea5e9',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    heroBadgeText: {
        color: '#082f49',
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    heroHint: {
        color: '#cbd5e1',
        fontSize: 12,
    },
    heroTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
    },
    heroSubtitle: {
        color: '#cbd5e1',
        fontSize: 13,
        marginTop: 6,
        lineHeight: 18,
    },
    tabWrap: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0',
        borderRadius: 14,
        marginHorizontal: 10,
        padding: 4,
        gap: 4,
    },
    tabBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 10,
        paddingVertical: 10,
    },
    tabBtnActive: {
        backgroundColor: '#ffffff',
    },
    tabText: {
        color: '#475569',
        fontSize: 15,
        fontWeight: '700',
    },
    tabTextActive: {
        color: '#0f172a',
    },
    card: {
        marginHorizontal: 0,
        borderRadius: 14,
    },
    inputTitle: {
        fontSize: 16,
        marginTop: 10,
        fontWeight: '700',
        textTransform: 'capitalize',
        color: '#0f172a',
    },
    inputSubTitle: {
        fontSize: 13,
        marginTop: 5,
        marginBottom: 10,
        textTransform: 'capitalize',
        color: '#475569',
    },
    paywallCard: {
        marginHorizontal: 10,
        borderRadius: 18,
        backgroundColor: '#fff7ed',
        borderWidth: 1,
        borderColor: '#fed7aa',
        padding: 16,
        alignItems: 'center',
        gap: 10,
    },
    moreDisabledBlock: {
        opacity: 0.5,
    },
    paywallIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffedd5',
    },
    paywallTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#9a3412',
    },
    paywallSubTitle: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        color: '#7c2d12',
    },
    upgradeBtn: {
        backgroundColor: '#ea580c',
        borderRadius: 12,
        width: '100%',
        paddingVertical: 13,
        alignItems: 'center',
        marginTop: 6,
    },
    upgradeBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
});
