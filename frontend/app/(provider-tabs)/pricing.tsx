import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  StatusBar, 
  Dimensions, 
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView
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
        <Text style={styles.priceValue}>₱{price}</Text>
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
    unit: 'hr'
  },
  {
    id: '2',
    icon: 'leaf',
    name: 'Garden Maintenance',
    description: 'Seasonal upkeep, lawn care, and landscape refinement.',
    price: '65',
    unit: 'hr'
  },
  {
    id: '3',
    icon: 'construct',
    name: 'Emergency Plumbing',
    description: '24/7 priority response for urgent mechanical and pipe repairs.',
    price: '120',
    unit: 'hr'
  }
];

export default function PricingScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Hourly Rates');
  const [services, setServices] = useState<Service[]>(initialServices);
  
  // Modal & Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    unit: 'hr'
  });

  const openModal = (service: Service | null = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price,
        unit: service.unit
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        unit: 'hr'
      });
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.price) return;

    if (editingService) {
      setServices(services.map(s => 
        s.id === editingService.id ? { ...s, ...formData } : s
      ));
    } else {
      const newService = {
        id: Date.now().toString(),
        icon: 'options-outline',
        ...formData
      };
      setServices([...services, newService]);
    }
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#00B761" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Pricing</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications" size={24} color="#00B761" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.subtitle}>FINANCIAL MANAGEMENT</Text>
          <Text style={styles.title}>Service Rates</Text>
          <Text style={styles.description}>
            Refine your service valuation. Adjust your market rates across specialized cleaning 
            and maintenance categories to reflect your expertise.
          </Text>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'Hourly Rates' && styles.activeTab]}
              onPress={() => setActiveTab('Hourly Rates')}
            >
              <Text style={[styles.tabText, activeTab === 'Hourly Rates' && styles.activeTabText]}>
                Hourly Rates
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'Flat Rates' && styles.activeTab]}
              onPress={() => setActiveTab('Flat Rates')}
            >
              <Text style={[styles.tabText, activeTab === 'Flat Rates' && styles.activeTabText]}>
                Flat Rates
              </Text>
            </TouchableOpacity>
          </View>

          {/* Service Cards */}
          {services.map(service => (
            <ServicePricingCard 
              key={service.id}
              {...service}
              onEdit={() => openModal(service)}
            />
          ))}

          {/* Add New Button */}
          <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={24} color="#FFF" />
            </View>
            <Text style={styles.addButtonText}>Add New Service Offering</Text>
          </TouchableOpacity>

          {/* Info Note */}
          <View style={styles.infoNote}>
            <View style={styles.infoDot} />
            <Text style={styles.infoText}>
              Updates will take effect for all new bookings immediately.
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={() => router.back()}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* Service Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingService ? 'Edit Service Rate' : 'Add New Service'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>Service Name</Text>
              <TextInput 
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholder="e.g. Premium House Cleaning"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput 
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="Describe the service..."
                multiline
                numberOfLines={3}
              />

              <View style={styles.priceInputRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.inputLabel}>Rate (₱)</Text>
                  <TextInput 
                    style={styles.input}
                    value={formData.price}
                    onChangeText={(text) => setFormData({...formData, price: text})}
                    placeholder="85"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ width: 100 }}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <TextInput 
                    style={styles.input}
                    value={formData.unit}
                    onChangeText={(text) => setFormData({...formData, unit: text})}
                    placeholder="hr"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.modalSaveButton} onPress={handleSave}>
                <Text style={styles.modalSaveButtonText}>Confirm Changes</Text>
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
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    fontFamily: 'Outfit-Bold',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6F61',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B761',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0D1B2A',
    fontFamily: 'Outfit-Bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 24,
    fontFamily: 'Outfit-Regular',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 100,
    padding: 6,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 100,
  },
  activeTab: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#00B76115',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 8,
    fontFamily: 'Outfit-Bold',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: 'Outfit-Regular',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0D1B2A',
    fontFamily: 'Outfit-Bold',
  },
  priceUnit: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  editRateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  editRateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00B761',
  },
  addButton: {
    height: 100,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  addIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  infoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00B761',
    marginRight: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  saveButton: {
    height: 56,
    backgroundColor: '#00B761',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D1B2A',
    fontFamily: 'Outfit-Bold',
  },
  modalForm: {
    paddingTop: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    color: '#0D1B2A',
    marginBottom: 20,
  },
  textArea: {
    height: 100,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  priceInputRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  modalSaveButton: {
    height: 56,
    backgroundColor: '#00B761',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  footerSpacer: {
    height: 60,
  },
});
