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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const SERVICES = [
  'Plumbing Repair',
  'Electrical Setup',
  'Home Cleaning',
  'Carpentry',
  'Aircon Servicing'
];

const INITIAL_ADDRESSES = [
  {
    id: '1',
    type: 'Home',
    fullAddress: '123 Mabini Street, Barangay San Jose, Quezon City',
  },
  {
    id: '2',
    type: 'Office',
    fullAddress: '456 Ayala Avenue, Makati Central Business District',
  },
];

const TIME_OPTIONS = [
  '8:00 AM',
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const BOOKABLE_DAYS = 21;

function formatDateValue(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function buildBookableDays(monthDate: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const availableKeys = new Set<string>();
  for (let index = 0; index < BOOKABLE_DAYS; index += 1) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + index);
    availableKeys.add(formatDateKey(nextDate));
  }

  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const leadingDays = firstDay.getDay();

  const cells: Array<
    | { key: string; type: 'empty' }
    | { key: string; type: 'day'; date: Date; isAvailable: boolean }
  > = [];

  for (let index = 0; index < leadingDays; index += 1) {
    cells.push({ key: `empty-${index}`, type: 'empty' });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
    cells.push({
      key: formatDateKey(date),
      type: 'day',
      date,
      isAvailable: availableKeys.has(formatDateKey(date)),
    });
  }

  return cells;
}

