import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Image, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchProviderBookingView, ProviderBookingView } from '@/lib/provider-booking';

const { width, height } = Dimensions.get('window');

export default function ProviderNavigationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [booking, setBooking] = useState<ProviderBookingView | null>(null);

  useEffect(() => {
    fetchProviderBookingView(id).then(setBooking).catch(() => setBooking(null));
  }, [id]);

  if (!booking) {
    return null;
  }

  const customerDetails = {
    name: booking.customer,
    address: booking.address,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Map Background Placeholder */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapGrid}>
          {/* Simple grid lines to simulate a map */}
          {[...Array(6)].map((_, i) => (
            <View key={`h-${i}`} style={[styles.gridLine, { top: i * (height / 6), width: width, height: 1 }]} />
          ))}
          {[...Array(4)].map((_, i) => (
            <View key={`v-${i}`} style={[styles.gridLine, { left: i * (width / 4), width: 1, height: height }]} />
          ))}
        </View>
        
        {/* Destination Pin */}
        <View style={styles.pinContainer}>
          <View style={styles.pinShadow} />
          <Ionicons name="location" size={56} color="#00B761" />
        </View>
      </View>

      {/* Top Instruction Overlay */}
      <SafeAreaView style={styles.topOverlayArea}>
        <View style={styles.topCard}>
          <View style={styles.instructionRow}>
            <View style={styles.navIconContainer}>
              <Ionicons name="navigate" size={24} color="#FFF" />
            </View>
            <View style={styles.instructionTextContainer}>
              <Text style={styles.maneuverText}>Turn right onto Ayala Avenue</Text>
              <Text style={styles.distanceToTurn}>in 500 m</Text>
            </View>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>ETA</Text>
              <Text style={styles.metricValue}>12 mins</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Distance</Text>
              <Text style={styles.metricValue}>3.2 km</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Traffic</Text>
              <Text style={[styles.metricValue, styles.trafficStatus]}>Light traffic</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom Sheet Overlay */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        
        <Text style={styles.sheetLabel}>Destination</Text>
        
        <View style={styles.destinationCard}>
          <View style={styles.locationIconCircle}>
            <Ionicons name="location" size={20} color="#00B761" />
          </View>
          <View style={styles.destinationInfo}>
            <Text style={styles.destinationName}>{customerDetails.name}</Text>
            <Text style={styles.destinationAddress}>{customerDetails.address}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.arrivedButton}
          onPress={() => router.push({ pathname: '/provider-start-service', params: { id: booking.id } } as any)}
        >
          <Text style={styles.arrivedButtonText}>I've Arrived</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8FBF2', // Light green base for map feel
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E8FBF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    backgroundColor: 'rgba(0, 183, 97, 0.1)',
    position: 'absolute',
  },
  pinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40, // Adjust for pin bottom alignment
  },
  pinShadow: {
    width: 20,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10,
    marginTop: -4,
  },
  topOverlayArea: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topCard: {
    margin: 20,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 20,
  },
  navIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00B761',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  instructionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  maneuverText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    lineHeight: 22,
  },
  distanceToTurn: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F3F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  metricItem: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  trafficStatus: {
    color: '#00B761',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: width,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    backgroundColor: '#EEE',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  sheetLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  locationIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8FBF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  destinationInfo: {
    flex: 1,
    marginLeft: 16,
  },
  destinationName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  arrivedButton: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#00B761',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  arrivedButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  contactActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00B761',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  contactButtonText: {
    color: '#00B761',
    fontSize: 15,
    fontWeight: '700',
  },
  endNavButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endNavText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '700',
  },
});
