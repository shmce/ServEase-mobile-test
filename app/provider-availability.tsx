import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Switch, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const DayScheduleItem = ({ day, active, onToggle, breakTime, onAddBreak, onRemoveBreak, onTimeChange, onBreakChange }: any) => (
  <View style={styles.dayCard}>
    <View style={styles.dayHeader}>
      <Text style={styles.dayName}>{day}</Text>
      <Switch 
        value={active} 
        onValueChange={onToggle}
        trackColor={{ false: '#E0E0E0', true: '#00B761' }}
        thumbColor="#FFF"
      />
    </View>
    
    {active ? (
      <View style={styles.timeSettings}>
        <View style={styles.timeRow}>
          <View style={styles.timeInputBox}>
            <Text style={styles.timeLabel}>Start Time</Text>
            <View style={styles.timeInput}>
              <TextInput 
                style={styles.timeText}
                defaultValue="08:00 am"
                placeholder="--:-- --"
                onChangeText={(val) => onTimeChange('start', val)}
              />
              <Ionicons name="time-outline" size={16} color="#CCC" />
            </View>
            <Text style={styles.timeFormat}>8:00 AM</Text>
          </View>
          
          <Text style={styles.toText}>to</Text>
          
          <View style={styles.timeInputBox}>
            <Text style={styles.timeLabel}>End Time</Text>
            <View style={styles.timeInput}>
              <TextInput 
                style={styles.timeText}
                defaultValue="05:00 pm"
                placeholder="--:-- --"
                onChangeText={(val) => onTimeChange('end', val)}
              />
              <Ionicons name="time-outline" size={16} color="#CCC" />
            </View>
            <Text style={styles.timeFormat}>5:00 PM</Text>
          </View>
        </View>
        
        {breakTime ? (
          <View style={styles.breakContainer}>
            <View style={styles.breakHeader}>
              <Text style={styles.breakLabel}>Break Time</Text>
              <TouchableOpacity onPress={onRemoveBreak}>
                <Ionicons name="close" size={20} color="#FF4D4D" />
              </TouchableOpacity>
            </View>
            <View style={styles.timeRow}>
              <View style={[styles.timeInput, styles.breakTimeInput]}>
                <TextInput 
                  style={styles.timeText}
                  value={breakTime.start}
                  placeholder="--:-- --"
                  onChangeText={(val) => onBreakChange('start', val)}
                />
              </View>
              <Text style={styles.breakToText}>to</Text>
              <View style={[styles.timeInput, styles.breakTimeInput]}>
                <TextInput 
                  style={styles.timeText}
                  value={breakTime.end}
                  placeholder="--:-- --"
                  onChangeText={(val) => onBreakChange('end', val)}
                />
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.addBreakButton} onPress={onAddBreak}>
            <Text style={styles.addBreakText}>+ Add a Break</Text>
          </TouchableOpacity>
        )}
      </View>
    ) : (
      <Text style={styles.closedText}>Unavailable for bookings</Text>
    )}
  </View>
);

