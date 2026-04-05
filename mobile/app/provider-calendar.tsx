import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  StatusBar, 
  Dimensions,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TimePickerModal } from '../components/TimePickerModal';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function ProviderCalendarScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'Month' | 'Week' | 'Day'>('Month');
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [blockedDays, setBlockedDays] = useState<number[]>([]);
  const [modalType, setModalType] = useState<'hours' | 'event' | null>(null);
  const [modalData, setModalData] = useState({ title: '', startTime: '', endTime: '', description: '' });
  
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'startTime' | 'endTime' | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('bookings')
          .select('*')
          .eq('provider_id', user.id);
        
        if (data) setBookings(data);
      }
      setIsLoading(false);
    }
    fetchBookings();
  }, []);

  const dailySchedule = useMemo(() => {
    return bookings.filter(b => {
      const date = new Date(b.scheduled_at || b.created_at);
      return date.getDate() === selectedDay && date.getMonth() === new Date().getMonth();
    }).map(b => ({
      id: b.id,
      type: 'Appointment',
      title: b.service_name || 'Service Appointment',
      time: new Date(b.scheduled_at || b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: b.status.charAt(0).toUpperCase() + b.status.slice(1),
      icon: 'person',
      color: b.status === 'confirmed' ? '#3A86FF' : '#FFA500'
    }));
  }, [bookings, selectedDay]);

  const bookedDays = useMemo(() => {
    return bookings.map(b => new Date(b.scheduled_at || b.created_at).getDate());
  }, [bookings]);

  const DAYS_IN_MONTH = 31;
  const START_DAY_OFFSET = 0; // March 2026 starts on Sunday (offset 0)

  const handleToggleBlockDay = () => {
    if (blockedDays.includes(selectedDay)) {
      setBlockedDays(blockedDays.filter(d => d !== selectedDay));
      Alert.alert('Day Unblocked', `March ${selectedDay} is now available for bookings.`);
    } else {
      setBlockedDays([...blockedDays, selectedDay]);
      Alert.alert('Day Blocked', `March ${selectedDay} is now blocked for all bookings.`);
    }
  };

  const handleTimeConfirm = (timeStr: string) => {
    if (pickerTarget) {
      setModalData({ ...modalData, [pickerTarget]: timeStr });
    }
  };

  const handleSaveModal = () => {
    const typeLabel = modalType === 'hours' ? 'Working hours' : 'Personal event';
    setModalType(null);
    setTimeout(() => {
      Alert.alert('Success', `${typeLabel} updated for March ${selectedDay}.`);
    }, 300);
  };

  const renderMonthView = () => {
    const days = [];
    let currentRow = [];
    
    for (let i = 0; i < START_DAY_OFFSET; i++) {
        currentRow.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= DAYS_IN_MONTH; day++) {
        const isSelected = selectedDay === day;
        const isBlocked = blockedDays.includes(day);
        
        currentRow.push(
            <TouchableOpacity 
                key={day} 
                style={[styles.dayCell, isSelected && styles.selectedDayCell, isBlocked && styles.blockedDayCell]}
                onPress={() => setSelectedDay(day)}
            >
                <Text style={[styles.dayText, isSelected && styles.selectedDayText, isBlocked && styles.blockedDayText]}>{day}</Text>
                {bookedDays.includes(day) && !isBlocked && <View style={styles.eventDot} />}
            </TouchableOpacity>
        );

        if (currentRow.length === 7 || day === DAYS_IN_MONTH) {
            if (day === DAYS_IN_MONTH) {
                let fillerCount = 1;
                while (currentRow.length < 7) {
                     currentRow.push(
                        <View key={`next-empty-${fillerCount}`} style={styles.dayCell}>
                            <Text style={styles.fillerDayText}>{fillerCount}</Text>
                        </View>
                    );
                    fillerCount++;
                }
            }
            days.push(<View key={`row-${day}`} style={styles.calendarRow}>{currentRow}</View>);
            currentRow = [];
        }
    }
    return days;
  };

  const renderWeekView = () => {
    const startOfWeek = Math.floor((selectedDay - 1) / 7) * 7 + 1;
    
    return (
      <View style={styles.weekView}>
        <View style={styles.weekHeader}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <Text key={i} style={styles.weekHeaderText}>{d}</Text>
          ))}
        </View>
        <View style={styles.calendarRow}>
          {Array.from({ length: 7 }).map((_, i) => {
            const day = startOfWeek + i;
            if (day > DAYS_IN_MONTH) return <View key={`week-empty-${i}`} style={styles.weekDayCell} />;
            const isSelected = selectedDay === day;
            const isBlocked = blockedDays.includes(day);
            return (
              <TouchableOpacity 
                key={day} 
                style={[styles.weekDayCell, isSelected && styles.selectedDayCell, isBlocked && styles.blockedDayCell]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayText, isSelected && styles.selectedDayText, isBlocked && styles.blockedDayText]}>{day}</Text>
                {bookedDays.includes(day) && !isBlocked && <View style={styles.eventDot} />}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00B761" />
        <Text style={{ marginTop: 16, color: '#0D1B2A' }}>Loading schedule...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>March 2026</Text>
          <Ionicons name="chevron-down" size={16} color="#0D1B2A" style={{ marginLeft: 4 }} />
        </View>
        <TouchableOpacity style={styles.todayButton} onPress={() => setSelectedDay(new Date().getDate())}>
          <Text style={styles.todayText}>Today</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.calendarControls}>
             <View style={styles.viewTabs}>
                {['Month', 'Week', 'Day'].map((mode) => (
                  <TouchableOpacity 
                    key={mode} 
                    style={[styles.viewTab, viewMode === mode && styles.activeViewTab]}
                    onPress={() => setViewMode(mode as any)}
                  >
                    <Text style={[styles.viewTabText, viewMode === mode && styles.activeViewTabText]}>{mode}</Text>
                  </TouchableOpacity>
                ))}
             </View>
          </View>

          <View style={styles.calendarCard}>
            {viewMode === 'Month' ? (
              <View>
                <View style={styles.weekHeader}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                    <Text key={i} style={styles.weekHeaderText}>{d}</Text>
                  ))}
                </View>
                {renderMonthView()}
              </View>
            ) : viewMode === 'Week' ? (
              renderWeekView()
            ) : (
              <View style={styles.dayViewMini}>
                 <Text style={styles.miniDayText}>Showing full schedule for March {selectedDay}</Text>
              </View>
            )}
          </View>

          <View style={[styles.dayDetailsPanel, viewMode === 'Day' && styles.fullDayPanel]}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Schedule for March {selectedDay}</Text>
              {blockedDays.includes(selectedDay) && (
                <View style={styles.blockedBadge}>
                  <Text style={styles.blockedBadgeText}>Blocked</Text>
                </View>
              )}
            </View>

            {dailySchedule.length > 0 && !blockedDays.includes(selectedDay) ? (
                dailySchedule.map((item: any) => (
                    <View key={item.id} style={styles.scheduleItem}>
                        <View style={[styles.scheduleIconContainer, { backgroundColor: item.color + '20' }]}>
                            <Ionicons name={item.icon as any} size={20} color={item.color} />
                        </View>
                        <View style={styles.scheduleInfo}>
                            <View style={styles.scheduleItemHeader}>
                                <Text style={styles.scheduleItemTitle}>{item.title}</Text>
                                {item.status && (
                                    <View style={[styles.statusBadge, { backgroundColor: item.status === 'Confirmed' ? '#E6F9F0' : '#F2F3F5' }]}>
                                        <Text style={[styles.statusText, { color: item.status === 'Confirmed' ? '#00B761' : '#8E8E93' }]}>{item.status}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.scheduleItemTime}>{item.time}</Text>
                        </View>
                    </View>
                ))
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={48} color="#EEE" />
                    <Text style={styles.emptyText}>
                        {blockedDays.includes(selectedDay) ? 'This day is blocked.' : 'No events scheduled for this day.'}
                    </Text>
                </View>
            )}

            <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.blockDayButton} onPress={handleToggleBlockDay}>
                    <Text style={styles.blockDayText}>
                      {blockedDays.includes(selectedDay) ? 'Unblock This Day' : 'Block This Day'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.setHoursButton} onPress={() => setModalType('hours')}>
                    <Text style={styles.setHoursText}>Set Working Hours</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addEventButton} onPress={() => setModalType('event')}>
                    <Text style={styles.addEventText}>Add Personal Event</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Sheet (Absolute positioned View for stability) */}
      {!!modalType && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setModalType(null)}
          >
            <TouchableOpacity 
              activeOpacity={1} 
              style={{ width: '100%', justifyContent: 'flex-end' }}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {modalType === 'hours' ? 'Set Working Hours' : 'Add Personal Event'}
                  </Text>
                  <TouchableOpacity onPress={() => setModalType(null)}>
                    <Ionicons name="close" size={24} color="#0D1B2A" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                  <Text style={styles.inputLabel}>
                    {modalType === 'hours' ? 'Work Schedule Title' : 'Event Name'}
                  </Text>
                  <TextInput 
                    style={styles.input}
                    placeholder={modalType === 'hours' ? "e.g. Regular Shift" : "e.g. Doctor's Appointment"}
                    value={modalData.title}
                    onChangeText={(text) => setModalData({...modalData, title: text})}
                  />

                  <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.inputLabel}>Start Time</Text>
                      <TouchableOpacity 
                        style={styles.pickerTrigger} 
                        onPress={() => { 
                          Keyboard.dismiss();
                          setPickerTarget('startTime'); 
                          setPickerVisible(true); 
                        }}
                      >
                        <Text style={[styles.pickerTriggerText, !modalData.startTime && styles.placeholderText]}>
                          {modalData.startTime || '08:00 AM'}
                        </Text>
                        <Ionicons name="time-outline" size={18} color="#AAA" />
                      </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.inputLabel}>End Time</Text>
                      <TouchableOpacity 
                        style={styles.pickerTrigger} 
                        onPress={() => { 
                          Keyboard.dismiss();
                          setPickerTarget('endTime'); 
                          setPickerVisible(true); 
                        }}
                      >
                        <Text style={[styles.pickerTriggerText, !modalData.endTime && styles.placeholderText]}>
                          {modalData.endTime || '05:00 PM'}
                        </Text>
                        <Ionicons name="time-outline" size={18} color="#AAA" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Notes (Optional)</Text>
                  <TextInput 
                    style={[styles.input, styles.textArea]}
                    placeholder="Additional details..."
                    value={modalData.description}
                    onChangeText={(text) => setModalData({...modalData, description: text})}
                    multiline
                    numberOfLines={3}
                  />

                  <TouchableOpacity 
                    style={styles.modalSaveButton} 
                    onPress={() => {
                      Keyboard.dismiss();
                      handleSaveModal();
                    }}
                  >
                    <Text style={styles.modalSaveButtonText}>Save Schedule</Text>
                  </TouchableOpacity>
                  <View style={{ height: Platform.OS === 'ios' ? 40 : 20 }} />
                </ScrollView>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}

      <TimePickerModal
        key={pickerTarget || 'calendar-time-picker'}
        visible={isPickerVisible}
        onClose={() => setPickerVisible(false)}
        onConfirm={handleTimeConfirm}
        initialTime={(pickerTarget && modalData[pickerTarget]) ? modalData[pickerTarget] : '08:00 AM'}
        title={pickerTarget === 'startTime' ? 'Select Start Time' : 'Select End Time'}
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  todayButton: {
    backgroundColor: '#00B761',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  todayText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  scrollContainer: {
    flex: 1,
  },
  container: {
    padding: 24,
  },
  calendarControls: {
    marginBottom: 20,
  },
  viewTabs: {
    flexDirection: 'row',
    backgroundColor: '#F2F3F5',
    borderRadius: 12,
    padding: 4,
  },
  viewTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeViewTab: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewTabText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
  },
  activeViewTabText: {
    color: '#0D1B2A',
  },
  calendarCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#AAA',
    textTransform: 'uppercase',
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  selectedDayCell: {
    backgroundColor: '#00B761',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  selectedDayText: {
    color: '#FFF',
  },
  fillerDayText: {
    color: '#EEE',
    fontSize: 14,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00B761',
    marginTop: 4,
  },
  blockedDayCell: {
    backgroundColor: '#FEEFEF',
  },
  blockedDayText: {
    color: '#FF4D4D',
  },
  dayViewMini: {
    padding: 20,
    alignItems: 'center',
  },
  miniDayText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  weekView: {
    paddingBottom: 10,
  },
  weekDayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  dayDetailsPanel: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  fullDayPanel: {
    minHeight: 400,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  blockedBadge: {
    backgroundColor: '#FEEFEF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  blockedBadgeText: {
    color: '#FF4D4D',
    fontSize: 12,
    fontWeight: '700',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  scheduleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  scheduleItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  scheduleItemSub: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  scheduleItemTime: {
    fontSize: 13,
    color: '#444',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
  },
  actionButtons: {
    marginTop: 20,
    gap: 12,
  },
  blockDayButton: {
    height: 56,
    backgroundColor: '#FFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF4D4D',
  },
  blockDayText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF4D4D',
  },
  setHoursButton: {
    height: 56,
    backgroundColor: '#FFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00B761',
  },
  setHoursText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00B761',
  },
  addEventButton: {
    height: 56,
    backgroundColor: '#FFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  addEventText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#555',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  modalForm: {
    paddingTop: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
    marginTop: 16,
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
  pickerTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  pickerTriggerText: {
    fontSize: 15,
    color: '#0D1B2A',
  },
  placeholderText: {
    color: '#AAA',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  modalSaveButton: {
    height: 56,
    backgroundColor: '#00B761',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
