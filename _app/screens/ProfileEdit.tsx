import React, { useState, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import {
    View, Text, TextInput, Image, Pressable, KeyboardAvoidingView,
    Platform, TouchableOpacity, StyleSheet, LayoutAnimation, UIManager
} from 'react-native';
import { Loaderx, bottomsheet_renderBackdrop } from '../funcs/functions_stateful';
import { ScrollView } from 'react-native-gesture-handler';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    runOnJS,
    withSpring,
} from 'react-native-reanimated';
import IIcon from 'react-native-vector-icons/Ionicons';
import MIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RadioGroup from 'react-native-radio-buttons-group';
import { styles, namer, colors } from '../funcs/static';
import { SafeAreaView } from 'react-native-safe-area-context';
import { _http_request, help, hostServer, llStorage, mediaHandler } from '../funcs/functions';
import { useHeaderHeight } from '@react-navigation/elements';
import { AccordionItem } from '../funcs/customAccordion';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Toastx } from '../funcs/customNotification';
import LinearGradient from 'react-native-linear-gradient';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Layout Constants ───────────────────────────────────────────────────────
const GRID_PADDING = 0;
const GAP = 5;

// ─── Types ───────────────────────────────────────────────────────────────────
interface PhotoItem {
    p?: string;
    uri?: string;
    local?: boolean;
    w?: number;
    h?: number;
}