export default function ProviderAvailabilityScreen() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<any>({
    Monday: { active: true, start: '08:00 am', end: '05:00 pm', break: null },
    Tuesday: { active: true, start: '08:00 am', end: '05:00 pm', break: null },
    Wednesday: { active: true, start: '08:00 am', end: '05:00 pm', break: null },
    Thursday: { active: true, start: '08:00 am', end: '05:00 pm', break: null },
    Friday: { active: true, start: '08:00 am', end: '05:00 pm', break: null },
    Saturday: { active: false, start: '08:00 am', end: '05:00 pm', break: null },
    Sunday: { active: false, start: '08:00 am', end: '05:00 pm', break: null },
  });

  const updateWorkTime = (day: string, type: 'start' | 'end', value: string) => {
    setSchedule((prev: any) => ({
      ...prev,
      [day]: { ...prev[day], [type]: value }
    }));
  };

  const updateBreakTime = (day: string, type: 'start' | 'end', value: string) => {
    setSchedule((prev: any) => ({
      ...prev,
      [day]: { ...prev[day], break: { ...prev[day].break, [type]: value } }
    }));
  };

  const toggleDay = (day: string) => {
    setSchedule((prev: any) => ({
      ...prev,
      [day]: { ...prev[day], active: !prev[day].active }
    }));
  };

  const addBreak = (day: string) => {
    setSchedule((prev: any) => ({
      ...prev,
      [day]: { ...prev[day], break: { start: '', end: '' } }
    }));
  };

  const [daysOff, setDaysOff] = useState<any[]>([
    { id: '1', day: 'Tuesday', reason: '' },
    { id: '2', day: 'Saturday', reason: 'Family Day' },
    { id: '3', day: 'Sunday', reason: 'Personal Day' },
  ]);

  const [newDayOffReason, setNewDayOffReason] = useState('');
  const [newDayOffDate, setNewDayOffDate] = useState('');

  const addDayOff = () => {
    if (!newDayOffDate) return; // Prevent empty dates
    
    const newEntry = {
      id: Date.now().toString(),
      day: newDayOffDate,
      reason: newDayOffReason
    };
    setDaysOff([...daysOff, newEntry]);
    setNewDayOffReason('');
    setNewDayOffDate('');
  };
   
  const removeBreak = (day: string) => {
    setSchedule((prev: any) => ({
      ...prev,
      [day]: { ...prev[day], break: null }
    }));
  };

  const removeDayOff = (id: string) => {
    setDaysOff(daysOff.filter(d => d.id !== id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Work Availability</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          
          {Object.keys(schedule).map((day) => (
            <DayScheduleItem 
              key={day} 
              day={day} 
              active={schedule[day].active} 
              onToggle={() => toggleDay(day)}
              breakTime={schedule[day].break}
              onAddBreak={() => addBreak(day)}
              onRemoveBreak={() => removeBreak(day)}
              onTimeChange={(type: any, val: string) => updateWorkTime(day, type, val)}
              onBreakChange={(type: any, val: string) => updateBreakTime(day, type, val)}
            />
          ))}

          <View style={styles.copyOption}>
            <TouchableOpacity style={styles.checkbox}>
              <View style={styles.checkboxTick} />
            </TouchableOpacity>
            <Text style={styles.copyText}>Copy Monday's schedule to all days</Text>
          </View>

          <Text style={styles.sectionTitle}>Recurring Days Off</Text>
          <View style={styles.daysOffCard}>
             <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select Date</Text>
                <View style={styles.dateInput}>
                  <TextInput 
                    style={styles.dateText}
                    placeholder="dd/mm/yyyy"
                    placeholderTextColor="#AAA"
                    value={newDayOffDate}
                    onChangeText={setNewDayOffDate}
                  />
                  <Ionicons name="calendar-outline" size={18} color="#00B761" />
                </View>
             </View>

             <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reason (Optional)</Text>
                <TextInput 
                  style={styles.reasonInput}
                  placeholder="e.g., Public Holiday, Vacation"
                  placeholderTextColor="#AAA"
                  value={newDayOffReason}
                  onChangeText={setNewDayOffReason}
                />
             </View>

             <TouchableOpacity style={styles.addDayOffButton} onPress={addDayOff}>
                <Text style={[styles.addDayOffText, newDayOffReason ? { color: '#00B761' } : null]}>
                  + Add Day Off
                </Text>
             </TouchableOpacity>

             {/* Days Off List */}
             {daysOff.length > 0 && (
               <View style={styles.daysOffList}>
                 {daysOff.map((item, index) => (
                   <View key={item.id} style={[styles.dayOffItem, index === 0 ? { borderTopWidth: 0 } : null]}>
                     <View style={styles.dayOffInfo}>
                       <Text style={styles.dayOffDate}>{item.day}</Text>
                       {item.reason ? <Text style={styles.dayOffReason}>Reason: {item.reason}</Text> : null}
                     </View>
                     <TouchableOpacity onPress={() => removeDayOff(item.id)}>
                       <Ionicons name="trash-outline" size={20} color="#FF4D4D" />
                     </TouchableOpacity>
                   </View>
                 ))}
               </View>
             )}
          </View>

          <View style={styles.footerSpacer} />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} activeOpacity={0.8} onPress={() => router.back()}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 8,
    marginRight: 4,
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
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 16,
    marginTop: 8,
  },
  dayCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  timeSettings: {
    marginTop: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeInputBox: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  timeText: {
    fontSize: 14,
    color: '#0D1B2A',
    flex: 1,
  },
  timeFormat: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 4,
  },
  toText: {
    marginHorizontal: 12,
    color: '#8E8E93',
    marginTop: 20,
  },
  addBreakButton: {
    marginTop: 16,
  },
  addBreakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B761',
  },
  breakContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  breakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakLabel: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  breakTimeInput: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingVertical: 10,
  },
  breakToText: {
    marginHorizontal: 12,
    color: '#8E8E93',
  },
  closedText: {
    marginTop: 12,
    fontSize: 14,
    color: '#AAA',
    fontStyle: 'italic',
  },
  copyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CCC',
    marginRight: 12,
    backgroundColor: '#FFF',
  },
  checkboxTick: {
    // Hidden for now, just stylized
  },
  copyText: {
    fontSize: 14,
    color: '#555',
  },
  daysOffCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 10,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  dateText: {
    fontSize: 15,
    color: '#0D1B2A',
    flex: 1,
  },
  reasonInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0D1B2A',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  addDayOffButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addDayOffText: {
    fontSize: 15,
    color: '#AAA',
    fontWeight: '600',
  },
  daysOffList: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  dayOffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  dayOffInfo: {
    flex: 1,
  },
  dayOffDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  dayOffReason: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  footer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  saveButton: {
    backgroundColor: '#00B761',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerSpacer: {
    height: 40,
  },
});
