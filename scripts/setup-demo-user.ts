// @ts-nocheck
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DEMO_USER = {
    email: 'salvadorsanroma@chessclans.com',
    password: 'salvadorsanroma1234',
    name: 'Salvador Sanromà',
    username: 'salvadorsanroma'
};

const TARGET_COURSE_SLUG = 'escacs-llengua-1-primaria';
const CLAN_NAME = 'Classe 1r Primària (Demo)';

async function setupDemoUser() {
    console.log('🚀 Setting up Demo User...');

    // 1. Get Course ID
    const { data: course, error: courseError } = await supabase
        .from('academy_courses')
        .select('id, title')
        .eq('slug', TARGET_COURSE_SLUG)
        .single();

    if (courseError || !course) {
        console.error('❌ Course not found:', courseError);
        return;
    }
    console.log(`✅ Found Course: ${course.title} (${course.id})`);

    // 2. Create/Get Clan and Assign Course
    // We try to find a clan with this name, or create one.
    // We assume there is an 'owner_id' required for a club. We can use the demo user as owner, or a system admin.
    // Actually, usually a teacher owns the clan. Let's make the demo user the owner for simplicity, 
    // OR create a System/Admin owner.
    // Let's create the user FIRST.

    // 3. Create User
    let userId;
    // Check if exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === DEMO_USER.email);

    if (existingUser) {
        console.log(`✅ User already exists: ${existingUser.id}`);
        userId = existingUser.id;
    } else {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: DEMO_USER.email,
            password: DEMO_USER.password,
            email_confirm: true,
            user_metadata: {
                full_name: DEMO_USER.name,
                username: DEMO_USER.username,
                app_role: 'ClubMember' // Student role
            }
        });

        if (createError) {
            console.error('❌ Error creating user:', createError);
            return;
        }
        console.log(`✅ Created User: ${newUser.user.id}`);
        userId = newUser.user.id;
    }

    // 4. Create proper Profile (trigger might have done it, but let's ensure)
    // We can assume trigger handles it.

    // 5. Create Clan (if not exists)
    // We need an owner for the clan. Let's start by using THIS user as owner just so it works, 
    // although realistically a teacher owns it. But "Student" role might not be allowed to own?
    // Let's look for a SuperAdmin to obtain an Owner ID, or just use the user itself if allowed.
    // For specific task: "Assign HIM to the course".
    // So we need a Clan that HAS the course, and HE is a member of it.

    const { data: clan, error: clanError } = await supabase
        .from('clubs')
        .select('id')
        .eq('name', CLAN_NAME)
        .single();

    let clanId;
    if (clan) {
        console.log(`✅ Found Clan: ${clan.id}`);
        clanId = clan.id;
        // Update course just in case
        await supabase.from('clubs').update({ course_id: course.id }).eq('id', clanId);
    } else {
        // Create new clan
        // We need an owner. Let's fetch the first user in DB to be owner, whatever.
        const { data: owners } = await supabase.from('profiles').select('id').limit(1);
        const ownerId = owners[0].id; // Just pick anyone as owner

        const { data: newClan, error: createClanError } = await supabase
            .from('clubs')
            .insert({
                name: CLAN_NAME,
                slug: 'demo-class-1r',
                owner_id: ownerId, // Assigned to random owner
                type: 'school',
                description: 'Demo Class for Academy Beta',
                course_id: course.id // HERE IS THE KEY ASSIGNMENT
            })
            .select()
            .single();

        if (createClanError) {
            console.error('❌ Error creating clan:', createClanError);
            return;
        }
        console.log(`✅ Created Clan with Course: ${newClan.id}`);
        clanId = newClan.id;
    }

    // 6. Add User to Clan
    const { error: memberError } = await supabase
        .from('club_members')
        .upsert({
            club_id: clanId,
            user_id: userId,
            role: 'member',
            joined_at: new Date().toISOString()
        }, { onConflict: 'club_id,user_id' }); // Composite key usually

    if (memberError) {
        // If no composite constraint, we might duplicate. Let's check first.
        const { data: existingMember } = await supabase
            .from('club_members')
            .select('*')
            .eq('club_id', clanId)
            .eq('user_id', userId);

        if (!existingMember || existingMember.length === 0) {
            const { error: insertError } = await supabase
                .from('club_members')
                .insert({
                    club_id: clanId,
                    user_id: userId,
                    role: 'member',
                    joined_at: new Date().toISOString()
                });
            if (insertError) console.error('❌ Error adding member:', insertError);
            else console.log('✅ User added to Clan.');
        } else {
            console.log('✅ User already in Clan.');
        }
    } else {
        console.log('✅ User added/updated in Clan.');
    }

    console.log('\n🎉 Setup Complete!');
    console.log(`User: ${DEMO_USER.email}`);
    console.log(`Pass: ${DEMO_USER.password}`);
    console.log(`Role: Student (via ClubMember)`);
    console.log(`Clan: ${CLAN_NAME}`);
    console.log(`Course: ${course.title}`);
}

setupDemoUser();
