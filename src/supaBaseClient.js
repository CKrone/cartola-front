import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ghxlnvyoxhacwsevsfws.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoeGxudnlveGhhY3dzZXZzZndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NTE5MzcsImV4cCI6MjA1ODMyNzkzN30.FdyNtQuczgV-_9P--1XaEaIVujNfBaDBR6vGmbZwLEo'
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