export default function CustomerBookingFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    newAddress?: string;
    serviceName?: string;
    providerName?: string;
    providerId?: string;
    date?: string;
    time?: string;
  }>();

  // Form State
  const [service, setService] = useState(params.serviceName || '');
  const [date, setDate] = useState(params.date || '');
  const [time, setTime] = useState(params.time || '');
  const [address, setAddress] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [savedAddresses, setSavedAddresses] = useState(INITIAL_ADDRESSES);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    let changed = false;
    if (params.newAddress) {
      try {
        const parsed = JSON.parse(params.newAddress as string);
        const formatted = {
           id: parsed.id,
           type: parsed.type,
           fullAddress: parsed.addressLine2
             ? `${parsed.addressLine1}, ${parsed.addressLine2}`
             : parsed.addressLine1
        };
        setSavedAddresses(prev => {
          if (prev.find(a => a.id === formatted.id)) return prev;
          return [...prev, formatted];
        });
        setAddress(formatted);
        changed = true;
      } catch {}
    }
    if (changed) {
      router.setParams({ newAddress: '' });
    }
  }, [params.newAddress, router]);
  
  // Modal States
  const [isServiceModalVisible, setServiceModalVisible] = useState(false);
  const [isAddressModalVisible, setAddressModalVisible] = useState(false);
  const [isTimeModalVisible, setTimeModalVisible] = useState(false);

  const calendarDays = buildBookableDays(calendarMonth);
  const monthLabel = calendarMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const isCurrentMonth = isSameMonth(calendarMonth, currentMonth);

  const handleConfirmBooking = () => {
    // Validate
    if (!service || !date || !time || !address) {
      Alert.alert('Missing Fields', 'Please fill in all required fields (Service, Date, Time, and Address).');
      return;
    }

    // Submit and navigate
    router.push({
      pathname: '/customer-booking-details',
      params: { id: 'BK-2026-03-012', addressId: address.id }
    });
  };

  const SelectionModal = ({ 
    visible, 
    title, 
    data, 
    onSelect, 
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book a Service</Text>
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
          {params.providerName ? (
            <View style={styles.providerBanner}>
              <Ionicons name="person-circle-outline" size={18} color="#00B761" />
              <Text style={styles.providerBannerText}>Booking with {params.providerName}</Text>
            </View>
          ) : null}

          {/* Service Type */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Service Type <Text style={styles.requiredAsterisk}>*</Text></Text>
            <TouchableOpacity 
              style={styles.dropdownButton} 
              onPress={() => setServiceModalVisible(true)}
            >
              <Text style={[styles.dropdownText, !service && styles.placeholderText]}>
                {service || 'Select a service'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Date <Text style={styles.requiredAsterisk}>*</Text></Text>
            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <View>
                  <Text style={styles.calendarMonth}>{monthLabel}</Text>
                  <Text style={styles.calendarCaption}>
                    {date || 'Choose an available booking date'}
                  </Text>
                </View>
                <View style={styles.calendarActions}>
                  <TouchableOpacity
                    style={[styles.calendarNavButton, isCurrentMonth && styles.calendarNavButtonDisabled]}
                    onPress={() =>
                      setCalendarMonth(
                        (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                      )
                    }
                    disabled={isCurrentMonth}
                  >
                    <Ionicons name="chevron-back" size={18} color={isCurrentMonth ? '#C8CDD6' : '#0D1B2A'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.calendarNavButton}
                    onPress={() =>
                      setCalendarMonth(
                        (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                      )
                    }
                  >
                    <Ionicons name="chevron-forward" size={18} color="#0D1B2A" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.weekdayRow}>
                {WEEKDAY_LABELS.map((label) => (
                  <Text key={label} style={styles.weekdayLabel}>
                    {label}
                  </Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {calendarDays.map((cell) => {
                  if (cell.type === 'empty') {
                    return <View key={cell.key} style={styles.calendarCell} />;
                  }

                  const formattedDate = formatDateValue(cell.date);
                  const isSelected = date === formattedDate;

                  return (
                    <View key={cell.key} style={styles.calendarCell}>
                      <TouchableOpacity
                        style={[
                          styles.calendarDateButton,
                          isSelected && styles.calendarDateButtonSelected,
                          !cell.isAvailable && styles.calendarDateButtonDisabled,
                        ]}
                        onPress={() => setDate(formattedDate)}
                        disabled={!cell.isAvailable}
                      >
                        <Text
                          style={[
                            styles.calendarDateText,
                            isSelected && styles.calendarDateTextSelected,
                            !cell.isAvailable && styles.calendarDateTextDisabled,
                          ]}
                        >
                          {cell.date.getDate()}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Time <Text style={styles.requiredAsterisk}>*</Text></Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setTimeModalVisible(true)}
            >
              <Ionicons name="time-outline" size={20} color={time ? "#0D1B2A" : "#8E8E93"} style={styles.inputIcon} />
              <Text style={[styles.dropdownText, !time && styles.placeholderText]}>
                {time || 'Select Time'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Address */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Location <Text style={styles.requiredAsterisk}>*</Text></Text>
            <TouchableOpacity 
              style={styles.addressSelector} 
              onPress={() => setAddressModalVisible(true)}
            >
              <View style={styles.addressSelectorContent}>
                <View style={styles.addressIconContainer}>
                  <Ionicons name={address ? (address.type === 'Home' ? 'home' : 'business') : 'location'} size={24} color="#00B761" />
                </View>
                <View style={styles.addressTextContainer}>
                  <Text style={styles.addressType}>{address ? address.type : 'Select Address'}</Text>
                  {address && <Text style={styles.addressDetail} numberOfLines={2}>{address.fullAddress}</Text>}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Notes (Optional)</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Any special instructions for the provider?"
                placeholderTextColor="#A0A0A0"
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* File Upload */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Attachments (Optional)</Text>
            <TouchableOpacity style={styles.uploadBox}>
              <Ionicons name="cloud-upload-outline" size={32} color="#00B761" />
              <Text style={styles.uploadText}>Upload Photos</Text>
              <Text style={styles.uploadSubtext}>Show the provider what needs to be fixed</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Action */}
      <View style={styles.bottomContainer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Estimated Total (Cash Basis)</Text>
          <Text style={styles.priceValue}>₱1,500.00</Text>
        </View>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmBooking}>
          <Text style={styles.confirmButtonText}>Confirm Booking</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <SelectionModal
        visible={isServiceModalVisible}
        title="Select Service"
        data={SERVICES}
        onClose={() => setServiceModalVisible(false)}
        renderItem={(item: string, index: number) => (
          <TouchableOpacity 
            key={index} 
            style={[styles.modalOption, service === item && styles.modalOptionSelected]}
            onPress={() => { setService(item); setServiceModalVisible(false); }}
          >
            <Text style={[styles.modalOptionText, service === item && styles.modalOptionTextSelected]}>{item}</Text>
            {service === item && <Ionicons name="checkmark-circle" size={24} color="#00B761" />}
          </TouchableOpacity>
        )}
      />

      <SelectionModal
        visible={isTimeModalVisible}
        title="Select Time"
        data={TIME_OPTIONS}
        onClose={() => setTimeModalVisible(false)}
        renderItem={(item: string, index: number) => (
          <TouchableOpacity 
            key={index}
            style={[styles.modalOption, time === item && styles.modalOptionSelected]}
            onPress={() => {
              setTime(item);
              setTimeModalVisible(false);
            }}
          >
            <Text style={[styles.modalOptionText, time === item && styles.modalOptionTextSelected]}>{item}</Text>
            {time === item && <Ionicons name="checkmark-circle" size={24} color="#00B761" />}
          </TouchableOpacity>
        )}
      />

      <SelectionModal
        visible={isAddressModalVisible}
        title="Select Address"
        data={[...savedAddresses, { id: 'add_new', type: 'Add New Address', fullAddress: '' }]}
        onClose={() => setAddressModalVisible(false)}
        renderItem={(item: any, index: number) => {
          if (item.id === 'add_new') {
            return (
              <TouchableOpacity
                key="add_new"
                style={styles.modalAddressOption}
                onPress={() => {
                  setAddressModalVisible(false);
                  router.push({ pathname: '/add-address', params: { returnTo: '/customer-booking-form' } });
                }}
              >
                <View style={[styles.modalAddressIcon, { backgroundColor: '#F0F0F0' }]}>
                  <Ionicons name="add" size={24} color="#0D1B2A" />
                </View>
                <View style={styles.modalAddressDetails}>
                  <Text style={[styles.modalOptionText, { fontWeight: '600' }]}>Add New Address</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity 
              key={index} 
              style={[styles.modalAddressOption, address?.id === item.id && styles.modalOptionSelected]}
              onPress={() => { setAddress(item); setAddressModalVisible(false); }}
            >
              <View style={styles.modalAddressIcon}>
                <Ionicons name={item.type === 'Home' ? 'home-outline' : item.type === 'Office' ? 'business-outline' : 'location-outline'} size={24} color="#00B761" />
              </View>
              <View style={styles.modalAddressDetails}>
                <Text style={[styles.modalOptionText, address?.id === item.id && styles.modalOptionTextSelected]}>{item.type}</Text>
                <Text style={styles.modalAddressLine}>{item.fullAddress}</Text>
              </View>
              {address?.id === item.id && <Ionicons name="checkmark-circle" size={24} color="#00B761" />}
            </TouchableOpacity>
          );
        }}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  providerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FBF2',
    borderWidth: 1,
    borderColor: '#B8EACD',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  providerBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
    marginLeft: 8,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 18,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calendarMonth: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  calendarCaption: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  calendarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  calendarNavButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  calendarNavButtonDisabled: {
    backgroundColor: '#F8F9FA',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    paddingVertical: 4,
    alignItems: 'center',
  },
  calendarDateButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDateButtonSelected: {
    backgroundColor: '#00B761',
  },
  calendarDateButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  calendarDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  calendarDateTextSelected: {
    color: '#FFF',
  },
  calendarDateTextDisabled: {
    color: '#C0C4CC',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: '#FF5252',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  dropdownText: {
    fontSize: 15,
    color: '#0D1B2A',
  },
  placeholderText: {
    color: '#8E8E93',
  },
  inputIcon: {
    marginRight: 8,
  },
  addressSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    padding: 16,
  },
  addressSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8FBF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  addressDetail: {
    fontSize: 13,
    color: '#8E8E93',
  },
  textAreaContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
  },
  textArea: {
    height: 100,
    fontSize: 15,
    color: '#0D1B2A',
  },
  uploadBox: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00B761',
    marginTop: 12,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00B761',
  },
  confirmButton: {
    backgroundColor: '#00B761',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  modalOptionSelected: {
    backgroundColor: '#F8FBF9',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#0D1B2A',
  },
  modalOptionTextSelected: {
    fontWeight: '700',
    color: '#00B761',
  },
  modalAddressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  modalAddressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8FBF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalAddressDetails: {
    flex: 1,
    paddingRight: 16,
  },
  modalAddressLine: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
});
