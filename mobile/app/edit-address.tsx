import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  TextInput,
  Alert,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const LABELS = ['Home', 'Office', 'Other'];

export default function EditAddressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Form State
  const [street, setStreet] = useState('');
  const [barangay, setBarangay] = useState('');
  const [city, setCity] = useState('');
  const [label, setLabel] = useState('');
  const [addressId, setAddressId] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  // Modal State
  const [isLabelModalVisible, setLabelModalVisible] = useState(false);

  useEffect(() => {
    if (params.address) {
      try {
        const parsed = JSON.parse(params.address as string);
        setAddressId(parsed.id);
        setStreet(parsed.street || '');
        setBarangay(parsed.barangay || '');
        setCity(parsed.city || '');
        setLabel(parsed.type);
        setIsDefault(parsed.isDefault);
      } catch (e) {
        console.error('Failed to parse address params', e);
      }
    }
  }, [params.address]);

  const handleSaveAddress = async () => {
    if (!street || !barangay || !city || !label) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    if (!user) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('user_addresses')
        .update({
          label: label,
          street: street,
          barangay: barangay,
          city: city,
          is_default: isDefault
        })
        .eq('id', addressId);

      if (error) throw error;

      const updatedAddress = {
        id: addressId,
        type: label,
        street,
        barangay,
        city,
        isDefault
      };

      router.push({
        pathname: '/manage-addresses',
        params: { updatedAddress: JSON.stringify(updatedAddress) }
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update address.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = () => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const { error } = await supabase
                .from('user_addresses')
                .delete()
                .eq('id', addressId);

              if (error) throw error;

              router.push({
                pathname: '/manage-addresses',
                params: { deletedAddressId: addressId }
              });
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete address.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const SelectionModal = ({ 
    visible, 
    title, 
    data, 
    onClose, 
    renderItem 
  }: any) => (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#0D1B2A" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {data.map((item: any, index: number) => renderItem(item, index))}
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Address</Text>
        <TouchableOpacity onPress={handleDeleteAddress} style={styles.deleteButtonHeader}>
           <Ionicons name="trash-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Street */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Street / Building No. <Text style={styles.requiredAsterisk}>*</Text></Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 123 Mabini Street"
              placeholderTextColor="#8E8E93"
              value={street}
              onChangeText={setStreet}
            />
          </View>

          {/* Barangay */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Barangay <Text style={styles.requiredAsterisk}>*</Text></Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. San Jose"
              placeholderTextColor="#8E8E93"
              value={barangay}
              onChangeText={setBarangay}
            />
          </View>

          {/* City */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>City / Province <Text style={styles.requiredAsterisk}>*</Text></Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Quezon City"
              placeholderTextColor="#8E8E93"
              value={city}
              onChangeText={setCity}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Label <Text style={styles.requiredAsterisk}>*</Text></Text>
             <TouchableOpacity 
              style={styles.dropdownButton} 
              onPress={() => setLabelModalVisible(true)}
            >
              <Text style={[styles.dropdownText, !label && styles.placeholderText]}>
                {label || 'Select a label'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && { opacity: 0.7 }]} 
          onPress={handleSaveAddress}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>

      <SelectionModal
        visible={isLabelModalVisible}
        title="Select Label"
        data={LABELS}
        onClose={() => setLabelModalVisible(false)}
        renderItem={(item: string, index: number) => (
          <TouchableOpacity 
            key={index} 
            style={[styles.modalOption, label === item && styles.modalOptionSelected]}
            onPress={() => { setLabel(item); setLabelModalVisible(false); }}
          >
            <Text style={[styles.modalOptionText, label === item && styles.modalOptionTextSelected]}>{item}</Text>
            {label === item && <Ionicons name="checkmark-circle" size={24} color="#00B761" />}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0D1B2A', flex: 1, marginLeft: 8 },
  deleteButtonHeader: { padding: 8 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 20 },
  fieldContainer: { marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#0D1B2A', marginBottom: 8 },
  requiredAsterisk: { color: '#FF5252' },
  textInput: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12,
    paddingHorizontal: 16, height: 52, fontSize: 15, color: '#0D1B2A',
  },
  dropdownButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12,
    paddingHorizontal: 16, height: 52,
  },
  dropdownText: { fontSize: 15, color: '#0D1B2A' },
  placeholderText: { color: '#8E8E93' },
  bottomContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, borderTopWidth: 1,
    borderTopColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 10,
  },
  saveButton: {
    backgroundColor: '#00B761', borderRadius: 12, height: 52,
    justifyContent: 'center', alignItems: 'center', shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
    elevation: 4, width: '100%',
  },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0D1B2A' },
  modalCloseButton: { padding: 4 },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F8F9FA',
  },
  modalOptionSelected: { backgroundColor: '#F8FBF9', borderRadius: 12, paddingHorizontal: 12 },
  modalOptionText: { fontSize: 16, color: '#0D1B2A' },
  modalOptionTextSelected: { fontWeight: '700', color: '#00B761' },
});
