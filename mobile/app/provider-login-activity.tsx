import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Mock Data for active sessions
const initialSessions = [
  {
    id: "1",
    device: "iPhone 14 Pro",
    location: "Manila, Philippines",
    time: "Active now",
    isCurrent: true,
    icon: "phone-portrait-outline",
  },
  {
    id: "2",
    device: "MacBook Air (Mac OS)",
    location: "Quezon City, Philippines",
    time: "Yesterday at 10:45 AM",
    isCurrent: false,
    icon: "laptop-outline",
  },
  {
    id: "3",
    device: "Windows PC (Chrome)",
    location: "Makati, Philippines",
    time: "March 20 at 2:15 PM",
    isCurrent: false,
    icon: "desktop-outline",
  },
];

export default function ProviderLoginActivityScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);

  const handleLogoutAll = () => {
    Alert.alert(
      "Log out of all other devices?",
      "You will be logged out of all devices except this one. You will need to log back in on your other devices.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out All",
          style: "destructive",
          onPress: () => {
            // Filter out everything except the current device
            setSessions(sessions.filter((s) => s.isCurrent));
          },
        },
      ],
    );
  };

  const handleLogoutSingle = (id: string, deviceName: string) => {
    Alert.alert(
      "Log out device?",
      `Are you sure you want to log out of the ${deviceName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            setSessions(sessions.filter((s) => s.id !== id));
          },
        },
      ],
    );
  };

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
        <Text style={styles.headerTitle}>Login Activity</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.introText}>
            Here is a list of devices that have logged into your account. Revoke
            any sessions that you do not recognize.
          </Text>

          <Text style={styles.sectionTitle}>Where you're logged in</Text>

          {/* Sessions List */}
          <View style={styles.sessionsContainer}>
            {sessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View
                  style={[
                    styles.iconBox,
                    session.isCurrent ? styles.activeIconBox : {},
                  ]}
                >
                  <Ionicons
                    name={session.icon as any}
                    size={24}
                    color={session.isCurrent ? "#00B761" : "#555"}
                  />
                </View>

                <View style={styles.sessionInfo}>
                  <Text style={styles.deviceText}>{session.device}</Text>
                  <Text style={styles.locationText}>{session.location}</Text>
                  <Text
                    style={[
                      styles.timeText,
                      session.isCurrent && styles.activeTimeText,
                    ]}
                  >
                    {session.time}
                  </Text>
                </View>

                {!session.isCurrent && (
                  <TouchableOpacity
                    style={styles.logoutSingleButton}
                    onPress={() =>
                      handleLogoutSingle(session.id, session.device)
                    }
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={20}
                      color="#FF6F61"
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Log Out All Button */}
          {sessions.length > 1 && (
            <TouchableOpacity
              style={styles.logoutAllButton}
              onPress={handleLogoutAll}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutAllText}>
                Log out of all other devices
              </Text>
            </TouchableOpacity>
          )}

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
    backgroundColor: "#FFF",
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
  introText: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0D1B2A",
    marginBottom: 16,
  },
  sessionsContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E9ECEF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  activeIconBox: {
    backgroundColor: "#E8FBF2",
  },
  sessionInfo: {
    flex: 1,
  },
  deviceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0D1B2A",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 13,
    color: "#555",
    marginBottom: 2,
  },
  timeText: {
    fontSize: 13,
    color: "#8E8E93",
  },
  activeTimeText: {
    color: "#00B761",
    fontWeight: "600",
  },
  logoutSingleButton: {
    padding: 8,
    backgroundColor: "#FFF1F0",
    borderRadius: 8,
  },
  logoutAllButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF6F61",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  logoutAllText: {
    color: "#FF6F61",
    fontSize: 15,
    fontWeight: "700",
  },
  footerSpacer: {
    height: 40,
  },
});
