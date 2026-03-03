// 請填入你的 Supabase 專案 URL 與 public anon key
const SUPABASE_URL = 'https://thqszkrjvzjzurgjuafp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocXN6a3JqdnpqenVyZ2p1YWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0ODc5MTMsImV4cCI6MjA4ODA2MzkxM30.P0XsbM5ma9thOpcvXBNkxd_29VZtJhwemm63GILG6zY';

// 初始化 Supabase Client
window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
