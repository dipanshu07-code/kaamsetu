-- ====================================================================
-- KaamSetu Initial Seed Data (PostgreSQL)
-- Categories, sample demo workers, rate cards, bookings, reviews
-- ====================================================================

-- 1. SEED SERVICE CATEGORIES
INSERT INTO public.service_categories (slug, name, name_hi, icon_name, description, description_hi, starting_price, price_unit, is_enabled, disabled_reason)
VALUES 
('maid-housekeeping', 'Maid and Housekeeping', 'घरेलू सहायिका और सफाई', 'Sparkles', 'Floor sweeping, mopping, dusting, utensil cleaning, and deep home cleaning.', 'झाड़ू-पोछा, बर्तन धोना और घर की गहरी सफाई।', 350.00, 'per-visit', TRUE, NULL),
('cook', 'Cook & Chef', 'रसोइया (कुक)', 'UtensilsCrossed', 'Home-cooked North & South Indian meals, breakfast, tiffin preparation, and party catering.', 'स्वादिष्ट घर का भोजन, नाश्ता और घरेलू दावत के लिए रसोइया।', 400.00, 'per-day', TRUE, NULL),
('electrician', 'Electrician', 'इलेक्ट्रीशियन', 'Zap', 'Switchboard repairs, fan installation, wiring troubleshooting, appliance diagnosis, and MCB fixes.', 'स्विचबोर्ड मरम्मत, पंखा लगाना, वायरिंग ठीक करना और एमसीबी रिपेयर।', 249.00, 'per-visit', TRUE, NULL),
('plumber', 'Plumber', 'प्लम्बर', 'Wrench', 'Tap leakage fixing, washbasin fitting, pipeline unclogging, water tank repair, and bathroom fixtures.', 'नल लीकेज ठीक करना, पाइपलाइन खोलना और पानी की टंकी मरम्मत।', 299.00, 'per-visit', TRUE, NULL),
('carpenter', 'Carpenter', 'बढ़ई (कारपेंटर)', 'Hammer', 'Furniture assembly, hinge repairs, custom wooden shelves, lock fitting, and door alignment.', 'फर्नीचर जोड़ना, काज मरम्मत, ताला लगाना और दरवाजा ठीक करना।', 349.00, 'per-visit', TRUE, NULL),
('general-labour', 'General Labour', 'सामान्य मजदूर', 'HardHat', 'Heavy lifting, terrace debris clearing, garden digging, unloading sacks, and basic construction assistance.', 'भारी सामान उठाना, छत की सफाई, बगीचे की खुदाई और सामान उतारना।', 650.00, 'per-day', TRUE, NULL),
('shifting-assistant', 'Shifting Assistant', 'सामान शिफ्टिंग सहायक', 'Truck', 'House shifting packing assistance, furniture loading, box cartage, and fragile item handling.', 'घर बदलने में सामान पैकिंग, फर्नीचर लोड करना और सुरक्षित ढुलाई में सहायता।', 799.00, 'per-visit', TRUE, NULL),
('childcare', 'Childcare & Babysitting', 'शिशु देखभाल (स्थगित)', 'Baby', 'Childcare services are temporarily paused pending mandatory enhanced background check protocols and safeguarding compliance.', 'सुरक्षा और पृष्ठभूमि सत्यापन मानकों के समीक्षाधीन होने के कारण शिशु देखभाल सेवा अभी स्थगित है।', 0.00, 'per-hour', FALSE, 'Temporarily disabled in platform pilot until biometric identity checks and child safety certifications are operational.')
ON CONFLICT (slug) DO NOTHING;