export function Screen_editprofile({ navigation }: { navigation: any }) {
    const getProfile = llStorage.currentProfile.get()?.currentUser;
    const __MAPPER = llStorage.CONFIG.get()?.mapper;

    const headerHeight = useHeaderHeight();

    const [getImages, setImages] = useState<PhotoItem[]>(getProfile?.user_image ?? []);
    const [getId, setId] = useState<string | null>(getProfile?.user_id ?? null);
    const [getFullname, setFullname] = useState<string>(getProfile?.user_fullname);
    const [getAge, setAge] = useState<string>(getProfile?.user_bio_dob);
    const [getAboutText, setAboutText] = useState<string>(getProfile?.user_bio_about);
    const [getGender, setGender] = useState<string>(getProfile?.user_bio_gender ?? "");
    const [getHeight, setHeight] = useState<{ cm: number, ftin: string }>({ cm: 150, ftin: "" });

    const [getLocation, setLocation] = useState<string>(getProfile?.user_location?.city);
    const [getChildren, setChildren] = useState<string>(getProfile?.user_bio_children);
    const [getSmoking, setSmoking] = useState<string>(getProfile?.user_bio_smoking);
    const [getDrinking, setDrinking] = useState<string>(getProfile?.user_bio_drinking);
    const [getRelationshipGoal, setRelationshipGoal] = useState<string>(getProfile?.user_bio_relationshipgoal);
    const [getHomeTown, setHomeTown] = useState<string>(getProfile?.user_bio_hometown);
    const [getSchoolAttended, setSchoolAttended] = useState<string>(getProfile?.user_bio_schoolattended);
    const [getHighEducation, setHighEducation] = useState<string>(getProfile?.user_bio_highesteducation);
    const [getEthnicity, setEthnicity] = useState<string>(getProfile?.user_bio_ethnicity);
    const [getLanguages, setLanguages] = useState<string>(getProfile?.user_bio_language);
    const [getPets, setPets] = useState<string>(getProfile?.user_bio_haspet);
    const [getBodyType, setBodyType] = useState<string>(getProfile?.user_bio_bodytype);
    const [getReligion, setReligion] = useState<string>(getProfile?.user_bio_religion);
    const [getPoliticalViews, setPoliticalViews] = useState<string>(getProfile?.user_bio_politicalview);
    const [getPrompts, setPrompts] = useState<Array<{ q: string; a: string; d: string }>>(Array.isArray(getProfile?.user_bio_prompt) ? getProfile.user_bio_prompt : []);
    const [getInterests, setInterests] = useState<string[]>(Array.isArray(getProfile?.user_bio_interests) ? getProfile.user_bio_interests : []);

    // Drag and drop state
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    const addNewPrompt_ref = useRef<BottomSheet>(null);
    const addInterests_ref = useRef<BottomSheet>(null);
    const addNewPromptSnapPoints = useMemo(() => ['80%'], []);
    const addInterestsSnapPoints = useMemo(() => ['85%'], []);

    // header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => <Text style={{ fontSize: 18, fontWeight: 400 }}>Your Profile</Text>,
            headerRight: () =>
                <View style={{ paddingRight: 10, flexDirection: "row", gap: 20 }}>
                    <Pressable onPress={() => navigation.push(namer.navigation.peoplesOnePerson, { getOnePersonId: getId, alreadyLiked: true, previewProfile: true })}>
                        <Text>Preview</Text>
                    </Pressable>

                    <Pressable style={{ gap: 3 }} onPress={handleSaveProfile}>
                        <Text style={[styles.pressableButtonText, { fontSize: 14, fontWeight: '400', color: "blue" }]}>Save</Text>
                    </Pressable>
                </View>
        });
    });

    const getImageUri = (index: number) => {
        const target = getImages?.[index];
        if (!target) return '';
        const path = target?.p ?? target?.uri ?? "";
        const isLocal = target?.local || path.startsWith('file:') || path.startsWith('content:');
        return isLocal ? path : String(__MAPPER?.img_domain[0] + path);
    };

    const handleSaveProfile = async () => {
        Loaderx.show();
        try {
            const normalizedImages = (getImages ?? []).filter(img => img?.p || img?.uri);
            const imageMeta = normalizedImages.map((img, index) => {
                const path = img?.p ?? img?.uri ?? "";
                const isLocal = img?.local || path.startsWith('file:') || path.startsWith('content:');
                const uploadName = isLocal ? `profile_${getId ?? 'user'}_${Date.now()}_${index}.jpg` : undefined;
                return {
                    p: isLocal ? uploadName : path,
                    w: img?.w ?? null,
                    h: img?.h ?? null,
                    local: Boolean(isLocal),
                    uploadName,
                };
            });

            const response = await _http_request({
                reqType: 'POST',
                customApiUrl: hostServer() + "/api/core/v1/pushProfile",
                bodyArray: {
                    prof_about: getAboutText ?? "",
                    prof_smoking: getSmoking ?? "",
                    prof_drinking: getDrinking ?? "",
                    prof_children: getChildren ?? "",
                    prof_ethnicity: getEthnicity ?? "",
                    prof_pet: getPets ?? "",
                    prof_religion: getReligion ?? "",
                    prof_bodytype: getBodyType ?? "",
                    prof_highesteducation: getHighEducation ?? "",
                    prof_relationshipgoal: getRelationshipGoal ?? "",
                    prof_languages: getLanguages ?? "",
                    prof_gender: getGender ?? "",
                    prof_hometown: getHomeTown ?? "",
                    prof_schoolattended: getSchoolAttended ?? "",
                    prof_political: getPoliticalViews ?? "",
                    prof_prompts: JSON.stringify(getPrompts ?? []),
                    prof_interests: JSON.stringify(getInterests ?? [])
                }
            });
            if (response?.code === 200) {
                Toastx.show({ type: 'success', message: response?.userpreferences?.message ?? 'Profile updated!' });
                navigation.goBack();
            } else {
                Toastx.show({ type: 'error', message: response?.userpreferences?.message ?? 'Error updating Profile!' });
            }
        } finally {
            Loaderx.hide();
            llStorage.currentProfile.load();
        }
    };

    const handlePress = async (index: number) => {
        const media = await mediaHandler.handleSelectFromGallery({
            mediaType: 'photo',
            selectionLimit: 1,
        });
        if (!media || media.length === 0) return;

        const asset = media[0];
        setImages(prev => {
            const updated = [...prev];
            while (updated.length < index) {
                updated.push({});
            }
            updated[index] = {
                ...(updated[index] ?? {}),
                p: asset.uri,
                local: true,
                w: asset.width,
                h: asset.height
            };
            return updated.slice(0, 6);
        });
    };

    const handleRemoveImage = (index: number) => {
        setImages(prev => {
            const updated = [...prev];
            updated[index] = {}; // Clear the image at this index
            return updated;
        });
    };

    // Drag and drop handlers
    const handleDragStart = useCallback((index: number) => {
        setDraggingIndex(index);
    }, []);

    const handleDragEnd = useCallback((fromIndex: number, translationX: number, translationY: number) => {
        setDraggingIndex(null);

        if (containerWidth === 0) return;

        // Calculate cell dimensions to find target slot
        const colW = (containerWidth - GAP) / 2;
        const smallH = colW * 0.65;
        const bigH = smallH * 2 + GAP;
        const bottomH = smallH;
        const thirdColW = (containerWidth - GAP * 2) / 3;

        const cellDims = [
            { w: colW, h: bigH, x: 0, y: 0 },
            { w: colW, h: smallH, x: colW + GAP, y: 0 },
            { w: colW, h: smallH, x: colW + GAP, y: smallH + GAP },
            { w: thirdColW, h: bottomH, x: 0, y: bigH + GAP },
            { w: thirdColW, h: bottomH, x: thirdColW + GAP, y: bigH + GAP },
            { w: thirdColW, h: bottomH, x: (thirdColW + GAP) * 2, y: bigH + GAP },
        ];

        const fromCell = cellDims[fromIndex];
        const fromCenterX = fromCell.x + fromCell.w / 2 + translationX;
        const fromCenterY = fromCell.y + fromCell.h / 2 + translationY;

        let toIndex = fromIndex;
        let minDist = Infinity;

        cellDims.forEach((cell, idx) => {
            if (idx === fromIndex) return;
            const cx = cell.x + cell.w / 2;
            const cy = cell.y + cell.h / 2;
            const dist = Math.sqrt((fromCenterX - cx) ** 2 + (fromCenterY - cy) ** 2);
            if (dist < minDist) {
                minDist = dist;
                toIndex = idx;
            }
        });

        if (toIndex !== fromIndex && minDist < 200) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            const newImages = [...getImages];
            // Ensure array is padded to 6
            while (newImages.length < 6) newImages.push({});
            const temp = newImages[fromIndex];
            newImages[fromIndex] = newImages[toIndex];
            newImages[toIndex] = temp;
            setImages(newImages.slice(0, 6));
        }
    }, [containerWidth, getImages]);

    // Draggable Photo Cell Component
    const DraggablePhoto = useCallback(({ image, slotIndex, cellWidth, cellHeight, x, y, imageUri }: {
        image: PhotoItem;
        slotIndex: number;
        cellWidth: number;
        cellHeight: number;
        x: number;
        y: number;
        imageUri: string;
    }) => {
        const translateX = useSharedValue(0);
        const translateY = useSharedValue(0);
        const scale = useSharedValue(1);
        const zIndex = useSharedValue(1);
        const isEmpty = !image?.p && !image?.uri;

        // Create gesture using the new Gesture API
        const gesture = Gesture.Pan()
            .minDistance(8)
            .onStart(() => {
                scale.value = withSpring(1.08);
                zIndex.value = 100;
                runOnJS(handleDragStart)(slotIndex);
            })
            .onUpdate((event) => {
                translateX.value = event.translationX;
                translateY.value = event.translationY;
            })
            .onEnd((event) => {
                scale.value = withSpring(1);
                zIndex.value = 1;
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
                runOnJS(handleDragEnd)(slotIndex, event.translationX, event.translationY);
            })
            .onFinalize(() => {
                // Ensure we reset even if gesture fails
                scale.value = withSpring(1);
                zIndex.value = 1;
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
            });

        const animatedStyle = useAnimatedStyle(() => ({
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
            ],
            zIndex: zIndex.value,
            shadowOpacity: draggingIndex === slotIndex ? 0.4 : 0,
            elevation: draggingIndex === slotIndex ? 8 : 0,
        }));

        return (
            <Animated.View style={[
                {
                    position: 'absolute',
                    left: x,
                    top: y,
                    width: cellWidth,
                    height: cellHeight,
                },
                animatedStyle,
            ]}>
                <GestureDetector gesture={!isEmpty ? gesture : Gesture.Pan()}>
                    <Animated.View style={{ flex: 1 }}>
                        <Pressable
                            style={[
                                localStyles.photoCell,
                                isEmpty && localStyles.emptyCell,
                            ]}
                            onPress={() => handlePress(slotIndex)}
                        >
                            {!isEmpty ? (
                                <>
                                    <Image
                                        source={{ uri: imageUri }}
                                        style={localStyles.img}
                                        resizeMode="cover"
                                    />
                                    {/* Remove button */}
                                    <Pressable
                                        style={localStyles.removeBtn}
                                        onPress={() => handleRemoveImage(slotIndex)}>
                                        <IIcon name="close-circle" size={22} color="#ff4444" />
                                    </Pressable>
                                    {/* Drag handle indicator */}
                                    <View style={localStyles.dragHandle}>
                                        <View style={localStyles.dragDot} />
                                        <View style={localStyles.dragDot} />
                                        <View style={localStyles.dragDot} />
                                        <View style={localStyles.dragDot} />
                                        <View style={localStyles.dragDot} />
                                        <View style={localStyles.dragDot} />
                                    </View>
                                    {/* Main photo badge */}
                                    {slotIndex === 0 && (
                                        <View style={localStyles.mainBadge}>
                                            <Text style={localStyles.mainBadgeText}>Main</Text>
                                        </View>
                                    )}
                                </>
                            ) : (
                                <View style={localStyles.emptyContent}>
                                    <Text style={localStyles.plusIcon}>+</Text>
                                </View>
                            )}
                        </Pressable>
                    </Animated.View>
                </GestureDetector>
            </Animated.View>
        );
    }, [handleDragStart, handleDragEnd, draggingIndex]);

    const stty = StyleSheet.create({
        closeBtn: {
            position: "absolute",
            backgroundColor: "#fff",
            borderRadius: 10,
            top: -4, right: -4,
            width: 18, height: 18,
            alignItems: "center", justifyContent: "center",
            elevation: 3,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3
        },
        closeText: {
            fontSize: 18,
            fontWeight: "bold",
            textAlign: "center", lineHeight: 8
        },
    });

    const localStyles = StyleSheet.create({
        photoCell: {
            flex: 1,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: '#f0f0f0',
        },
        emptyCell: {
            borderWidth: 2,
            borderColor: '#ddd',
            borderStyle: 'dashed',
            backgroundColor: '#fafafa',
        },
        img: {
            width: '100%',
            height: '100%',
        },
        emptyContent: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
        plusIcon: {
            fontSize: 28,
            color: '#ccc',
            fontWeight: '300',
        },
        removeBtn: {
            position: "absolute",
            top: 4,
            right: 4,
            zIndex: 10,
            backgroundColor: 'white',
            borderRadius: 12,
            width: 24,
            height: 24,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 3,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3
        },
        dragHandle: {
            position: 'absolute',
            bottom: 6,
            right: 6,
            flexDirection: 'row',
            flexWrap: 'wrap',
            width: 14,
            gap: 2,
            opacity: 0.6,
        },
        dragDot: {
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#fff',
        },
        mainBadge: {
            position: 'absolute',
            bottom: 8,
            left: 8,
            backgroundColor: 'rgba(0,0,0,0.45)',
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 3,
        },
        mainBadgeText: {
            color: '#fff',
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.5,
        },
        photoGridContainer: {
            gap: 5,
            marginBottom: 10,
        }
    });

    // Calculate grid dimensions
    const renderPhotoGrid = () => {
        if (containerWidth === 0) {
            return (
                <View onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
                    style={{ width: '100%', height: 10 }} />
            );
        }

        // Calculate cell sizes
        const colW = (containerWidth - GAP) / 2;
        const smallH = colW * 0.65;
        const bigH = smallH * 2 + GAP;
        const bottomH = smallH;
        const thirdColW = (containerWidth - GAP * 2) / 3;
        const totalHeight = bigH + GAP + bottomH;

        const cellDims = [
            { w: colW, h: bigH, x: 0, y: 0 },
            { w: colW, h: smallH, x: colW + GAP, y: 0 },
            { w: colW, h: smallH, x: colW + GAP, y: smallH + GAP },
            { w: thirdColW, h: bottomH, x: 0, y: bigH + GAP },
            { w: thirdColW, h: bottomH, x: thirdColW + GAP, y: bigH + GAP },
            { w: thirdColW, h: bottomH, x: (thirdColW + GAP) * 2, y: bigH + GAP },
        ];

        const paddedImages = [...getImages];
        while (paddedImages.length < 6) paddedImages.push({});

        return (
            <View
                onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
                style={{ width: '100%', height: totalHeight }}
            >
                {cellDims.map((cell, index) => (
                    <DraggablePhoto
                        key={index}
                        image={paddedImages[index]}
                        slotIndex={index}
                        cellWidth={cell.w}
                        cellHeight={cell.h}
                        x={cell.x}
                        y={cell.y}
                        imageUri={getImageUri(index)}
                    />
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
            <View style={[styles.container, { paddingTop: headerHeight }]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
                    style={{ flex: 1 }} >
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                        <View style={[{ gap: 12, marginBottom: 12 }]}>
                            
                            {/* Photo Grid Section */}
                            <View style={localStyles.photoGridContainer}>
                                <Text style={[styles.editprofile_inputtitle, { marginLeft: 5 }]}>
                                    Profile Photos (Long press and drag to rearrange)
                                </Text>
                                {renderPhotoGrid()}
                            </View>

                            <LinearGradient colors={["#f95f62", "#f27a9c"]} style={[styles.card, { padding: 0 }]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
                                    <View style={{ gap: 6, flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start', gap: 6, }}>
                                            <MIcons name='heart-multiple-outline' color={'#f95f62'} size={16} />
                                            <Text style={{ color: '#f95f62', fontWeight: '600' }}>Vibes & Energy</Text>
                                        </View>
                                        <Text style={{ fontSize: 20, color: '#fff', fontWeight: '700' }}>Show your best self today</Text>
                                        <Text style={{ color: '#ffe7ef', fontSize: 13, lineHeight: 18 }}>Update a prompt and write a bio to make it easy for others to start a conversation with you.</Text>
                                    </View>
                                    <MIcons name='flower-tulip-outline' size={82} color={'#fff'} />
                                </View>
                            </LinearGradient>

                            <View style={styles.editprofile_inputborder}>
                                <View>
                                    <Text style={styles.editprofile_inputtitle}>Full Name</Text>
                                    <IIcon name="lock-closed" size={18} color="#000" style={{ position: "absolute", right: 0, top: 0 }} />
                                </View>
                                <TextInput style={styles.editprofile_input} value={getFullname} readOnly />
                            </View>
                            
                            <View style={styles.editprofile_inputborder}>
                                <View>
                                    <Text style={styles.editprofile_inputtitle}>Age</Text>
                                    <IIcon name="lock-closed" size={19} color="#000" style={{ position: "absolute", right: 0, top: 0 }} />
                                </View>
                                <TextInput style={styles.editprofile_input} value={help.getageFromDOB(getAge) ?? "-"} readOnly />
                            </View>

                            <View style={styles.editprofile_inputborder}>
                                <View>
                                    <Text style={styles.editprofile_inputtitle}>About you</Text>
                                    <IIcon name="create-outline" size={19} color="#000" style={{ position: "absolute", right: 0, top: 0 }} />
                                </View>
                                <TextInput style={[styles.editprofile_input, { height: 200 }]} multiline numberOfLines={10} value={getAboutText} onChangeText={setAboutText} placeholder="Write about yourself" maxLength={400} />
                                <Text style={{ color: colors.gray2, fontSize: 12, marginTop: 4, paddingLeft: 4 }}>Keep it concise and engaging! {`(Max characters ${getAboutText?.length}/400)`}</Text>
                            </View>

                            <AccordionItem title="What are your Intentions?" titleStyle={[styles.editprofile_inputtitle, { paddingLeft: 0, }]} subtitle={__MAPPER?.bio_intent?.[getRelationshipGoal]} Content={() => (<View>{
                                <RadioGroup labelStyle={{ fontSize: 15, textTransform: 'capitalize' }}
                                    radioButtons={Object.entries(__MAPPER?.bio_intent ?? {}).map(([key, value]) => ({
                                        id: key,
                                        label: value as string,
                                        value: value as string,
                                    }))}
                                    containerStyle={{ alignItems: 'flex-start' }}
                                    onPress={setRelationshipGoal}
                                    selectedId={getRelationshipGoal.toString()}
                                />}
                            </View>)} />

                            <AccordionItem title="What is your gender?" titleStyle={[styles.editprofile_inputtitle, { paddingLeft: 0 }]} subtitle={__MAPPER?.bio_gender?.[getGender]} Content={() => (<View>{
                                <RadioGroup labelStyle={{ fontSize: 15, textTransform: "capitalize" }}
                                    radioButtons={Object.entries(__MAPPER?.bio_gender ?? {}).map(([key, value]) => ({
                                        id: key,
                                        label: value as string,
                                        value: value as string,
                                    }))}
                                    containerStyle={{ alignItems: 'flex-start' }}
                                    onPress={setGender}
                                    selectedId={getGender.toString() || ""}
                                />}
                            </View>)} />

                            <View style={[styles.editprofile_inputborder,]}>
                                <Pressable style={{ gap: 6 }} onPress={() => { addInterests_ref.current?.snapToIndex(0); }}>
                                    <View>
                                        <Text style={styles.editprofile_inputtitle}>Interests - {getInterests?.length}/15</Text>
                                        <MIcons name="cursor-default-click-outline" size={19} color="#000" style={{ position: "absolute", right: 0, top: 0 }} />
                                    </View>
                                    <View style={{ flexDirection: "row", gap: 2, flexWrap: "wrap" }}>
                                        {getInterests.length <= 0 ? (
                                            <Text style={{ opacity: 0.5, paddingHorizontal: 10 }}>Select interests.</Text>
                                        ) : (getInterests.map((interest, i) => (
                                            <View key={i} style={[styles.editProfile_chip, { paddingRight: 16 }]}>
                                                <Text>{interest}</Text>
                                                <Pressable style={stty.closeBtn} onPress={() => { setInterests(prev => prev.filter(v => v !== interest)); }}>
                                                    <Text style={stty.closeText}>×</Text>
                                                </Pressable>
                                            </View>
                                        ))
                                        )}
                                    </View>
                                </Pressable>
                            </View>

                            <View style={styles.editprofile_inputborder}>
                                <View>
                                    <Text style={styles.editprofile_inputtitle}>Location</Text>
                                    <IIcon name="location-outline" size={19} color="#000" style={{ position: "absolute", right: 0, top: 0 }} />
                                </View>
                                <Text style={styles.editprofile_input}>{getLocation}</Text>
                            </View>
                            
                            <View style={styles.editprofile_inputborder}>
                                <View>
                                    <Text style={styles.editprofile_inputtitle}>Hometown</Text>
                                    <IIcon name="create-outline" size={18} color="#000" style={{ position: "absolute", right: 0, top: 0 }} />
                                </View>
                                <TextInput style={styles.editprofile_input}
                                    value={getHomeTown}
                                    onChangeText={setHomeTown}
                                    placeholder="What is your hometown ?"
                                    maxLength={45}
                                    multiline
                                />
                            </View>
                            
                            <AccordionItem title="Highest Education Achieved?" titleStyle={[styles.editprofile_inputtitle, { paddingLeft: 0 }]} subtitle={__MAPPER?.bio_education?.[getHighEducation]} Content={() => (<View>{
                                <RadioGroup labelStyle={{ fontSize: 16 }}
                                    radioButtons={Object.entries(__MAPPER?.bio_education ?? {}).map(([key, value]) => ({
                                        id: key,
                                        label: value as string,
                                        value: value as string,
                                    }))}
                                    containerStyle={{ alignItems: 'flex-start' }}
                                    onPress={setHighEducation}
                                    selectedId={getHighEducation.toString() || ""}
                                />}
                            </View>)} />
                            
                            <View style={styles.editprofile_inputborder}>
                                <View>
                                    <Text style={styles.editprofile_inputtitle}>Languages</Text>
                                    <IIcon name="language-outline" size={19} color="#000" style={{ position: "absolute", right: 0, top: 0 }} />
                                </View>
                                <TextInput style={styles.editprofile_input}
                                    value={getLanguages}
                                    onChangeText={setLanguages}
                                    placeholder="Do you speak any language ?"
                                />
                            </View>

                            <View style={styles.editprofile_inputborder}>
                                <View>
                                    <Text style={styles.editprofile_inputtitle}>School Attended</Text>
                                    <IIcon name="create-outline" size={18} color="#000" style={{ position: "absolute", right: 0, top: 0 }} />
                                </View>
                                <TextInput style={styles.editprofile_input}
                                    value={getSchoolAttended}
                                    onChangeText={setSchoolAttended}
                                    placeholder="What school did you attend ?"
                                    maxLength={45}
                                    multiline
                                />
                            </View>

                            <View style={[styles.editprofile_inputborder, { padding: 6, gap: 6 }]}>
                                <Text style={styles.editprofile_inputtitle}>Prompts</Text>

                                {getPrompts && getPrompts.map((item: any, index: any) => (
                                    <View key={index} style={[styles.editprofile_inputborder, { position: "relative" }]}>
                                        <Pressable style={{ position: "absolute", right: 6, top: 6, zIndex: 10 }} onPress={() => {
                                            const updatedPrompts = getPrompts.filter((_: any, i: number) => i !== index);
                                            setPrompts(updatedPrompts);
                                        }}>
                                            <IIcon name="close-circle" size={20} color="#ff0000" />
                                        </Pressable>
                                        <View style={{ padding: 8, gap: 6 }} >
                                            <Text style={{ fontSize: 16, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700 }}>{item?.q}</Text>
                                            <TextInput style={styles.editprofile_input}
                                                value={item?.a} placeholder={item?.q}
                                                multiline maxLength={140} />
                                        </View>
                                    </View>
                                ))}
                                {getPrompts && getPrompts.length < 3 && (
                                    <Pressable style={styles.editprofile_inputborder} onPress={() => {
                                        addNewPrompt_ref.current?.snapToIndex(0);
                                    }}>
                                        <View style={{ gap: 4, flexDirection: "row", padding: 5, alignItems: "center" }}>
                                            <MIcons name='plus-circle-outline' size={20} color={'#f95f62'} />
                                            <Text style={{ fontSize: 14, fontWeight: 600 }}>Add a new Prompt</Text>
                                        </View>
                                    </Pressable>
                                )}
                            </View>

                            <AccordionItem title="Do you have children?" titleStyle={[styles.editprofile_inputtitle, { paddingLeft: 0 }]} subtitle={__MAPPER?.bio_children?.[getChildren]} Content={() => (<View>{
                                <RadioGroup labelStyle={{ fontSize: 15, textTransform: "capitalize" }}
                                    radioButtons={Object.entries(__MAPPER?.bio_children ?? {}).map(([key, value]) => ({
                                        id: key,
                                        label: value as string,
                                        value: value as string,
                                    }))}
                                    containerStyle={{ alignItems: 'flex-start' }}
                                    onPress={setChildren}
                                    selectedId={getChildren.toString() || ""}
                                />}
                            </View>)} />
                            
                            <AccordionItem title="Do you smoke?" titleStyle={[styles.editprofile_inputtitle, { paddingLeft: 0 }]} subtitle={__MAPPER?.bio_smoking?.[getSmoking]} Content={() => (<View>{
                                <RadioGroup labelStyle={{ fontSize: 15, textTransform: "capitalize" }}
                                    radioButtons={Object.entries(__MAPPER?.bio_smoking ?? {}).map(([key, value]) => ({
                                        id: key,
                                        label: value as string,
                                        value: value as string,
                                    }))}
                                    containerStyle={{ alignItems: 'flex-start' }}
                                    onPress={setSmoking}
                                    selectedId={getSmoking.toString() || ""}
                                />}
                            </View>)} />
                            
                            <AccordionItem title="Do you drink?" titleStyle={[styles.editprofile_inputtitle, { paddingLeft: 0 }]} subtitle={__MAPPER?.bio_drinking?.[getDrinking]} Content={() => (<View>{
                                <RadioGroup labelStyle={{ fontSize: 15, textTransform: "capitalize" }}
                                    radioButtons={Object.entries(__MAPPER?.bio_drinking ?? {}).map(([key, value]) => ({
                                        id: key,
                                        label: value as string,
                                        value: value as string,
                                    }))}
                                    containerStyle={{ alignItems: 'flex-start' }}
                                    onPress={setDrinking}
                                    selectedId={getDrinking.toString() || ""}
                                />}
                            </View>)} />
                            
                            <AccordionItem title="Do you have a pet?" titleStyle={[styles.editprofile_inputtitle, { paddingLeft: 0 }]} subtitle={__MAPPER?.bio_pets?.[getPets]} Content={() => (<View>{
                                <RadioGroup labelStyle={{ fontSize: 15, textTransform: "capitalize" }}
                                    radioButtons={Object.entries(__MAPPER?.bio_pets ?? {}).map(([key, value]) => ({
                                        id: key,
                                        label: value as string,
                                        value: value as string,
                                    }))}
                                    containerStyle={{ alignItems: 'flex-start' }}
                                    onPress={setPets}
                                    selectedId={getPets.toString() || ""}
                                />}
                            </View>)} />
                            
                            <AccordionItem title='What is your religion?' titleStyle={[styles.editprofile_inputtitle, { paddingLeft: 0 }]} subtitle={__MAPPER?.bio_religion?.[getReligion]} Content={() => (<View>{
                                <RadioGroup labelStyle={{ fontSize: 15, textTransform: "capitalize" }}
                                    radioButtons={Object.entries(__MAPPER?.bio_religion ?? {}).map(([key, value]) => ({
                                        id: key,
                                        label: value as string,
                                        value: value as string,
                                    }))}
                                    containerStyle={{ alignItems: 'flex-start' }}
                                    onPress={setReligion}
                                    selectedId={getReligion || ""}
                                />}
                            </View>)} />
                            
                            <AccordionItem title='What is your ethnicity?' titleStyle={[styles.editprofile_inputtitle, { paddingLeft: 0 }]} subtitle={__MAPPER?.bio_ethnicity?.[getEthnicity]} Content={() => (<View>{
                                <RadioGroup labelStyle={{ fontSize: 15, textTransform: "capitalize" }}
                                    radioButtons={Object.entries(__MAPPER?.bio_ethnicity ?? {}).map(([key, value]) => ({
                                        id: key,
                                        label: value as string,
                                        value: value as string,
                                    }))}
                                    containerStyle={{ alignItems: 'flex-start' }}
                                    onPress={setEthnicity}
                                    selectedId={getEthnicity || ""}
                                />}
                            </View>)} />

                            <AccordionItem title="Describe your body type" titleStyle={[styles.editprofile_inputtitle, { paddingLeft: 0 }]} subtitle={__MAPPER?.bio_bodytype?.[getBodyType]} Content={() => (<View>{
                                <RadioGroup labelStyle={{ fontSize: 15, textTransform: "capitalize" }}
                                    radioButtons={Object.entries(__MAPPER?.bio_bodytype ?? {}).map(([key, value]) => ({
                                        id: key,
                                        label: value as string,
                                        value: value as string,
                                    }))}
                                    containerStyle={{ alignItems: 'flex-start' }}
                                    onPress={setBodyType}
                                    selectedId={getBodyType || ""}
                                />}
                            </View>)} />
                            
                            <AccordionItem title="Political Views ?" titleStyle={[styles.editprofile_inputtitle, { paddingLeft: 0 }]} subtitle={__MAPPER?.bio_politicalview?.[getPoliticalViews]} Content={() => (<View>{
                                <RadioGroup labelStyle={{ fontSize: 15, textTransform: "capitalize" }}
                                    radioButtons={Object.entries(__MAPPER?.bio_politicalview ?? {}).map(([key, value]) => ({
                                        id: key,
                                        label: value as string,
                                        value: value as string,
                                    }))}
                                    containerStyle={{ alignItems: 'flex-start' }}
                                    onPress={setPoliticalViews}
                                    selectedId={getPoliticalViews.toString() || ""}
                                />}
                            </View>)} />

                        </View>
                    </ScrollView>
                </KeyboardAvoidingView >
            </View >

            {/* Add new prompt from __MAPPER?.prompts */}
            <BottomSheet
                ref={addNewPrompt_ref}
                index={-1}
                enablePanDownToClose
                snapPoints={addNewPromptSnapPoints}
                backdropComponent={bottomsheet_renderBackdrop}
            >
                <BottomSheetView style={{ padding: 23 }}>
                    <View style={{ flex: 1, gap: 10 }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', textAlign: "center" }}>Add a new Prompt</Text>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 2 }}>
                            <View style={{ gap: 12 }}>
                                {Object.values(__MAPPER?.bio_prompt ?? {}).filter(prompt => !(getPrompts.map((p: any) => p.q)).includes(prompt)).map((prompt: any, index: number) => (

                                    <AccordionItem key={index} title={prompt} titleStyle={[styles.editprofile_inputtitle, { paddingLeft: 0 }]} subtitle={""}
                                        Content={() => {
                                            const [getNewPrompt_text, setNewPrompt_text] = useState<string>("");

                                            return (
                                                <View>
                                                    <TextInput style={[styles.editprofile_input, { minHeight: 100, margin: 6, borderWidth: 1, borderColor: colors.gray2, borderRadius: 8, }]}
                                                        value={getNewPrompt_text} onChangeText={setNewPrompt_text}
                                                        placeholder={prompt}
                                                        maxLength={140} multiline
                                                    />
                                                    <Pressable style={{ alignSelf: "center", marginLeft: "auto", paddingRight: 10 }} onPress={() => {
                                                        const usedPrompts = getPrompts.map((p: any) => p.q);
                                                        const todayDate = new Date();

                                                        if (!usedPrompts.includes(prompt as string)) {
                                                            const dateStr =
                                                                `${todayDate.getFullYear()}` +
                                                                `${String(todayDate.getMonth() + 1).padStart(2, "0")}` +
                                                                `${String(todayDate.getDate()).padStart(2, "0")}` +
                                                                `${String(todayDate.getHours()).padStart(2, "0")}` +
                                                                `${String(todayDate.getMinutes()).padStart(2, "0")}` +
                                                                `${String(todayDate.getSeconds()).padStart(2, "0")}`;
                                                            setPrompts([...getPrompts, { q: prompt, a: getNewPrompt_text.trim(), d: dateStr }]);
                                                        }
                                                        addNewPrompt_ref.current?.close();
                                                    }}>
                                                        <Text style={{ color: "blue", fontSize: 16 }}>save</Text>
                                                    </Pressable>
                                                </View>
                                            )
                                        }} />

                                )
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </BottomSheetView>
            </BottomSheet>

            {/* interests */}
            <BottomSheet
                ref={addInterests_ref}
                index={-1}
                enablePanDownToClose
                snapPoints={addInterestsSnapPoints}
                backdropComponent={bottomsheet_renderBackdrop}
            >
                <BottomSheetView style={{ padding: 23 }}>
                    <ScrollView contentContainerStyle={[{ gap: 10, paddingVertical: 6 }]} showsVerticalScrollIndicator={false}>
                        {
                            Object.entries(__MAPPER?.bio_interests as Record<string, string[]> ?? {}).map(([category, items]) => (
                                <View style={{ backgroundColor: "#fafafaff", borderRadius: 8 }} key={category}>
                                    <AccordionItem key={category} title={category} titleStyle={[styles.editprofile_inputtitle, { paddingLeft: 0 }]}
                                        subtitle={""}
                                        Content={() => (<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                            {items.map((item: any, idx: number) => {
                                                const gi = getInterests.includes(item);
                                                return (
                                                    <TouchableOpacity key={idx} style={[styles.editProfile_chip, gi && { backgroundColor: "blue" }]}
                                                        onPress={() => {
                                                            if (getInterests.length <= 15) {
                                                                setInterests(prev =>
                                                                    prev.includes(item)
                                                                        ? prev.filter(v => v !== item)   // remove
                                                                        : [...prev, item]                // add
                                                                );
                                                            } else {
                                                                Toastx.show({ message: "You can only select 15 interests.", type: "info" })
                                                                addInterests_ref.current?.close();
                                                            }
                                                        }}>
                                                        <Text style={gi && { color: "white", fontWeight: 600 }}>{item}</Text>
                                                    </TouchableOpacity>
                                                )
                                            })}
                                        </View>)} />
                                </View>
                            ))
                        }

                    </ScrollView>
                </BottomSheetView>
            </BottomSheet>

        </SafeAreaView >
    );
}