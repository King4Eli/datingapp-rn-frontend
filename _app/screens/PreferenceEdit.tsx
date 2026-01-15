import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Loaderx } from '../funcs/functions_stateful';
import RadioGroup from 'react-native-radio-buttons-group';
import RangeSlider from '../funcs/rn-range-slider';
import { styles } from '../funcs/static';
import { _http_request, help, hostServer, llStorage } from '../funcs/functions';
import { AccordionItem } from '../funcs/customAccordion';
import { Toastx } from '../funcs/customNotification';

export function Screen_editpreference({ closeModal = () => { } }: { closeModal?: () => void }) {
    const __MAPPER = llStorage.CONFIG.get()?.mapper;

    const currentProfile = llStorage.currentProfile.get()?.currentUser;
    const [getMinAge, setMinAge] = useState(currentProfile?.user_preference_minimum_age?.toString() ?? "19");
    const [getMaxAge, setMaxAge] = useState(currentProfile?.user_preference_maximum_age?.toString() ?? "47");
    const [getGender, setGender] = useState(currentProfile?.user_preference_gender?.toString() ?? "-99");
    const [getChildren, setChildren] = useState<string>(currentProfile?.user_preference_children?.toString() ?? "-99");
    const [getSmoking, setSmoking] = useState(currentProfile?.user_preference_smoking?.toString() ?? "-99");
    const [getDrinking, setDrinking] = useState(currentProfile?.user_preference_drinking?.toString() ?? "-99");
    const [getRelationshipGoal, setRelationshipGoal] = useState(currentProfile?.user_preference_relationshipgoal?.toString() ?? "-99");

    const [getHighEducation, setHighEducation] = useState(currentProfile?.user_preference_highesteducation?.toString() ?? "-99");
    const [getEthnicity, setEthnicity] = useState(currentProfile?.user_preference_ethnicity?.toString() ?? "-99");
    const [getLanguages, setLanguages] = useState(currentProfile?.user_preference_languages?.toString() ?? "-99");
    const [getPets, setPets] = useState(currentProfile?.user_preference_pet?.toString() ?? "-99");
    const [getBodyType, setBodyType] = useState(currentProfile?.user_preference_bodytype?.toString() ?? "-99");
    const [getReligion, setReligion] = useState(currentProfile?.user_preference_religion?.toString() ?? "-99");

    const [getMinHeight, setMinHeight] = useState<{ cm: number, ftin: string }>({ cm: currentProfile?.user_preference_height_minimum ?? 100, ftin: help.cmToFtIn(currentProfile?.user_preference_height_minimum) ?? "Unknown" });
    const [getMaxHeight, setMaxHeight] = useState<{ cm: number, ftin: string }>({ cm: currentProfile?.user_preference_height_maximum ?? 105, ftin: help.cmToFtIn(currentProfile?.user_preference_height_maximum) ?? "Unknown" });
    const [getDistance, setDistance] = useState<{ miles: number, km: string }>({ miles: currentProfile?.user_preference_distance ?? 25, km: help.milesToKM(currentProfile?.user_preference_distance)?.toString() ?? "Unknown" });



    useEffect(() => { }, []);

    const radioButtons = {
        getGender: [...Object.entries(__MAPPER?.bio_gender ?? {}), ["-99", "Don't matter"]] as [string, string][],
        getChildren: [...Object.entries(__MAPPER?.bio_children ?? {}), ["-99", "Don't matter"]] as [string, string][],
        getSmoking: [...Object.entries(__MAPPER?.bio_smoking ?? {}), ["-99", "Don't matter"]] as [string, string][],
        getDrinking: [...Object.entries(__MAPPER?.bio_drinking ?? {}), ["-99", "Don't matter"]] as [string, string][],
        getRelationshipGoal: [...Object.entries(__MAPPER?.bio_intent ?? {}), ["-99", "Don't matter"]] as [string, string][],
        getHighEducation: [...Object.entries(__MAPPER?.bio_education ?? {}), ["-99", "Don't matter"]] as [string, string][],
        getEthnicity: [...Object.entries(__MAPPER?.bio_ethnicity ?? {}), ["-99", "Don't matter"]] as [string, string][],
        getPets: [...Object.entries(__MAPPER?.bio_pets ?? {}), ["-99", "Don't matter"]] as [string, string][],
        getBodyType: [...Object.entries(__MAPPER?.bio_bodytype ?? {}), ["-99", "Don't matter"]] as [string, string][],
        getReligion: [...Object.entries(__MAPPER?.bio_religion ?? {}), ["-99", "Don't matter"]] as [string, string][],
        getLanguages: [...Object.entries(__MAPPER?.bio_language ?? {}), ["-99", "Don't matter"]] as [string, string][],
    };













    return (
        <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Edit Preferences</Text>
                <Pressable style={{ gap: 3 }} onPress={() => {
                    Loaderx.show();
                    _http_request({
                        customApiUrl: hostServer() + "/api/core/v1/pushProfile",
                        reqType: 'POST', bodyArray: {
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
                            //pref_min_height: getMinHeight.cm,
                            //pref_max_height: getMaxHeight.cm,
                            pref_gender: getGender,
                            pref_distance: getDistance.miles
                        }
                    }).then((response) => {
                        if (response?.code === 200) {
                            Toastx.show({
                                type: 'success', message: response?.message ?? 'Preferences updated!'
                            });
                            closeModal();
                        } else {
                            Toastx.show({
                                type: ((response?.code === 203) ? 'info' : 'error'), message: response?.message ?? 'Error updating preference!'
                            });
                        }
                    }).finally(() => {
                        Loaderx.hide();
                        llStorage.currentProfile.load();
                    });
                }}>
                    <Text style={[styles.pressableButtonText, { fontSize: 14, fontWeight: '400', color: "blue" }]}>save</Text>
                </Pressable>
            </View>


            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 4, gap: 12, }}>
                <View style={[styles.editprofile_inputborder, {}]}>
                    <Text style={{ fontSize: 16, marginTop: 10, fontWeight: '600', textTransform: "capitalize" }}> Age Range</Text>
                    <Text style={{ fontSize: 13, marginTop: 5, marginBottom: 10, textTransform: "capitalize" }}> Between {getMinAge} - {getMaxAge}</Text>

                    <View pointerEvents="box-none">
                        <RangeSlider style={{ width: "100%", height: 30 }}
                            low={parseInt(getMinAge) ?? 18} high={parseInt(getMaxAge) ?? 25}
                            min={18} max={100} step={1} floatingLabel={true} minRange={2}
                            onValueChanged={(low: number, high: number) => {
                                if (low.toString() != getMinAge) {
                                    setMinAge(low.toString());
                                }
                                if (high.toString() != getMaxAge) {
                                    setMaxAge(high.toString());
                                }
                            }}
                            renderThumb={() => (<View style={styles.slider_thumb} />)}
                            renderRail={() => (<View style={styles.slider_rail} />)}
                            renderRailSelected={() => (<View style={styles.slider_railSelected} />)} />
                    </View>
                </View>
                {/*<View style={[styles.editprofile_inputborder, { display: "flex" }]}>
                    <Text style={{ fontSize: 14, marginTop: 10, fontWeight: '600' }}> Height Range</Text>
                    <Text style={{ fontSize: 14, marginTop: 5, marginBottom: 10 }}> Between {getMinHeight.ftin} - {getMaxHeight.ftin}</Text>

                    <RangeSlider
                        style={{ width: "100%", height: 30 }}
                        low={getMinHeight.cm ?? 100} high={getMaxHeight.cm ?? 100}
                        min={100} max={220} step={1}
                        onValueChanged={(low: number, high: number) => {
                            if (low != getMinHeight.cm) {
                                setMinHeight({ cm: low, ftin: help.cmToFtIn(low) ?? "n/a" });
                            }
                            if (high != getMaxHeight.cm) {
                                setMaxHeight({ cm: high, ftin: help.cmToFtIn(high) ?? "n/a" });
                            }
                        }}
                        renderThumb={() => (<View style={styles.slider_thumb} />)}
                        renderRail={() => (<View style={styles.slider_rail} />)}
                        renderRailSelected={() => (<View style={styles.slider_railSelected} />)} />
                </View>*/}













                <View style={[styles.editprofile_inputborder, { display: "flex" }]}>
                    <Text style={{ fontSize: 16, marginTop: 10, fontWeight: '600', textTransform: "capitalize" }}> {`Distance from you (${currentProfile?.user_location?.city})`}</Text>
                    <Text style={{ fontSize: 13, marginTop: 5, marginBottom: 10, textTransform: "capitalize" }}> {getDistance.miles > 100 ? "no limit on distance." : `${getDistance.miles} miles from you`}</Text>

                    <RangeSlider
                        disableRange={true} style={{ width: "100%", height: 30 }}
                        low={getDistance.miles ?? 55} high={getDistance.miles ?? 60}
                        min={5} max={105} step={5}
                        onValueChanged={(va: number) => {
                            if (va != getDistance.miles) {
                                setDistance({ miles: va, km: help.milesToKM(va)?.toString() ?? "n/a" });
                            }
                        }}
                        renderThumb={() => (<View style={styles.slider_thumb} />)}
                        renderRail={() => (<View style={styles.slider_rail} />)}
                        renderRailSelected={() => (<View style={styles.slider_railSelected} />)} />
                </View>




                <AccordionItem title="What gender are you interested in?" subtitle={radioButtons.getGender.find(([key, value]) => key === getGender)?.[1] || "null"} Content={() => (<View>{
                    <RadioGroup labelStyle={{ fontSize: 16, textTransform: "capitalize", }}
                        radioButtons={radioButtons.getGender.map(([key, value]) => ({
                            id: key,
                            label: value,
                            value: value,
                        }))}
                        containerStyle={{ alignItems: 'flex-start' }}
                        onPress={setGender}
                        selectedId={getGender || "0"}
                    />
                }</View>)} />




                <AccordionItem title="Should they have kids?" subtitle={radioButtons.getChildren.find(([key, value]) => key === getChildren)?.[1] || "null"} Content={() => (<View>{
                    <RadioGroup labelStyle={{ fontSize: 16, textTransform: "capitalize", }}
                        radioButtons={radioButtons.getChildren.map(([key, value]) => ({
                            id: key,
                            label: value as string,
                            value: value as string,
                        }))}
                        containerStyle={{ alignItems: 'flex-start' }}
                        onPress={setChildren}
                        selectedId={getChildren}
                    />
                }</View>)} />

                <AccordionItem title="Should they drink?" subtitle={radioButtons.getDrinking.find(([key, value]) => key === getDrinking)?.[1] || "null"} Content={() => (<View>{
                    <RadioGroup labelStyle={{ fontSize: 16, textTransform: "capitalize", }}
                        radioButtons={radioButtons.getDrinking.map(([key, value]) => ({
                            id: key,
                            label: value as string,
                            value: key,
                        }))}
                        containerStyle={{ alignItems: 'flex-start' }}
                        onPress={setDrinking}
                        selectedId={getDrinking}
                    />
                }</View>)} />



                <AccordionItem title="Should they smoke?" subtitle={radioButtons.getSmoking.find(([key, value]) => key === getSmoking)?.[1] || "null"} Content={() => (<View>{
                    <RadioGroup labelStyle={{ fontSize: 16, textTransform: "capitalize", }}
                        radioButtons={radioButtons.getSmoking.map(([key, value]) => ({
                            id: key,
                            label: value as string,
                            value: key,
                        }))}
                        containerStyle={{ alignItems: 'flex-start' }}
                        onPress={setSmoking}
                        selectedId={getSmoking}
                    />
                }</View>)} />

                <AccordionItem title="Prefered ethnicity?" subtitle={radioButtons.getEthnicity.find(([key, value]) => key === getEthnicity)?.[1] || "null"} Content={() => (<View>{
                    <RadioGroup labelStyle={{ fontSize: 16, textTransform: "capitalize", }}
                        radioButtons={radioButtons.getEthnicity.map(([key, value]) => ({
                            id: key,
                            label: value as string,
                            value: value as string,
                        }))}
                        containerStyle={{ alignItems: 'flex-start' }}
                        onPress={setEthnicity}
                        selectedId={getEthnicity}
                    />
                }</View>)} />


                <AccordionItem title="Should they have pet(s)?" subtitle={radioButtons.getPets.find(([key, value]) => key === getPets)?.[1] || "null"} Content={() => (<View>{
                    <RadioGroup labelStyle={{ paddingHorizontal: 2, fontSize: 16, textTransform: "capitalize", }}
                        radioButtons={radioButtons.getPets.map(([key, value]) => ({
                            id: key,
                            label: value as string,
                            value: value as string,
                        }))}
                        containerStyle={{ alignItems: 'flex-start' }}
                        onPress={setPets}
                        selectedId={getPets}
                    />
                }</View>)} />

                <AccordionItem title="Prefered religion?" subtitle={radioButtons.getReligion.find(([key, value]) => key === getReligion)?.[1] || "null"} Content={() => (<View>{
                    <RadioGroup labelStyle={{ fontSize: 16, textTransform: "capitalize", }}
                        radioButtons={radioButtons.getReligion.map(([key, value]) => ({
                            id: key,
                            label: value as string,
                            value: value as string,
                        }))}
                        containerStyle={{ alignItems: 'flex-start' }}
                        onPress={setReligion}
                        selectedId={getReligion}
                    />
                }</View>)} />

                <AccordionItem title="What are your intentions?" subtitle={radioButtons.getRelationshipGoal.find(([key, value]) => key === getRelationshipGoal)?.[1] || "null"} Content={() => (<View>{
                    <RadioGroup labelStyle={{ fontSize: 16, textTransform: "capitalize", }}
                        radioButtons={radioButtons.getRelationshipGoal.map(([key, value]) => ({
                            id: key,
                            label: value as string,
                            value: value as string,
                        }))}
                        containerStyle={{ alignItems: 'flex-start' }}
                        onPress={setRelationshipGoal}
                        selectedId={getRelationshipGoal}
                    />
                }</View>)} />

                <AccordionItem title="Prefered highest education?" subtitle={radioButtons.getHighEducation.find(([key, value]) => key === getHighEducation)?.[1] || "null"} Content={() => (<View>{
                    <RadioGroup labelStyle={{ fontSize: 16, textTransform: "capitalize", }}
                        radioButtons={radioButtons.getHighEducation.map(([key, value]) => ({
                            id: key,
                            label: value as string,
                            value: value as string,
                        }))}
                        containerStyle={{ alignItems: 'flex-start' }}
                        onPress={setHighEducation}
                        selectedId={getHighEducation}
                    />
                }</View>)} />

                <AccordionItem title="Prefered bodytype?" subtitle={radioButtons.getBodyType.find(([key, value]) => key === getBodyType)?.[1] || "null"} Content={() => (<View>{
                    <RadioGroup labelStyle={{ fontSize: 16, textTransform: "capitalize", }}
                        radioButtons={radioButtons.getBodyType.map(([key, value]) => ({
                            id: key,
                            label: value as string,
                            value: value as string,
                        }))}
                        containerStyle={{ alignItems: 'flex-start' }}
                        onPress={setBodyType}
                        selectedId={getBodyType}
                    />
                }</View>)} />
            </ScrollView>
        </>
    );
}
