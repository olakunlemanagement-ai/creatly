"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PLANS } from "@/lib/pricing";

export type SubscriptionState = {
  loading: boolean;
  isActive: boolean;
  isCancelled: boolean;
  isPastDue: boolean;
  status: string | null;
  planId: string | null;
  planLabel: string | null;
  periodEnd: string | null;
  cancelAt: string | null;
  isTeam: boolean;
  seatsTotal: number;
};

const INITIAL: SubscriptionState = {
  loading: true,
  isActive: false,
  isCancelled: false,
  isPastDue: false,
  status: null,
  planId: null,
  planLabel: null,
  periodEnd: null,
  cancelAt: null,
  isTeam: false,
  seatsTotal: 1,
};

// Reads subscription state client-side from Supabase (own rows via RLS).
// isActive is derived from DB status — never from client payment state.
// For Supabase Realtime updates, re-query on subscription channel updates.
export function useSubscription(userId: string | null | undefined): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>(INITIAL);

  useEffect(() => {
    if (!userId) {
      setState({ ...INITIAL, loading: false });
      return;
    }

    const supabase = createClient();

    async function fetch() {
      const { data } = await supabase
        .from("subscriptions")
        .select("status, plan_id, current_period_end, cancel_at, max_seats")
        .eq("owner_id", userId)
        .in("status", ["active", "past_due", "cancelled"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) {
        setState({ ...INITIAL, loading: false });
        return;
      }

      const planLabel = data.plan_id
        ? ((await import("@/lib/pricing")).PLANS[data.plan_id as keyof typeof PLANS]?.label ?? null)
        : null;

      setState({
        loading:     false,
        isActive:    data.status === "active",
        isCancelled: data.status === "cancelled",
        isPastDue:   data.status === "past_due",
        status:      data.status,
        planId:      data.plan_id,
        planLabel,
        periodEnd:   data.current_period_end,
        cancelAt:    data.cancel_at,
        isTeam:      (data.max_seats ?? 1) > 1,
        seatsTotal:  data.max_seats ?? 1,
      });
    }

    void fetch();

    // Realtime: re-fetch when subscription row changes (webhook fires → banner hides immediately).
    // .on() must be chained before .subscribe() — Supabase Realtime v2 rejects listeners added after subscribe().
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(`subscription-state:${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "subscriptions", filter: `owner_id=eq.${userId}` },
          () => { void fetch(); },
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("[useSubscription] Realtime channel error:", status);
          }
        });
    } catch (err) {
      console.warn("[useSubscription] Failed to open Realtime channel:", err);
    }

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [userId]);

  return state;
}
