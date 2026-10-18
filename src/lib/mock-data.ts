import { ServiceCategory, WorkerProfile, Booking, Review, Complaint, AdminAuditLog, AppUser } from '@/types';

export const serviceCategories: ServiceCategory[] = [
  {
    id: 'cat-1',
    name: 'Maid and Housekeeping',
    nameHi: 'घरेलू सहायिका और सफाई',
    slug: 'maid-housekeeping',
    iconName: 'Sparkles',
    description: 'Floor sweeping, mopping, dusting, utensil cleaning, and deep home cleaning.',
    descriptionHi: 'झाड़ू-पोछा, बर्तन धोना, धूल-सफाई और घर की गहरी सफाई।',
    startingPrice: 350,
    priceUnit: 'per-visit',
    isEnabled: true,
    popularServices: ['Daily House Dusting & Mopping', 'Utensil Washing', 'Deep Kitchen Cleaning', 'Bathroom Scrubbing']
  },
  {
    id: 'cat-2',
    name: 'Cook & Chef',
    nameHi: 'रसोइया (कुक)',
    slug: 'cook',
    iconName: 'UtensilsCrossed',
    description: 'Home-cooked North & South Indian meals, breakfast, tiffin preparation, and party catering.',
    descriptionHi: 'स्वादिष्ट घर का भोजन, नाश्ता, टिफिन और घरेलू दावत के लिए रसोइया।',
    startingPrice: 400,
    priceUnit: 'per-day',
    isEnabled: true,
    popularServices: ['Daily 2-Meal Cooking (Rotis/Sabzi/Dal)', 'South Indian Breakfast & Filter Coffee', 'Party / Get-Together Special Chef']
  },
  {
    id: 'cat-3',
    name: 'Electrician',
    nameHi: 'इलेक्ट्रीशियन',
    slug: 'electrician',
    iconName: 'Zap',
    description: 'Switchboard repairs, fan installation, wiring troubleshooting, appliance diagnosis, and MCB fixes.',
    descriptionHi: 'स्विचबोर्ड मरम्मत, पंखा लगाना, वायरिंग ठीक करना, उपकरण जांच और एमसीबी रिपेयर।',
    startingPrice: 249,
    priceUnit: 'per-visit',
    isEnabled: true,
    popularServices: ['Ceiling Fan Installation & Repair', 'Inverter Wiring & Battery Check', 'Switchboard Replacement', 'Short Circuit Troubleshooting']
  },
  {
    id: 'cat-4',
    name: 'Plumber',
    nameHi: 'प्लम्बर',
    slug: 'plumber',
    iconName: 'Wrench',
    description: 'Tap leakage fixing, washbasin fitting, pipeline unclogging, water tank repair, and bathroom fixtures.',
    descriptionHi: 'नल लीकेज ठीक करना, पाइपलाइन खोलना, पानी की टंकी और बाथरूम फिटिंग।',
    startingPrice: 299,
    priceUnit: 'per-visit',
    isEnabled: true,
    popularServices: ['Leaking Tap / Valve Replacement', 'Drain Blockage Removal', 'Water Tank Ball-Cock Repair', 'Sanitary & Basin Fitting']
  },
  {
    id: 'cat-5',
    name: 'Carpenter',
    nameHi: 'बढ़ई (कारपेंटर)',
    slug: 'carpenter',
    iconName: 'Hammer',
    description: 'Furniture assembly, hinge repairs, custom wooden shelves, lock fitting, and door alignment.',
    descriptionHi: 'फर्नीचर जोड़ना, काज मरम्मत, लकड़ी की अलमारी, ताला लगाना और दरवाजा ठीक करना।',
    startingPrice: 349,
    priceUnit: 'per-visit',
    isEnabled: true,
    popularServices: ['Bed / Wardrobe Assembly', 'Door Handle & Lock Installation', 'Drawer Channel & Hinge Repair', 'Wooden Trim & Shelf Fitting']
  },
  {
    id: 'cat-6',
    name: 'General Labour',
    nameHi: 'सामान्य मजदूर',
    slug: 'general-labour',
    iconName: 'HardHat',
    description: 'Heavy lifting, terrace debris clearing, garden digging, unloading sacks, and basic construction assistance.',
    descriptionHi: 'भारी सामान उठाना, छत की सफाई, बगीचे की खुदाई और सामान उतारना।',
    startingPrice: 650,
    priceUnit: 'per-day',
    isEnabled: true,
    popularServices: ['Full Day Loading & Unloading', 'Garden Landscaping & Soil Digging', 'Terrace Clearing & Debris Removal']
  },
  {
    id: 'cat-7',
    name: 'Shifting Assistant',
    nameHi: 'सामान शिफ्टिंग सहायक',
    slug: 'shifting-assistant',
    iconName: 'Truck',
    description: 'House shifting packing assistance, furniture loading, box cartage, and fragile item handling.',
    descriptionHi: 'घर बदलने में सामान पैकिंग, फर्नीचर लोड करना और सुरक्षित ढुलाई में सहायता।',
    startingPrice: 799,
    priceUnit: 'per-visit',
    isEnabled: true,
    popularServices: ['Half-Day Shifting Handyman', 'Furniture Bubble-Wrapping & Crating', 'Tempo Loading / Unloading Assist']
  },
  {
    id: 'cat-8',
    name: 'Childcare & Babysitting',
    nameHi: 'शिशु देखभाल (स्थगित)',
    slug: 'childcare',
    iconName: 'Baby',
    description: 'Childcare services are temporarily paused pending mandatory enhanced background check protocols and safeguarding compliance.',
    descriptionHi: 'सुरक्षा और पृष्ठभूमि सत्यापन मानकों के समीक्षाधीन होने के कारण शिशु देखभाल सेवा अभी स्थगित है।',
    startingPrice: 0,
    priceUnit: 'per-hour',
    isEnabled: false,
    disabledReason: 'Temporarily disabled in platform pilot until biometric identity checks, child safety certification, and emergency protocol screening are operational.',
    popularServices: []
  }
];

