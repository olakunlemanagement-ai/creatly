// Temporary diagnostic — delete after use.
// Run: node --env-file=.env.local scripts/test-storage.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in environment");
  process.exit(1);
}

console.log("Supabase URL:     ", url);
// Print first 30 chars of the key so we can verify it's the service-role key
// (service-role is a long JWT starting with eyJ...; new format starts with sb_secret_...)
console.log("Key prefix (30):  ", secretKey.slice(0, 30));

const admin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1. List all objects in resource-files to see what Supabase actually sees
console.log("\n--- Listing objects in resource-files ---");
const { data: listData, error: listError } = await admin.storage
  .from("resource-files")
  .list("", { limit: 20 });
console.log("List result:", JSON.stringify({ data: listData, error: listError }, null, 2));

// 2. Attempt signed URL for test.jpg
console.log("\n--- createSignedUrl('test.jpg', 60) ---");
const { data, error } = await admin.storage
  .from("resource-files")
  .createSignedUrl("test.jpg", 60);
console.log("Result:", JSON.stringify({ data, error }, null, 2));
