import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');

interface Address {
  id: string;
  type: 'Home' | 'Office' | 'Other';
  addressLine1: string;
  addressLine2: string;
  isDefault: boolean;
}

const INITIAL_ADDRESSES: Address[] = [
  {
    id: '1',
    type: 'Home',
    addressLine1: '123 Mabini Street, Barangay San Jose',
    addressLine2: 'Quezon City, Metro Manila 1100',
    isDefault: true,
  },
  {
    id: '2',
    type: 'Office',
    addressLine1: '456 Ayala Avenue, Makati Central Business District',
    addressLine2: 'Makati City, Metro Manila 1226',
    isDefault: false,
  },
  {
    id: '3',
    type: 'Other',
    addressLine1: '789 Rizal Boulevard, Bonifacio Global City',
    addressLine2: 'Taguig City, Metro Manila 1634',
    isDefault: false,
  },
];

const AddressCard = ({ 
  address, 
  onSetDefault,
  onEdit 
}: { 
  address: Address; 
  onSetDefault: (id: string) => void;
  onEdit: (id: string) => void;
}) => {
  const getIcon = () => {
    switch (address.type) {
      case 'Home': return 'home-outline';
      case 'Office': return 'business-outline';
      default: return 'location-outline';
    }
  };

  return (
    <View style={styles.addressCard}>
      <View style={styles.cardHeader}>
        <View style={styles.typeContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name={getIcon()} size={20} color="#00B761" />
          </View>
          <View>
            <Text style={styles.addressType}>{address.type}</Text>
            {address.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <View style={styles.addressInfo}>
        <Text style={styles.addressLine1}>{address.addressLine1}</Text>
        <Text style={styles.addressLine2}>{address.addressLine2}</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton, address.isDefault && { width: '100%' }]}
          onPress={() => onEdit(address.id)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        
        {!address.isDefault && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.setDefaultButton]}
            onPress={() => onSetDefault(address.id)}
          >
            <Text style={styles.setDefaultText}>Set as Default</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default function ManageAddressesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);

  useEffect(() => {
    let changed = false;
    if (params.newAddress) {
      try {
        const parsed = JSON.parse(params.newAddress as string);
        setAddresses(prev => {
          if (prev.find(a => a.id === parsed.id)) return prev;
          return [...prev, parsed];
        });
        changed = true;
      } catch(e) {}
    }
    if (params.updatedAddress) {
      try {
        const parsed = JSON.parse(params.updatedAddress as string);
        setAddresses(prev => prev.map(a => a.id === parsed.id ? parsed : a));
        changed = true;
      } catch(e) {}
    }
    if (params.deletedAddressId) {
      const idStr = params.deletedAddressId as string;
      setAddresses(prev => prev.filter(a => a.id !== idStr));
      changed = true;
    }
    
    if (changed) {
      router.setParams({ newAddress: '', updatedAddress: '', deletedAddressId: '' });
    }
  }, [params.newAddress, params.updatedAddress, params.deletedAddressId]);

  const handleSetDefault = (id: string) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
  };

  const handleEdit = (id: string) => {
    const addr = addresses.find(a => a.id === id);
    if (addr) {
      router.push({
        pathname: '/edit-address',
        params: { address: JSON.stringify(addr) }
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Addresses</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Add New Address Button */}
        <TouchableOpacity 
          style={styles.addAddressButton}
          onPress={() => router.push('/add-address')}
        >
          <Ionicons name="add" size={24} color="#FFF" />
          <Text style={styles.addAddressText}>Add New Address</Text>
        </TouchableOpacity>

        {/* Address Cards */}
        {addresses.map(address => (
          <AddressCard 
            key={address.id} 
            address={address} 
            onSetDefault={handleSetDefault}
            onEdit={handleEdit}
          />
        ))}

        <View style={styles.footerSpacer} />
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B761',
    borderRadius: 12,
    height: 56,
    marginBottom: 24,
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  addAddressText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  addressCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8FBF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  defaultBadge: {
    backgroundColor: '#E8FBF2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00B761',
  },
  moreButton: {
    padding: 4,
  },
  addressInfo: {
    marginBottom: 20,
  },
  addressLine1: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  addressLine2: {
    fontSize: 13,
    color: '#8E8E93',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  setDefaultButton: {
    backgroundColor: '#00B761',
  },
  setDefaultText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  footerSpacer: {
    height: 40,
  },
});
