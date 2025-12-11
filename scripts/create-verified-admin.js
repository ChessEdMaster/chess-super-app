const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createVerifiedAdmin() {
    const email = 'admin.verified@chess.com';
    const password = 'SuperPassword123!';
    const roleName = 'SuperAdmin';

    console.log(`Creating verified user ${email}...`);

    // 1. Create User in Auth
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // AUTO-CONFIRM
        user_metadata: {
            full_name: 'Verified Admin',
            username: 'SuperChessAdmin'
        }
    });

    let userId;

    if (userError) {
        console.error('Error creating user:', userError.message);
        if (userError.message.includes('already registered')) {
            console.log('Fetching existing user...');
            const { data: users } = await supabase.auth.admin.listUsers();
            const existingUser = users.users.find(u => u.email === email);
            if (existingUser) {
                userId = existingUser.id;
                console.log(`Found existing user ID: ${userId}`);
            } else {
                console.error("Could not find existing user in list.");
                return;
            }
        } else {
            return;
        }
    } else {
        userId = userData.user.id;
        console.log(`User created with ID: ${userId}`);
    }

    // 2. Update Role in Profiles
    if (userId) {
        await updateUserRole(userId, roleName);
    }
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
        console.error('Error fetching role (maybe it does not exist in app_roles?):', roleError.message);
        return;
    }

    const roleId = roleData.id;

    // Update Profile
    // Note: The profile row is usually created by a trigger on auth.users insert.
    // We might need to wait a sec if it was just created, but usually triggers are fast.
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

createVerifiedAdmin();
