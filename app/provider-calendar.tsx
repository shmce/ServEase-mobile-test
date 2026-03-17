import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// Mock Data for the calendar
const DAYS_IN_MONTH = 31;
const START_DAY_OFFSET = 0; // Assuming month starts on a Sunday for this mock
const CURRENT_MONTH = 'March 2026';

const BOOKED_DAYS = [13, 14, 20, 21, 24];
const BLOCKED_DAYS = [15, 22];

// Mock Schedule Data for March 13
const SCHEDULE_DATA = [
  { id: 1, time: '8:00 AM', type: 'available', customer: null, service: null },
  { id: 2, time: '9:00 AM - 10:00 AM', type: 'confirmed', customer: 'John Smith', service: 'Home Cleaning' },
  { id: 3, time: '10:00 AM', type: 'available', customer: null, service: null },
  { id: 4, time: '11:00 AM', type: 'available', customer: null, service: null },
  { id: 5, time: '12:00 PM', type: 'available', customer: null, service: null },
];

export default function ProviderCalendarScreen() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(13);
  const [viewMode, setViewMode] = useState<'Month' | 'Week' | 'Day'>('Month');

  const renderCalendarGrid = () => {
    const days = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Header abbreviations
    const headerRow = weekdays.map((day, ix) => (
      <View key={`header-${ix}`} style={styles.dayCell}>
        <Text style={styles.dayHeaderText}>{day}</Text>
      </View>
    ));
    days.push(<View key="header-row" style={styles.calendarRow}>{headerRow}</View>);

    // Grid days
    let currentRow = [];
    // Add empty cells for offset
    for (let i = 0; i < START_DAY_OFFSET; i++) {
        currentRow.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= DAYS_IN_MONTH; day++) {
        const isSelected = day === selectedDay;
        const isBooked = BOOKED_DAYS.includes(day);
        const isBlocked = BLOCKED_DAYS.includes(day);
        const isAvailable = !isBooked && !isBlocked;

        currentRow.push(
          <TouchableOpacity 
            key={`day-${day}`} 
            style={[styles.dayCell, isSelected && styles.selectedDayCell]}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{day}</Text>
            {/* Indicators */}
            <View style={styles.indicatorContainer}>
                {isBooked && <View style={[styles.indicatorDot, { backgroundColor: '#3B82F6' }]} />}
                {isBlocked && <View style={[styles.indicatorDot, { backgroundColor: '#EF4444' }]} />}
                {!isBooked && !isBlocked && <View style={[styles.indicatorDot, { backgroundColor: '#10B981' }]} />}
            </View>
          </TouchableOpacity>
        );

        if (currentRow.length === 7 || day === DAYS_IN_MONTH) {
            // Fill remaining with next month placeholder
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Calendar</Text>
        
        <TouchableOpacity style={styles.todayButton} onPress={() => setSelectedDay(13)}>
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Top Controls */}
        <View style={styles.topControls}>
            <View style={styles.segmentControl}>
                <TouchableOpacity style={[styles.segmentButton, viewMode === 'Month' && styles.segmentButtonActive]} onPress={() => setViewMode('Month')}>
                    <Text style={[styles.segmentText, viewMode === 'Month' && styles.segmentTextActive]}>Month</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.segmentButton, viewMode === 'Week' && styles.segmentButtonActive]} onPress={() => setViewMode('Week')}>
                    <Text style={[styles.segmentText, viewMode === 'Week' && styles.segmentTextActive]}>Week</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.segmentButton, viewMode === 'Day' && styles.segmentButtonActive]} onPress={() => setViewMode('Day')}>
                    <Text style={[styles.segmentText, viewMode === 'Day' && styles.segmentTextActive]}>Day</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.monthSelector}>
                <Text style={styles.monthTitle}>{CURRENT_MONTH}</Text>
                <View style={styles.monthChevrons}>
                    <TouchableOpacity style={styles.chevronButton}>
                        <Ionicons name="chevron-back" size={20} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chevronButton}>
                        <Ionicons name="chevron-forward" size={20} color="#555" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>

        {/* Calendar Card */}
        <View style={styles.calendarCard}>
            {renderCalendarGrid()}

            <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                    <Text style={styles.legendText}>Bookings</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.legendText}>Blocked</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.legendText}>Available</Text>
                </View>
            </View>
        </View>

        {/* Selected Day Details Panel */}
        <View style={styles.dayDetailsPanel}>
            <View style={styles.dayDetailsHeader}>
                <View>
                    <Text style={styles.dayDetailsDateText}>March {selectedDay}, 2026</Text>
                    {selectedDay === 13 && <Text style={styles.dayDetailsBookingsCount}>3 Bookings</Text>}
                    {selectedDay !== 13 && <Text style={styles.dayDetailsBookingsCount}>No Bookings</Text>}
                </View>
                <TouchableOpacity style={styles.closePanelButton}>
                    <Ionicons name="close" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.dayDetailsContent}>
                {selectedDay === 13 ? (
                   SCHEDULE_DATA.map((slot) => (
                    slot.type === 'available' ? (
                        <TouchableOpacity key={slot.id} style={styles.availableSlot}>
                            <View style={styles.addIconContainer}>
                                <Ionicons name="add" size={16} color="#8E8E93" />
                            </View>
                            <Text style={styles.availableSlotText}>{slot.time} - Available</Text>
                        </TouchableOpacity>
                    ) : (
                        <View key={slot.id} style={styles.confirmedSlot}>
                            <View style={styles.confirmedSlotHeader}>
                                <Text style={styles.confirmedTimeText}>{slot.time}</Text>
                                <View style={styles.confirmedBadge}>
                                    <Text style={styles.confirmedBadgeText}>Confirmed</Text>
                                </View>
                            </View>
                            <Text style={styles.confirmedCustomerText}>{slot.customer}</Text>
                            <Text style={styles.confirmedServiceText}>{slot.service}</Text>
                        </View>
                    )
                   ))
                ) : (
                    <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>Select a day to view schedule</Text>
                    </View>
                )}
            </View>
            
            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
                <TouchableOpacity style={styles.blockDayButton}>
                    <Text style={styles.blockDayText}>Block This Day</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.setHoursButton}>
                    <Text style={styles.setHoursText}>Set Working Hours</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addEventButton}>
                    <Text style={styles.addEventText}>Add Personal Event</Text>
                </TouchableOpacity>
            </View>
        </View>

      </ScrollView>
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
    fontWeight: '600',
    color: '#0D1B2A',
  },
  todayButton: {
    backgroundColor: '#00B761',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  todayButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  topControls: {
    padding: 16,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  segmentTextActive: {
    color: '#00B761',
    fontWeight: '600',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: '400',
    color: '#0D1B2A', 
  },
  monthChevrons: {
    flexDirection: 'row',
    gap: 8,
  },
  chevronButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  calendarCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayCell: {
    width: (width - 72) / 7,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  selectedDayCell: {
    borderWidth: 1.5,
    borderColor: '#00B761',
    backgroundColor: '#F0FBF6',
  },
  dayHeaderText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  fillerDayText: {
    fontSize: 16,
    color: '#E0E0E0',
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#0D1B2A',
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
    height: 4,
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  dayDetailsPanel: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  dayDetailsHeader: {
    backgroundColor: '#00B761',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dayDetailsDateText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  dayDetailsBookingsCount: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '400',
  },
  closePanelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayDetailsContent: {
    padding: 20,
    backgroundColor: '#FFF',
  },
  availableSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  addIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  availableSlotText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  confirmedSlot: {
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderLeftWidth: 4,
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  confirmedSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmedTimeText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  confirmedBadge: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  confirmedBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  confirmedCustomerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  confirmedServiceText: {
    fontSize: 13,
    color: '#555',
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#8E8E93',
  },
  bottomActions: {
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingBottom: 40,
  },
  blockDayButton: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  blockDayText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '500',
  },
  setHoursButton: {
    borderWidth: 1,
    borderColor: '#00B761',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  setHoursText: {
    color: '#00B761',
    fontSize: 15,
    fontWeight: '500',
  },
  addEventButton: {
    borderWidth: 1,
    borderColor: '#8E8E93',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addEventText: {
    color: '#555',
    fontSize: 15,
    fontWeight: '500',
  },
});
