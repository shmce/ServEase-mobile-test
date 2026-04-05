#!/usr/bin/env node

/**
 * Create provider auth users in Supabase
 * This script creates auth.users entries for all 4 seeded providers
 * matching their user_profile IDs from SEED_DATA.sql
 */

const { createClient } = require('@supabase/supabase-js');

// Load from environment variables - NEVER hardcode credentials
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: Missing environment variables');
  console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Provider data matching SEED_DATA.sql
const PROVIDERS = [
  {
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    email: 'juan@servease.ph',
    name: 'Juan dela Cruz',
    password: 'Juan@12345', // Temporary password - user should change
  },
  {
    id: 'b2c3d4e5-f6a7-4b5c-8d9e-1f2a3b4c5d6e',
    email: 'roberto@servease.ph',
    name: 'Roberto Aquino',
    password: 'Roberto@12345',
  },
  {
    id: 'c3d4e5f6-a7b8-4c5d-8e9f-2a3b4c5d6e7f',
    email: 'maria@servease.ph',
    name: 'Maria Santos',
    password: 'Maria@12345',
  },
  {
    id: 'd4e5f6a7-b8c9-4d5e-8f9a-3b4c5d6e7f8a',
    email: 'sarah@servease.ph',
    name: 'Sarah Go',
    password: 'Sarah@12345',
  },
];

async function createProviderAuthUsers() {
  console.log('🚀 Creating provider authentication users...\n');

  // Initialize Supabase admin client
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  for (const provider of PROVIDERS) {
    try {
      console.log(`Creating auth user for ${provider.name}...`);

      // Create auth user with specific ID using admin API
      const { data, error } = await supabase.auth.admin.createUser({
        id: provider.id,
        email: provider.email,
        password: provider.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          user_type: 'provider',
          full_name: provider.name,
        },
      });

      if (error) {
        console.error(
          `❌ Error creating user for ${provider.name}: ${error.message}`
        );
      } else {
        console.log(
          `✅ Created auth user: ${provider.email} (ID: ${provider.id})`
        );
      }
    } catch (err) {
      console.error(
        `❌ Exception creating user for ${provider.name}: ${err.message}`
      );
    }
  }

  console.log('\n✨ Done! All provider auth users created.\n');
  console.log('Test Login Credentials:');
  console.log('------------------------');
  PROVIDERS.forEach((p) => {
    console.log(`${p.name}`);
    console.log(`  Email: ${p.email}`);
    console.log(`  Password: ${p.password}`);
    console.log('');
  });

  console.log(
    '⚠️  Remember to change these temporary passwords after first login!'
  );
}

// Run the script
createProviderAuthUsers().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
