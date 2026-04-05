-- ServEase Seed Data - Test Users & Providers
-- This script populates the database with test data for development

-- User Profiles for Providers
INSERT INTO public.user_profiles (id, full_name, email, phone, avatar_url, user_type, bio, created_at, updated_at) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Juan dela Cruz', 'juan@servease.ph', '+63-917-123-4567', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=30', 'provider', 'Licensed technician with 15+ years experience', now(), now()),
('b2c3d4e5-f6a7-4b5c-8d9e-1f2a3b4c5d6e', 'Roberto Aquino', 'roberto@servease.ph', '+63-917-765-4321', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=30', 'provider', 'Expert in residential maintenance', now(), now()),
('c3d4e5f6-a7b8-4c5d-8e9f-2a3b4c5d6e7f', 'Maria Santos', 'maria@servease.ph', '+63-917-234-5678', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=30', 'provider', 'Professional cleaner', now(), now()),
('d4e5f6a7-b8c9-4d5e-8f9a-3b4c5d6e7f8a', 'Sarah Go', 'sarah@servease.ph', '+63-917-876-5432', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=30', 'provider', 'Makeup artist specialist', now(), now()),
('e5f6a7b8-c9d0-4e5f-8a9b-4c5d6e7f8a9b', 'Demo Customer', 'customer@servease.ph', '+63-917-555-8888', 'https://images.unsplash.com/photo-1535713566543-f7b98b78faf7?w=150&q=30', 'customer', 'Test customer account', now(), now());

-- Provider Profiles
INSERT INTO public.provider_profiles (id, user_id, rating, total_reviews, bio, years_experience, service_areas, languages, created_at, updated_at) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 4.9, 128, 'Licensed technician with 15+ years experience. Specializing in emergency fixes.', 15, ARRAY['Makati City', 'Pasig', 'Manila'], ARRAY['English', 'Tagalog'], now(), now()),
('b2c3d4e5-f6a7-4b5c-8d9e-1f2a3b4c5d6e', 'b2c3d4e5-f6a7-4b5c-8d9e-1f2a3b4c5d6e', 4.8, 156, 'Expert in residential maintenance with fast, reliable service.', 12, ARRAY['Pasig City', 'Quezon City', 'Taguig'], ARRAY['English', 'Tagalog'], now(), now()),
('c3d4e5f6-a7b8-4c5d-8e9f-2a3b4c5d6e7f', 'c3d4e5f6-a7b8-4c5d-8e9f-2a3b4c5d6e7f', 5.0, 204, 'Professional cleaner trusted by hundreds of satisfied customers.', 8, ARRAY['BGC, Taguig', 'Makati', 'Paranaque'], ARRAY['English', 'Tagalog'], now(), now()),
('d4e5f6a7-b8c9-4d5e-8f9a-3b4c5d6e7f8a', 'd4e5f6a7-b8c9-4d5e-8f9a-3b4c5d6e7f8a', 4.9, 145, 'Makeup artist specializing in natural, glowing looks.', 6, ARRAY['Makati City', 'BGC', 'Ortigas'], ARRAY['English', 'Tagalog'], now(), now());

-- Services
INSERT INTO public.services (id, provider_id, title, description, starting_price, duration, created_at, updated_at) VALUES
-- Juan's Plumbing Services
('f1a2b3c4-d5e6-4f5a-8b9c-1d2e3f4a5b6c', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Pipe Repair', 'Fix leaking pipes and water system issues', 500, 60, now(), now()),
('f2b3c4d5-e6f7-4a5b-8c9d-0e1f2a3b4c5d', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Faucet Replacement', 'Install new kitchen or bathroom faucets', 800, 45, now(), now()),
('f3c4d5e6-f7a8-4b5c-8d9e-1f2a3b4c5d6e', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Drain Cleaning', 'Clear blocked drains and pipes', 600, 30, now(), now()),

-- Roberto's Carpentry Services
('f4d5e6f7-a8b9-4c5d-8e9f-2a3b4c5d6e7f', 'b2c3d4e5-f6a7-4b5c-8d9e-1f2a3b4c5d6e', 'Cabinet Making', 'Custom wooden cabinets and storage', 3000, 240, now(), now()),
('f5e6f7a8-b9c0-4d5e-8f9a-3b4c5d6e7f8a', 'b2c3d4e5-f6a7-4b5c-8d9e-1f2a3b4c5d6e', 'Door Installation', 'Install interior or exterior doors', 2000, 120, now(), now()),
('f6f7a8b9-c0d1-4e5f-8a9b-4c5d6e7f8a9b', 'b2c3d4e5-f6a7-4b5c-8d9e-1f2a3b4c5d6e', 'Furniture Repair', 'Fix broken chairs, tables, and wooden items', 1500, 90, now(), now()),

-- Maria's Cleaning Services
('f7a8b9c0-d1e2-4f5a-8b9c-5d6e7f8a9b0c', 'c3d4e5f6-a7b8-4c5d-8e9f-2a3b4c5d6e7f', 'Home Cleaning', 'Complete house cleaning and tidying', 1200, 180, now(), now()),
('f8b9c0d1-e2f3-4a5b-8c9d-6e7f8a9b0c1d', 'c3d4e5f6-a7b8-4c5d-8e9f-2a3b4c5d6e7f', 'Office Cleaning', 'Commercial office space cleaning', 2000, 240, now(), now()),
('f9c0d1e2-f3a4-4b5c-8d9e-7f8a9b0c1d2e', 'c3d4e5f6-a7b8-4c5d-8e9f-2a3b4c5d6e7f', 'Post-Construction Cleaning', 'Deep clean after renovation', 3000, 300, now(), now()),

-- Sarah's Beauty Services
('fad1e2f3-a4b5-4c5d-8e9f-8a9b0c1d2e3f', 'd4e5f6a7-b8c9-4d5e-8f9a-3b4c5d6e7f8a', 'Makeup Session', 'Professional makeup application', 1200, 60, now(), now()),
('fbe2f3a4-b5c6-4d5e-8f9a-9b0c1d2e3f4a', 'd4e5f6a7-b8c9-4d5e-8f9a-3b4c5d6e7f8a', 'Bridal Makeup', 'Complete bridal makeup package', 3500, 120, now(), now()),
('fcf3a4b5-c6d7-4e5f-8a9b-0c1d2e3f4a5b', 'd4e5f6a7-b8c9-4d5e-8f9a-3b4c5d6e7f8a', 'Makeup Lessons', 'Learn makeup techniques one-on-one', 800, 90, now(), now());

-- Sample Reviews
INSERT INTO public.reviews (id, provider_id, customer_id, rating, content, image_url, created_at, updated_at) VALUES
('ab1a2b3c-d4e5-4f6a-9b0c-2d3e4f5a6b7c', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'e5f6a7b8-c9d0-4e5f-8a9b-4c5d6e7f8a9b', 5, 'Excellent service! Very professional and timely.', null, now() - interval '30 days', now() - interval '30 days'),
('ab2b3c4d-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'b2c3d4e5-f6a7-4b5c-8d9e-1f2a3b4c5d6e', 'e5f6a7b8-c9d0-4e5f-8a9b-4c5d6e7f8a9b', 5, 'Great carpentry work, highly recommended!', null, now() - interval '20 days', now() - interval '20 days'),
('ab3c4d5e-f6a7-4b5c-8d9e-1f2a3b4c5d6e', 'c3d4e5f6-a7b8-4c5d-8e9f-2a3b4c5d6e7f', 'e5f6a7b8-c9d0-4e5f-8a9b-4c5d6e7f8a9b', 5, 'Very thorough cleaning, my home sparkles!', null, now() - interval '10 days', now() - interval '10 days'),
('ab4d5e6f-a7b8-4c5d-8e9f-2a3b4c5d6e7f', 'd4e5f6a7-b8c9-4d5e-8f9a-3b4c5d6e7f8a', 'e5f6a7b8-c9d0-4e5f-8a9b-4c5d6e7f8a9b', 5, 'Best makeup artist in the city!', null, now() - interval '5 days', now() - interval '5 days');

-- Sample Address for Demo Customer
INSERT INTO public.user_addresses (id, user_id, street, barangay, city, province, postal_code, location_note, label, is_default, created_at, updated_at) VALUES
('ad1a2b3c-d4e5-4f6a-9b0c-2d3e4f5a6b7c', 'e5f6a7b8-c9d0-4e5f-8a9b-4c5d6e7f8a9b', '123 Mabini Street', 'San Jose', 'Quezon City', 'NCR', '1103', 'Apartment Building', 'Home', true, now(), now()),
('ad2b3c4d-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'e5f6a7b8-c9d0-4e5f-8a9b-4c5d6e7f8a9b', '456 Ayala Avenue', 'Makati Central Business District', 'Makati', 'NCR', '1226', 'Office Building 5th Floor', 'Office', false, now(), now());
