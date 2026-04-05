import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ProviderAgreementScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Provider Agreement</Text>
        <View style={{ width: 40 }} /> {/* Spacer for alignment */}
      </View>

      {/* Document Content */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last Updated: March 26, 2026</Text>

          <Text style={styles.paragraph}>
            This Provider Agreement ("Agreement") is a binding contract between
            you ("Provider," "you," or "your") and ServEase ("Company," "we,"
            "us," or "our"). By registering as a service provider on the
            ServEase platform, you agree to be bound by these terms.
          </Text>

          <Text style={styles.sectionTitle}>
            1. Independent Contractor Status
          </Text>
          <Text style={styles.paragraph}>
            You acknowledge that you are an independent contractor and not an
            employee, agent, joint venturer, or partner of ServEase. You are
            solely responsible for all taxes, withholdings, and compliance with
            local regulations regarding your services.
          </Text>

          <Text style={styles.sectionTitle}>
            2. Service Quality and Professionalism
          </Text>
          <Text style={styles.paragraph}>
            You agree to perform all accepted service requests in a timely,
            professional, and workmanlike manner. You must maintain all
            necessary licenses, permits, and insurance required by your local
            jurisdiction to perform your designated services.
          </Text>

          <Text style={styles.sectionTitle}>3. Fees and Payments</Text>
          <Text style={styles.paragraph}>
            ServEase acts as a payment collection agent. You agree to our
            standard platform commission rates as outlined in your dashboard.
            Payouts will be processed according to the schedule specified in the
            ServEase payment terms.
          </Text>

          <Text style={styles.sectionTitle}>4. User Interactions</Text>
          <Text style={styles.paragraph}>
            You agree to maintain respectful and professional communication with
            all users. Harassment, discrimination, or unsafe behavior will
            result in immediate termination of your account.
          </Text>

          <Text style={styles.sectionTitle}>5. Account Termination</Text>
          <Text style={styles.paragraph}>
            ServEase reserves the right to suspend or terminate your account at
            any time for violations of this Agreement, low ratings, or failure
            to maintain required credentials.
          </Text>

          <View style={styles.footerSpacer} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0D1B2A",
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  lastUpdated: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 24,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0D1B2A",
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: "#444",
    lineHeight: 24,
  },
  footerSpacer: {
    height: 40,
  },
});