export const initialWorkers: WorkerProfile[] = [
  {
    id: 'w-1',
    userId: 'u-w1',
    fullName: 'Rameshwar "Ramesh" Prasad',
    fullNameHi: 'रामेश्वर "रमेश" प्रसाद',
    phone: '9810123456',
    avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
    category: 'electrician',
    subcategories: ['Switchboards', 'Ceiling Fans', 'Inverter Setup', 'Appliance Wiring'],
    experienceYears: 8,
    city: 'Delhi NCR',
    locality: 'Lajpat Nagar',
    serviceRadiusKm: 7,
    languages: ['Hindi', 'Basic English', 'Bhojpuri'],
    isAvailableToday: true,
    availabilitySchedule: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      timeSlots: ['Morning (9am-1pm)', 'Afternoon (2pm-6pm)']
    },
    pricingBasis: 'per-visit',
    baseRate: 299,
    rateCards: [
      { id: 'rc-1-1', serviceCategorySlug: 'electrician', serviceTitle: 'Standard Home Inspection & Minor Fix', pricingBasis: 'per-visit', amount: 299, description: 'Inspection, diagnostic testing of up to 2 switchboards or light points. Parts extra.' },
      { id: 'rc-1-2', serviceCategorySlug: 'electrician', serviceTitle: 'Ceiling Fan Installation & Hook Mounting', pricingBasis: 'per-visit', amount: 350, description: 'Safe mechanical ceiling mounting, regulator connection, and test run.' },
      { id: 'rc-1-3', serviceCategorySlug: 'electrician', serviceTitle: 'Inverter & Battery Setup with Rewiring', pricingBasis: 'quoted', amount: 800, description: 'Complete AC/DC loop setup, load segregation, and earth leakage safety check.' }
    ],
    bio: 'Licensed ITI-trained electrician with 8 years of residential experience across South Delhi colonies. Specializes in safe wiring, earthing, inverter connections, and LED fixture installations. Brings own tools and multi-meter.',
    bioHi: 'साउथ दिल्ली में 8 वर्षों के अनुभव वाले कुशल इलेक्ट्रीशियन। सुरक्षित वायरिंग, इन्वर्टर कनेक्शन और पंखे की फिटिंग में माहिर। स्वयं का औजार और मीटर साथ लाते हैं।',
    verificationStatus: 'verified',
    verificationDetails: {
      isIdentityVerified: true,
      isBackgroundChecked: true,
      isSkillEndorsed: true,
      verificationDate: '2026-03-15'
    },
    rating: 4.8,
    reviewCount: 34,
    completedJobsCount: 41,
    onTimeArrivalRatePercent: 96,
    isDemoProfile: true,
    proofOfWorkExamples: [
      {
        id: 'pow-1',
        title: 'Complete MCB Distribution Box Replacement',
        description: 'Replaced an old burning fuse board with a modular 8-way Havells MCB box with proper earthing in an apartment in Lajpat Nagar II.',
        beforePhoto: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80',
        afterPhoto: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
        completedDate: '2026-09-28'
      }
    ]
  },
  {
    id: 'w-2',
    userId: 'u-w2',
    fullName: 'Sunita Devi',
    fullNameHi: 'सुनीता देवी',
    phone: '9871234567',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    category: 'maid-housekeeping',
    subcategories: ['Daily Sweeping & Mopping', 'Utensil Washing', 'Deep Kitchen Cleaning', 'Bathroom Scrubbing'],
    experienceYears: 6,
    city: 'Bengaluru',
    locality: 'Koramangala',
    serviceRadiusKm: 5,
    languages: ['Hindi', 'Kannada', 'Basic English'],
    isAvailableToday: true,
    availabilitySchedule: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      timeSlots: ['Morning (7am-11am)', 'Evening (4pm-7pm)']
    },
    pricingBasis: 'per-month',
    baseRate: 3500,
    rateCards: [
      { id: 'rc-2-1', serviceCategorySlug: 'maid-housekeeping', serviceTitle: 'Daily 2 BHK Sweeping, Mopping & Utensils (Monthly)', pricingBasis: 'per-month', amount: 3500, description: 'Once daily 60-75 mins visit for dust sweeping, wet floor mopping, and kitchen sinks washing.' },
      { id: 'rc-2-2', serviceCategorySlug: 'maid-housekeeping', serviceTitle: 'One-Time Deep Kitchen & Bathroom Degreasing', pricingBasis: 'per-visit', amount: 550, description: 'Thorough scrub of tile walls, gas stove grease removal, and toilet sanitary disinfection.' }
    ],
    bio: 'Dedicated domestic housekeeper working in Koramangala 4th, 5th, and 6th blocks for 6 years. Punctual, polite, and thorough with hygiene standards. Verified address and local residential references available.',
    bioHi: 'कोरामंगला क्षेत्र में 6 वर्षों से घरेलू सहायिका के रूप में कार्यरत। समय की पाबंद, विनम्र और स्वच्छता का पूरा ध्यान रखती हैं।',
    verificationStatus: 'verified',
    verificationDetails: {
      isIdentityVerified: true,
      isBackgroundChecked: true,
      isSkillEndorsed: true,
      verificationDate: '2026-02-10'
    },
    rating: 4.9,
    reviewCount: 48,
    completedJobsCount: 62,
    onTimeArrivalRatePercent: 98,
    isDemoProfile: true,
    proofOfWorkExamples: []
  },
  {
    id: 'w-3',
    userId: 'u-w3',
    fullName: 'Rajesh "Masterji" Sharma',
    fullNameHi: 'राजेश "मास्टरजी" शर्मा',
    phone: '9820011223',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    category: 'cook',
    subcategories: ['North Indian Vegetarian', 'Marwari & Jain Cuisine', 'Healthy Millet Rotis', 'Weekend Special Meals'],
    experienceYears: 12,
    city: 'Mumbai',
    locality: 'Andheri West',
    serviceRadiusKm: 6,
    languages: ['Hindi', 'Marathi', 'Gujarati'],
    isAvailableToday: true,
    availabilitySchedule: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      timeSlots: ['Morning (7am-10am)', 'Evening (6pm-9pm)']
    },
    pricingBasis: 'per-month',
    baseRate: 5000,
    rateCards: [
      { id: 'rc-3-1', serviceCategorySlug: 'cook', serviceTitle: 'Daily Lunch & Dinner for Family (4 persons)', pricingBasis: 'per-month', amount: 5000, description: 'Fresh phulkas, 2 seasonal sabzis, dal/kadhi, rice, and fresh salad preparation.' },
      { id: 'rc-3-2', serviceCategorySlug: 'cook', serviceTitle: 'Special Festive / Party Meal (Up to 10 Guests)', pricingBasis: 'per-visit', amount: 1200, description: 'Cooks special delicacies like Paneer Lababdar, Dal Makhani, Pulao, Gulab Jamun.' }
    ],
    bio: 'Trained traditional North Indian cook with 12 years of experience cooking for residential households in Mumbai. Maintains spotless kitchen hygiene, uses fresh spices, and prepares oil-controlled nutritious meals.',
    bioHi: '12 वर्षों का अनुभव रखने वाले पारंपरिक रसोइया। शुद्ध शाकाहारी, कम तेल में पौष्टिक और स्वादिष्ट भोजन तैयार करते हैं।',
    verificationStatus: 'verified',
    verificationDetails: {
      isIdentityVerified: true,
      isBackgroundChecked: true,
      isSkillEndorsed: true,
      verificationDate: '2026-01-20'
    },
    rating: 4.7,
    reviewCount: 29,
    completedJobsCount: 35,
    onTimeArrivalRatePercent: 94,
    isDemoProfile: true,
    proofOfWorkExamples: []
  },
  {
    id: 'w-4',
    userId: 'u-w4',
    fullName: 'Mohammed Shafi',
    fullNameHi: 'मोहम्मद शफ़ी',
    phone: '9711889900',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    category: 'plumber',
    subcategories: ['Pipe Leakages', 'Bathroom Sanitary Fittings', 'Overhead Tank Cleaning', 'Water Heaters'],
    experienceYears: 9,
    city: 'Delhi NCR',
    locality: 'Noida Sector 62',
    serviceRadiusKm: 8,
    languages: ['Hindi', 'Urdu'],
    isAvailableToday: false,
    availabilitySchedule: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sun'],
      timeSlots: ['Morning (9am-1pm)', 'Afternoon (1pm-5pm)']
    },
    pricingBasis: 'per-visit',
    baseRate: 299,
    rateCards: [
      { id: 'rc-4-1', serviceCategorySlug: 'plumber', serviceTitle: 'Visiting Inspection & Minor Tap Washer Fix', pricingBasis: 'per-visit', amount: 299, description: 'Visiting fee and fixing up to 2 dripping taps or shower arm leakages.' },
      { id: 'rc-4-2', serviceCategorySlug: 'plumber', serviceTitle: 'Washbasin & Bottle Trap Replacement', pricingBasis: 'per-visit', amount: 450, description: 'Removal of cracked siphon, fitting new PVC bottle trap, silicone sealing.' },
      { id: 'rc-4-3', serviceCategorySlug: 'plumber', serviceTitle: 'Overhead 1000L Sintex Tank Thorough Wash', pricingBasis: 'per-visit', amount: 750, description: 'Complete draining, high pressure wall scrub, UV/bleaching sanitation treatment.' }
    ],
    bio: 'Professional plumber specializing in high-rise society plumbing, pressure booster pumps, concealed CPVC piping, and Jaquar/Kohler sanitary fittings. Carry pipe threaders and leak detection gauges.',
    bioHi: 'सोसायटियों और घरों के लिए कुशल प्लम्बर। पाइप लीकेज, सेनेटरी फिटिंग्स और वाटर टैंक की सफाई में दक्ष।',
    verificationStatus: 'verified',
    verificationDetails: {
      isIdentityVerified: true,
      isBackgroundChecked: true,
      isSkillEndorsed: true,
      verificationDate: '2026-04-02'
    },
    rating: 4.8,
    reviewCount: 39,
    completedJobsCount: 52,
    onTimeArrivalRatePercent: 93,
    isDemoProfile: true,
    proofOfWorkExamples: [
      {
        id: 'pow-2',
        title: 'Bathroom Wall Concealed CPVC Leak Repair',
        description: 'Chipped minimal tile area, fixed perforated 1-inch hot water line using Astra pipe joiner, and re-grouted neatly.',
        beforePhoto: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80',
        afterPhoto: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&auto=format&fit=crop&q=80',
        completedDate: '2026-10-04'
      }
    ]
  },
  {
    id: 'w-5',
    userId: 'u-w5',
    fullName: 'Gurpreet "Paji" Singh',
    fullNameHi: 'गुरप्रीत "पाजी" सिंह',
    phone: '9811223344',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    category: 'carpenter',
    subcategories: ['Modular Wardrobes', 'Door Lock Installation', 'Drawer Slides', 'Bed Repairs'],
    experienceYears: 14,
    city: 'Pune',
    locality: 'Kothrud',
    serviceRadiusKm: 9,
    languages: ['Hindi', 'Punjabi', 'Marathi'],
    isAvailableToday: true,
    availabilitySchedule: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      timeSlots: ['Morning (10am-2pm)', 'Afternoon (2pm-6pm)']
    },
    pricingBasis: 'per-visit',
    baseRate: 350,
    rateCards: [
      { id: 'rc-5-1', serviceCategorySlug: 'carpenter', serviceTitle: 'Carpentry Inspection & Hinge / Handle Adjustment', pricingBasis: 'per-visit', amount: 350, description: 'Inspection and tightening up to 4 loose cabinet hinges or door stoppers.' },
      { id: 'rc-5-2', serviceCategorySlug: 'carpenter', serviceTitle: 'Godrej Ultra Lock Installation on Wooden Door', pricingBasis: 'per-visit', amount: 550, description: 'Precision chiseling, cylinder lock mounting, and strike plate alignment.' },
      { id: 'rc-5-3', serviceCategorySlug: 'carpenter', serviceTitle: 'King Size Hydraulic Storage Bed Assembly', pricingBasis: 'quoted', amount: 1100, description: 'Complete flatpack unboxing, hydraulic piston fitting, and sturdy frame joinery.' }
    ],
    bio: 'Master carpenter with 14 years of bespoke woodwork experience. Expert in Godrej locks, soft-close hydraulic hinges, laminates, and Ikea/Urban Ladder furniture assembly.',
    bioHi: '14 वर्षों के अनुभवी बढ़ई। मॉड्यूलर फर्नीचर फिटिंग, गोदरेज लॉक इंस्टालेशन और लकड़ी की मरम्मत में पारंगत।',
    verificationStatus: 'verified',
    verificationDetails: {
      isIdentityVerified: true,
      isBackgroundChecked: true,
      isSkillEndorsed: true,
      verificationDate: '2026-02-18'
    },
    rating: 4.9,
    reviewCount: 52,
    completedJobsCount: 70,
    onTimeArrivalRatePercent: 97,
    isDemoProfile: true,
    proofOfWorkExamples: []
  },
  {
    id: 'w-6',
    userId: 'u-w6',
    fullName: 'Babloo Paswan',
    fullNameHi: 'बबलू पासवान',
    phone: '9899112255',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
    category: 'general-labour',
    subcategories: ['Heavy Cartage', 'Terrace Clearing', 'Material Shifting', 'Debris Cleanup'],
    experienceYears: 4,
    city: 'Delhi NCR',
    locality: 'Gurugram Sector 43',
    serviceRadiusKm: 10,
    languages: ['Hindi', 'Maithili'],
    isAvailableToday: true,
    availabilitySchedule: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      timeSlots: ['Full Day (8am-5pm)', 'Morning Half Day (8am-12pm)']
    },
    pricingBasis: 'per-day',
    baseRate: 700,
    rateCards: [
      { id: 'rc-6-1', serviceCategorySlug: 'general-labour', serviceTitle: 'Full Day Manual Labour (8 Hours)', pricingBasis: 'per-day', amount: 700, description: 'Physical labour including carrying heavy cartons, construction materials, and shifting.' },
      { id: 'rc-6-2', serviceCategorySlug: 'general-labour', serviceTitle: 'Half Day Garden / Terrace Cleaning (4 Hours)', pricingBasis: 'per-visit', amount: 450, description: 'Weeding, flower pot relocation, fallen leaves & debris disposal.' }
    ],
    bio: 'Hardworking and honest general labour assistant. Strong, dependable for heavy household lifting, building material handling, and garden soil digging. Fair daily wage transparent billing.',
    bioHi: 'मेहनती और ईमानदार मजदूर। भारी सामान उठाने, छत और बगीचे की सफाई के लिए उपलब्ध।',
    verificationStatus: 'pending',
    verificationDetails: {
      isIdentityVerified: true,
      isBackgroundChecked: false,
      isSkillEndorsed: true,
      verificationDate: undefined
    },
    rating: 4.6,
    reviewCount: 16,
    completedJobsCount: 22,
    onTimeArrivalRatePercent: 92,
    isDemoProfile: true,
    proofOfWorkExamples: []
  },
  {
    id: 'w-7',
    userId: 'u-w7',
    fullName: 'Vikram Yadav',
    fullNameHi: 'विक्रम यादव',
    phone: '9876543210',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    category: 'shifting-assistant',
    subcategories: ['Apartment Packing', 'Loading / Unloading', 'Bubble Wrapping', 'Mattress Bagging'],
    experienceYears: 5,
    city: 'Bengaluru',
    locality: 'HSR Layout',
    serviceRadiusKm: 12,
    languages: ['Hindi', 'English', 'Kannada'],
    isAvailableToday: true,
    availabilitySchedule: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      timeSlots: ['Morning (8am-12pm)', 'Afternoon (12pm-4pm)', 'Evening (4pm-8pm)']
    },
    pricingBasis: 'per-visit',
    baseRate: 850,
    rateCards: [
      { id: 'rc-7-1', serviceCategorySlug: 'shifting-assistant', serviceTitle: '3-Hour Shifting & Loading Assistance (1 Worker)', pricingBasis: 'per-visit', amount: 850, description: 'Helper assistance for loading boxes, furniture wrapping, and carrying up/down staircases.' },
      { id: 'rc-7-2', serviceCategorySlug: 'shifting-assistant', serviceTitle: 'Full Day Comprehensive Packing & Shifting Hand', pricingBasis: 'per-day', amount: 1500, description: 'Full day assist with packing kitchen crockery, labeling boxes, loading truck.' }
    ],
    bio: 'Experienced relocation assistant in South Bengaluru. Handles delicate glassware, electronics, and heavy appliances with care. Punctual, non-smoking, and physically fit.',
    bioHi: 'शिफ्टिंग और पैकिंग में अनुभवी सहायक। टीवी, फ्रिज और नाज़ुक सामान को सावधानी से सुरक्षित लोड करते हैं।',
    verificationStatus: 'verified',
    verificationDetails: {
      isIdentityVerified: true,
      isBackgroundChecked: true,
      isSkillEndorsed: true,
      verificationDate: '2026-03-01'
    },
    rating: 4.8,
    reviewCount: 21,
    completedJobsCount: 28,
    onTimeArrivalRatePercent: 95,
    isDemoProfile: true,
    proofOfWorkExamples: []
  }
];

