import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const [isAgreed, setIsAgreed] = useState(false);

  const handleAction = (route: string) => {
    if (!isAgreed) {
      Alert.alert(
        "Agreement Required",
        "Please read and agree to the Terms & Conditions and Privacy Policy to proceed.",
        [{ text: "OK" }]
      );
      return;
    }
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Decorative Background Assets */}
      <Image
        source={require('../assets/images/pliers.png')}
        style={[styles.toolImage, styles.pliers]}
        resizeMode="contain"
      />
      <Image
        source={require('../assets/images/paintbrush.png')}
        style={[styles.toolImage, styles.paintbrush]}
        resizeMode="contain"
      />
      
      <View style={styles.content}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>
          Finding and connecting with trusted local professionals around you.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.signUpButton,
              isAgreed ? styles.signUpButtonActive : styles.signUpButtonInactive,
            ]}
            onPress={() => handleAction('/signup')}
            activeOpacity={0.7}
          >
            <Text style={[styles.signUpText, isAgreed && styles.signUpTextActive]}>Sign up to ServEase</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginButton, !isAgreed && styles.loginButtonDisabled]}
            onPress={() => handleAction('/login')}
            activeOpacity={0.7}
          >
            <Text style={[styles.loginText, !isAgreed && styles.loginTextDisabled]}>Log In</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.termsContainer}>
          <TouchableOpacity 
            style={[styles.checkbox, isAgreed && styles.checkboxActive]} 
            onPress={() => setIsAgreed(!isAgreed)}
            activeOpacity={0.8}
          >
            {isAgreed && <Ionicons name="checkmark" size={14} color="#00B761" />}
          </TouchableOpacity>
          <Text style={styles.termsText}>
            I have read and agree to the{' '}
            <Text 
              style={styles.link} 
              onPress={() => router.push('/terms')}
            >
              Terms & Conditions
            </Text> and{' '}
            <Text 
              style={styles.link}
              onPress={() => router.push('/privacy')}
            >
              Privacy Policy
            </Text>.
          </Text>
        </View>
      </View>

      {/* Bottom Decorative Assets */}
      <Image
        source={require('../assets/images/broom.png')}
        style={[styles.toolImage, styles.broom]}
        resizeMode="contain"
      />
      <Image
        source={require('../assets/images/plumbing_tools.png')}
        style={[styles.toolImage, styles.plumbing]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00B761', // Vibrant Green
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  content: {
    width: '85%',
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    width: width * 0.7,
    height: 100,
    marginBottom: 15,
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 40,
    lineHeight: 24,
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
    marginBottom: 35,
  },
  signUpButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
  },
  signUpButtonInactive: {
      borderColor: '#8EE0AD',
  },
  signUpButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  signUpText: {
    color: '#AEE6C1',
    fontSize: 18,
    fontWeight: '600',
  },
  signUpTextActive: {
    color: '#00B761',
    fontWeight: '700',
  },
  loginButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  loginButtonDisabled: {
    borderColor: '#8EE0AD',
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loginTextDisabled: {
    color: '#AEE6C1',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  checkboxActive: {
    backgroundColor: '#FFFFFF',
  },
  termsText: {
    color: '#FFFFFF',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
    opacity: 0.9,
  },
  link: {
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  toolImage: {
    position: 'absolute',
    opacity: 0.9,
  },
  pliers: {
    top: -18,
    left: -78,
    width: 205,
    height: 205,
    transform: [{ rotate: '180deg' }],
  },
  paintbrush: {
    top: -26,
    right: -62,
    width: 228,
    height: 228,
    transform: [{ rotate: '-8deg' }],
  },
  broom: {
    bottom: -60,
    left: -85,
    width: 248,
    height: 248,
    transform: [{ rotate: '180deg' }],
  },
  plumbing: {
    bottom: -40,
    right: -80,
    width: 250,
    height: 200,
    transform: [{ rotate: '-3deg' }],
  },
});
