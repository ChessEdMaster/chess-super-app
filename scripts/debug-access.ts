// @ts-nocheck
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DEMO_EMAIL = 'salvadorsanroma@chessclans.com';

async function debugAccess() {
    console.log('🕵️ Debugging User Access...');

    // 1. Get User
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === DEMO_EMAIL);

    if (!user) {
        console.error('❌ User not found');
        return;
    }
    console.log(`✅ User found: ${user.id} (${user.email})`);
    console.log('   App Metadata:', user.app_metadata);
    console.log('   User Metadata:', user.user_metadata);

    // 2. Check Club Membership
    const { data: members, error: memError } = await supabase
        .from('club_members')
        .select('*')
        .eq('user_id', user.id);

    if (memError) console.error('❌ Error fetching members:', memError);
    else console.log(`   Club Memberships (${members.length}):`, members);

    if (members.length > 0) {
        const clubId = members[0].club_id;
        // 3. Check Club
        const { data: club, error: clubError } = await supabase
            .from('clubs')
            .select('id, name, course_id')
            .eq('id', clubId)
            .single();

        if (clubError) console.error('❌ Error fetching club:', clubError);
        else {
            console.log(`   Club: ${club.name}`);
            console.log(`   Course ID: ${club.course_id}`);

            if (club.course_id) {
                // 4. Check Course
                const { data: course, error: courseError } = await supabase
                    .from('academy_courses')
                    .select('id, title, published')
                    .eq('id', club.course_id)
                    .single();

                if (courseError) console.error('❌ Error fetching course:', courseError);
                else console.log(`   Course: ${course.title} (Published: ${course.published})`);
            } else {
                console.error('❌ Club has NO course_id assigned!');
            }
        }
    } else {
        console.error('❌ User is not in any club!');
    }
}

debugAccess();