export const initialBookings: Booking[] = [
  {
    id: 'b-101',
    bookingNumber: 'KS-2026-101',
    customerId: 'u-c1',
    customerName: 'Priya Sharma',
    customerPhone: '9812345678',
    workerId: 'w-1',
    workerName: 'Rameshwar "Ramesh" Prasad',
    workerCategory: 'electrician',
    workerAvatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
    workerPhone: '9810123456',
    status: 'completed',
    statusHistory: [
      { status: 'pending', timestamp: '2026-10-14T09:00:00Z', note: 'Customer created booking request.' },
      { status: 'accepted', timestamp: '2026-10-14T09:15:00Z', note: 'Worker confirmed availability for slot.' },
      { status: 'confirmed', timestamp: '2026-10-14T09:20:00Z', note: 'Booking confirmed at ₹350 agreed rate.' },
      { status: 'in_progress', timestamp: '2026-10-15T10:05:00Z', note: 'Worker arrived at premises.' },
      { status: 'completed', timestamp: '2026-10-15T11:20:00Z', note: 'Ceiling fan mounting completed successfully.' }
    ],
    serviceTitle: 'Ceiling Fan Installation & Hook Mounting',
    serviceCategory: 'electrician',
    scheduledDate: '2026-10-15',
    scheduledTimeSlot: 'Morning (9am-1pm)',
    customerAddress: {
      houseNumber: 'Flat 302, Green Glen Towers',
      locality: 'Lajpat Nagar IV',
      city: 'Delhi NCR',
      pincode: '110024',
      landmark: 'Near Central Market'
    },
    jobDescription: 'Need to install a new Orient ceiling fan in the master bedroom. Old fan already removed. Hook is in place.',
    pricingBasis: 'per-visit',
    agreedPrice: 350,
    paymentMethod: 'upi_direct',
    paymentStatus: 'paid_directly_to_worker',
    proofOfWorkNotes: 'Mounted Crompton fan with safety wire anchor, tested high-speed regulator.',
    proofOfWorkPhotos: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80'
    ],
    createdAt: '2026-10-14T09:00:00Z',
    updatedAt: '2026-10-15T11:20:00Z',
    hasReview: true
  },
  {
    id: 'b-102',
    bookingNumber: 'KS-2026-102',
    customerId: 'u-c1',
    customerName: 'Priya Sharma',
    customerPhone: '9812345678',
    workerId: 'w-4',
    workerName: 'Mohammed Shafi',
    workerCategory: 'plumber',
    workerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    workerPhone: '9711889900',
    status: 'in_progress',
    statusHistory: [
      { status: 'pending', timestamp: '2026-10-17T14:00:00Z', note: 'Booking requested by customer.' },
      { status: 'accepted', timestamp: '2026-10-17T14:30:00Z', note: 'Worker accepted the assignment.' },
      { status: 'confirmed', timestamp: '2026-10-17T15:00:00Z', note: 'Time slot confirmed.' },
      { status: 'in_progress', timestamp: '2026-10-18T10:15:00Z', note: 'Shafi arrived on-site and began leak inspection.' }
    ],
    serviceTitle: 'Visiting Inspection & Minor Tap Washer Fix',
    serviceCategory: 'plumber',
    scheduledDate: '2026-10-18',
    scheduledTimeSlot: 'Morning (9am-1pm)',
    customerAddress: {
      houseNumber: 'Flat 302, Green Glen Towers',
      locality: 'Lajpat Nagar IV',
      city: 'Delhi NCR',
      pincode: '110024'
    },
    jobDescription: 'Continuous dripping from kitchen sink mixer faucet. Need washer replacement or cartridge seal.',
    pricingBasis: 'per-visit',
    agreedPrice: 299,
    paymentMethod: 'cash_on_completion',
    paymentStatus: 'pending',
    createdAt: '2026-10-17T14:00:00Z',
    updatedAt: '2026-10-18T10:15:00Z',
    hasReview: false
  },
  {
    id: 'b-103',
    bookingNumber: 'KS-2026-103',
    customerId: 'u-c1',
    customerName: 'Priya Sharma',
    customerPhone: '9812345678',
    workerId: 'w-2',
    workerName: 'Sunita Devi',
    workerCategory: 'maid-housekeeping',
    workerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    workerPhone: '9871234567',
    status: 'pending',
    statusHistory: [
      { status: 'pending', timestamp: '2026-10-18T08:30:00Z', note: 'Request awaiting worker confirmation.' }
    ],
    serviceTitle: 'One-Time Deep Kitchen & Bathroom Degreasing',
    serviceCategory: 'maid-housekeeping',
    scheduledDate: '2026-10-20',
    scheduledTimeSlot: 'Morning (7am-11am)',
    customerAddress: {
      houseNumber: 'Flat 302, Green Glen Towers',
      locality: 'Koramangala 4th Block',
      city: 'Bengaluru',
      pincode: '560034'
    },
    jobDescription: 'Deep pre-festival cleaning of kitchen cabinets and 2 bathrooms before relatives arrive.',
    pricingBasis: 'per-visit',
    agreedPrice: 550,
    paymentMethod: 'upi_direct',
    paymentStatus: 'pending',
    createdAt: '2026-10-18T08:30:00Z',
    updatedAt: '2026-10-18T08:30:00Z',
    hasReview: false
  }
];

