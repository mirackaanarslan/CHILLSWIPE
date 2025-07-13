import { createClient } from '@supabase/supabase-js'

const supabaseUrl = SECRET
const supabaseKey = SECRET
 
export const supabase = createClient(supabaseUrl, supabaseKey) 
