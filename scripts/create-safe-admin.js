const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSafeAdmin() {
    const email = 'admin@chessclans.com';
    const password = 'SuperPassword123!';
    const roleName = 'SuperAdmin';

    console.log(`Creating SAFE admin: ${email}`);

    const { data: userData, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: 'Super Admin',
            username: 'SuperAdmin'
        }
    });

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    const userId = userData.user.id;
    console.log(`User created (ID: ${userId}). Assigning role...`);

    // Get Role ID
    const { data: roleData } = await supabase
        .from('app_roles')
        .select('id')
        .eq('name', roleName)
        .single();

    if (roleData) {
        await supabase
            .from('profiles')
            .update({ role_id: roleData.id })
            .eq('id', userId);
        console.log('Role assigned successfully.');
    } else {
        console.error('Role SuperAdmin not found in DB.');
    }
}

createSafeAdmin();