export const initialReviews: Review[] = [
  {
    id: 'rev-1',
    bookingId: 'b-101',
    workerId: 'w-1',
    customerId: 'u-c1',
    customerName: 'Priya Sharma',
    customerLocality: 'Lajpat Nagar IV',
    rating: 5,
    punctualityRating: 5,
    workQualityRating: 5,
    politenessRating: 5,
    comment: 'Rameshwar arrived exactly on time with all his ladder clips and tools. Fixed the fan cleanly, balanced the blades without any wobble, and charged strictly the agreed amount. Very honest worker.',
    createdAt: '2026-10-15T12:00:00Z',
    isVerifiedJob: true
  },
  {
    id: 'rev-2',
    bookingId: 'b-demo-past-1',
    workerId: 'w-2',
    customerId: 'u-demo-c2',
    customerName: 'Arjun Nambiar',
    customerLocality: 'Koramangala 5th Block',
    rating: 5,
    punctualityRating: 5,
    workQualityRating: 5,
    politenessRating: 5,
    comment: 'Sunita ji has been working with us for over 4 months now. Never misses a day without prior intimation, leaves the kitchen squeaky clean, and is very gentle with glassware.',
    createdAt: '2026-10-01T15:20:00Z',
    isVerifiedJob: true
  },
  {
    id: 'rev-3',
    bookingId: 'b-demo-past-2',
    workerId: 'w-5',
    customerId: 'u-demo-c3',
    customerName: 'Dr. Vivek Kulkarni',
    customerLocality: 'Kothrud',
    rating: 5,
    punctualityRating: 4,
    workQualityRating: 5,
    politenessRating: 5,
    comment: 'Gurpreet Singh is an expert carpenter. Repaired our heavy teakwood wardrobe sliding doors that 2 previous carpenters could not fix. Very reasonable rates.',
    createdAt: '2026-09-22T17:45:00Z',
    isVerifiedJob: true
  }
];

