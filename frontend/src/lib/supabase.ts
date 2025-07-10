import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mympcultccsrokpjpsdm.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bXBjdWx0Y2Nzcm9rcGpwc2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjc2OTYsImV4cCI6MjA2NzY0MzY5Nn0.-LDpmeaMnkO2QUix3IdyUAHXkVq3JVezkcuCGSdF6to'
 
export const supabase = createClient(supabaseUrl, supabaseKey) 