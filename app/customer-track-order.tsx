import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function CustomerTrackOrderScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Map View Mockup */}
      <View style={styles.mapContainer}>
        {/* Simple grid lines to simulate a map */}
        <View style={styles.mapGridHorizontal} />
        <View style={[styles.mapGridHorizontal, { top: height * 0.2 }]} />
        <View style={[styles.mapGridHorizontal, { top: height * 0.4 }]} />
        <View style={styles.mapGridVertical} />
        <View style={[styles.mapGridVertical, { left: width * 0.5 }]} />
        
        {/* Map Objects */}
        <View style={styles.etaBubble}>
          <Ionicons name="navigate-outline" size={16} color="#00C853" style={{ marginRight: 8 }} />
          <Text style={styles.etaBubbleText}>Estimated arrival: 12 mins</Text>
        </View>

        <View style={styles.providerMarker}>
          <View style={styles.markerCircle}>
            <MaterialCommunityIcons name="motorbike" size={24} color="#fff" />
          </View>
          <View style={styles.markerLabel}>
            <Text style={styles.markerText}>Maria</Text>
          </View>
        </View>

        {/* Path Line Mockup */}
        <View style={styles.pathLine} />
      </View>

      {/* Header Overlay */}
      <SafeAreaView style={styles.headerOverlay}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))} 
            style={styles.closeButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Live Tracking</Text>
            <Text style={styles.headerSubtitle}>BK-2026-03-012</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionIconBtn}>
              <Ionicons name="call" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: '#F8F9FA', marginLeft: 10 }]}>
              <Ionicons name="chatbubble-outline" size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        
        {/* Progress Stepper */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCompleted]}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelCompleted]}>Booked</Text>
          </View>
          <View style={[styles.stepLine, styles.stepLineCompleted]} />
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepActive]}>
              <View style={styles.activeDot} />
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>On the Way</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepItem}>
            <View style={styles.stepCircle}>
              <View style={styles.inactiveDot} />
            </View>
            <Text style={styles.stepLabel}>Arrived</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepItem}>
            <View style={styles.stepCircle}>
              <View style={styles.inactiveDot} />
            </View>
            <Text style={styles.stepLabel}>In Progress</Text>
          </View>
        </View>

        {/* Provider Card */}
        <View style={styles.providerCard}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=60' }} 
            style={styles.providerAvatar} 
          />
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>Maria Santos</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FFA000" />
              <Text style={styles.ratingText}>4.8 · House Cleaning</Text>
            </View>
          </View>
          <View style={styles.etaBadge}>
            <Text style={styles.etaTime}>12 mins</Text>
            <Text style={styles.etaLabel}>ETA</Text>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={18} color="#999" style={{ marginRight: 12 }} />
            <Text style={styles.detailText}>123 Rizal St, Makati City</Text>
          </View>
          <View style={[styles.detailItem, { marginTop: 15 }]}>
            <Ionicons name="calendar-outline" size={18} color="#999" style={{ marginRight: 12 }} />
            <Text style={styles.detailText}>March 14, 2026 · 10:00 AM</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>₱1,500.00</Text>
          </View>
        </View>

        {/* Footer Actions */}
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => router.push('/customer-cancel-booking' as any)}
        >
          <Ionicons name="close" size={18} color="#FF5252" style={{ marginRight: 8 }} />
          <Text style={styles.cancelButtonText}>Cancel Booking</Text>
        </TouchableOpacity>
        <Text style={styles.cancelFooterText}>Free cancellation up to 24 hours before the service</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#F1F8F5', // Light green map background
  },
  mapGridHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    top: height * 0.3,
  },
  mapGridVertical: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    left: width * 0.4,
  },
  etaBubble: {
    position: 'absolute',
    top: height * 0.15,
    alignSelf: 'center',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  etaBubbleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  providerMarker: {
    position: 'absolute',
    top: height * 0.35,
    left: width * 0.2,
    alignItems: 'center',
  },
  markerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2D3436', // Dark gray marker
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerLabel: {
    backgroundColor: '#2D3436',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 5,
  },
  markerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pathLine: {
    position: 'absolute',
    width: 2,
    height: 150,
    backgroundColor: '#00C853',
    top: height * 0.43,
    left: width * 0.28,
    transform: [{ rotate: '45deg' }],
    opacity: 0.5,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 25,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCompleted: {
    backgroundColor: '#00C853',
  },
  stepActive: {
    backgroundColor: '#E8FBF2',
    borderWidth: 2,
    borderColor: '#00C853',
  },
  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00C853',
  },
  inactiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#BDBDBD',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#999',
  },
  stepLabelCompleted: {
    color: '#00C853',
  },
  stepLabelActive: {
    color: '#00C853',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#F0F0F0',
    marginBottom: 18,
    marginHorizontal: -5,
  },
  stepLineCompleted: {
    backgroundColor: '#00C853',
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 20,
    marginBottom: 20,
  },
  providerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#00C853',
    marginRight: 15,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  etaBadge: {
    backgroundColor: '#E8FBF2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  etaTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00C853',
  },
  etaLabel: {
    fontSize: 10,
    color: '#00C853',
    fontWeight: '600',
    marginTop: 2,
  },
  detailsSection: {
    marginBottom: 30,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00C853',
  },
  cancelButton: {
    height: 55,
    borderRadius: 27.5,
    borderWidth: 1,
    borderColor: '#FFCACA',
    backgroundColor: '#FFF5F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cancelButtonText: {
    color: '#FF5252',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cancelFooterText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
});

