const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing env vars.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function nukeAllUsers() {
    console.log('WARNING: Deleting ALL users...');

    let { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    if (!users || users.length === 0) {
        console.log('No users found to delete.');
        return;
    }

    console.log(`Found ${users.length} users. Deleting...`);

    for (const user of users) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
            console.error(`Failed to delete ${user.email}:`, deleteError.message);
        } else {
            console.log(`Deleted: ${user.email}`);
        }
    }

    console.log('All users deleted.');
}

nukeAllUsers();
