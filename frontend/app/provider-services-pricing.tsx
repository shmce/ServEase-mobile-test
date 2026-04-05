import React, { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface Service {
  id: string;
  icon: string;
  name: string;
  description: string;
  price: string;
  unit: string;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  unit: string;
}

const ServicePricingCard = ({ icon, name, description, price, unit, onEdit }: any) => (
  <View style={styles.serviceCard}>
    <View style={styles.serviceHeader}>
      <View style={styles.iconBackground}>
        <Ionicons name={icon} size={24} color="#00B761" />
      </View>
    </View>

    <Text style={styles.serviceName}>{name}</Text>
    <Text style={styles.serviceDescription}>{description}</Text>

    <View style={styles.priceRow}>
      <View style={styles.priceContainer}>
        <Text style={styles.priceValue}>P{price}</Text>
        <Text style={styles.priceUnit}> / {unit}</Text>
      </View>

      <TouchableOpacity style={styles.editRateButton} onPress={onEdit}>
        <Ionicons name="pencil" size={14} color="#00B761" style={{ marginRight: 6 }} />
        <Text style={styles.editRateText}>Edit Rate</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const initialServices = [
  {
    id: '1',
    icon: 'brush',
    name: 'Deep Home Clean',
    description: 'Comprehensive top-to-bottom sanitation for residential properties.',
    price: '85',
    unit: 'hr',
  },
  {
    id: '2',
    icon: 'leaf',
    name: 'Garden Maintenance',
    description: 'Seasonal upkeep, lawn care, and landscape refinement.',
    price: '65',
    unit: 'hr',
  },
  {
    id: '3',
    icon: 'construct',
    name: 'Emergency Plumbing',
    description: '24/7 priority response for urgent mechanical and pipe repairs.',
    price: '120',
    unit: 'hr',
  },
];

export default function ProviderServicesPricingScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Hourly Rates');
  const [services, setServices] = useState<Service[]>(initialServices);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    unit: 'hr',
  });

  const openModal = (service: Service | null = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price,
        unit: service.unit,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        unit: 'hr',
      });
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.price) return;

    if (editingService) {
      setServices(services.map((service) => (service.id === editingService.id ? { ...service, ...formData } : service)));
    } else {
      setServices([
        ...services,
        {
          id: Date.now().toString(),
          icon: 'options-outline',
          ...formData,
        },
      ]);
    }

    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Services & Pricing</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.subtitle}>SERVICE SETUP</Text>
          <Text style={styles.title}>Manage Service Rates</Text>
          <Text style={styles.description}>
            Update the services you offer and adjust your rates without leaving the settings flow.
          </Text>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'Hourly Rates' && styles.activeTab]}
              onPress={() => setActiveTab('Hourly Rates')}
            >
              <Text style={[styles.tabText, activeTab === 'Hourly Rates' && styles.activeTabText]}>Hourly Rates</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'Flat Rates' && styles.activeTab]}
              onPress={() => setActiveTab('Flat Rates')}
            >
              <Text style={[styles.tabText, activeTab === 'Flat Rates' && styles.activeTabText]}>Flat Rates</Text>
            </TouchableOpacity>
          </View>

          {services.map((service) => (
            <ServicePricingCard key={service.id} {...service} onEdit={() => openModal(service)} />
          ))}

          <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={24} color="#FFF" />
            </View>
            <Text style={styles.addButtonText}>Add New Service Offering</Text>
          </TouchableOpacity>

          <View style={styles.infoNote}>
            <View style={styles.infoDot} />
            <Text style={styles.infoText}>Updates will apply to new bookings after you save changes.</Text>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={() => router.back()}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.footerSpacer} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingService ? 'Edit Service Rate' : 'Add New Service'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>Service Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g. Premium House Cleaning"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Describe the service..."
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Rate</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                placeholder="e.g. 120"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Billing Unit</Text>
              <View style={styles.unitRow}>
                {['hr', 'service', 'day'].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[styles.unitChip, formData.unit === unit && styles.unitChipActive]}
                    onPress={() => setFormData({ ...formData, unit })}
                  >
                    <Text style={[styles.unitChipText, formData.unit === unit && styles.unitChipTextActive]}>{unit}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.modalSaveButton} onPress={handleSave}>
                <Text style={styles.modalSaveButtonText}>Save Service</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginLeft: 8,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#00B761',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0D1B2A',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#64748B',
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F7',
    borderRadius: 999,
    padding: 6,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#00B761',
  },
  serviceCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  serviceHeader: {
    marginBottom: 18,
  },
  iconBackground: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#E8FBF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0D1B2A',
    marginBottom: 10,
  },
  serviceDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#64748B',
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0D1B2A',
  },
  priceUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 4,
    marginBottom: 5,
  },
  editRateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  editRateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00B761',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: '#0D1B2A',
    borderRadius: 18,
    marginTop: 4,
  },
  addIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  infoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00B761',
    marginTop: 6,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
  },
  saveButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#00B761',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  footerSpacer: {
    height: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    width,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  modalForm: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0D1B2A',
    marginBottom: 16,
  },
  textArea: {
    height: 110,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  unitRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  unitChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  unitChipActive: {
    backgroundColor: '#E8FBF2',
  },
  unitChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  unitChipTextActive: {
    color: '#00B761',
  },
  modalSaveButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#00B761',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
