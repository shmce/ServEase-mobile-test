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
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ProviderContactSupportScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert(
        "Missing Information",
        "Please fill in both the subject and message fields.",
      );
      return;
    }

    // Show success message and go back
    Alert.alert(
      "Message Sent",
      "Our support team has received your message and will get back to you within 24 hours.",
      [{ text: "OK", onPress: () => router.back() }],
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
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={{ width: 40 }} /> {/* Spacer for alignment */}
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.introText}>
            Need help? Reach out to us using the options below or send us a
            direct message.
          </Text>

          {/* Quick Contact Cards */}
          <View style={styles.quickContactContainer}>
            <TouchableOpacity style={styles.contactCard}>
              <View style={[styles.iconCircle, { backgroundColor: "#E8FBF2" }]}>
                <Ionicons name="call" size={24} color="#00B761" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Call Us</Text>
                <Text style={styles.contactDetail}>+63 917 123 4567</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactCard}>
              <View style={[styles.iconCircle, { backgroundColor: "#E8F4FF" }]}>
                <Ionicons name="mail" size={24} color="#1877F2" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Email Us</Text>
                <Text style={styles.contactDetail}>support@servease.com</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Contact Form */}
          <Text style={styles.sectionTitle}>Send a Message</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Subject <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="What is this regarding?"
              placeholderTextColor="#CCC"
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Message <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={6}
                placeholder="Describe your issue in detail..."
                placeholderTextColor="#CCC"
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSend}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Send Message</Text>
          </TouchableOpacity>

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
  quickContactContainer: {
    gap: 12,
    marginBottom: 32,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
    fontWeight: "500",
  },
  contactDetail: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0D1B2A",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0D1B2A",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
  },
  required: {
    color: "#FF6F61",
  },
  input: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: "#0D1B2A",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  textAreaContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  textArea: {
    fontSize: 15,
    color: "#0D1B2A",
    height: 120,
  },
  submitButton: {
    backgroundColor: "#00B761",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  footerSpacer: {
    height: 40,
  },
});
