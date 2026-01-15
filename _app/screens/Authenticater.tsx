import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ScrollView, Animated, Dimensions, Linking } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from '../funcs/static';
import { __init__app, _handle_Signin, hostServer, screenWidth } from '../funcs/functions';
import { Loaderx } from '../funcs/functions_stateful';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CarouselRef, ControlledCarousel } from '../funcs/customCarousel';
import { Toastx } from '../funcs/customNotification';


export const Auth_InputPhoneNumberPage = () => {
  const [getPhoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [getProgressStep, setProgressStep] = useState<number>(1);
  const carouselRef1 = useRef<CarouselRef>(null);
  const [isLoginPage, setisLoginPage] = useState<boolean>(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [getErr, setErr] = useState<{ flname: boolean, email: boolean, date: boolean }>({ date: false, flname: false, email: false });

  useEffect(() => {
    // Animate when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const animatePageChange = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  };

  const rq = StyleSheet.create({
    line: { flex: 1, height: 1, backgroundColor: '#ccc', },
    text: { color: '#666', fontWeight: '500', paddingHorizontal: 5, lineHeight: 13 },
  });

  const [userData, setUserData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    dob_year: string,
    dob_month: string,
    dob_day: string,
    gender: string;
    interestedIn: string;
    bio: string;
    height: string;
    relationshipGoals: string;
    education: string;
    occupation: string;
    hobbies: string[];
    location: string;
    maxDistance: number;
    ageRange: [number, number];
    photos: string[];
    prompts: { question: string; answer: string }[];
    lifestyle: {
      smoking: string;
      drinking: string;
      workout: string;
      diet: string;
      pets: string[];
    };
    astrology: {
      zodiac: string;
      personality: string[];
    };
  }>({
    firstName: '',
    lastName: '',
    email: '',
    dob_year: '',
    dob_month: '',
    dob_day: '',
    gender: '',
    interestedIn: '',
    bio: '',
    height: '',
    relationshipGoals: '',
    education: '',
    occupation: '',
    hobbies: [],
    location: '',
    maxDistance: 50,
    ageRange: [18, 35],
    photos: [],
    prompts: [],
    lifestyle: {
      smoking: '',
      drinking: '',
      workout: '',
      diet: '',
      pets: []
    },
    astrology: {
      zodiac: '',
      personality: []
    }
  });

  // Enhanced options
  const genderOptions: string[] = [];

  const interestedInOptions = [...Object.entries({}).filter(([k, o]) => k !== "2"), ["-99", "Anyone / Everyone"]] as [string, string][];
  const relationshipGoalsOptions: string[] = [];

  const hobbyOptions = [
    'Travel', 'Music', 'Sports', 'Reading', 'Cooking', 'Gaming',
    'Movies', 'Fitness', 'Art', 'Photography', 'Dancing', 'Hiking',
    'Technology', 'Foodie', 'Animals', 'Volunteering', 'Yoga',
    'Writing', 'Shopping', 'Meditation', 'Cycling', 'Swimming'
  ];



  const personalityTraits = [
    'Adventurous', 'Ambitious', 'Analytical', 'Artistic', 'Caring', 'Confident',
    'Creative', 'Curious', 'Empathetic', 'Energetic', 'Funny', 'Intellectual',
    'Optimistic', 'Organized', 'Passionate', 'Patient', 'Spontaneous', 'Thoughtful'
  ];


  const handleInputChange = (field: string, value: any) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleInterestedInSelection = (value: string) => {
    handleInputChange('interestedIn', [value]); // Set as array with single item
  };


  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);

    if (isNaN(birth.getTime())) return NaN; // invalid date

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const validatePersonalInfo = () => {
    setErr(prev =>
      Object.fromEntries(
        Object.keys(prev).map(k => [k, false])
      ) as typeof prev
    );

    if (!/^[A-Za-z]+$/.test(userData.firstName.trim()) || !/^[A-Za-z]+$/.test(userData.lastName.trim())) {
      Toastx.show({ type: 'error', message: "Please enter your first and last name!" });
      setErr((g) => ({ ...g, flname: true }));
      return false;
    }
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(userData.email.trim())) {
      Toastx.show({ type: 'error', message: "Please enter a valid email address!" });
      setErr((g) => ({ ...g, email: true }));
      return false;
    }

    const dob_date = new Date(userData.dob_year + "-" + userData.dob_month + "-" + userData.dob_day);
    const date_now = new Date();
    const minDate = new Date();
    minDate.setFullYear(date_now.getFullYear() - 120); // 120 years ago
    const maxDate = new Date();
    maxDate.setFullYear(date_now.getFullYear() - 18); // at least 18 years ago
    if (isNaN(dob_date.getTime()) || dob_date < minDate || dob_date > date_now || dob_date > maxDate) {
      Toastx.show({ type: 'error', message: "Please enter your date of birth" });
      setErr((g) => ({ ...g, date: true }));
      return false;
    }

    if (!userData.gender) {
      Toastx.show({ type: 'error', message: "Please select your gender" });
      return false;
    }

    if (userData.interestedIn.length === 0) {
      Toastx.show({ type: 'error', message: "Please select who you're interested in" });
      return false;
    }

    return true;
  };

  const ProgressBar = ({ current, total }: { current: number; total: number }) => (
    <View style={stylesx.progressContainer}>
      <View style={stylesx.progressBar}>
        <View style={[stylesx.progressFill, { width: `${(current / total) * 100}%` }]} />
      </View>
      <Text style={stylesx.progressText}>Step {current} of {total}</Text>
    </View>
  );

  const renderLoginPage = () => (
    <Animated.View style={[
      stylesx.page,
      {
        justifyContent: "center",
        opacity: fadeAnim, paddingHorizontal: 10,
        transform: [{ translateY: slideAnim }]
      }
    ]}>

      <View style={stylesx.header}>
        <Text style={stylesx.title}>Find Your Perfect Match</Text>
        <Text style={stylesx.subtitle}>Join millions finding love and connection</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={stylesx.inputContainer}>
          <MaterialCommunityIcons name="phone" size={20} color="#666" style={stylesx.inputIcon} />
          <TextInput
            style={stylesx.inputWithIcon}
            placeholder="Phone Number"
            placeholderTextColor="#999"
            value={getPhoneNumber}
            onChangeText={(e) => { const r = e.replace(/[^0-9]/g, ''); setPhoneNumber(r); }}
            keyboardType='number-pad'
          />
        </View>

        <TouchableOpacity
          disabled={!(getPhoneNumber.length > 5)}
          style={[
            styles.pressableButton,
            !(getPhoneNumber.length > 5) && { backgroundColor: "#cccccc", opacity: 0.6 }
          ]}
          onPress={async () => {
            Loaderx.show();
            await new Promise(res => setTimeout(() => res(undefined), 1000));
            await _handle_Signin(getPhoneNumber, null).then((htp) => {
              if (htp) {
                if (htp.code === 200) {
                  carouselRef1.current?.goToNext();
                } else if (htp.code === 301) {
                  Toastx.show({ type: 'info', message: htp.message ?? "Redirecting" });
                  //carouselRef1.current?.goToPage(2);
                  setisLoginPage(false);
                } else {
                  Toastx.show({ type: 'error', message: htp.message ?? htp.redirect ?? "nothing" });
                }
              } else {
                Toastx.show({ type: 'error', message: "Error signup..." });
              }
            }).finally(() => {
              Loaderx.hide();
            });
          }}
        >
          <Text style={[styles.pressableButtonText]}>Continue with Phone</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
          <View style={rq.line} />
          <Text style={rq.text}>or continue with</Text>
          <View style={rq.line} />
        </View>

        <View style={stylesx.socialButtonsContainer}>
          <Pressable style={[stylesx.socialButton, { backgroundColor: '#db4437' }]}
            onPress={() => { }} >
            <MaterialCommunityIcons name="google" size={21} color="#fff" />
            <Text style={stylesx.socialButtonText}>Google</Text>
          </Pressable>

          <Pressable style={[stylesx.socialButton, { backgroundColor: '#4267B2' }]}
            onPress={() => { }} >
            <MaterialCommunityIcons name="facebook" size={21} color="#fff" />
            <Text style={stylesx.socialButtonText}>Facebook</Text>
          </Pressable>
        </View>

        {Platform.OS == "ios" && (
          <Pressable style={[stylesx.socialButton, { backgroundColor: '#000', marginTop: 10 }]}
            onPress={() => { }} >
            <MaterialCommunityIcons name="apple" size={21} color="#fff" />
            <Text style={stylesx.socialButtonText}>Apple</Text>
          </Pressable>
        )}


        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <Text style={stylesx.termsText}>By continuing, you agree to our</Text>
          <Pressable onPress={() => { Linking.openURL(hostServer() + "/static_page/tnc.php"); }}><Text style={[stylesx.termsText, { color: "#5d5b8dff" }]}> Terms of Service</Text></Pressable>
          <Text style={stylesx.termsText}> and</Text>
          <Pressable onPress={() => { Linking.openURL(hostServer() + "/static_page/privacy.php"); }}><Text style={[stylesx.termsText, { color: "#5d5b8dff" }]}> Privacy Policy.</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );

  const renderVerificationPage = () => {
    const inputRefs = useRef<Array<TextInput | null>>([]);

    const applyCodeInput = (text: string, index: number) => {
      const digits = text.replace(/\D/g, '').split('');
      const next = [...verificationCode];

      if (digits.length > 0) {
        digits.slice(0, 6 - index).forEach((d, i) => {
          next[index + i] = d;
        });
        setVerificationCode(next);
        const focusTo = Math.min(index + digits.length, 5);
        inputRefs.current[focusTo]?.focus();
        return;
      }

      next[index] = '';
      setVerificationCode(next);
    };

    const handleKeyPress = (e: any, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && !verificationCode[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    };

    const [timer, setTimer] = useState(80);
    const [isDisabled, setIsDisabled] = useState(true);
    useEffect(() => {
      let interval: ReturnType<typeof setInterval> | null = null;
      if (isDisabled) {
        interval = setInterval(() => {
          setTimer(prev => {
            if (prev <= 1) {
              clearInterval(interval!);
              setIsDisabled(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      return () => clearInterval(interval!);
    }, [isDisabled]);

    const handleResendCode = () => {
      setTimer(90);
      setIsDisabled(true);
      Toastx.show({ type: 'info', message: 'Code resent' });
    };

    const maskedNumber = getPhoneNumber
      ? `*****${getPhoneNumber.substring(Math.max(getPhoneNumber.length - 4, 0))}`
      : '';

    return (
      <Animated.View style={[
        stylesx.page,
        { justifyContent: "center", opacity: fadeAnim, paddingHorizontal: 10, gap: 10, transform: [{ translateY: slideAnim }] }
      ]}>
        <View style={stylesx.heroCard}>
          <Text style={stylesx.heroTitle}>Verify your number</Text>
          <Text style={stylesx.heroSubtitle}>We sent a 6-digit code to {maskedNumber}</Text>
        </View>

        <View style={stylesx.prefCard}>
          <View style={stylesx.cardHeader}>
            <Text style={stylesx.cardTitle}>Enter code</Text>
          </View>

          <View style={stylesx.codeStack}>
            {verificationCode.map((digit, index) => {
              const isActive = !!digit;
              return (
                <TextInput
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  key={index}
                  style={[stylesx.codeInput, isActive && stylesx.codeInputActive]}
                  value={digit}
                  onChangeText={(text) => applyCodeInput(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  placeholder='0'
                  placeholderTextColor="#c4c4d3"
                  keyboardType="number-pad"
                  maxLength={6}
                  selectTextOnFocus
                  textContentType="oneTimeCode"
                />
              );
            })}
          </View>

          <View style={stylesx.codeFooter}>
            <Text style={stylesx.helperText}>{isDisabled ? 'Waiting to resend' : 'Didn’t get it?'}</Text>
            <TouchableOpacity
              style={[stylesx.pill, isDisabled && { opacity: 0.6 }]}
              disabled={isDisabled}
              onPress={handleResendCode}
            >
              <Text style={[stylesx.pillText, stylesx.pillTextActive]}>
                {isDisabled
                  ? `Resend in ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`
                  : 'Resend code'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.pressableButton} onPress={async () => {
          const vc = verificationCode.join("");
          if (vc.length < 6) {
            Toastx.show({ type: 'error', message: "Please enter the complete verification code!" });
          } else {
            Loaderx.show();
            await new Promise(res => setTimeout(() => res(undefined), 1000));
            await _handle_Signin(getPhoneNumber, vc).then(async (htp) => {
              if (htp) {
                if (htp.code === 200) {
                  await __init__app({ doAgain: true });
                  Toastx.show({ type: 'success', message: htp.message ?? "Verification successful!" });
                } else if (htp.code === 301) {
                  Toastx.show({ type: 'info', message: htp.message ?? "Redirecting" });
                } else {
                  Toastx.show({ type: 'error', message: htp.message ?? htp.redirect ?? "nothing" });
                }
              } else {
                Toastx.show({ type: 'error', message: "Error verifying account!" });
              }
            }).finally(() => {
              Loaderx.hide();
            });
          }
        }}>
          <Text style={styles.pressableButtonText}>Verify & Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
          carouselRef1.current?.goToPrevious();
          verificationCode.fill('');
        }}>
          <Text style={stylesx.backButtonText}>Wrong number? Edit</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };


  // Enhanced Personal Info Page with better layout
  const renderPersonalInfoPage = () => {
    const [localErrors, setLocalErrors] = useState<{
      firstName: boolean;
      lastName: boolean;
      email: boolean;
      date: boolean;
      gender: boolean;
      interestedIn: boolean;
    }>({
      firstName: false,
      lastName: false,
      email: false,
      date: false,
      gender: false,
      interestedIn: false
    });

    const validateField = (field: string, value: any): boolean => {
      switch (field) {
        case 'firstName':
        case 'lastName':
          return /^[A-Za-z]+$/.test(value?.trim() || '');
        case 'email':
          return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value?.trim() || '');
        case 'date':
          if (!userData.dob_year || !userData.dob_month || !userData.dob_day) return false;
          const dobDate = new Date(`${userData.dob_year}-${userData.dob_month}-${userData.dob_day}`);
          const today = new Date();
          const minDate = new Date();
          minDate.setFullYear(today.getFullYear() - 120);
          const maxDate = new Date();
          maxDate.setFullYear(today.getFullYear() - 18);

          return !isNaN(dobDate.getTime()) &&
            dobDate >= minDate &&
            dobDate <= today &&
            dobDate <= maxDate;
        case 'gender':
          return !!value;
        case 'interestedIn':
          return Array.isArray(value) && value.length > 0;
        default:
          return true;
      }
    };

    const handleFieldChange = (field: string, value: any) => {
      handleInputChange(field, value);

      // Clear error when user starts typing
      if (localErrors[field as keyof typeof localErrors]) {
        setLocalErrors(prev => ({ ...prev, [field]: false }));
      }
    };

    const handleContinue = () => {
      const newErrors = {
        firstName: !validateField('firstName', userData.firstName),
        lastName: !validateField('lastName', userData.lastName),
        email: !validateField('email', userData.email),
        date: !validateField('date', null),
        gender: !validateField('gender', userData.gender),
        interestedIn: !validateField('interestedIn', userData.interestedIn)
      };

      setLocalErrors(newErrors);

      if (Object.values(newErrors).some(error => error)) {
        Toastx.show({ type: 'error', message: "Please fix the errors above to continue" });
        return;
      }

      if (validatePersonalInfo()) {
        carouselRef1.current?.goToNext();
      }
    };

    const getAge = () => {
      if (!userData.dob_year || !userData.dob_month || !userData.dob_day) return 0;
      return calculateAge(`${userData.dob_year}-${userData.dob_month}-${userData.dob_day}`);
    };

    const formatDateInput = (value: string, type: 'year' | 'month' | 'day') => {
      // Remove non-numeric characters
      let formatted = value.replace(/[^0-9]/g, '');

      // Apply constraints based on type
      if (type === 'year' && formatted.length > 4) {
        formatted = formatted.slice(0, 4);
      } else if (type === 'month') {
        if (formatted.length > 2) formatted = formatted.slice(0, 2);
        const monthNum = parseInt(formatted);
        if (monthNum > 12) formatted = '12';
        if (monthNum < 1 && formatted.length === 2) formatted = '01';
      } else if (type === 'day') {
        if (formatted.length > 2) formatted = formatted.slice(0, 2);
        const dayNum = parseInt(formatted);
        if (dayNum > 31) formatted = '31';
        if (dayNum < 1 && formatted.length === 2) formatted = '01';
      }

      return formatted;
    };

    return (
      <ScrollView
        style={[stylesx.page, { padding: 0 }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 12, gap: 16 }}
      >
        <View style={stylesx.heroCard}>
          <Text style={stylesx.heroKicker}>Step 1</Text>
          <Text style={stylesx.heroTitle}>Personal details</Text>
          <Text style={stylesx.heroSubtitle}>Lock in the essentials so we can tailor your matches.</Text>
        </View>

        <View style={stylesx.prefCard}>
          <View style={stylesx.cardHeader}>
            <Text style={stylesx.cardTitle}>Name</Text>
            {localErrors.firstName || localErrors.lastName ? (
              <Text style={stylesx.errorText}>Required</Text>
            ) : (
              <Text style={stylesx.helperText}>Use your real name</Text>
            )}
          </View>
          <View style={stylesx.row}>
            <View style={[stylesx.flex1, stylesx.fieldStack]}>
              <Text style={stylesx.inputLabel}>First name</Text>
              <TextInput
                style={[stylesx.input, localErrors.firstName && stylesx.inputError]}
                placeholder="Alex"
                placeholderTextColor="#999"
                value={userData.firstName}
                onChangeText={(text) => handleFieldChange('firstName', text)}
                maxLength={30}
                autoCapitalize="words"
              />
              {localErrors.firstName && <Text style={stylesx.errorText}>Enter a valid first name</Text>}
            </View>
            <View style={[stylesx.flex1, stylesx.fieldStack]}>
              <Text style={stylesx.inputLabel}>Last name</Text>
              <TextInput
                style={[stylesx.input, localErrors.lastName && stylesx.inputError]}
                placeholder="Morgan"
                placeholderTextColor="#999"
                value={userData.lastName}
                onChangeText={(text) => handleFieldChange('lastName', text)}
                maxLength={30}
                autoCapitalize="words"
              />
              {localErrors.lastName && <Text style={stylesx.errorText}>Enter a valid last name</Text>}
            </View>
          </View>
        </View>

        <View style={stylesx.prefCard}>
          <View style={stylesx.cardHeader}>
            <Text style={stylesx.cardTitle}>Contact</Text>
            {localErrors.email ? (
              <Text style={stylesx.errorText}>Required</Text>
            ) : (
              <Text style={stylesx.helperText}>We’ll keep this private</Text>
            )}
          </View>
          <View style={stylesx.fieldStack}>
            <Text style={stylesx.inputLabel}>Email address</Text>
            <TextInput
              style={[stylesx.input, localErrors.email && stylesx.inputError]}
              placeholder="you@example.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={userData.email}
              onChangeText={(text) => handleFieldChange('email', text)}
            />
            {localErrors.email && <Text style={stylesx.errorText}>Enter a valid email</Text>}
          </View>
        </View>

        <View style={stylesx.prefCard}>
          <View style={stylesx.cardHeader}>
            <Text style={stylesx.cardTitle}>Birthday</Text>
            <Text style={stylesx.helperText}>Must be 18 or older</Text>
          </View>
          <View style={stylesx.row}>
            <TextInput
              style={[stylesx.input, stylesx.flex1, localErrors.date && stylesx.inputError]}
              placeholder="YYYY"
              placeholderTextColor="#999"
              value={userData.dob_year}
              onChangeText={(text) => handleFieldChange('dob_year', formatDateInput(text, 'year'))}
              keyboardType='number-pad'
              maxLength={4}
            />
            <TextInput
              style={[stylesx.input, stylesx.flex1, localErrors.date && stylesx.inputError]}
              placeholder="MM"
              placeholderTextColor="#999"
              value={userData.dob_month}
              onChangeText={(text) => handleFieldChange('dob_month', formatDateInput(text, 'month'))}
              keyboardType='number-pad'
              maxLength={2}
            />
            <TextInput
              style={[stylesx.input, stylesx.flex1, localErrors.date && stylesx.inputError]}
              placeholder="DD"
              placeholderTextColor="#999"
              value={userData.dob_day}
              onChangeText={(text) => handleFieldChange('dob_day', formatDateInput(text, 'day'))}
              keyboardType='number-pad'
              maxLength={2}
            />
          </View>
          {localErrors.date ? (
            <Text style={stylesx.errorText}>Enter a valid date (18+)</Text>
          ) : getAge() > 0 ? (
            <Text style={stylesx.ageText}>{getAge()} years old</Text>
          ) : null}
        </View>

        <View style={stylesx.prefCard}>
          <View style={stylesx.cardHeader}>
            <Text style={stylesx.cardTitle}>Gender</Text>
            {localErrors.gender && <Text style={stylesx.errorText}>Required</Text>}
          </View>
          <View style={stylesx.chipGroup}>
            {genderOptions.map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  stylesx.chip,
                  userData.gender === gender && stylesx.chipSelected
                ]}
                onPress={() => handleFieldChange('gender', gender)}
              >
                <Text style={[
                  stylesx.chipText,
                  userData.gender === gender && stylesx.chipSelectedText,
                  { textTransform: "capitalize" }
                ]}>
                  {gender}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={stylesx.helperText}>Choose what best fits—editable anytime.</Text>
        </View>

        <View style={stylesx.prefCard}>
          <View style={stylesx.cardHeader}>
            <Text style={stylesx.cardTitle}>Interested in</Text>
            {localErrors.interestedIn && <Text style={stylesx.errorText}>Required</Text>}
          </View>
          <Text style={stylesx.helperText}>Pick one for now—you can adjust later.</Text>
          <View style={stylesx.chipGroup}>
            {interestedInOptions.map(([kry, option]) => (
              <TouchableOpacity
                key={option}
                style={[
                  stylesx.chip,
                  userData.interestedIn.includes(option) && stylesx.chipSelected
                ]}
                onPress={() => handleInterestedInSelection(option)}
              >
                <Text style={[
                  stylesx.chipText,
                  userData.interestedIn.includes(option) && stylesx.chipSelectedText,
                  { textTransform: "capitalize" }
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={stylesx.navigationButtons}>
          <TouchableOpacity
            style={[stylesx.secondaryButton, { marginRight: 10 }]}
            onPress={() => { setisLoginPage(true); }}
          >
            <Text style={stylesx.secondaryButtonText}>Back / Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pressableButton, { flex: 2 }]}
            onPress={handleContinue}
          >
            <Text style={styles.pressableButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderBioPage = () => {
    const bioLimit = 500;
    const remaining = Math.max(0, bioLimit - (userData.bio?.length ?? 0));


    return (
      <ScrollView
        style={[stylesx.page, { padding: 0 }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 12, gap: 16 }}
      >
        <View style={stylesx.heroCard}>
          <Text style={stylesx.heroKicker}>Your story</Text>
          <Text style={stylesx.heroTitle}>Make your intro count</Text>
          <Text style={stylesx.heroSubtitle}>
            Keep it intentional with a short bio, what you do, and what you want next.
          </Text>
        </View>

        <View style={stylesx.bioCard}>
          <View style={stylesx.cardHeader}>
            <Text style={stylesx.cardTitle}>Bio</Text>
            <Text style={[
              stylesx.charCount,
              remaining < 80 && stylesx.charCountWarn,
              remaining < 30 && stylesx.charCountDanger
            ]}>
              {remaining} left
            </Text>
          </View>
          <TextInput
            style={[stylesx.input, stylesx.textArea, { minHeight: 110 }]}
            placeholder="Share what you’re into, what lights you up, or what a great weekend looks like."
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
            value={userData.bio}
            onChangeText={(text) => handleInputChange('bio', text.slice(0, bioLimit))}
          />

        </View>

        <View style={stylesx.bioCard}>
          <Text style={stylesx.cardTitle}>Work & education</Text>
          <View style={stylesx.fieldStack}>
            <Text style={stylesx.inputLabel}>Role or title</Text>
            <TextInput
              style={stylesx.input}
              placeholder="Product designer, nurse, founder..."
              placeholderTextColor="#999"
              value={userData.occupation}
              maxLength={40}
              onChangeText={(text) => handleInputChange('occupation', text)}
            />
          </View>

          <View style={stylesx.fieldStack}>
            <Text style={stylesx.inputLabel}>Education</Text>
            <TextInput
              style={stylesx.input}
              placeholder="School, program, or certification"
              placeholderTextColor="#999"
              value={userData.education}
              maxLength={60}
              onChangeText={(text) => handleInputChange('education', text)}
            />
          </View>

          <View style={stylesx.fieldStack}>
            <Text style={stylesx.inputLabel}>Height</Text>
            <TextInput
              style={stylesx.input}
              placeholder="e.g., 5'9 or 175 cm"
              placeholderTextColor="#999"
              value={userData.height}
              maxLength={12}
              onChangeText={(text) => handleInputChange('height', text)}
            />
          </View>
        </View>

        <View style={stylesx.bioCard}>
          <View style={stylesx.cardHeader}>
            <Text style={stylesx.cardTitle}>What you’re looking for</Text>
            <Text style={stylesx.helperText}>Choose one—easy to change later.</Text>
          </View>
          <View style={stylesx.chipRow}>
            {relationshipGoalsOptions.map((goal) => (
              <TouchableOpacity
                key={goal}
                style={[stylesx.chip, userData.relationshipGoals === goal && stylesx.chipActive]}
                onPress={() => handleInputChange('relationshipGoals', goal)}
              >
                <Text style={[stylesx.chipText, userData.relationshipGoals === goal && stylesx.chipTextActive]}>
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={stylesx.navigationButtons}>
          <TouchableOpacity
            style={[stylesx.secondaryButton, { marginRight: 10 }]}
            onPress={() => { carouselRef1.current?.goToPrevious(); }}
          >
            <Text style={stylesx.secondaryButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pressableButton, { flex: 2 }]}
            onPress={() => {
              if (validatePersonalInfo()) {
                carouselRef1.current?.goToNext();
              }
            }}
          >
            <Text style={styles.pressableButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };
  const renderInterestsPage = () => (
    <ScrollView style={stylesx.page} showsVerticalScrollIndicator={false}>
      <Text style={stylesx.title}>Your Interests</Text>
      <Text style={stylesx.subtitle}>Select what you enjoy doing</Text>

      <Text style={stylesx.label}>Hobbies & Interests</Text>
      <View style={stylesx.interestsContainer}>
        {hobbyOptions.map((hobby) => (
          <TouchableOpacity
            key={hobby}
            style={[
              stylesx.interestButton,
              userData.hobbies.includes(hobby) && stylesx.selectedInterest
            ]}
            onPress={() => handleInterestedInSelection(hobby)}
          >
            <Text style={[
              stylesx.interestText,
              userData.hobbies.includes(hobby) && stylesx.selectedInterestText
            ]}>
              {hobby}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={stylesx.selectedCount}>
        {userData.hobbies.length} interests selected
      </Text>

      <View style={stylesx.navigationButtons}>
        <TouchableOpacity
          style={[stylesx.secondaryButton, { marginRight: 10 }]}
          onPress={() => { carouselRef1.current?.goToPrevious(); }}>
          <Text style={stylesx.secondaryButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pressableButton, { flex: 2 }]}
          onPress={() => {
            if (validatePersonalInfo()) {
              carouselRef1.current?.goToNext();
            }
          }}
        >
          <Text style={styles.pressableButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // replace renderPreferencesPage in _app/screens/Authenticater.tsx
  const renderPreferencesPage = () => {
    const distanceRange = { min: 5, max: 150 };
    const ageRangeBounds = { min: 18, max: 65 };
    const lifestyleOptions = [
      { key: 'smoking', label: 'Smoking', choices: ['Never', 'Socially', 'Regularly'] },
      { key: 'drinking', label: 'Drinking', choices: ['Never', 'Socially', 'Frequently'] },
      { key: 'workout', label: 'Workout', choices: ['Rarely', 'Weekly', 'Daily'] },
      { key: 'diet', label: 'Diet', choices: ['No preference', 'Vegetarian', 'Vegan', 'Pescatarian'] },
    ];
    const featuredTraits = personalityTraits.slice(0, 10);

    const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

    const updateDistance = (delta: number) => {
      const next = clamp(userData.maxDistance + delta, distanceRange.min, distanceRange.max);
      handleInputChange('maxDistance', next);
    };

    const updateAge = (index: 0 | 1, delta: number) => {
      const next = [...userData.ageRange] as [number, number];
      next[index] = clamp(next[index] + delta, ageRangeBounds.min, ageRangeBounds.max);
      if (next[0] > next[1] - 2) next[index === 0 ? 1 : 0] = clamp(next[0] + 2, ageRangeBounds.min, ageRangeBounds.max);
      handleInputChange('ageRange', next);
    };

    const setLifestyle = (key: keyof typeof userData.lifestyle, value: string) => {
      const already = userData.lifestyle[key] === value;
      handleInputChange('lifestyle', { ...userData.lifestyle, [key]: already ? '' : value });
    };

    const togglePersonality = (trait: string) => {
      const current = userData.astrology.personality || [];
      const exists = current.includes(trait);
      const next = exists ? current.filter(t => t !== trait) : [...current, trait];
      handleInputChange('astrology', { ...userData.astrology, personality: next });
    };

    const percent = (value: number, min: number, max: number) => `${((value - min) / (max - min)) * 100}%`;

    return (
      <ScrollView
        style={[stylesx.page, { padding: 0 }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 12, gap: 16 }}
      >
        <View style={stylesx.heroCard}>
          <Text style={stylesx.heroKicker}>Dial it in</Text>
          <Text style={stylesx.heroTitle}>Match preferences</Text>
          <Text style={stylesx.heroSubtitle}>Keep it intentional with distance, age, lifestyle, and vibe filters.</Text>
        </View>

        <View style={stylesx.prefCard}>
          <View style={stylesx.prefHeader}>
            <View style={stylesx.prefTitleRow}>
              <MaterialCommunityIcons name="map-marker" color="#5d5b8d" size={18} />
              <Text style={stylesx.prefTitle}>Location</Text>
            </View>
            <Text style={stylesx.prefMeta}>We’ll use this to prioritize nearby matches</Text>
          </View>
          <View style={stylesx.inlineField}>
            <TextInput
              style={[stylesx.input, { flex: 1 }]}
              placeholder="City, State"
              placeholderTextColor="#8b8b9b"
              value={userData.location}
              onChangeText={(text) => handleInputChange('location', text)}
            />
            <TouchableOpacity style={stylesx.pillButton} onPress={() => handleInputChange('location', '')}>
              <Text style={stylesx.pillButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={stylesx.prefCard}>
          <View style={stylesx.prefTitleRow}>
            <MaterialCommunityIcons name="radar" color="#5d5b8d" size={18} />
            <Text style={stylesx.prefTitle}>Maximum distance</Text>
          </View>
          <View style={stylesx.sliderShell}>

            <View style={stylesx.sliderActions}>
              <TouchableOpacity style={stylesx.roundButton} onPress={() => updateDistance(-5)}>
                <Text style={stylesx.roundButtonText}>-5</Text>
              </TouchableOpacity>
              <Text style={stylesx.sliderValueText}>{userData.maxDistance} km</Text>
              <TouchableOpacity style={stylesx.roundButton} onPress={() => updateDistance(5)}>
                <Text style={stylesx.roundButtonText}>+5</Text>
              </TouchableOpacity>
            </View>
            <View style={stylesx.sliderLabels}>
              <Text style={stylesx.sliderLabel}>{distanceRange.min} km</Text>
              <Text style={stylesx.sliderLabel}>{distanceRange.max} km</Text>
            </View>
          </View>
        </View>

        <View style={stylesx.prefCard}>
          <View style={stylesx.prefTitleRow}>
            <MaterialCommunityIcons name="account-group" color="#5d5b8d" size={18} />
            <Text style={stylesx.prefTitle}>Age range</Text>
          </View>
          <View style={stylesx.rangeRow}>
            {(['Min', 'Max'] as const).map((label, idx) => (
              <View key={label} style={stylesx.rangeBox}>
                <Text style={stylesx.rangeLabel}>{label}</Text>
                <View style={stylesx.rangeControls}>
                  <TouchableOpacity style={stylesx.roundButton} onPress={() => updateAge(idx as 0 | 1, -1)}>
                    <Text style={stylesx.roundButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={stylesx.rangeValue}>{userData.ageRange[idx]}</Text>
                  <TouchableOpacity style={stylesx.roundButton} onPress={() => updateAge(idx as 0 | 1, 1)}>
                    <Text style={stylesx.roundButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
          <Text style={stylesx.prefMeta}>Keeping at least a 2-year gap between min and max</Text>
        </View>

        <View style={stylesx.prefCard}>
          <View style={stylesx.prefTitleRow}>
            <MaterialCommunityIcons name="heart-multiple" color="#5d5b8d" size={18} />
            <Text style={stylesx.prefTitle}>Relationship intent</Text>
          </View>
          <View style={stylesx.chipGroup}>
            {relationshipGoalsOptions.map((goal) => (
              <TouchableOpacity
                key={goal}
                style={[
                  stylesx.chip,
                  userData.relationshipGoals === goal && stylesx.chipSelected,
                ]}
                onPress={() => handleInputChange('relationshipGoals', goal)}
              >
                <Text
                  style={[
                    stylesx.chipText,
                    userData.relationshipGoals === goal && stylesx.chipSelectedText,
                  ]}
                >
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={stylesx.prefCard}>
          <View style={stylesx.prefTitleRow}>
            <MaterialCommunityIcons name="leaf" color="#5d5b8d" size={18} />
            <Text style={stylesx.prefTitle}>Lifestyle</Text>
          </View>
          {lifestyleOptions.map((item) => (
            <View key={item.key} style={stylesx.lifestyleRow}>
              <Text style={stylesx.lifestyleLabel}>{item.label}</Text>
              <View style={stylesx.pillRow}>
                {item.choices.map((choice) => {
                  const active = (userData.lifestyle as any)[item.key] === choice;
                  return (
                    <TouchableOpacity
                      key={choice}
                      style={[stylesx.pill, active && stylesx.pillSelected]}
                      onPress={() => setLifestyle(item.key as any, choice)}
                    >
                      <Text style={[stylesx.pillText, active && stylesx.pillTextActive]}>{choice}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        <View style={stylesx.prefCard}>
          <View style={stylesx.prefTitleRow}>
            <MaterialCommunityIcons name="sparkles" color="#5d5b8d" size={18} />
            <Text style={stylesx.prefTitle}>Personality highlights</Text>
          </View>
          <Text style={stylesx.prefMeta}>Pick traits that feel most you</Text>
          <View style={stylesx.chipGroup}>
            {featuredTraits.map((trait) => {
              const active = userData.astrology.personality?.includes(trait);
              return (
                <TouchableOpacity
                  key={trait}
                  style={[stylesx.chip, active && stylesx.chipSelected]}
                  onPress={() => togglePersonality(trait)}
                >
                  <Text style={[stylesx.chipText, active && stylesx.chipSelectedText]}>{trait}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={stylesx.selectedCount}>{userData.astrology.personality?.length || 0} selected</Text>
        </View>

        <View style={stylesx.navigationButtons}>
          <TouchableOpacity
            style={[stylesx.secondaryButton, { marginRight: 10 }]}
            onPress={() => { carouselRef1.current?.goToPrevious(); }}
          >
            <Text style={stylesx.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pressableButton, { flex: 2 }]}
            onPress={async () => {
              Loaderx.show();
              await new Promise(res => setTimeout(() => res(undefined), 800));
              Loaderx.hide();
              Toastx.show({ type: 'success', message: "Preferences saved" });
            }}
          >
            <Text style={styles.pressableButtonText}>Save & Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // Continue with other pages (Bio, Interests, Preferences) following the same enhanced pattern...
  const LoginPages = [
    renderLoginPage(),
    renderVerificationPage(),
  ]
  const SignupPages = [
    renderPersonalInfoPage(),
    renderBioPage(),
    //renderInterestsPage(),
    renderPreferencesPage()
    // Add other pages here with similar enhancements
  ];
  const currentPageToShow = isLoginPage ? LoginPages : SignupPages;

  return (
    <SafeAreaView style={stylesx.container} edges={["bottom", "top"]}>

      {(getProgressStep) >= 1 && <ProgressBar current={getProgressStep} total={(currentPageToShow.length)} />}
      <ControlledCarousel
        ref={carouselRef1}
        pages={currentPageToShow}
        onPageChange={(index) => {
          console.log('Current page:', index);
          setProgressStep(index + 1);
          animatePageChange();
        }}
      />
    </SafeAreaView>
  );
};

const stylesx = StyleSheet.create({
  prefCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ececf3',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  prefHeader: { marginBottom: 8 },
  prefTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  prefTitle: { fontSize: 16, fontWeight: '700', color: '#1c1c2b' },
  prefMeta: { fontSize: 12, color: '#7a7a92' },
  row: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
  inlineField: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pillButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f1f2fb', borderWidth: 1, borderColor: '#d9dbff' },
  pillButtonText: { color: '#5d5b8d', fontWeight: '700', fontSize: 13 },
  sliderShell: { marginTop: 6 },
  sliderActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  sliderValueText: { fontSize: 16, fontWeight: '700', color: '#1c1c2b' },
  roundButton: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#dfe0ec', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f7fb' },
  roundButtonText: { fontSize: 14, fontWeight: '800', color: '#5d5b8d' },
  rangeRow: { flexDirection: 'row', gap: 12 },
  rangeBox: { flex: 1, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#edeef6', backgroundColor: '#fafbff' },
  rangeLabel: { fontSize: 12, color: '#7a7a92', marginBottom: 6 },
  rangeControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rangeValue: { fontSize: 18, fontWeight: '700', color: '#1c1c2b' },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e5e6f2', backgroundColor: '#f9f9ff' },
  chipSelected: { backgroundColor: '#5d5b8d', borderColor: '#5d5b8d' },
  chipText: { color: '#3f3f55', fontWeight: '600' },
  chipSelectedText: { color: '#fff' },
  lifestyleRow: { marginTop: 10, gap: 10 },
  lifestyleLabel: { fontSize: 13, fontWeight: '700', color: '#1c1c2b' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#f2f2fa', borderWidth: 1, borderColor: '#e3e4f3' },
  pillSelected: { backgroundColor: '#e8e7ff', borderColor: '#5d5b8d' },
  pillText: { color: '#4a4a63', fontWeight: '600', fontSize: 13 },
  pillTextActive: { color: '#2f2d6a' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },

  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF2F2',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  selectedCount: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  page: {
    width: screenWidth,
    flex: 1,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 22,
  },
  heroCard: {
    backgroundColor: '#f5f4ff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e4e6ff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  heroKicker: {
    color: '#5d5b8d',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222236',
    marginTop: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#5a5a72',
    marginTop: 6,
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 10,
  },
  bioCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ececf3',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c2b',
  },
  helperText: {
    fontSize: 12,
    color: '#7a7a92',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipActive: {
    backgroundColor: '#5d5b8d',
    borderColor: '#5d5b8d',
  },
  chipTextActive: {
    color: '#fff',
  },
  fieldStack: {
    gap: 6,
  },
  charCountWarn: {
    color: '#d17700',
  },
  charCountDanger: {
    color: '#d12e2e',
    fontWeight: '700',
  },


  textArea: {
    height: 100,
    paddingTop: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
    marginTop: 10,
  },
  codeStack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  codeInput: {
    flex: 1,
    marginHorizontal: 4,
    height: 56,
    borderWidth: 1,
    borderColor: '#dcdced',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    backgroundColor: '#fafbff',
    color: '#1c1c2b',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  codeInputActive: {
    borderColor: '#5d5b8d',
    backgroundColor: '#f2f1ff',
  },
  codeFooter: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },


  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  interestButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#f8f8f8',
  },
  selectedInterest: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  interestText: {
    fontSize: 14,
    color: '#666',
  },
  selectedInterestText: {
    color: '#fff',
    fontWeight: '600',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: -10,
    marginBottom: 15,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#999',
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputWithIcon: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  socialButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  navigationButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  secondaryButton: {
    flex: 1,
    height: 50,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 20,
  },
  resendCodeButton: {
    marginTop: 15,
  },
  resendCodeText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  ageText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 5,
    fontWeight: '500',
  },
  // Add more styles for other components as needed
});
