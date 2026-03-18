import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

type Service = {
  id: string;
  title: string;
  description: string;
  price: string;
  image: string;
};

const CATEGORY_DATA: Record<string, Service[]> = {
  'Home Maintenance & Repair': [
    {
      id: '1',
      title: 'General Plumbing Repair',
      description: 'Fix leaks, clogs, and install fixtures',
      price: '75',
      image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '2',
      title: 'Electrical Repair & Installation',
      description: 'Wiring, outlets, and lighting fixes',
      price: '85',
      image: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '3',
      title: 'Carpentry & Woodwork',
      description: 'Furniture repair and custom woodwork',
      price: '90',
      image: 'https://images.unsplash.com/photo-1621905252507-b3522e407fab?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '4',
      title: 'HVAC Maintenance',
      description: 'AC and heating system service',
      price: '110',
      image: 'https://images.unsplash.com/photo-1599933023673-c248a742ce95?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '5',
      title: 'Roof Inspection & Repair',
      description: 'Identify and fix roof issues',
      price: '150',
      image: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '6',
      title: 'Door & Window Repair',
      description: 'Fix or replace doors and windows',
      price: '95',
      image: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '7',
      title: 'Drywall Patching',
      description: 'Repair holes and cracks in walls',
      price: '65',
      image: 'https://images.unsplash.com/photo-1589939705384-5185138a04b9?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '8',
      title: 'Gutter Cleaning & Repair',
      description: 'Clear and fix gutters and downspouts',
      price: '80',
      image: 'https://images.unsplash.com/photo-1615859133861-8ee13a73b296?w=400&auto=format&fit=crop&q=60',
    },
  ],
  'Beauty, Wellness & Personal Care': [
    {
      id: '1',
      title: 'In-Home Hair Styling',
      description: 'Professional cuts, colors, and styling',
      price: '60',
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '2',
      title: 'Mobile Massage Therapy',
      description: 'Relaxing massage at your location',
      price: '90',
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '3',
      title: 'Manicure & Pedicure',
      description: 'Nail care and beautification',
      price: '45',
      image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '4',
      title: 'Makeup Artist Services',
      description: 'Special event makeup application',
      price: '80',
      image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '5',
      title: 'Personal Training',
      description: 'One-on-one fitness coaching',
      price: '70',
      image: 'https://images.unsplash.com/photo-1571019623124-74e6ca2a1c56?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '6',
      title: 'Yoga Instruction',
      description: 'Private or group yoga sessions',
      price: '55',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '7',
      title: 'Nutrition Consulting',
      description: 'Diet planning and wellness advice',
      price: '100',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&auto=format&fit=crop&q=60',
    },
  ],
  'Education & Professional Services': [
    {
      id: '1',
      title: 'Private Tutoring (Math)',
      description: 'One-on-one math instruction',
      price: '50',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '2',
      title: 'Language Lessons',
      description: 'Learn a new language with expert tutors',
      price: '55',
      image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '3',
      title: 'Music Lessons',
      description: 'Piano, guitar, and vocal training',
      price: '60',
      image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '4',
      title: 'Resume Writing',
      description: 'Professional resume and cover letter',
      price: '75',
      image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '5',
      title: 'Business Consulting',
      description: 'Strategy and operations advice',
      price: '150',
      image: 'https://images.unsplash.com/photo-1454165833762-d21f59a86063?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '6',
      title: 'Tax Preparation',
      description: 'File your taxes accurately',
      price: '120',
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '7',
      title: 'Legal Consultation',
      description: 'Get legal advice from experts',
      price: '200',
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '8',
      title: 'Career Coaching',
      description: 'Advance your professional goals',
      price: '90',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&auto=format&fit=crop&q=60',
    },
  ],
  'Domestic & Cleaning Services': [
    {
      id: '1',
      title: 'Deep House Cleaning',
      description: 'Thorough cleaning of your entire home',
      price: '120',
      image: 'https://images.unsplash.com/photo-1581578731522-745a05ad9ad5?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '2',
      title: 'Regular Housekeeping',
      description: 'Weekly or bi-weekly cleaning service',
      price: '80',
      image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '3',
      title: 'Carpet & Upholstery Cleaning',
      description: 'Steam clean carpets and furniture',
      price: '95',
      image: 'https://images.unsplash.com/photo-1558317374-067df5f15430?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '4',
      title: 'Window Washing',
      description: 'Inside and outside window cleaning',
      price: '70',
      image: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '5',
      title: 'Move-In/Move-Out Cleaning',
      description: 'Prepare your home for new occupants',
      price: '150',
      image: 'https://images.unsplash.com/photo-1603712725038-e9334ad8f39f?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '6',
      title: 'Laundry & Ironing',
      description: 'Wash, dry, and iron your clothes',
      price: '50',
      image: 'https://images.unsplash.com/photo-1545173159-bb8d466953f3?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '7',
      title: 'Kitchen Deep Clean',
      description: 'Sanitize and degrease your kitchen',
      price: '85',
      image: 'https://images.unsplash.com/photo-1556911220-e152748a7352?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: '8',
      title: 'Bathroom Sanitization',
      description: 'Deep clean and disinfect bathrooms',
      price: '65',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=60',
    },
  ],
};

export default function CategoryDetailsScreen() {
  const router = useRouter();
  const { title = 'Home Maintenance & Repair' } = useLocalSearchParams<{ title: string }>();

  // Find services for this category, default to Home Maintenance if not found
  const services = CATEGORY_DATA[title] || CATEGORY_DATA['Home Maintenance & Repair'];
  const count = services.length;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSubtitle}>{count} services available</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentHeader}>
          <Text style={styles.contentTitle}>{title}</Text>
          <Text style={styles.contentSubtitle}>{count} services available</Text>
        </View>

        <View style={styles.servicesList}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() =>
                router.push({
                  pathname: '/provider-list',
                  params: { serviceName: service.title },
                })
              }
            >
              <Image source={{ uri: service.image }} style={styles.serviceImage} />
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDescription} numberOfLines={2}>
                  {service.description}
                </Text>
                <Text style={styles.servicePrice}>From ₱{service.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  contentHeader: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1B1E',
  },
  contentSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  servicesList: {
    paddingHorizontal: 20,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F8F9FA',
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  serviceDescription: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
    lineHeight: 16,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00C853',
    marginTop: 10,
  },
});
