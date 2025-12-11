const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const USERS = [
    {
        email: 'superadmin@chessclans.com',
        password: 'password123',
        fullName: 'Super Admin',
        role: 'SuperAdmin',
        username: 'superadmin'
    },
    {
        email: 'school_owner@chessclans.com',
        password: 'password123',
        fullName: 'School Owner',
        role: 'ClubMember',
        username: 'schoolowner',
        club: {
            name: 'Chess Academy School',
            slug: 'chess-academy-school',
            type: 'school',
            description: 'A premier chess school for testing.',
            settings: { allow_chat: true, require_approval: true }
        }
    },
    {
        email: 'club_owner@chessclans.com',
        password: 'password123',
        fullName: 'Club Owner',
        role: 'ClubMember',
        username: 'clubowner',
        club: {
            name: 'Grandmaster Physical Club',
            slug: 'grandmaster-club',
            type: 'club',
            description: 'A physical club for OTB play.',
            settings: { allow_chat: true, require_approval: false }
        }
    },
    {
        email: 'online_owner@chessclans.com',
        password: 'password123',
        fullName: 'Online Owner',
        role: 'ClubMember',
        username: 'onlineowner',
        club: {
            name: 'Global Online Chess',
            slug: 'global-online-chess',
            type: 'online',
            description: 'Connecting players worldwide.',
            settings: { allow_chat: true, require_approval: false }
        }
    },
    {
        email: 'student@chessclans.com',
        password: 'password123',
        fullName: 'Test Student',
        role: 'ClubMember',
        username: 'teststudent'
    },
    {
        email: 'member@chessclans.com',
        password: 'password123',
        fullName: 'Test Member',
        role: 'ClubMember',
        username: 'testmember'
    },
    {
        email: 'newuser@chessclans.com',
        password: 'password123',
        fullName: 'New User',
        role: 'NewUser',
        username: 'newuser'
    }
];

async function getRoleId(roleName) {
    const { data, error } = await supabase
        .from('app_roles')
        .select('id')
        .eq('name', roleName)
        .single();

    if (error) {
        console.error(`Error finding role ${roleName}:`, error.message);
        return null;
    }
    return data.id;
}

async function createOrUpdateUser(userDef) {
    console.log(`Processing user: ${userDef.email}`);

    let userId;

    // 1. Try to find existing user by email
    // Since listUsers is paginated, for exact match effectively we might better iterate or just try create and catch
    // But listUsers allows filtering by email in some versions? No, checking manually is safer for script.

    // Using admin.listUsers to find if exists
    // Note: This is not efficient for millions of users but fine for test script
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === userDef.email);

    if (existingUser) {
        console.log(`  - User exists with ID: ${existingUser.id}`);
        userId = existingUser.id;
        // Update password not strictly necessary if we know it, but good for reset. skipping for speed unless needed.
    } else {
        console.log(`  - Creating new user...`);
        const { data, error } = await supabase.auth.admin.createUser({
            email: userDef.email,
            password: userDef.password,
            email_confirm: true,
            user_metadata: {
                full_name: userDef.fullName,
                username: userDef.username
            }
        });

        if (error) {
            console.error(`  - Error creating user: ${error.message}`);
            return null;
        }
        userId = data.user.id;
        console.log(`  - Created user ID: ${userId}`);
    }

    // 2. Update Role
    const roleId = await getRoleId(userDef.role);
    if (roleId && userId) {
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ role_id: roleId })
            .eq('id', userId);

        if (profileError) {
            console.error(`  - Error updating profile role: ${profileError.message}`);
        } else {
            console.log(`  - Role updated to ${userDef.role}`);
        }
    }

    // 3. Create Club if needed
    if (userDef.club && userId) {
        await ensureClub(userId, userDef.club);
    }

    return userId;
}

async function ensureClub(ownerId, clubDef) {
    console.log(`  - Ensuring club: ${clubDef.name}`);

    // Check if club with this slug exists
    const { data: existingClub, error: fetchError } = await supabase
        .from('clubs')
        .select('id, owner_id')
        .eq('slug', clubDef.slug)
        .single();

    if (existingClub) {
        console.log(`    - Club exists with ID: ${existingClub.id}`);
        if (existingClub.owner_id !== ownerId) {
            console.warn(`    - WARNING: Club owner mismatch! Expected ${ownerId}, got ${existingClub.owner_id}`);
            // Can update owner if we want strictly enforcement
        }
    } else {
        console.log(`    - Creating club...`);
        // We assume 'clubs' table columns based on types/club.ts
        // id, name, slug, description, image_url, owner_id, type, settings

        const { data, error } = await supabase
            .from('clubs')
            .insert({
                name: clubDef.name,
                slug: clubDef.slug,
                description: clubDef.description,
                owner_id: ownerId,
                type: clubDef.type,
                settings: clubDef.settings
            })
            .select()
            .single();

        if (error) {
            console.error(`    - Error creating club: ${error.message}`);
        } else {
            console.log(`    - Club created with ID: ${data.id}`);
        }
    }
}

async function main() {
    console.log('Starting Test Users Setup...');

    for (const userDef of USERS) {
        await createOrUpdateUser(userDef);
    }

    console.log('Setup Complete!');
}

main();
