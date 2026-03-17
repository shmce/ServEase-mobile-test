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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function CustomerSignupScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

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

  const CheckItem = ({ label, met }: { label: string; met: boolean }) => (
    <View style={styles.criteriaItem}>
      <View style={[styles.checkCircle, met && styles.checkCircleMet]}>
        {met && <Ionicons name="checkmark" size={12} color="#FFF" />}
      </View>
      <Text style={[styles.criteriaText, met && styles.criteriaTextMet]}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Customer Registration</Text>
          <Text style={styles.headerSubtitle}>Step 1 of 2</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarActive} />
        <View style={styles.progressBarInactive} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Fill in your details to get started</Text>

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
                onChangeText={(text) => setFormData({...formData, phone: text})}
                keyboardType="phone-pad"
              />
            </View>
            <Text style={styles.helperText}>Philippine mobile number (e.g. 9171234567)</Text>
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

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
              <Ionicons name="logo-google" size={20} color="#000" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
              <Ionicons name="call-outline" size={20} color="#000" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Continue with Phone Number</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => router.push('/customer-login' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next Step</Text>
        </TouchableOpacity>
      </View>
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
  },
  progressBarActive: {
    flex: 1,
    backgroundColor: '#00B761',
  },
  progressBarInactive: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 100,
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
  helperText: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 6,
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  dividerText: {
    paddingHorizontal: 15,
    color: '#777',
    fontSize: 13,
  },
  socialButtons: {
    gap: 15,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 14,
  },
  socialIcon: {
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0D1B2A',
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
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
