import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://utvambhummwlrpqeefqy.supabase.co";
const supabaseAnonKey = "sb_publishable_IHdWSEXEdRwqOJYLQ2Ik7Q_1XxwLXos";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);