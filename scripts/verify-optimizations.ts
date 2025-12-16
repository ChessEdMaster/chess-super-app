export async function checkIndexPerformance() {
    console.log("To verify index performance, please run the following EXPLAIN ANALYZE queries in your Supabase SQL Editor:");
    console.log(`
    EXPLAIN ANALYZE SELECT * FROM academy_exercises WHERE tags @> '{"mate-in-1"}';
    
    EXPLAIN ANALYZE SELECT * FROM club_students WHERE club_id = 'some-uuid';
  `);
}

checkIndexPerformance();
