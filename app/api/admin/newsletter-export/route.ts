import { getAuthenticatedUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    // 1. AUTH
    const auth = await getAuthenticatedUser();
    if (!auth) return new Response("Unauthorized", { status: 401 });

    // 2. AUTHORIZE — admin only
    const allowed = await hasPermission(auth.user.id, "users.read");
    if (!allowed) return new Response("Forbidden", { status: 403 });

    // 3. EXECUTE — fetch all subscribers (no pagination for export)
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("email, source, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[newsletter-export] query error:", error);
      return new Response("Internal error", { status: 500 });
    }

    const rows = data ?? [];
    const csv = [
      "email,source,subscribed_at",
      ...rows.map((r) =>
        [
          `"${r.email.replace(/"/g, '""')}"`,
          `"${r.source}"`,
          `"${r.created_at}"`,
        ].join(",")
      ),
    ].join("\r\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="newsletter-subscribers.csv"`,
      },
    });
  } catch (err) {
    console.error("[newsletter-export] unexpected error:", err);
    return new Response("Internal error", { status: 500 });
  }
}
