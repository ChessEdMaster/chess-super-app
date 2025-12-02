const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
    const email = 'joanantperez@gmail.com';
    const password = 'ChessMaster2025!';
    const roleName = 'ClubMember'; // Basic role with view permissions

    console.log(`Creating user ${email}...`);

    // 1. Create User in Auth
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: 'Joan Ant. Perez',
            username: 'joanantperez'
        }
    });

    if (userError) {
        console.error('Error creating user:', userError.message);
        // If user already exists, try to get their ID
        if (userError.message.includes('already registered')) {
            console.log('User already exists, fetching details...');
            // We can't fetch by email easily with admin API without listing, 
            // but let's assume we can just update the profile if we knew the ID.
            // For now, let's just exit or try to sign in?
            // Actually, let's list users to find the ID.
            const { data: users } = await supabase.auth.admin.listUsers();
            const existingUser = users.users.find(u => u.email === email);
            if (existingUser) {
                console.log(`Found existing user ID: ${existingUser.id}`);
                await updateUserRole(existingUser.id, roleName);
                return;
            }
        }
        return;
    }

    const userId = userData.user.id;
    console.log(`User created with ID: ${userId}`);

    // 2. Update Role in Profiles
    await updateUserRole(userId, roleName);
}

async function updateUserRole(userId, roleName) {
    console.log(`Updating role to ${roleName}...`);

    // Get Role ID
    const { data: roleData, error: roleError } = await supabase
        .from('app_roles')
        .select('id')
        .eq('name', roleName)
        .single();

    if (roleError) {
        console.error('Error fetching role:', roleError.message);
        return;
    }

    const roleId = roleData.id;

    // Update Profile
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role_id: roleId })
        .eq('id', userId);

    if (updateError) {
        console.error('Error updating profile role:', updateError.message);
    } else {
        console.log(`Successfully updated user ${userId} to role ${roleName}`);
    }
}

createTestUser();
