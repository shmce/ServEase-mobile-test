import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, TextInput, Image, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function ProviderAdditionalChargesScreen() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [justification, setJustification] = useState('');
  const [items, setItems] = useState<{ id: string, desc: string, amt: number }[]>([]);

  const originalPrice = 2500;

  const handleAddItem = () => {
    if (!description || !amount) return;
    const newItem = {
      id: Date.now().toString(),
      desc: description,
      amt: parseFloat(amount) || 0,
    };
    setItems([...items, newItem]);
    setDescription('');
    setAmount('');
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const totalAdditional = items.reduce((sum, item) => sum + item.amt, 0);
  const newTotal = originalPrice + totalAdditional;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Additional Charges</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            {/* Current Price Card */}
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Current Booking Price</Text>
              <Text style={styles.priceAmount}>₱2,500</Text>
            </View>

            {/* Additional Charges Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Additional Charges</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Extra pipe replacement"
                  placeholderTextColor="#AAA"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (₱)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0.00"
                  placeholderTextColor="#AAA"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
                <Ionicons name="add" size={20} color="#00B761" />
                <Text style={styles.addItemText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {/* Added Items List */}
            {items.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Additional Items ({items.length})</Text>
                {items.map((item) => (
                  <View key={item.id} style={styles.addedItemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.desc}</Text>
                      <Text style={styles.itemAmount}>₱{item.amt.toLocaleString()}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeButton}>
                      <Ionicons name="close" size={20} color="#FF4D4D" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Summary Card */}
            {items.length > 0 && (
              <View style={[styles.sectionCard, styles.summaryCard]}>
                <Text style={styles.summaryLabel}>Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryText}>Original Amount</Text>
                  <Text style={styles.summaryValue}>₱{originalPrice.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryText, styles.greenText]}>Total Additional Charges</Text>
                  <Text style={[styles.summaryValue, styles.greenText]}>+₱{totalAdditional.toLocaleString()}</Text>
                </View>
                <View style={[styles.divider, { marginVertical: 12 }]} />
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>New Total Amount</Text>
                  <Text style={styles.totalValue}>₱{newTotal.toLocaleString()}</Text>
                </View>
              </View>
            )}

            {/* Justification Section */}
            <View style={styles.sectionCard}>
              <View style={styles.labelRow}>
                <Text style={styles.sectionTitle}>Justification</Text>
                <Text style={styles.requiredAsterisk}>*</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Explain why these additional charges are necessary..."
                placeholderTextColor="#AAA"
                value={justification}
                onChangeText={setJustification}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Warning Alert */}
            <View style={styles.warningAlert}>
              <Ionicons name="alert-circle-outline" size={20} color="#8B6E12" />
              <Text style={styles.warningText}>
                Customer must approve before charges are applied
              </Text>
            </View>

          </View>
        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.sendButton, !justification && styles.sendButtonDisabled]}
            disabled={!justification}
          >
            <Text style={styles.sendButtonText}>Send Request to Customer</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginLeft: 8,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  priceCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  priceLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0D1B2A',
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requiredAsterisk: {
    color: '#FF4D4D',
    fontSize: 16,
    marginLeft: 4,
    marginTop: -8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#444',
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F2F3F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: '#0D1B2A',
  },
  textArea: {
    height: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00B761' + '40', // Semi-transparent green
    marginTop: 8,
    gap: 8,
  },
  addItemText: {
    color: '#00B761',
    fontWeight: '700',
    fontSize: 15,
  },
  addedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  itemAmount: {
    fontSize: 14,
    color: '#00B761',
    fontWeight: '600',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  summaryCard: {
    borderColor: '#00B761',
    borderWidth: 1.5,
    backgroundColor: '#F8F9FA' + '50',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#555',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  greenText: {
    color: '#00B761',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#DDD',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D1B2A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00B761',
  },
  warningAlert: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#8B6E12' + '20',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#8B6E12',
    fontWeight: '700',
    lineHeight: 18,
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sendButton: {
    backgroundColor: '#99E6C3', // Branded light green from mockup
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
