import React, { useEffect, useMemo, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  Image, 
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase, identityDb, providerCatalogDb, bookingDb } from '@/lib/db';
import { getErrorMessage } from '@/lib/error-handling';
import { getBookingAttachments, type BookingAttachmentRow } from '@/services/bookingAttachmentService';
import {
  getPaymentByBookingId,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from '@/services/paymentService';
import { getCustomerBookingPresentation } from '@/lib/booking-status';
import { openPhoneCall } from '@/lib/communication';
import { useAuth } from '@/hooks/useAuth';
import { ImagePreviewModal } from '@/components/ui/image-preview-modal';
import {
  getCustomerChatSummaries,
  subscribeToChatSummaries,
  type ChatSummary,
} from '@/services/chatService';
import {
  getProviderAdditionalChargeRequests,
  getProviderRescheduleRequests,
  reviewAdditionalChargeRequest,
  reviewRescheduleRequest,
  type AdditionalChargeRow,
  type BookingRescheduleRequestRow,
} from '@/services/providerBookingActionsService';

const { width } = Dimensions.get('window');

const formatScheduleFromProposal = (dateRaw: string, timeRaw: string) => {
  const parsed = new Date(`${dateRaw} ${timeRaw}`);
  if (!Number.isNaN(parsed.getTime())) {
    return {
      date: parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
      year: String(parsed.getFullYear()),
      time: parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  }

  return {
    date: dateRaw,
    year: '',
    time: timeRaw,
  };
};

const BookingDetailsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ booking?: string; id?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [chatSummary, setChatSummary] = useState<ChatSummary | null>(null);
  const [attachments, setAttachments] = useState<BookingAttachmentRow[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<BookingAttachmentRow | null>(null);
  const [rescheduleRequests, setRescheduleRequests] = useState<BookingRescheduleRequestRow[]>([]);
  const [additionalChargeRequests, setAdditionalChargeRequests] = useState<AdditionalChargeRow[]>([]);
  const [requestAction, setRequestAction] = useState<'reschedule' | 'charges' | null>(null);

  const initialBooking = useMemo(() => {
    if (params.booking) {
      try {
        return JSON.parse(params.booking);
      } catch {}
    }
    return null;
  }, [params.booking]);

  const [booking, setBooking] = useState<any>(initialBooking);
  const provider = booking?.provider || {};
  const [payment, setPayment] = useState<any>(null);
  const bookingIdForChat = String(booking?.rawId || params.id || '').trim();
  const bookingId = String(booking?.rawId || params.id || '').trim();
  const countdown = booking?.countdown || {};
  const safeBooking = {
    id: booking?.id || 'Booking',
    rawId: booking?.rawId || '',
    service: booking?.service || 'Service Booking',
    address: booking?.address || 'No address provided.',
    date: booking?.date || 'N/A',
    year: booking?.year || '',
    time: booking?.time || 'N/A',
    totalAmount: booking?.totalAmount || '0.00',
    notes: booking?.notes || '',
  };

  const loadChatSummary = React.useCallback(async () => {
    if (!user?.id || !bookingIdForChat) {
      setChatSummary(null);
      return;
    }

    try {
      const summaries = await getCustomerChatSummaries(user.id);
      setChatSummary(summaries.find((entry) => entry.bookingId === bookingIdForChat) || null);
    } catch {
      setChatSummary(null);
    }
  }, [bookingIdForChat, user?.id]);

  useEffect(() => {
    let active = true;

    async function loadLiveBooking() {
      const bookingId = String(params.id || initialBooking?.id || '').trim();
      if (!bookingId || bookingId.startsWith('BK-')) return;

      setIsLoading(true);
      try {
        const { data: bookingRow, error: bookingError } = await bookingDb
          .from('bookings')
          .select('id,booking_reference,status,service_address,scheduled_at,total_amount,provider_id,service_id,customer_notes')
          .eq('id', bookingId)
          .maybeSingle();
        if (bookingError) throw bookingError;
        if (!bookingRow) return;

        const [providerRes, profileRes, serviceRes] = await Promise.all([
          identityDb.from('users').select('id,full_name,is_verified').eq('id', bookingRow.provider_id).maybeSingle(),
          providerCatalogDb
            .from('provider_profiles')
            .select('user_id,business_name,average_rating,verification_status')
            .eq('user_id', bookingRow.provider_id)
            .maybeSingle(),
          providerCatalogDb.from('provider_services').select('id,title').eq('id', bookingRow.service_id).maybeSingle(),
        ]);

        if (providerRes.error) throw providerRes.error;
        if (profileRes.error) throw profileRes.error;
        if (serviceRes.error) throw serviceRes.error;

        const scheduled = bookingRow.scheduled_at ? new Date(bookingRow.scheduled_at) : null;
        const now = new Date();
        const diffMs = scheduled ? Math.max(0, scheduled.getTime() - now.getTime()) : 0;
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        const statusRaw = String(bookingRow.status || 'Pending');
        const businessName = String(profileRes.data?.business_name || '').trim();
        const providerName = String(providerRes.data?.full_name || 'Service Provider');
        const serviceTitle = String(serviceRes.data?.title || initialBooking?.service || 'Service Booking');

        const normalized = {
          id: bookingRow.booking_reference || bookingRow.id,
          rawId: bookingRow.id,
          service: serviceTitle,
          address: bookingRow.service_address || 'N/A',
          date: scheduled
            ? scheduled.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
            : initialBooking?.date || 'N/A',
          year: scheduled ? String(scheduled.getFullYear()) : initialBooking?.year || '',
          time: scheduled
            ? scheduled.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            : initialBooking?.time || 'N/A',
          status: statusRaw,
          totalAmount: Number(bookingRow.total_amount || 0).toFixed(2),
          notes: String(bookingRow.customer_notes || '').trim(),
          countdown: {
            days: String(days),
            hours: String(hours),
            mins: String(mins),
          },
          provider: {
            id: bookingRow.provider_id,
            name: providerName,
            phone: providerRes.data?.contact_number || '',
            rating: Number(profileRes.data?.average_rating || 0).toFixed(1),
            specialty: businessName || serviceTitle,
            avatar: `https://i.pravatar.cc/150?u=${bookingRow.provider_id}`,
            isVerified: Boolean(providerRes.data?.is_verified) || String(profileRes.data?.verification_status || '').toLowerCase().includes('verified'),
          },
        };

        if (active) {
          setBooking((prev: any) => ({ ...prev, ...normalized }));
          try {
            const pay = await getPaymentByBookingId(String(bookingRow.id));
            if (active) setPayment(pay);
          } catch {
            if (active) setPayment(null);
          }
          try {
            const files = await getBookingAttachments(String(bookingRow.id));
            if (active) setAttachments(files);
          } catch {
            if (active) setAttachments([]);
          }
        }
      } catch (error) {
        console.error('Failed to load booking details:', error);
        if (active) {
          setBooking((prev: any) => ({
            ...prev,
            loadError: getErrorMessage(error, 'Failed to load live booking details.'),
          }));
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadLiveBooking();
    return () => {
      active = false;
    };
  }, [initialBooking?.date, initialBooking?.id, initialBooking?.service, initialBooking?.time, initialBooking?.year, params.id]);

  useEffect(() => {
    void loadChatSummary();
  }, [loadChatSummary]);

  useEffect(() => {
    if (!user?.id) return;

    return subscribeToChatSummaries({
      role: 'customer',
      userId: user.id,
      onChange: () => {
        void loadChatSummary();
      },
    });
  }, [loadChatSummary, user?.id]);

  const bookingState = getCustomerBookingPresentation(booking?.status);
  const isCompleted = bookingState.normalizedStatus === 'completed';
  const isCancelled = bookingState.normalizedStatus === 'cancelled';
  const isUpcoming = bookingState.tab === 'inProgress';
  const canReviewBooking = isCompleted;
  const canTrackBooking = bookingState.canTrack && Boolean(booking?.rawId || params.id);
  const canCancelBooking = bookingState.canCancel && Boolean(booking?.rawId || params.id);
  const pendingRescheduleRequest = rescheduleRequests.find(
    (entry) => String(entry.status || '').toLowerCase() === 'pending'
  ) || null;
  const pendingAdditionalCharges = additionalChargeRequests.filter(
    (entry) => String(entry.status || '').toLowerCase() === 'pending'
  );
  const pendingAdditionalChargeTotal = pendingAdditionalCharges.reduce(
    (sum, entry) => sum + Number(entry.amount || 0),
    0
  );

  useEffect(() => {
    let active = true;

    async function loadRequestState() {
      if (!bookingId) {
        if (active) {
          setRescheduleRequests([]);
          setAdditionalChargeRequests([]);
        }
        return;
      }

      try {
        const [reschedules, charges] = await Promise.all([
          getProviderRescheduleRequests(bookingId),
          getProviderAdditionalChargeRequests(bookingId),
        ]);

        if (!active) return;
        setRescheduleRequests(reschedules);
        setAdditionalChargeRequests(charges);
      } catch (error) {
        console.warn('Failed to load booking requests:', error);
        if (!active) return;
        setRescheduleRequests([]);
        setAdditionalChargeRequests([]);
      }
    }

    void loadRequestState();
    return () => {
      active = false;
    };
  }, [bookingId]);

  const refreshPayment = React.useCallback(async () => {
    if (!bookingId) {
      setPayment(null);
      return;
    }

    try {
      const pay = await getPaymentByBookingId(bookingId);
      setPayment(pay);
    } catch {
      setPayment(null);
    }
  }, [bookingId]);

  const refreshRequests = React.useCallback(async () => {
    if (!bookingId) {
      setRescheduleRequests([]);
      setAdditionalChargeRequests([]);
      return;
    }

    try {
      const [reschedules, charges] = await Promise.all([
        getProviderRescheduleRequests(bookingId),
        getProviderAdditionalChargeRequests(bookingId),
      ]);
      setRescheduleRequests(reschedules);
      setAdditionalChargeRequests(charges);
    } catch {
      setRescheduleRequests([]);
      setAdditionalChargeRequests([]);
    }
  }, [bookingId]);

  const handleReviewReschedule = React.useCallback(
    async (decision: 'approved' | 'declined') => {
      if (!pendingRescheduleRequest || !bookingId || !user?.id) return;

      setRequestAction('reschedule');
      try {
        const updated = await reviewRescheduleRequest({
          requestId: pendingRescheduleRequest.id,
          bookingId,
          customerId: user.id,
          decision,
        });

        if (decision === 'approved') {
          const nextSchedule = formatScheduleFromProposal(
            updated.proposed_date,
            updated.proposed_time
          );

          setBooking((prev: any) => ({
            ...prev,
            date: nextSchedule.date,
            year: nextSchedule.year,
            time: nextSchedule.time,
          }));
        }

        await refreshRequests();
        Alert.alert(
          decision === 'approved' ? 'Reschedule Approved' : 'Reschedule Declined',
          decision === 'approved'
            ? 'The provider will now see the updated service schedule.'
            : 'The provider has been notified that the reschedule was declined.'
        );
      } catch (error) {
        Alert.alert(
          'Review Failed',
          getErrorMessage(error, 'Could not review this reschedule request.')
        );
      } finally {
        setRequestAction(null);
      }
    },
    [bookingId, pendingRescheduleRequest, refreshRequests, user?.id]
  );

  const handleReviewAdditionalCharges = React.useCallback(
    async (decision: 'approved' | 'declined') => {
      if (!pendingAdditionalCharges.length || !bookingId || !user?.id) return;

      setRequestAction('charges');
      try {
        await reviewAdditionalChargeRequest({
          bookingId,
          customerId: user.id,
          chargeIds: pendingAdditionalCharges.map((entry) => entry.id),
          decision,
        });

        if (decision === 'approved') {
          setBooking((prev: any) => ({
            ...prev,
            totalAmount: (
              Number(prev?.totalAmount || 0) + pendingAdditionalChargeTotal
            ).toFixed(2),
          }));
          await refreshPayment();
        }

        await refreshRequests();
        Alert.alert(
          decision === 'approved' ? 'Charges Approved' : 'Charges Declined',
          decision === 'approved'
            ? 'The booking total was updated with the approved charges.'
            : 'The provider has been notified that the extra charges were declined.'
        );
      } catch (error) {
        Alert.alert(
          'Review Failed',
          getErrorMessage(error, 'Could not review these additional charges.')
        );
      } finally {
        setRequestAction(null);
      }
    },
    [bookingId, pendingAdditionalChargeTotal, pendingAdditionalCharges, refreshPayment, refreshRequests, user?.id]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))} 
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <Text style={styles.bookingId}>{safeBooking.id}</Text>
        </View>
        <View style={{ width: 40 }} /> {/* Spacer */}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#00C853" />
            <Text style={styles.loadingText}>Refreshing booking details from database...</Text>
          </View>
        ) : null}
        {booking?.loadError ? <Text style={styles.errorText}>{String(booking.loadError)}</Text> : null}
        
        {/* Status and Service Title */}
        <View style={styles.serviceInfoSection}>
          <View
            style={[
              styles.statusBadge,
              isCompleted && styles.statusBadgeCompleted,
              isCancelled && styles.statusBadgeCancelled,
            ]}
          >
              <View
              style={[
                styles.statusDot,
                isCompleted && styles.statusDotCompleted,
                isCancelled && styles.statusDotCancelled,
              ]}
            />
            <Text
              style={[
                styles.statusText,
                isCompleted && styles.statusTextCompleted,
                isCancelled && styles.statusTextCancelled,
              ]}
            >
              {bookingState.label}
            </Text>
          </View>
          <Text style={styles.serviceTitle}>{safeBooking.service}</Text>
          <Text style={styles.serviceAddress}>{safeBooking.address}</Text>
        </View>

        {/* Schedule Cards */}
        <View style={styles.scheduleContainer}>
          <View style={styles.scheduleCard}>
            <Ionicons name="calendar" size={24} color="#00C853" />
            <Text style={styles.scheduleDate}>{safeBooking.date}</Text>
            <Text style={styles.scheduleYear}>{safeBooking.year}</Text>
          </View>
          <View style={styles.scheduleCard}>
            <Ionicons name="time" size={24} color="#00C853" />
            <Text style={styles.scheduleTime}>{safeBooking.time}</Text>
            <Text style={styles.scheduleSub}>Scheduled</Text>
          </View>
        </View>

        {/* Status Summary */}
        {isUpcoming ? (
          <View style={styles.countdownSection}>
            <Text style={styles.countdownLabel}>SERVICE STARTS IN</Text>
            <View style={styles.timerRow}>
              <View style={styles.timerItem}>
                <View style={styles.timerBox}><Text style={styles.timerNumber}>{String(countdown.days || '0')}</Text></View>
                <Text style={styles.timerLabel}>DAYS</Text>
              </View>
              <Text style={styles.timerSeparator}>:</Text>
              <View style={styles.timerItem}>
                <View style={styles.timerBox}><Text style={styles.timerNumber}>{String(countdown.hours || '0')}</Text></View>
                <Text style={styles.timerLabel}>HRS</Text>
              </View>
              <Text style={styles.timerSeparator}>:</Text>
              <View style={styles.timerItem}>
                <View style={styles.timerBox}><Text style={styles.timerNumber}>{String(countdown.mins || '0')}</Text></View>
                <Text style={styles.timerLabel}>MINS</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.countdownSection, isCancelled && styles.countdownSectionCancelled]}>
            <Text style={styles.summaryTitle}>{bookingState.summaryTitle}</Text>
            <Text style={styles.summaryText}>{bookingState.summaryText}</Text>
          </View>
        )}

        {/* Provider Assigned Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PROVIDER ASSIGNED</Text>
        </View>
        <View style={styles.providerCard}>
          <View style={styles.providerHeader}>
            <View>
              <Image source={{ uri: provider.avatar || 'https://i.pravatar.cc/150?u=provider' }} style={styles.providerAvatar} />
              {provider.isVerified ? (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-sharp" size={10} color="#fff" />
                </View>
              ) : null}
            </View>
            <View style={styles.providerMainInfo}>
              <View style={styles.providerNameRow}>
                <Text style={styles.providerName}>{provider.name || 'Service Provider'}</Text>
                {provider.isVerified && (
                  <View style={styles.verifiedTag}>
                    <Ionicons name="shield-checkmark" size={12} color="#00C853" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
              <View style={styles.providerRatingRow}>
                <Ionicons name="star" size={14} color="#FFA000" />
                <Text style={styles.providerRating}>{provider.rating ?? '0.0'}</Text>
                <Text style={styles.providerSpecialty}> • {provider.specialty || safeBooking.service}</Text>
              </View>
            </View>
          </View>

          <View style={styles.providerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openPhoneCall(provider.phone, provider.name)}
            >
              <Ionicons name="call" size={18} color="#0D1B2A" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                router.push({
                  pathname: '/customer-chat',
                  params: {
                    id: String(booking.rawId || params.id || ''),
                    providerName: provider.name || 'Service Provider',
                    serviceName: provider.specialty || safeBooking.service,
                    phone: provider.phone || '',
                  },
                } as any)
              }
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="#0D1B2A" />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Booking Details Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>BOOKING DETAILS</Text>
        </View>
        <View style={styles.detailsCard}>
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="location-outline" size={20} color="#666" />
            </View>
            <View>
              <Text style={styles.detailLabel}>Service Address</Text>
              <Text style={styles.detailValue}>{safeBooking.address}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="wallet-outline" size={20} color="#666" />
            </View>
            <View>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>
                {getPaymentMethodLabel(payment?.method || 'cash')}
              </Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="card-outline" size={20} color="#666" />
            </View>
            <View>
              <Text style={styles.detailLabel}>Payment Status</Text>
              <Text style={styles.detailValue}>
                {getPaymentStatusLabel(payment?.status || 'pending')}
              </Text>
            </View>
          </View>
          {safeBooking.notes ? (
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="document-text-outline" size={20} color="#666" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Customer Notes</Text>
                <Text style={styles.detailValue}>{safeBooking.notes}</Text>
              </View>
            </View>
          ) : null}
          
          <View style={styles.priceContainer}>
            <Text style={styles.totalLabel}>Total Amount ({getPaymentMethodLabel(payment?.method || 'cash')})</Text>
            <Text style={styles.totalValue}>P{safeBooking.totalAmount}</Text>
          </View>
        </View>

        {attachments.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ATTACHMENTS</Text>
            </View>
            <View style={styles.detailsCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachmentGallery}>
                {attachments.map((attachment) => (
                  <TouchableOpacity
                    key={attachment.id}
                    style={styles.attachmentCard}
                    activeOpacity={0.9}
                    onPress={() => setPreviewAttachment(attachment)}
                  >
                    <Image source={{ uri: attachment.file_url }} style={styles.attachmentPreview} />
                    <Text style={styles.attachmentTitle} numberOfLines={1}>
                      {attachment.file_name || 'Attachment'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        ) : null}

        {pendingRescheduleRequest ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PENDING RESCHEDULE REQUEST</Text>
            </View>
            <View style={styles.requestCard}>
              <View style={styles.requestHeaderRow}>
                <View style={styles.requestIconWrap}>
                  <Ionicons name="calendar-outline" size={18} color="#00C853" />
                </View>
                <View style={styles.requestContent}>
                  <Text style={styles.requestTitle}>Provider requested a new schedule</Text>
                  <Text style={styles.requestSubtitle}>
                    {pendingRescheduleRequest.proposed_date} at {pendingRescheduleRequest.proposed_time}
                  </Text>
                </View>
              </View>
              <Text style={styles.requestBody}>{pendingRescheduleRequest.reason}</Text>
              <Text style={styles.requestExplanation}>{pendingRescheduleRequest.explanation}</Text>
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={styles.requestDeclineButton}
                  disabled={requestAction === 'reschedule'}
                  onPress={() => void handleReviewReschedule('declined')}
                >
                  <Text style={styles.requestDeclineText}>
                    {requestAction === 'reschedule' ? 'Saving...' : 'Decline'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.requestApproveButton}
                  disabled={requestAction === 'reschedule'}
                  onPress={() => void handleReviewReschedule('approved')}
                >
                  <Text style={styles.requestApproveText}>
                    {requestAction === 'reschedule' ? 'Saving...' : 'Approve'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : null}

        {pendingAdditionalCharges.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PENDING ADDITIONAL CHARGES</Text>
            </View>
            <View style={styles.requestCard}>
              <View style={styles.requestHeaderRow}>
                <View style={[styles.requestIconWrap, styles.requestIconWrapWarn]}>
                  <Ionicons name="cash-outline" size={18} color="#C77800" />
                </View>
                <View style={styles.requestContent}>
                  <Text style={styles.requestTitle}>Provider requested extra charges</Text>
                  <Text style={styles.requestSubtitle}>
                    +P{pendingAdditionalChargeTotal.toFixed(2)} across {pendingAdditionalCharges.length}{' '}
                    {pendingAdditionalCharges.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>
              </View>
              {pendingAdditionalCharges.map((charge) => (
                <View key={charge.id} style={styles.chargeItemRow}>
                  <View style={styles.chargeItemTextWrap}>
                    <Text style={styles.chargeItemTitle}>{charge.description}</Text>
                    {charge.justification ? (
                      <Text style={styles.chargeItemBody}>{charge.justification}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.chargeAmount}>P{Number(charge.amount || 0).toFixed(2)}</Text>
                </View>
              ))}
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={styles.requestDeclineButton}
                  disabled={requestAction === 'charges'}
                  onPress={() => void handleReviewAdditionalCharges('declined')}
                >
                  <Text style={styles.requestDeclineText}>
                    {requestAction === 'charges' ? 'Saving...' : 'Decline'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.requestApproveButton}
                  disabled={requestAction === 'charges'}
                  onPress={() => void handleReviewAdditionalCharges('approved')}
                >
                  <Text style={styles.requestApproveText}>
                    {requestAction === 'charges' ? 'Saving...' : 'Approve'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : null}

        {chatSummary ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>RECENT CONTACT</Text>
            </View>
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() =>
                router.push({
                  pathname: '/customer-chat',
                  params: {
                    id: String(booking.rawId || params.id || ''),
                    providerName: provider.name || 'Service Provider',
                    serviceName: provider.specialty || safeBooking.service,
                    phone: provider.phone || '',
                  },
                } as any)
              }
            >
              <View style={styles.contactIconWrap}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#00C853" />
              </View>
              <View style={styles.contactContent}>
                <View style={styles.contactTitleRow}>
                  <Text style={styles.contactTitle}>Last message {chatSummary.lastMessageTime}</Text>
                  {chatSummary.unreadCount > 0 ? (
                    <View style={styles.contactUnreadPill}>
                      <Text style={styles.contactUnreadText}>
                        {chatSummary.unreadCount > 1
                          ? `${chatSummary.unreadCount} new messages`
                          : 'New message'}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.contactBody} numberOfLines={2}>
                  {chatSummary.lastMessage}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </>
        ) : null}

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          {canReviewBooking ? (
            <>
              <TouchableOpacity 
                style={[styles.cancelBookingButton, { borderColor: '#00C853', backgroundColor: '#E8FBF2', marginBottom: 15 }]}
                onPress={() => router.push({
                  pathname: '/customer-review',
                  params: {
                    booking: JSON.stringify({
                      ...booking,
                      providerId: booking?.providerId || booking?.provider?.id || '',
                      provider: {
                        ...(booking?.provider || {}),
                        id: booking?.provider?.id || booking?.providerId || '',
                      },
                    }),
                  }
                })}
              >
                <Ionicons name="star" size={20} color="#00C853" />
                <Text style={[styles.cancelBookingText, { color: '#00C853' }]}>Leave a Review</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.rebookButton}
                onPress={() => router.push({
                  pathname: '/customer-book-again',
                  params: { booking: JSON.stringify(booking) }
                } as any)}
              >
                <Ionicons name="refresh-outline" size={20} color="#fff" />
                <Text style={styles.rebookButtonText}>Book Again</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {isUpcoming ? (
            <>
              {canTrackBooking ? (
                <TouchableOpacity
                  style={styles.trackBookingButton}
                  onPress={() =>
                    router.push({
                      pathname: '/customer-track-order',
                      params: {
                        id: String(booking.rawId || params.id || ''),
                        booking: JSON.stringify(booking),
                      },
                    } as any)
                  }
                >
                  <Ionicons name="location-outline" size={20} color="#fff" />
                  <Text style={styles.trackBookingText}>Track Booking</Text>
                </TouchableOpacity>
              ) : null}

              {canCancelBooking ? (
              <TouchableOpacity 
                style={styles.cancelBookingButton}
                onPress={() =>
                  router.push({
                    pathname: '/customer-cancel-booking',
                    params: {
                      id: String(booking.rawId || booking.id || ''),
                      booking: JSON.stringify(booking),
                    },
                  } as any)
                }
              >
                <Ionicons name="close" size={20} color="#FF5252" />
                <Text style={styles.cancelBookingText}>Cancel Booking</Text>
              </TouchableOpacity>
              ) : null}
              <Text style={styles.policyFootnote}>Free cancellation up to 24 hours before the service</Text>
            </>
          ) : null}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ImagePreviewModal
        visible={Boolean(previewAttachment)}
        imageUrl={previewAttachment?.file_url || ''}
        title={previewAttachment?.file_name || 'Attachment Preview'}
        onClose={() => setPreviewAttachment(null)}
      />
    </SafeAreaView>
  );
};

export default BookingDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  bookingId: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 25,
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  loadingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  serviceInfoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: '#F8FBF9', // Very light green tint
    paddingVertical: 15,
    borderRadius: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
  },
  statusBadgeCompleted: {
    backgroundColor: '#E8FBF2',
  },
  statusBadgeCancelled: {
    backgroundColor: '#FFF1F1',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00C853',
    marginRight: 8,
  },
  statusDotCompleted: {
    backgroundColor: '#00C853',
  },
  statusDotCancelled: {
    backgroundColor: '#FF5252',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#008C4A',
  },
  statusTextCompleted: {
    color: '#008C4A',
  },
  statusTextCancelled: {
    color: '#C62828',
  },
  serviceTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  serviceAddress: {
    fontSize: 14,
    color: '#999',
  },
  scheduleContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
  },
  scheduleCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  scheduleDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
    marginTop: 10,
  },
  scheduleYear: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
    marginTop: 10,
  },
  scheduleSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  countdownSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F0F0F5',
  },
  countdownSectionCancelled: {
    backgroundColor: '#FFF8F8',
  },
  countdownLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D1B2A',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  timerItem: {
    alignItems: 'center',
  },
  timerBox: {
    width: 60,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  timerNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00C853',
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#BABABA',
    marginTop: 8,
  },
  timerSeparator: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DDD',
    marginTop: -20,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BABABA',
    letterSpacing: 1,
  },
  providerCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00C853',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerMainInfo: {
    flex: 1,
    marginLeft: 15,
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FBF2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00C853',
  },
  providerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  providerRating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1B1E',
    marginLeft: 4,
  },
  providerSpecialty: {
    fontSize: 13,
    color: '#999',
  },
  providerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F5F5F7',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#BABABA',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
    marginTop: 2,
    maxWidth: width * 0.6,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F7',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00C853',
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    padding: 16,
    marginBottom: 28,
  },
  requestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  requestIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8FBF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestIconWrapWarn: {
    backgroundColor: '#FFF4E5',
  },
  requestContent: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  requestSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  requestBody: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 6,
  },
  requestExplanation: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  requestDeclineButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFDADA',
    backgroundColor: '#FFF8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestDeclineText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF5252',
  },
  requestApproveButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestApproveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  chargeItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  chargeItemTextWrap: {
    flex: 1,
  },
  chargeItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  chargeItemBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    marginTop: 4,
  },
  chargeAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C77800',
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    padding: 16,
    marginBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8FBF2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
    marginRight: 12,
  },
  contactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D1B2A',
    flex: 1,
  },
  contactUnreadPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E8FBF2',
  },
  contactUnreadText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00B761',
  },
  contactBody: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
  },
  bottomActions: {
    alignItems: 'center',
    gap: 15,
  },
  rebookButton: {
    width: '100%',
    height: 56,
    borderRadius: 20,
    backgroundColor: '#00C853',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trackBookingButton: {
    width: '100%',
    height: 56,
    borderRadius: 20,
    backgroundColor: '#00C853',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelBookingButton: {
    width: '100%',
    height: 56,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFDADA',
    backgroundColor: '#FFF8F8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelBookingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF5252',
  },
  trackBookingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  rebookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  policyFootnote: {
    fontSize: 12,
    color: '#BABABA',
    textAlign: 'center',
  },
});

