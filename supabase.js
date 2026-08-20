// Supabase configuration - replace with your new project values
const SUPABASE_URL = 'https://lekkmvwpqgxdqtizdtgs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla2ttdndwcWd4ZHF0aXpkdGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4Mzg0OTAsImV4cCI6MjEwMTQxNDQ5MH0.BFJyIp2OkCkl0oAuf7tDo9iW4kaHbAloTal4R3zN7_s';

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expose for inline scripts in HTML
window.supabaseClient = supabaseClient;
