import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function CustomerTrackOrderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let channel: any;

    async function fetchBooking() {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          provider_catalog_svc:provider_profiles(
            user_profiles(full_name, avatar_url)
          )
        `)
        .eq('id', id)
        .single();

      if (data && !error) {
        setBooking(data);

        // Subscribe to real-time changes
        channel = supabase
          .channel(`track-booking-${id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'bookings',
              filter: `id=eq.${id}`,
            },
            (payload) => {
              setBooking((prev: any) => ({ ...prev, ...payload.new }));
            }
          )
          .subscribe();
      }
      setIsLoading(false);
    }

    fetchBooking();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [id]);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#00C853" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Booking not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#00C853' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const providerInfo = booking.provider_catalog_svc?.user_profiles;
  const status = booking.status;

  const getStepStatus = (step: string) => {
    const statusOrder = ['pending', 'confirmed', 'on_the_way', 'in_progress', 'completed'];
    const currentIndex = statusOrder.indexOf(status);
    const stepIndex = statusOrder.indexOf(step);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'inactive';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Map View Mockup */}
      <View style={styles.mapContainer}>
        <View style={styles.mapGridHorizontal} />
        <View style={[styles.mapGridHorizontal, { top: height * 0.2 }]} />
        <View style={[styles.mapGridHorizontal, { top: height * 0.4 }]} />
        <View style={styles.mapGridVertical} />
        <View style={[styles.mapGridVertical, { left: width * 0.5 }]} />
        
        <View style={styles.etaBubble}>
          <Ionicons name="navigate-outline" size={16} color="#00C853" style={{ marginRight: 8 }} />
          <Text style={styles.etaBubbleText}>
            {status === 'on_the_way' ? 'Estimated arrival: 12 mins' : 
             status === 'in_progress' ? 'Service is in progress' : 
             'Awaiting provider...'}
          </Text>
        </View>

        {providerInfo && (
          <View style={styles.providerMarker}>
            <View style={styles.markerCircle}>
              <MaterialCommunityIcons name="motorbike" size={24} color="#fff" />
            </View>
            <View style={styles.markerLabel}>
              <Text style={styles.markerText}>{providerInfo.full_name?.split(' ')[0]}</Text>
            </View>
          </View>
        )}

        <View style={styles.pathLine} />
      </View>

      {/* Header Overlay */}
      <SafeAreaView style={styles.headerOverlay}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.closeButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Live Tracking</Text>
            <Text style={styles.headerSubtitle}>ID: {id?.slice(0, 8)}</Text>
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
          {['confirmed', 'on_the_way', 'in_progress', 'completed'].map((step, index, arr) => {
            const stepState = getStepStatus(step);
            const label = step === 'on_the_way' ? 'On the Way' : 
                          step === 'in_progress' ? 'Started' : 
                          step.charAt(0).toUpperCase() + step.slice(1);
            
            return (
              <React.Fragment key={step}>
                <View style={styles.stepItem}>
                  <View style={[
                    styles.stepCircle, 
                    stepState === 'completed' && styles.stepCompleted,
                    stepState === 'active' && styles.stepActive
                  ]}>
                    {stepState === 'completed' ? (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    ) : stepState === 'active' ? (
                      <View style={styles.activeDot} />
                    ) : (
                      <View style={styles.inactiveDot} />
                    )}
                  </View>
                  <Text style={[
                    styles.stepLabel, 
                    stepState !== 'inactive' && styles.stepLabelActive
                  ]}>{label}</Text>
                </View>
                {index < arr.length - 1 && (
                  <View style={[
                    styles.stepLine, 
                    stepState === 'completed' && styles.stepLineCompleted
                  ]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Provider Card */}
        <View style={styles.providerCard}>
          <Image 
            source={{ uri: providerInfo?.avatar_url || 'https://via.placeholder.com/150' }} 
            style={styles.providerAvatar} 
          />
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{providerInfo?.full_name || 'Service Provider'}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FFA000" />
              <Text style={styles.ratingText}>4.8 · {booking.service_name || 'Service'}</Text>
            </View>
          </View>
          {(status === 'on_the_way' || status === 'confirmed') && (
            <View style={styles.etaBadge}>
              <Text style={styles.etaTime}>12 mins</Text>
              <Text style={styles.etaLabel}>ETA</Text>
            </View>
          )}
        </View>

        {/* Booking Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={18} color="#999" style={{ marginRight: 12 }} />
            <Text style={styles.detailText}>{booking.address || 'Address not set'}</Text>
          </View>
          <View style={[styles.detailItem, { marginTop: 15 }]}>
            <Ionicons name="calendar-outline" size={18} color="#999" style={{ marginRight: 12 }} />
            <Text style={styles.detailText}>
              {`${new Date(booking.scheduled_at || booking.created_at).toLocaleDateString()} · ${new Date(booking.scheduled_at || booking.created_at).toLocaleTimeString()}`}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>₱{(booking.total_price || 0).toLocaleString()}.00</Text>
          </View>
        </View>

        {status === 'pending' || status === 'confirmed' ? (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.push({ pathname: '/customer-cancel-booking', params: { id: booking.id } } as any)}
          >
            <Ionicons name="close" size={18} color="#FF5252" style={{ marginRight: 8 }} />
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.cancelButton, { opacity: 0.5, borderColor: '#EEE', backgroundColor: '#F9F9F9' }]}>
            <Text style={[styles.cancelButtonText, { color: '#AAA' }]}>Cancellation Unavailable</Text>
          </View>
        )}
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