export const initialComplaints: Complaint[] = [
  {
    id: 'comp-1',
    ticketNumber: 'TKT-2026-041',
    bookingId: 'b-old-99',
    raisedByUserId: 'u-c1',
    raisedByRole: 'customer',
    raisedByName: 'Priya Sharma',
    raisedByPhone: '9812345678',
    accusedWorkerOrCustomerId: 'w-6',
    accusedName: 'Babloo Paswan',
    category: 'no_show',
    subject: 'Worker delayed by 2 hours on shifting day',
    description: 'Worker informed late about a traffic delay on shifting day morning. Had to reschedule truck by an hour.',
    status: 'resolved',
    createdAt: '2026-10-05T11:00:00Z',
    resolutionNotes: 'Customer support spoke to both parties. Worker provided genuine explanation of transport puncture. Acknowledged and apology accepted.',
    resolvedAt: '2026-10-06T14:30:00Z'
  }
];

export const initialAuditLogs: AdminAuditLog[] = [
  {
    id: 'log-1',
    adminId: 'u-admin1',
    adminName: 'Platform Ops Lead',
    action: 'WORKER_VERIFICATION_APPROVED',
    targetType: 'worker',
    targetId: 'w-1',
    details: 'Verified phone OTP, residential electricity bill, and ITI trade certification for Rameshwar Prasad.',
    timestamp: '2026-03-15T10:30:00Z'
  },
  {
    id: 'log-2',
    adminId: 'u-admin1',
    adminName: 'Platform Ops Lead',
    action: 'WORKER_VERIFICATION_APPROVED',
    targetType: 'worker',
    targetId: 'w-2',
    details: 'Verified residential address and reference check with society security for Sunita Devi.',
    timestamp: '2026-02-10T14:15:00Z'
  },
  {
    id: 'log-3',
    adminId: 'u-admin1',
    adminName: 'Platform Ops Lead',
    action: 'COMPLAINT_RESOLVED',
    targetType: 'complaint',
    targetId: 'comp-1',
    details: 'Ticket TKT-2026-041 resolved through mediation call.',
    timestamp: '2026-10-06T14:30:00Z'
  }
];

export const demoAccounts: { [role in 'customer' | 'worker' | 'admin']: AppUser } = {
  customer: {
    id: 'u-c1',
    name: 'Priya Sharma',
    phone: '9812345678',
    email: 'priya.sharma@example.in',
    role: 'customer',
    locality: 'Lajpat Nagar',
    city: 'Delhi NCR'
  },
  worker: {
    id: 'u-w1',
    name: 'Rameshwar "Ramesh" Prasad',
    phone: '9810123456',
    email: 'ramesh.electrician@kaamsetu.in',
    role: 'worker',
    locality: 'Lajpat Nagar',
    city: 'Delhi NCR',
    workerProfileId: 'w-1'
  },
  admin: {
    id: 'u-admin1',
    name: 'Platform Ops Admin (Delhi/BLR)',
    phone: '9800000001',
    email: 'admin@kaamsetu.org.in',
    role: 'admin',
    locality: 'Central HQ',
    city: 'New Delhi'
  }
};
