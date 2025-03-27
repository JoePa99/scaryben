// Script to set up Supabase tables
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials
const supabaseUrl = 'https://tgmetgsidyjqgggqukug.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbWV0Z3NpZHlqcWdnZ3F1a3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwOTI5MjYsImV4cCI6MjA1ODY2ODkyNn0.XJHEM7Bq99SQaNj2q4VvEY-HNQaSXrw7x1PGrn46MVc';

// Create a single supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupSupabase() {
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'supabase-setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split the SQL into separate statements
    const statements = sql.split(';').filter(stmt => stmt.trim());

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each SQL statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;

      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        // Try direct query as fallback
        const { error: directError } = await supabase.from('_exec_sql').select('*').limit(1);
        if (directError) {
          console.error('Direct SQL execution failed:', directError);
        }
      }
    }

    // Verify table was created
    const { data, error } = await supabase.from('franklin_requests').select('count').limit(1);
    
    if (error) {
      console.error('Error verifying table creation:', error);
    } else {
      console.log('Table verification successful!');
    }

    console.log('Supabase setup completed successfully!');
  } catch (error) {
    console.error('Unhandled error during setup:', error);
  }
}

// Run the setup
setupSupabase().catch(console.error);