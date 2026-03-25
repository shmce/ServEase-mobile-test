import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, TextInput, Image, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const Chip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <View style={styles.chip}>
    <Text style={styles.chipText}>{label}</Text>
    <TouchableOpacity onPress={onRemove} style={styles.chipRemove}>
      <Ionicons name="close" size={14} color="#00B761" />
    </TouchableOpacity>
  </View>
);

const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const CredentialItem = ({ title, subtitle, date, onEdit, onDelete }: any) => (
  <View style={styles.credentialCard}>
    <View style={styles.credentialInfo}>
      <Text style={styles.credentialTitle}>{title}</Text>
      <Text style={styles.credentialSubtitle}>{subtitle}</Text>
      <Text style={styles.credentialDate}>{date}</Text>
    </View>
    <View style={styles.credentialActions}>
      <TouchableOpacity onPress={onEdit} style={styles.credentialActionButton}>
        <Ionicons name="pencil-outline" size={18} color="#8E8E93" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={[styles.credentialActionButton, styles.credentialDeleteButton]}>
        <Ionicons name="trash-outline" size={18} color="#FF6F61" />
      </TouchableOpacity>
    </View>
  </View>
);

export default function ProviderEditProfileScreen() {
  const router = useRouter();
  
  // State for form fields
  const [businessName, setBusinessName] = useState("Juan's Home Services");
  const [bio, setBio] = useState("Professional home service provider with extensive experience in repairs, maintenance, and improvements. Committed to quality workmanship and customer satisfaction.");
  
  const [categories, setCategories] = useState(['Plumbing', 'Electrical', 'Carpentry']);
  const [areas, setAreas] = useState(['Makati City', 'Quezon City', 'Pasig City']);
  const [languages, setLanguages] = useState(['English', 'Tagalog']);
  
  const [experience, setExperience] = useState('5-10 years');
  
  const [facebook, setFacebook] = useState('facebook.com/juanservices');
  const [instagram, setInstagram] = useState('@juanservices');
  const [website, setWebsite] = useState('www.juanservices.com');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))}>
          <Text style={[styles.headerButtonText, styles.saveButtonText]}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Profile Images Section */}
          <View style={styles.imageSection}>
            <View style={styles.coverImageContainer}>
              <View style={styles.coverPlaceholder} />
              <TouchableOpacity style={styles.changeCoverButton}>
                <Ionicons name="camera-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.changeCoverText}>Change Cover</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileImageWrapper}>
              <View style={styles.profileImageContainer}>
                <Text style={styles.profileInitials}>JD</Text>
                <TouchableOpacity style={styles.profileCameraIcon}>
                  <Ionicons name="camera" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.changeProfileTextButton}>
                <Text style={styles.changeProfileText}>Change Profile Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formContent}>
            {/* Basic Information */}
            <SectionHeader title="Basic Information" />
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Enter business name"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio/Description</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={4}
                  value={bio}
                  onChangeText={setBio}
                  maxLength={500}
                />
                <Text style={styles.charCount}>{bio.length}/500</Text>
              </View>
            </View>

            {/* Skills & Location */}
            <SectionHeader title="Skills & Location" />
            
            <View style={styles.tagSection}>
              <Text style={styles.tagLabel}>Service Categories</Text>
              <View style={styles.chipContainer}>
                {categories.map(cat => (
                  <Chip key={cat} label={cat} onRemove={() => setCategories(categories.filter(c => c !== cat))} />
                ))}
              </View>
              <TouchableOpacity style={styles.addTagButton}>
                <Ionicons name="add" size={18} color="#00B761" />
                <Text style={styles.addTagText}>Add Category</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tagSection}>
              <Text style={styles.tagLabel}>Service Areas</Text>
              <View style={styles.chipContainer}>
                {areas.map(area => (
                  <Chip key={area} label={area} onRemove={() => setAreas(areas.filter(a => a !== area))} />
                ))}
              </View>
              <TouchableOpacity style={styles.addTagButton}>
                <Ionicons name="add" size={18} color="#00B761" />
                <Text style={styles.addTagText}>Add Service Area</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tagSection}>
              <Text style={styles.tagLabel}>Languages Spoken</Text>
              <View style={styles.chipContainer}>
                {languages.map(lang => (
                  <Chip key={lang} label={lang} onRemove={() => setLanguages(languages.filter(l => l !== lang))} />
                ))}
              </View>
              <TouchableOpacity style={styles.addTagButton}>
                <Ionicons name="add" size={18} color="#00B761" />
                <Text style={styles.addTagText}>Add Language</Text>
              </TouchableOpacity>
            </View>

            {/* Professional Credentials */}
            <SectionHeader title="Professional Credentials" />
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Years of Experience</Text>
              <TouchableOpacity style={styles.pickerButton}>
                <Text style={styles.pickerText}>{experience}</Text>
                <Ionicons name="chevron-down" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.tagLabel}>Professional Licenses</Text>
              <TouchableOpacity style={styles.addSmallButton}>
                <Ionicons name="add" size={16} color="#00B761" />
                <Text style={styles.addSmallText}>Add</Text>
              </TouchableOpacity>
            </View>
            <CredentialItem 
              title="Electrical License" 
              subtitle="License #: EL-2021-12345" 
              date="Expires: 2026-12-31" 
            />
            <CredentialItem 
              title="Plumbing License" 
              subtitle="License #: PL-2020-67890" 
              date="Expires: 2025-08-15" 
            />

            <View style={[styles.listHeader, { marginTop: 12 }]}>
              <Text style={styles.tagLabel}>Certifications</Text>
              <TouchableOpacity style={styles.addSmallButton}>
                <Ionicons name="add" size={16} color="#00B761" />
                <Text style={styles.addSmallText}>Add</Text>
              </TouchableOpacity>
            </View>
            <CredentialItem 
              title="HVAC Certification" 
              subtitle="Year: 2022" 
            />
            <CredentialItem 
              title="Safety Training Certificate" 
              subtitle="Year: 2023" 
            />

            {/* Social Media & Links */}
            <SectionHeader title="Social Media & Links" />
            
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="logo-facebook" size={18} color="#1877F2" />
                <Text style={[styles.label, { marginLeft: 8, marginBottom: 0 }]}>Facebook</Text>
              </View>
              <TextInput
                style={styles.input}
                value={facebook}
                onChangeText={setFacebook}
                placeholder="facebook.com/yourbusiness"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="logo-instagram" size={18} color="#E4405F" />
                <Text style={[styles.label, { marginLeft: 8, marginBottom: 0 }]}>Instagram</Text>
              </View>
              <TextInput
                style={styles.input}
                value={instagram}
                onChangeText={setInstagram}
                placeholder="@yourbusiness"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="globe-outline" size={18} color="#555" />
                <Text style={[styles.label, { marginLeft: 8, marginBottom: 0 }]}>Website</Text>
              </View>
              <TextInput
                style={styles.input}
                value={website}
                onChangeText={setWebsite}
                placeholder="www.yourbusiness.com"
              />
            </View>

            <View style={styles.footerSpacer} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  headerButtonText: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  saveButtonText: {
    color: '#00B761',
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  imageSection: {
    marginBottom: 20,
  },
  coverImageContainer: {
    height: 140,
    backgroundColor: '#00703C', // Dark green matching mockup
    position: 'relative',
  },
  coverPlaceholder: {
    flex: 1,
  },
  changeCoverButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeCoverText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  profileImageWrapper: {
    alignItems: 'center',
    marginTop: -55,
  },
  profileImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#00B761',
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  profileInitials: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
  },
  profileCameraIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#00703C',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  changeProfileTextButton: {
    marginTop: 12,
  },
  changeProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B761',
  },
  formContent: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginTop: 30,
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  required: {
    color: '#FF6F61',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: '#0D1B2A',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  textAreaContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  textArea: {
    fontSize: 15,
    color: '#0D1B2A',
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
  },
  tagSection: {
    marginBottom: 24,
  },
  tagLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FBF2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 14,
    color: '#00703C',
    fontWeight: '500',
  },
  chipRemove: {
    marginLeft: 8,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B761',
    marginLeft: 4,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  pickerText: {
    fontSize: 15,
    color: '#0D1B2A',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addSmallButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addSmallText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00B761',
    marginLeft: 2,
  },
  credentialCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  credentialInfo: {
    flex: 1,
  },
  credentialTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  credentialSubtitle: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  credentialDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  credentialActions: {
    flexDirection: 'row',
    gap: 8,
  },
  credentialActionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  credentialDeleteButton: {
    backgroundColor: '#FFF1F0',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  footerSpacer: {
    height: 60,
  },
});

