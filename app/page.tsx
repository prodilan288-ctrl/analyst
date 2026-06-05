import { supabase } from "@/lib/supabase";
import ReachChartWrapper from "./components/ReachChartWrapper";
import ReelsTable from "./components/ReelsTable";
import type { ReelRow } from "./components/ReelsTable";

export const dynamic_param = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  // All account snapshots oldest → newest (chart-ready order)
  const { data: snapshots } = await supabase
    .from("account_snapshots")
    .select("*")
    .order("captured_on", { ascending: true })
    .limit(30);

  const latest = snapshots ? snapshots[snapshots.length - 1] : null;
  const sevenDayReach = (snapshots ?? []).slice(-7).reduce((sum, s) => sum + (s.reach ?? 0), 0);

  const chartData = (snapshots ?? []).map((s) => ({
    date: s.captured_on as string,
    reach: s.reach ?? 0,
  }));

  // Latest snapshot date for the reels table
  const { data: latestDateRow } = await supabase
    .from("reel_snapshots")
    .select("captured_on")
    .order("captured_on", { ascending: false })
    .limit(1)
    .single();

  const { data: reelRows } = latestDateRow
    ? await supabase
        .from("reel_snapshots")
        .select("*, reels!inner(*)")
        .eq("captured_on", latestDateRow.captured_on)
    : { data: [] };

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white px-8 py-10">
      <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-600 mb-10">
        prod.ilan_ / analytics
      </p>

      {/* Overview */}
      <div className="grid grid-cols-2 gap-3 mb-10 md:grid-cols-4">
        <StatCard label="Followers" value={latest?.followers?.toLocaleString() ?? "—"} />
        <StatCard label="7-Day Reach" value={sevenDayReach.toLocaleString()} />
        <StatCard label="Profile Views" sub="7-day" value={latest?.profile_views?.toLocaleString() ?? "—"} accent />
        <StatCard label="Accounts Engaged" sub="7-day" value={latest?.accounts_engaged?.toLocaleString() ?? "—"} accent />
      </div>

      {/* Reach chart */}
      <section className="mb-10">
        <Label>Daily Reach — Last 7 Days</Label>
        <div className="border border-[#2a2a2a] bg-[#1c1c1c] p-6">
          <ReachChartWrapper data={chartData} />
        </div>
      </section>

      {/* Reels */}
      <section>
        <Label>Reels</Label>
        <ReelsTable reels={(reelRows ?? []) as ReelRow[]} />
      </section>
    </main>
  );
}

function StatCard({ label, sub, value, accent }: { label: string; sub?: string; value: string; accent?: boolean }) {
  return (
    <div className={`border bg-[#1c1c1c] p-5 ${accent ? "border-l-2 border-l-amber-400 border-t-[#2a2a2a] border-r-[#2a2a2a] border-b-[#2a2a2a]" : "border-[#2a2a2a]"}`}>
      <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-400">
        {label}
        {sub && <span className="ml-1 text-zinc-600">({sub})</span>}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-white">{value}</p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 mb-3">{children}</p>;
}
