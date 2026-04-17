export type ServiceCategoryGroup = {
  name: string;
  icon_name: string;
  image_url: string;
  subcategories: string[];
};

export const SUBCATEGORY_IMAGES: Record<string, string> = {
  // Home Maintenance
  'Plumbing': 'https://images.unsplash.com/photo-1504148455328-c39695715583?auto=format&fit=crop&q=80&w=400',
  'Electrical': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400',
  'Carpentry': 'https://images.unsplash.com/photo-1503387762-592dee58c460?auto=format&fit=crop&q=80&w=400',
  'Painting': 'https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&q=80&w=400',
  'Other': 'https://images.unsplash.com/photo-1516216628859-9bccecad84ef?auto=format&fit=crop&q=80&w=400',
  
  // Beauty & Wellness
  'Hair Styling': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=400',
  'Makeup Artist': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&q=80&w=400',
  'Massage Therapy': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=400',
  'Nails': 'https://images.unsplash.com/photo-1604654894610-df490982570d?auto=format&fit=crop&q=80&w=400',
  
  // Education
  'Academic Tutor': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=400',
  'Language Teacher': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
  'Music Lessons': 'https://images.unsplash.com/photo-1514119412350-e174d90d280e?auto=format&fit=crop&q=80&w=400',
  
  // Domestic
  'House Cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400',
  'Laundry': 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&q=80&w=400',
  'Ironing': 'https://images.unsplash.com/photo-1567113463300-1025523633cb?auto=format&fit=crop&q=80&w=400',
  'Deep Cleaning': 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=400',
  
  // Pets
  'Grooming': 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=400',
  'Walking': 'https://images.unsplash.com/photo-1601758003122-53c40e686a19?auto=format&fit=crop&q=80&w=400',
  'Training': 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=400',
  'Sitting': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=400',
  
  // Events
  'Photography': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400',
  'DJ': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400',
  'Host': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=400',
  'Catering': 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=400',
  
  // Automotive & Tech
  'Car Wash': 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=400',
  'Mechanic': 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=400',
  'Computer Repair': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=400',
  'Mobile Repair': 'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&q=80&w=400',
  
  // Generic Fallback
  'Others': 'https://images.unsplash.com/photo-1516216628859-9bccecad84ef?auto=format&fit=crop&q=80&w=400',
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1516216628859-9bccecad84ef?auto=format&fit=crop&q=80&w=400';

export function getSubcategoryImage(name: string) {
  const normalized = (name || '').trim().toLowerCase();
  const entry = Object.entries(SUBCATEGORY_IMAGES).find(
    ([key]) => key.toLowerCase() === normalized
  );
  return entry ? entry[1] : FALLBACK_IMG;
}

export const SERVICE_TAXONOMY: ServiceCategoryGroup[] = [
  {
    name: 'Home Maintenance & Repair',
    icon_name: 'construct-outline',
    image_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600',
    subcategories: ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Other'],
  },
  {
    name: 'Beauty, Wellness & Personal Care',
    icon_name: 'sparkles-outline',
    image_url: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=600',
    subcategories: ['Hair Styling', 'Makeup Artist', 'Massage Therapy', 'Nails', 'Other'],
  },
  {
    name: 'Education & Professional Services',
    icon_name: 'school-outline',
    image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600',
    subcategories: ['Academic Tutor', 'Language Teacher', 'Music Lessons', 'Other'],
  },
  {
    name: 'Domestic & Cleaning Services',
    icon_name: 'home-outline',
    image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
    subcategories: ['House Cleaning', 'Laundry', 'Ironing', 'Deep Cleaning', 'Other'],
  },
  {
    name: 'Pet Services',
    icon_name: 'paw-outline',
    image_url: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=600',
    subcategories: ['Grooming', 'Walking', 'Training', 'Sitting'],
  },
  {
    name: 'Events & Entertainment',
    icon_name: 'camera-outline',
    image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600',
    subcategories: ['Photography', 'DJ', 'Host', 'Catering'],
  },
  {
    name: 'Automotive & Tech Support',
    icon_name: 'car-outline',
    image_url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=600',
    subcategories: ['Car Wash', 'Mechanic', 'Computer Repair', 'Mobile Repair'],
  },
];

export const TOP_LEVEL_CATEGORY_ITEMS = SERVICE_TAXONOMY.map((group, index) => ({
  id: `top-${index + 1}`,
  name: group.name,
  icon_name: group.icon_name,
  image_url: group.image_url,
}));

export function findCategoryGroup(name: string) {
  return SERVICE_TAXONOMY.find((group) => group.name.toLowerCase() === name.trim().toLowerCase()) || null;
}

export function findParentCategoryForSubcategory(name: string) {
  const normalized = name.trim().toLowerCase();
  return (
    SERVICE_TAXONOMY.find((group) =>
      group.subcategories.some((sub) => sub.toLowerCase() === normalized)
    ) || null
  );
}
