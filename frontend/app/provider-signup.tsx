import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Dimensions,
  Keyboard,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { DatePickerModal } from '@/components/DatePickerModal';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function ProviderSignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);  // ✅ Added for signup loading state
  
  // Dropdown states
  const [showPrimaryDropdown, setShowPrimaryDropdown] = useState(false);
  const [showSubDropdown, setShowSubDropdown] = useState(false);
  const [showExpDropdown, setShowExpDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    password: '',
    confirmPassword: '',
    // Step 2
    primaryCategory: '',
    subCategory: '',
    experienceLevel: '',
    // Step 3
    streetAddress: '',
    city: '',
    province: '',
    zipCode: '',
    radius: 10,
    // Step 4
    idType: '',
    idDocument: null as string | null, // Mocking filename as "image_2026-03-17_062955..."
    // Step 5
    otp: ['', '', '', '', '', ''],
  });

  const [timeLeft, setTimeLeft] = useState(295); // 4:55 in seconds

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

  const subCategories = {
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

  const [showIdDropdown, setShowIdDropdown] = useState(false);

  useEffect(() => {
    const { password } = formData;
    setPasswordCriteria({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    });
  }, [formData.password]);

  const CheckItem = ({ label, met }: { label: string; met: boolean }) => (
    <View style={styles.criteriaItem}>
      <View style={[styles.checkCircle, met && styles.checkCircleMet]}>
        {met && <Ionicons name="checkmark" size={12} color="#FFF" />}
      </View>
      <Text style={[styles.criteriaText, met && styles.criteriaTextMet]}>{label}</Text>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.content}>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Fill in your personal details to get started.</Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#CCC"
            value={formData.fullName}
            onChangeText={(text) => setFormData({...formData, fullName: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email address"
            placeholderTextColor="#CCC"
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.helperText}>Required for account creation</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact Number <Text style={styles.required}>*</Text></Text>
          <View style={styles.phoneInputContainer}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+63</Text>
              <View style={styles.verticalDivider} />
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="9XX XXX XXXX"
              placeholderTextColor="#CCC"
              value={formData.phone}
              onChangeText={(text) => {
                const digitsOnly = text.replace(/\D/g, '');
                let nextPhone = digitsOnly;
                if (digitsOnly.length > 0 && digitsOnly[0] !== '9') {
                  nextPhone = '9' + digitsOnly.slice(0, 9);
                }
                setFormData({ ...formData, phone: nextPhone.slice(0, 10) });
              }}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          <Text style={styles.helperText}>Philippine mobile number (e.g. 9171234567)</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity 
            style={styles.dobContainer}
            onPress={() => {
              Keyboard.dismiss();
              setShowDatePicker(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.dobInputText, !formData.dob && { color: '#CCC' }]}>
              {formData.dob || "MM/DD/YYYY"}
            </Text>
            <Ionicons name="calendar-outline" size={22} color="#777" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Create a password"
              placeholderTextColor="#CCC"
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#777" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.criteriaContainer}>
          <Text style={styles.criteriaHeader}>Password must contain:</Text>
          <CheckItem label="At least 8 characters" met={passwordCriteria.length} />
          <CheckItem label="One uppercase letter (A-Z)" met={passwordCriteria.uppercase} />
          <CheckItem label="One lowercase letter (a-z)" met={passwordCriteria.lowercase} />
          <CheckItem label="One number (0-9)" met={passwordCriteria.number} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password <Text style={styles.required}>*</Text></Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm your password"
              placeholderTextColor="#CCC"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
              <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#777" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.content}>
      <Text style={styles.title}>Your Service Profile</Text>
      <Text style={styles.subtitle}>
        Tell us what type of service you offer and your experience level. You can complete your full profile after approval.
      </Text>

      <View style={styles.form}>
        {/* Primary Category Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Primary Category <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity 
            style={[styles.pickerButton, showPrimaryDropdown && styles.pickerButtonActive]}
            onPress={() => setShowPrimaryDropdown(!showPrimaryDropdown)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pickerText, !formData.primaryCategory && { color: '#CCC' }]}>
              {formData.primaryCategory || "Select your service category"}
            </Text>
            <Ionicons name={showPrimaryDropdown ? "chevron-up" : "chevron-down"} size={20} color="#777" />
          </TouchableOpacity>
          
          {showPrimaryDropdown && (
            <View style={styles.dropdownMenu}>
              <ScrollView nestedScrollEnabled style={{ maxHeight: 250 }}>
                {categories.map((cat, index) => (
                  <TouchableOpacity 
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
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Sub-category Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sub-category <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity 
            style={[styles.pickerButton, showSubDropdown && styles.pickerButtonActive]}
            onPress={() => setShowSubDropdown(!showSubDropdown)}
            activeOpacity={0.7}
            disabled={!formData.primaryCategory}
          >
            <Text style={[styles.pickerText, !formData.subCategory && { color: '#CCC' }]}>
              {formData.subCategory || "Select a sub-category"}
            </Text>
            <Ionicons name={showSubDropdown ? "chevron-up" : "chevron-down"} size={20} color="#777" />
          </TouchableOpacity>

          {showSubDropdown && formData.primaryCategory && subCategories[formData.primaryCategory as keyof typeof subCategories] && (
            <View style={styles.dropdownMenu}>
              {subCategories[formData.primaryCategory as keyof typeof subCategories].map((sub, index) => (
                <TouchableOpacity 
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
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Experience Level Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Experience Level <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity 
            style={[styles.pickerButton, showExpDropdown && styles.pickerButtonActive]}
            onPress={() => setShowExpDropdown(!showExpDropdown)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pickerText, !formData.experienceLevel && { color: '#CCC' }]}>
              {formData.experienceLevel || "Select years of experience"}
            </Text>
            <Ionicons name={showExpDropdown ? "chevron-up" : "chevron-down"} size={20} color="#777" />
          </TouchableOpacity>

          {showExpDropdown && (
            <View style={styles.dropdownMenu}>
              {expLevels.map((lvl, index) => (
                <TouchableOpacity 
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
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.content}>
      <Text style={styles.title}>Where do you work?</Text>
      <Text style={styles.subtitle}>
        Set your service area so customers can find you.
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Street Address / Landmark <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 123 Rizal St, near SM"
            placeholderTextColor="#CCC"
            value={formData.streetAddress}
            onChangeText={(text) => setFormData({...formData, streetAddress: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>City <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Search your city"
            placeholderTextColor="#CCC"
            value={formData.city}
            onChangeText={(text) => setFormData({...formData, city: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Province <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Search your province"
            placeholderTextColor="#CCC"
            value={formData.province}
            onChangeText={(text) => setFormData({...formData, province: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>ZIP Code <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1000"
            placeholderTextColor="#CCC"
            value={formData.zipCode}
            onChangeText={(text) => setFormData({...formData, zipCode: text})}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Maximum Service Radius <Text style={styles.required}>*</Text></Text>
            <Text style={styles.radiusValue}>{formData.radius} <Text style={styles.radiusUnit}>km</Text></Text>
          </View>
          
          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderTrackFilled, { width: `${(formData.radius / 50) * 100}%` }]} />
              <View 
                style={[styles.sliderThumb, { left: `${(formData.radius / 50) * 100}%` }]} 
                {...{
                  // Simple mock for slider movement
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
    <View style={styles.content}>
      <Text style={styles.title}>Verify your identity</Text>
      <Text style={styles.subtitle}>Upload a valid Philippine government-issued ID.</Text>

      <View style={styles.form}>
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={20} color="#D4A017" style={styles.warningIcon} />
          <Text style={styles.warningText}>
            Please ensure your ID is clear, valid, and all details are visible.
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select ID Type <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity 
            style={[styles.pickerButton, showIdDropdown && styles.pickerButtonActive]}
            onPress={() => setShowIdDropdown(!showIdDropdown)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pickerText, !formData.idType && { color: '#CCC' }]}>
              {formData.idType || "Choose your ID type"}
            </Text>
            <Ionicons name={showIdDropdown ? "chevron-up" : "chevron-down"} size={20} color="#777" />
          </TouchableOpacity>

          {showIdDropdown && (
            <View style={styles.dropdownMenu}>
              {idTypes.map((type, index) => (
                <TouchableOpacity 
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
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Upload your selected ID <Text style={styles.required}>*</Text></Text>
          {formData.idDocument ? (
            <View style={styles.uploadedFileContainer}>
              <View style={styles.fileIconContainer}>
                <Ionicons name="document-text" size={24} color="#00B761" />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{formData.idDocument}</Text>
                <Text style={styles.fileSize}>0.02 MB</Text>
              </View>
              <TouchableOpacity 
                style={styles.removeFileButton}
                onPress={() => setFormData({...formData, idDocument: null})}
              >
                <Ionicons name="close-circle" size={24} color="#FF6F61" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadArea}>
              <View style={styles.uploadIconContainer}>
                <Ionicons name="cloud-upload-outline" size={40} color="#00B761" />
              </View>
              <Text style={styles.uploadTitle}>Upload your selected ID</Text>
              <Text style={styles.uploadSubtitle}>PNG, JPG or PDF • Max 5MB</Text>
              
              <View style={styles.uploadActions}>
                <TouchableOpacity 
                  style={styles.browseButton}
                  onPress={() => setFormData({...formData, idDocument: "image_2026-03-17_062955.png"})}
                >
                  <Ionicons name="document-text-outline" size={18} color="#00B761" style={{ marginRight: 6 }} />
                  <Text style={styles.browseButtonText}>Browse</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.scanButton}
                  onPress={() => setFormData({...formData, idDocument: "scanned_id_001.jpg"})}
                >
                  <Ionicons name="camera-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.scanButtonText}>Scan</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.content}>
      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.subtitle}>
        We sent a 6-digit code to <Text style={{ fontWeight: '700' }}>user@example.com</Text>. Enter it below to complete your registration.
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
          <Text style={styles.timerText}>Code expires in <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text></Text>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (step > 1) setStep(step - 1);
            else router.back();
          }} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderContent()}
        <View style={styles.footerSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.nextButton, 
            (step === 1 && (!formData.fullName || !formData.email || !formData.phone || !formData.dob || !formData.password)) || 
            (step === 2 && (!formData.primaryCategory || !formData.subCategory || !formData.experienceLevel)) ||
            (step === 3 && (!formData.streetAddress || !formData.city || !formData.province || !formData.zipCode)) ||
            (step === 4 && (!formData.idType || !formData.idDocument)) ||
            (step === 5 && formData.otp.some(d => !d))
              ? styles.nextButtonDisabled 
              : null
          ]}
          onPress={async () => {
            if (step < 5) {
              // Basic validation before moving to next step
              if (step === 1) {
                // Validate passwords match on step 1
                if (formData.password !== formData.confirmPassword) {
                  Alert.alert('Password Mismatch', 'Passwords must match');
                  return;
                }
                if (!formData.fullName || !formData.email || !formData.phone || !formData.dob || !formData.password) return;
              }
              if (step === 2 && (!formData.primaryCategory || !formData.subCategory || !formData.experienceLevel)) return;
              if (step === 3 && (!formData.streetAddress || !formData.city || !formData.province || !formData.zipCode)) return;
              if (step === 4 && (!formData.idType || !formData.idDocument)) return;
              setStep(step + 1);
            } else {
              // ✅ Complete registration with supabase.auth.signUp
              // The trigger will automatically create user_profiles entry
              
              // Final password validation
              if (formData.password !== formData.confirmPassword) {
                Alert.alert('Password Mismatch', 'Passwords must match');
                return;
              }
              
              setIsLoading(true);
              try {
                const { data, error } = await supabase.auth.signUp({
                  email: formData.email.trim().toLowerCase(),
                  password: formData.password,
                  options: {
                    data: {
                      full_name: formData.fullName,
                      phone: formData.phone,
                      dob: formData.dob,
                      user_type: 'provider',  // ✅ Trigger uses this to auto-create user_profiles
                      // Store additional provider info for later use
                      primary_category: formData.primaryCategory,
                      sub_category: formData.subCategory,
                      experience_level: formData.experienceLevel,
                      street_address: formData.streetAddress,
                      city: formData.city,
                      province: formData.province,
                      zip_code: formData.zipCode,
                    }
                  }
                });

                if (error) {
                  Alert.alert('Signup Failed', error.message);
                } else {
                  // User created and profile auto-generated!
                  Alert.alert('Success', 'Account created! Your profile is ready. Please log in to continue.');
                  router.replace('/login' as any);
                }
              } catch (err: any) {
                Alert.alert('Error', err.message || 'An unexpected error occurred. Please try again.');
              } finally {
                setIsLoading(false);
              }
            }
          }}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.nextButtonText}>
              {step === 5 ? "Complete Registration" : "Next Step"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <DatePickerModal 
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onConfirm={(date) => setFormData({ ...formData, dob: date })}
        initialDate={formData.dob}
        title="Select Date of Birth"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
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
    color: '#0D1B2A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 4,
    width: '100%',
    backgroundColor: '#F0F0F0',
    gap: 4,
  },
  progressBarSegment: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  progressBarActive: {
    backgroundColor: '#00B761',
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
    marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
    zIndex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  radiusValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00B761',
  },
  radiusUnit: {
    fontSize: 14,
    color: '#777',
    fontWeight: '400',
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    marginBottom: 10,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    position: 'relative',
  },
  sliderTrackFilled: {
    height: '100%',
    backgroundColor: '#00B761',
    borderRadius: 3,
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#00B761',
    position: 'absolute',
    top: -9,
    marginLeft: -12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 10,
  },
  required: {
    color: '#FF4D4D',
  },
  input: {
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0D1B2A',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pickerButtonActive: {
    borderColor: '#00B761',
    backgroundColor: '#FFF',
  },
  pickerText: {
    fontSize: 15,
    color: '#0D1B2A',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#FFEBB3',
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  uploadArea: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#00B761',
    borderStyle: 'dashed',
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8FBF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: '#777',
    marginBottom: 20,
  },
  uploadActions: {
    flexDirection: 'row',
    gap: 12,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#00B761',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  browseButtonText: {
    color: '#00B761',
    fontSize: 14,
    fontWeight: '700',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B761',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  uploadedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#00B761',
    marginTop: 10,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E8FBF2',
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
    color: '#0D1B2A',
  },
  fileSize: {
    fontSize: 12,
    color: '#777',
  },
  removeFileButton: {
    marginLeft: 8,
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
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 14,
    color: '#00B761',
    fontWeight: '500',
  },
  timerValue: {
    fontWeight: '700',
  },
  disclaimerBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    lineHeight: 18,
  },
  dropdownMenu: {
    marginTop: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F7F7',
  },
  dropdownOptionText: {
    fontSize: 15,
    color: '#0D1B2A',
  },
  dropdownOptionTextActive: {
    color: '#00B761',
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 6,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    alignItems: 'center',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  countryCodeText: {
    fontSize: 15,
    color: '#777',
    marginRight: 10,
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#DDD',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0D1B2A',
  },
  dobContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    height: 55,
    paddingHorizontal: 16,
  },
  dobInputText: {
    flex: 1,
    fontSize: 15,
    color: '#0D1B2A',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0D1B2A',
  },
  eyeIcon: {
    padding: 12,
  },
  criteriaContainer: {
    marginBottom: 25,
  },
  criteriaHeader: {
    fontSize: 13,
    color: '#777',
    marginBottom: 12,
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
    borderWidth: 1.5,
    borderColor: '#DDD',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleMet: {
    backgroundColor: '#00B761',
    borderColor: '#00B761',
  },
  criteriaText: {
    fontSize: 14,
    color: '#777',
  },
  criteriaTextMet: {
    color: '#0D1B2A',
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
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  nextButton: {
    backgroundColor: '#00B761',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#A5E6BA',
    opacity: 0.8,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
