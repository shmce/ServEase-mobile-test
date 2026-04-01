import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { supabase, identityDb, providerCatalogDb } from '@/lib/db';
import { getErrorMessage } from '@/lib/error-handling';
import { TOKENS } from '@/constants/tokens';
import { AppButton } from '@/src/components/common/AppButton';
import { AppTextInput } from '@/src/components/common/AppTextInput';
import { AppPressable } from '@/src/components/common/AppPressable';

const CheckItem = ({ label, met }: { label: string; met: boolean }) => (
  <View style={styles.criteriaItem}>
    <View style={[styles.checkCircle, met && styles.checkCircleMet]}>
      {met && <Ionicons name="checkmark" size={12} color="#FFF" />}
    </View>
    <Text style={[styles.criteriaText, met && styles.criteriaTextMet]}>{label}</Text>
  </View>
);

const { width } = Dimensions.get('window');
const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function ProviderSignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dropdown states
  const [showPrimaryDropdown, setShowPrimaryDropdown] = useState(false);
  const [showSubDropdown, setShowSubDropdown] = useState(false);
  const [showExpDropdown, setShowExpDropdown] = useState(false);
  const [showIdDropdown, setShowIdDropdown] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    password: '',
    confirmPassword: '',
    primaryCategory: '',
    subCategory: '',
    experienceLevel: '',
    streetAddress: '',
    city: '',
    province: '',
    zipCode: '',
    radius: 10,
    idType: '',
    idDocument: null as string | null,
    otp: ['', '', '', '', '', ''],
  });

  const [timeLeft, setTimeLeft] = useState(295);

  useEffect(() => {
    if (step === 5 && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const categories = [
    "Home Maintenance & Repair",
    "Beauty, Wellness & Personal Care",
    "Education & Professional Services",
    "Domestic & Cleaning Services",
    "Pet Services",
    "Events & Entertainment",
    "Automotive & Tech Support"
  ];

  const subCategories: Record<string, string[]> = {
    "Home Maintenance & Repair": ["Plumbing", "Electrical", "Carpentry", "Painting", "Other"],
    "Beauty, Wellness & Personal Care": ["Hair Styling", "Makeup Artist", "Massage Therapy", "Nails", "Other"],
    "Education & Professional Services": ["Academic Tutor", "Language Teacher", "Music Lessons", "Other"],
    "Domestic & Cleaning Services": ["House Cleaning", "Laundry", "Ironing", "Deep Cleaning", "Other"],
    "Pet Services": ["Pet Grooming", "Dog Walking", "Pet Sitting", "Other"],
    "Events & Entertainment": ["Photography", "Hosting/MC", "Catering", "DJ/Live Music", "Other"],
    "Automotive & Tech Support": ["Car Repair", "Car Wash", "PC/Laptop Repair", "Phone/Tablet Repair", "Other"]
  };

  const idTypes = [
    "UMID",
    "Driver's License",
    "Philippine National ID (PhilID)",
    "Passport",
    "Postal ID"
  ];

  const expLevels = ["Less than 1 year", "1-2 years", "3-5 years", "5-10 years", "More than 10 years"];

  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });

  useEffect(() => {
    const { password } = formData;
    setPasswordCriteria({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    });
  }, [formData.password]);

  const persistProviderProfile = async (userId: string) => {
    const { error } = await providerCatalogDb.from('provider_profiles').upsert({
      user_id: userId,
      business_name: formData.fullName.trim(),
    });
    if (error) throw error;
  };

  const persistSignupCategories = async () => {
    const selected = [formData.primaryCategory, formData.subCategory]
      .map((v) => v.trim())
      .filter(Boolean);

    if (selected.length === 0) return;

    for (const name of selected) {
      const slug = toSlug(name);
      const { error } = await providerCatalogDb
        .from('service_categories')
        .upsert(
          { name, slug, is_active: true },
          { onConflict: 'slug' }
        );
      if (error) throw error;
    }
  };


  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Fill in your personal details to get started.</Text>

      <View style={styles.form}>
        <AppTextInput
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChangeText={(text: string) => setFormData({...formData, fullName: text})}
          leftIcon="person-outline"
        />

        <AppTextInput
          label="Email Address"
          placeholder="Enter your email address"
          value={formData.email}
          onChangeText={(text: string) => setFormData({...formData, email: text})}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="mail-outline"
          error={formData.email && !formData.email.includes('@') ? "Invalid email address" : ""}
        />

        <AppTextInput
          label="Contact Number"
          placeholder="9XX XXX XXXX"
          value={formData.phone}
          onChangeText={(text: string) => setFormData({...formData, phone: text.replace(/\D/g, '').slice(0, 10)})}
          keyboardType="phone-pad"
          leftIcon="call-outline"
          maxLength={10}
        />

        <AppTextInput
          label="Date of Birth"
          placeholder="MM/DD/YYYY"
          value={formData.dob}
          onChangeText={(text: string) => setFormData({...formData, dob: text})}
          leftIcon="calendar-outline"
        />

        <AppTextInput
          label="Password"
          placeholder="Create a password"
          value={formData.password}
          onChangeText={(text: string) => setFormData({...formData, password: text})}
          isPassword
          leftIcon="lock-closed-outline"
        />

        <View style={styles.criteriaContainer}>
          <Text style={styles.criteriaHeader}>Password must contain:</Text>
          <CheckItem label="At least 8 characters" met={passwordCriteria.length} />
          <CheckItem label="One uppercase letter (A-Z)" met={passwordCriteria.uppercase} />
          <CheckItem label="One lowercase letter (a-z)" met={passwordCriteria.lowercase} />
          <CheckItem label="One number (0-9)" met={passwordCriteria.number} />
        </View>

        <AppTextInput
          label="Confirm Password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChangeText={(text: string) => setFormData({...formData, confirmPassword: text})}
          isPassword
          leftIcon="lock-closed-outline"
          error={formData.confirmPassword && formData.password !== formData.confirmPassword ? "Passwords do not match" : ""}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Your Service Profile</Text>
      <Text style={styles.subtitle}>
        Tell us what type of service you offer and your experience level.
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Primary Category <Text style={styles.required}>*</Text></Text>
          <AppPressable 
            style={[styles.pickerButton, showPrimaryDropdown && styles.pickerButtonActive]}
            onPress={() => setShowPrimaryDropdown(!showPrimaryDropdown)}
          >
            <Text style={[styles.pickerText, !formData.primaryCategory && { color: TOKENS.colors.text.muted }]}>
              {formData.primaryCategory || "Select your service category"}
            </Text>
            <Ionicons name={showPrimaryDropdown ? "chevron-up" : "chevron-down"} size={20} color={TOKENS.colors.text.muted} />
          </AppPressable>
          
          {showPrimaryDropdown && (
            <View style={styles.dropdownMenu}>
              <ScrollView nestedScrollEnabled style={{ maxHeight: 250 }}>
                {categories.map((cat, index) => (
                  <AppPressable 
                    key={index} 
                    style={styles.dropdownOption}
                    onPress={() => {
                      setFormData({...formData, primaryCategory: cat, subCategory: ''});
                      setShowPrimaryDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownOptionText, formData.primaryCategory === cat && styles.dropdownOptionTextActive]}>
                      {cat}
                    </Text>
                  </AppPressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Sub-category <Text style={styles.required}>*</Text></Text>
          <AppPressable 
            style={[
              styles.pickerButton, 
              showSubDropdown && styles.pickerButtonActive, 
              !formData.primaryCategory && { opacity: 0.6 }
            ]}
            onPress={() => setShowSubDropdown(!showSubDropdown)}
            disabled={!formData.primaryCategory}
          >
            <Text style={[styles.pickerText, !formData.subCategory && { color: TOKENS.colors.text.muted }]}>
              {formData.subCategory || "Select a sub-category"}
            </Text>
            <Ionicons name={showSubDropdown ? "chevron-up" : "chevron-down"} size={20} color={TOKENS.colors.text.muted} />
          </AppPressable>

          {showSubDropdown && formData.primaryCategory && subCategories[formData.primaryCategory] && (
            <View style={styles.dropdownMenu}>
              {subCategories[formData.primaryCategory].map((sub, index) => (
                <AppPressable 
                  key={index} 
                  style={styles.dropdownOption}
                  onPress={() => {
                    setFormData({...formData, subCategory: sub});
                    setShowSubDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, formData.subCategory === sub && styles.dropdownOptionTextActive]}>
                    {sub}
                  </Text>
                </AppPressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Experience Level <Text style={styles.required}>*</Text></Text>
          <AppPressable 
            style={[styles.pickerButton, showExpDropdown && styles.pickerButtonActive]}
            onPress={() => setShowExpDropdown(!showExpDropdown)}
          >
            <Text style={[styles.pickerText, !formData.experienceLevel && { color: TOKENS.colors.text.muted }]}>
              {formData.experienceLevel || "Select years of experience"}
            </Text>
            <Ionicons name={showExpDropdown ? "chevron-up" : "chevron-down"} size={20} color={TOKENS.colors.text.muted} />
          </AppPressable>

          {showExpDropdown && (
            <View style={styles.dropdownMenu}>
              {expLevels.map((lvl, index) => (
                <AppPressable 
                  key={index} 
                  style={styles.dropdownOption}
                  onPress={() => {
                    setFormData({...formData, experienceLevel: lvl});
                    setShowExpDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, formData.experienceLevel === lvl && styles.dropdownOptionTextActive]}>
                    {lvl}
                  </Text>
                </AppPressable>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Where do you work?</Text>
      <Text style={styles.subtitle}>
        Set your service area so customers can find you.
      </Text>

      <View style={styles.form}>
        <AppTextInput
          label="Street Address / Landmark"
          placeholder="e.g. 123 Rizal St, near SM"
          value={formData.streetAddress}
          onChangeText={(text: string) => setFormData({...formData, streetAddress: text})}
          leftIcon="location-outline"
        />

        <AppTextInput
          label="City"
          placeholder="Search your city"
          value={formData.city}
          onChangeText={(text: string) => setFormData({...formData, city: text})}
          leftIcon="business-outline"
        />

        <AppTextInput
          label="Province"
          placeholder="Search your province"
          value={formData.province}
          onChangeText={(text: string) => setFormData({...formData, province: text})}
          leftIcon="map-outline"
        />

        <AppTextInput
          label="ZIP Code"
          placeholder="e.g. 1000"
          value={formData.zipCode}
          onChangeText={(text: string) => setFormData({...formData, zipCode: text})}
          keyboardType="numeric"
          leftIcon="mail-open-outline"
        />

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>Maximum Service Radius</Text>
            <Text style={styles.radiusValue}>{formData.radius} <Text style={styles.radiusUnit}>km</Text></Text>
          </View>
          
          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderTrackFilled, { width: `${(formData.radius / 50) * 100}%` }]} />
              <View 
                style={[styles.sliderThumb, { left: `${(formData.radius / 50) * 100}%` }]} 
                {...{
                  onTouchMove: (e: any) => {
                    const x = e.nativeEvent.locationX;
                    const val = Math.round((x / (width - 50)) * 50);
                    if (val >= 1 && val <= 50) setFormData({...formData, radius: val});
                  }
                }}
              />
            </View>
          </View>
          <Text style={styles.helperText}>How far are you willing to travel for service calls?</Text>
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Verify your identity</Text>
      <Text style={styles.subtitle}>Upload a valid Philippine government-issued ID.</Text>

      <View style={styles.form}>
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={20} color={TOKENS.colors.warning.text} style={styles.warningIcon} />
          <Text style={styles.warningText}>
            Please ensure your ID is clear, valid, and all details are visible.
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Select ID Type <Text style={styles.required}>*</Text></Text>
          <AppPressable 
            style={[styles.pickerButton, showIdDropdown && styles.pickerButtonActive]}
            onPress={() => setShowIdDropdown(!showIdDropdown)}
          >
            <Text style={[styles.pickerText, !formData.idType && { color: TOKENS.colors.text.muted }]}>
              {formData.idType || "Choose your ID type"}
            </Text>
            <Ionicons name={showIdDropdown ? "chevron-up" : "chevron-down"} size={20} color={TOKENS.colors.text.muted} />
          </AppPressable>

          {showIdDropdown && (
            <View style={styles.dropdownMenu}>
              {idTypes.map((type, index) => (
                <AppPressable 
                  key={index} 
                  style={styles.dropdownOption}
                  onPress={() => {
                    setFormData({...formData, idType: type});
                    setShowIdDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, formData.idType === type && styles.dropdownOptionTextActive]}>
                    {type}
                  </Text>
                </AppPressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Upload your selected ID <Text style={styles.required}>*</Text></Text>
          {formData.idDocument ? (
            <View style={styles.uploadedFileContainer}>
              <View style={styles.fileIconContainer}>
                <Ionicons name="document-text" size={24} color={TOKENS.colors.primary} />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{formData.idDocument}</Text>
                <Text style={styles.fileSize}>0.02 MB</Text>
              </View>
              <AppPressable 
                style={styles.removeFileButton}
                onPress={() => setFormData({...formData, idDocument: null})}
              >
                <Ionicons name="close-circle" size={24} color={TOKENS.colors.danger.text} />
              </AppPressable>
            </View>
          ) : (
            <View style={styles.uploadArea}>
              <View style={styles.uploadIconContainer}>
                <Ionicons name="cloud-upload-outline" size={32} color={TOKENS.colors.primary} />
              </View>
              <Text style={styles.uploadTitle}>Upload your selected ID</Text>
              <Text style={styles.uploadSubtitle}>PNG, JPG or PDF • Max 5MB</Text>
              
              <View style={styles.uploadActions}>
                <AppButton
                  label="Browse"
                  variant="outline"
                  size="sm"
                  onPress={() => setFormData({...formData, idDocument: "image_2026-03-17_062955.png"})}
                  leftIcon="document-text-outline"
                />
                <AppButton
                  label="Scan"
                  size="sm"
                  onPress={() => setFormData({...formData, idDocument: "scanned_id_001.jpg"})}
                  leftIcon="camera-outline"
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.subtitle}>
        Sent 6-digit code to <Text style={{ fontWeight: '700' }}>{formData.email}</Text>.
      </Text>

      <View style={styles.form}>
        <View style={styles.otpContainer}>
          {formData.otp.map((digit, index) => (
            <TextInput
              key={index}
              style={styles.otpInput}
              value={digit}
              onChangeText={(text) => {
                const newOtp = [...formData.otp];
                newOtp[index] = text.slice(-1);
                setFormData({...formData, otp: newOtp});
              }}
              keyboardType="numeric"
              maxLength={1}
            />
          ))}
        </View>

        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            Code expires in <Text style={{ fontWeight: '700' }}>{formatTime(timeLeft)}</Text>
          </Text>
        </View>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            The code must be used within its 5-minute validity period.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  const getHeaderTitle = () => {
    switch (step) {
      case 1: return "Personal Information";
      case 2: return "Provider Profile";
      case 3: return "Service Location";
      case 4: return "Document Upload";
      case 5: return "Email Verification";
      default: return "Provider Profile";
    }
  };

  const handleNextStep = async () => {
    if (step < 5) {
      if (step === 1 && (!formData.fullName || !formData.email || !formData.phone || !formData.dob || !formData.password || formData.password !== formData.confirmPassword || !Object.values(passwordCriteria).every(Boolean))) {
        Alert.alert('Invalid Details', 'Please complete all required fields correctly.');
        return;
      }
      if (step === 2 && (!formData.primaryCategory || !formData.subCategory || !formData.experienceLevel)) return;
      if (step === 3 && (!formData.streetAddress || !formData.city || !formData.province || !formData.zipCode)) return;
      if (step === 4 && (!formData.idType || !formData.idDocument)) return;
      setStep(step + 1);
    } else {
      if (formData.otp.some(d => !d)) return;
      setIsSubmitting(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          options: {
            data: {
              role: 'provider',
              user_type: 'provider',
              full_name: formData.fullName.trim(),
              phone: formData.phone.trim(),
              primary_category: formData.primaryCategory,
              sub_category: formData.subCategory,
              experience_level: formData.experienceLevel,
            },
          },
        });

        if (error) throw error;

        if (data.user?.id) {
          const { error: usersError } = await identityDb.from('users').upsert({
            id: data.user.id,
            email: formData.email.trim().toLowerCase(),
            full_name: formData.fullName.trim(),
            contact_number: formData.phone.trim(),
            role: 'provider',
          });
          if (usersError) throw usersError;
          await persistProviderProfile(data.user.id);
        }

        await persistSignupCategories();

        Alert.alert(
          'Registration Submitted',
          'Your account was created. Check your email to confirm before logging in.',
          [{ text: 'OK', onPress: () => router.replace('/provider-login' as any) }]
        );
      } catch (err: any) {
        Alert.alert('Signup Failed', getErrorMessage(err, 'Unable to create provider account.'));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <AppPressable 
          onPress={() => {
            if (step > 1) setStep(step - 1);
            else if (router.canGoBack?.()) router.back(); else router.replace('/' as any);
          }} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={TOKENS.colors.text.primary} />
        </AppPressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
          <Text style={styles.headerSubtitle}>Step {step} of 5</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressBarContainer}>
        {[1, 2, 3, 4, 5].map((s) => (
          <View 
            key={s} 
            style={[styles.progressBarSegment, s <= step && styles.progressBarActive]} 
          />
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderContent()}
        <View style={styles.footerSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          label={step === 5 ? "Complete Registration" : "Next Step"}
          onPress={handleNextStep}
          isLoading={isSubmitting}
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TOKENS.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TOKENS.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: TOKENS.colors.text.secondary,
    marginTop: 2,
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 4,
    width: '100%',
    backgroundColor: TOKENS.colors.background,
    gap: 4,
  },
  progressBarSegment: {
    flex: 1,
    backgroundColor: TOKENS.colors.background,
  },
  progressBarActive: {
    backgroundColor: TOKENS.colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 40,
  },
  stepContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: TOKENS.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: TOKENS.colors.text.secondary,
    marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: TOKENS.spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: TOKENS.colors.text.primary,
    marginBottom: TOKENS.spacing.sm,
    marginLeft: 4,
  },
  required: {
    color: TOKENS.colors.danger.text,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    backgroundColor: TOKENS.colors.background,
    borderRadius: TOKENS.borderRadius.md,
    alignItems: 'center',
    height: 56,
    paddingHorizontal: TOKENS.spacing.md,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 15,
    color: TOKENS.colors.text.secondary,
    marginRight: 10,
    fontWeight: '600',
  },
  verticalDivider: {
    width: 1.5,
    height: 24,
    backgroundColor: TOKENS.colors.border,
    marginRight: 12,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 15,
    color: TOKENS.colors.text.primary,
    fontWeight: '500',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: TOKENS.colors.background,
    borderRadius: TOKENS.borderRadius.md,
    paddingHorizontal: TOKENS.spacing.md,
    height: 56,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pickerButtonActive: {
    borderColor: TOKENS.colors.primary,
    backgroundColor: TOKENS.colors.white,
  },
  pickerText: {
    fontSize: 15,
    color: TOKENS.colors.text.primary,
    fontWeight: '500',
  },
  dropdownMenu: {
    marginTop: 8,
    backgroundColor: TOKENS.colors.white,
    borderRadius: TOKENS.borderRadius.md,
    borderWidth: 1.5,
    borderColor: TOKENS.colors.border,
    overflow: 'hidden',
    ...TOKENS.shadows.medium,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.colors.border,
  },
  dropdownOptionText: {
    fontSize: 15,
    color: TOKENS.colors.text.primary,
  },
  dropdownOptionTextActive: {
    color: TOKENS.colors.primary,
    fontWeight: '700',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: TOKENS.spacing.sm,
  },
  radiusValue: {
    fontSize: 20,
    fontWeight: '800',
    color: TOKENS.colors.primary,
  },
  radiusUnit: {
    fontSize: 14,
    color: TOKENS.colors.text.secondary,
    fontWeight: '400',
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    marginBottom: 10,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: TOKENS.colors.border,
    borderRadius: 3,
    position: 'relative',
  },
  sliderTrackFilled: {
    height: '100%',
    backgroundColor: TOKENS.colors.primary,
    borderRadius: 3,
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TOKENS.colors.white,
    borderWidth: 2,
    borderColor: TOKENS.colors.primary,
    position: 'absolute',
    top: -9,
    marginLeft: -12,
    ...TOKENS.shadows.soft,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: TOKENS.colors.warning.bg,
    borderRadius: TOKENS.borderRadius.md,
    padding: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: TOKENS.colors.warning.border,
  },
  warningIcon: {
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: TOKENS.colors.warning.text,
    lineHeight: 18,
    fontWeight: '500',
  },
  uploadArea: {
    backgroundColor: TOKENS.colors.white,
    borderRadius: TOKENS.borderRadius.lg,
    borderWidth: 2,
    borderColor: TOKENS.colors.primary,
    borderStyle: 'dashed',
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  uploadIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: TOKENS.colors.success.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TOKENS.colors.text.primary,
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: TOKENS.colors.text.muted,
    marginBottom: 20,
  },
  uploadActions: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.colors.white,
    borderRadius: TOKENS.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: TOKENS.colors.primary,
    marginTop: 10,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: TOKENS.colors.success.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: TOKENS.colors.text.primary,
  },
  fileSize: {
    fontSize: 12,
    color: TOKENS.colors.text.muted,
  },
  removeFileButton: {
    marginLeft: 8,
  },
  criteriaContainer: {
    marginBottom: 25,
    paddingLeft: 4,
  },
  criteriaHeader: {
    fontSize: 13,
    color: TOKENS.colors.text.secondary,
    marginBottom: 12,
    fontWeight: '600',
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: TOKENS.colors.border,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleMet: {
    backgroundColor: TOKENS.colors.primary,
    borderColor: TOKENS.colors.primary,
  },
  criteriaText: {
    fontSize: 14,
    color: TOKENS.colors.text.secondary,
  },
  criteriaTextMet: {
    color: TOKENS.colors.text.primary,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  otpInput: {
    width: 50,
    height: 60,
    backgroundColor: TOKENS.colors.background,
    borderRadius: TOKENS.borderRadius.md,
    borderWidth: 1.5,
    borderColor: TOKENS.colors.border,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: TOKENS.colors.text.primary,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 14,
    color: TOKENS.colors.primary,
  },
  disclaimerBox: {
    backgroundColor: TOKENS.colors.background,
    borderRadius: TOKENS.borderRadius.md,
    padding: 20,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 13,
    color: TOKENS.colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  helperText: {
    fontSize: 12,
    color: TOKENS.colors.text.muted,
    marginTop: 6,
    marginLeft: 4,
  },
  footerSpacer: {
    height: 80,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 25,
    paddingVertical: 20,
    backgroundColor: TOKENS.colors.white,
    borderTopWidth: 1,
    borderTopColor: TOKENS.colors.border,
  },
});
