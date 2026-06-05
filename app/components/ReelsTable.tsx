"use client";

import { useState, useCallback } from "react";

const FORMAT_OPTIONS = ["viral", "yap", "cookup", "pov", "placement"];
const STAGE_OPTIONS = ["TOFU", "MOFU", "BOFU"];

const STAGE_COLORS: Record<string, string> = {
  TOFU: "text-teal-400",
  MOFU: "text-violet-400",
  BOFU: "text-amber-400",
};

function TagSelect({
  igMediaId,
  field,
  value,
  options,
  onSave,
  flashing,
}: {
  igMediaId: string;
  field: "format" | "funnel_stage";
  value: string | null;
  options: string[];
  onSave: (igMediaId: string, field: "format" | "funnel_stage", value: string | null) => void;
  flashing: boolean;
}) {
  const colorClass =
    field === "funnel_stage" && value
      ? (STAGE_COLORS[value] ?? "text-zinc-300")
      : value
        ? "text-zinc-300"
        : "text-zinc-500";

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onSave(igMediaId, field, e.target.value || null)}
      className={[
        "text-[11px] px-1.5 py-0.5 rounded-none cursor-pointer outline-none",
        "border transition-colors duration-150",
        "bg-[#1c1c1c]",
        flashing
          ? "border-green-600 bg-green-950/40 text-green-400"
          : `border-zinc-700 hover:border-zinc-500 ${colorClass}`,
      ].join(" ")}
    >
      <option value="" className="bg-[#1c1c1c] text-zinc-500">—</option>
      {options.map((o) => (
        <option key={o} value={o} className="bg-[#1c1c1c] text-zinc-200">
          {o}
        </option>
      ))}
    </select>
  );
}

type ReelMeta = {
  id: string;
  ig_media_id: string;
  caption: string | null;
  permalink: string | null;
  thumbnail_url: string | null;
  posted_at: string | null;
  format: string | null;
  funnel_stage: string | null;
};

export type ReelRow = {
  reel_id: string;
  captured_on: string;
  views: number | null;
  reach: number | null;
  saved: number | null;
  shares: number | null;
  comments: number | null;
  total_interactions: number | null;
  avg_watch_time: number | null;
  total_watch_time: number | null;
  reels: ReelMeta;
};

type ColDef = {
  key: string;
  label: string;
  icp?: boolean;
  getValue: (r: ReelRow) => number | string | null;
  render: (r: ReelRow) => React.ReactNode;
};

const n = (v: number | null) => (v != null ? v.toLocaleString() : "—");
const watchMs = (ms: number | null) => (ms != null ? `${(ms / 1000).toFixed(1)}s` : "—");
const postDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    : "—";

const COLUMNS: ColDef[] = [
  {
    key: "posted_at",
    label: "Posted",
    getValue: (r) => r.reels.posted_at ?? "",
    render: (r) => <span className="text-zinc-500 whitespace-nowrap">{postDate(r.reels.posted_at)}</span>,
  },
  {
    key: "views",
    label: "Views",
    getValue: (r) => r.views ?? -1,
    render: (r) => <span className="text-zinc-300">{n(r.views)}</span>,
  },
  {
    key: "reach",
    label: "Reach",
    getValue: (r) => r.reach ?? -1,
    render: (r) => <span className="text-zinc-300">{n(r.reach)}</span>,
  },
  {
    key: "saved",
    label: "Saved",
    icp: true,
    getValue: (r) => r.saved ?? -1,
    render: (r) => <span className="font-semibold text-amber-300">{n(r.saved)}</span>,
  },
  {
    key: "shares",
    label: "Shares",
    getValue: (r) => r.shares ?? -1,
    render: (r) => <span className="text-zinc-300">{n(r.shares)}</span>,
  },
  {
    key: "comments",
    label: "Comments",
    getValue: (r) => r.comments ?? -1,
    render: (r) => <span className="text-zinc-300">{n(r.comments)}</span>,
  },
  {
    key: "avg_watch_time",
    label: "Avg Watch",
    getValue: (r) => r.avg_watch_time ?? -1,
    render: (r) => <span className="text-zinc-400">{watchMs(r.avg_watch_time)}</span>,
  },
];

const FUNNEL_STYLES: Record<string, string> = {
  TOFU: "bg-teal-950 text-teal-400 border border-teal-800",
  MOFU: "bg-violet-950 text-violet-400 border border-violet-800",
  BOFU: "bg-amber-950 text-amber-400 border border-amber-800",
};

function FunnelTag({ stage }: { stage: string | null }) {
  if (!stage) return null;
  const cls = FUNNEL_STYLES[stage] ?? "bg-zinc-900 text-zinc-500 border border-zinc-700";
  return (
    <span className={`text-[10px] px-2 py-0.5 tracking-wide whitespace-nowrap ${cls}`}>
      {stage}
    </span>
  );
}

export default function ReelsTable({ reels }: { reels: ReelRow[] }) {
  const [sortKey, setSortKey] = useState("saved");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [localTags, setLocalTags] = useState<
    Record<string, { format?: string | null; funnel_stage?: string | null }>
  >({});
  const [flashKey, setFlashKey] = useState<string | null>(null);

  const handleTag = useCallback(
    async (igMediaId: string, field: "format" | "funnel_stage", value: string | null) => {
      const res = await fetch(`/api/reels/${igMediaId}/tag`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        setLocalTags((prev) => ({
          ...prev,
          [igMediaId]: { ...prev[igMediaId], [field]: value },
        }));
        const key = `${igMediaId}-${field}`;
        setFlashKey(key);
        setTimeout(() => setFlashKey((k) => (k === key ? null : k)), 1200);
      }
    },
    [],
  );

  function handleSort(key: string) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const col = COLUMNS.find((c) => c.key === sortKey);
  const sorted = [...reels].sort((a, b) => {
    const aVal = col?.getValue(a) ?? -1;
    const bVal = col?.getValue(b) ?? -1;
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="border border-zinc-800 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-[#1c1c1c]">
          <tr className="border-b border-zinc-800">
            <th className="p-3 text-left w-20 text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-normal">
              Thumb
            </th>
            <th className="p-3 text-left text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-normal">
              Caption
            </th>
            {COLUMNS.map((c) => (
              <th
                key={c.key}
                onClick={() => handleSort(c.key)}
                className={[
                  "p-3 text-left text-[10px] uppercase tracking-[0.15em] font-normal",
                  "cursor-pointer select-none whitespace-nowrap transition-colors",
                  sortKey === c.key ? (c.icp ? "text-amber-300" : "text-white") : c.icp ? "text-amber-400" : "text-zinc-400",
                  sortKey !== c.key ? "hover:text-zinc-300" : "",
                ].join(" ")}
              >
                {c.label}
                {sortKey === c.key && (
                  <span className="ml-0.5 opacity-60">{sortDir === "desc" ? "↓" : "↑"}</span>
                )}
              </th>
            ))}
            <th className="p-3 text-left text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-normal">
              Format
            </th>
            <th className="p-3 text-left text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-normal">
              Stage
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={row.reel_id}
              className={[
                "border-b border-zinc-800/40 transition-colors hover:bg-[#222222]",
                i % 2 !== 0 ? "bg-[#171717]" : "bg-[#141414]",
              ].join(" ")}
            >
              <td className="p-3">
                {row.reels.thumbnail_url ? (
                  <img
                    src={row.reels.thumbnail_url}
                    alt=""
                    className="w-16 aspect-video object-cover bg-zinc-800 border border-zinc-600"
                  />
                ) : (
                  <div className="w-16 aspect-video bg-zinc-800" />
                )}
              </td>
              <td className="p-3 max-w-[220px]">
                <a
                  href={row.reels.permalink ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 hover:text-white transition-colors leading-snug block"
                >
                  {row.reels.caption
                    ? row.reels.caption.slice(0, 60) + (row.reels.caption.length > 60 ? "…" : "")
                    : <span className="text-zinc-600">—</span>}
                </a>
              </td>
              {COLUMNS.map((c) => (
                <td
                  key={c.key}
                  className={`p-3 tabular-nums${c.icp ? " bg-amber-950/40" : ""}`}
                >
                  {c.render(row)}
                </td>
              ))}
              <td className="p-3">
                <TagSelect
                  igMediaId={row.reels.ig_media_id}
                  field="format"
                  value={localTags[row.reels.ig_media_id]?.format !== undefined
                    ? localTags[row.reels.ig_media_id].format ?? null
                    : row.reels.format}
                  options={FORMAT_OPTIONS}
                  onSave={handleTag}
                  flashing={flashKey === `${row.reels.ig_media_id}-format`}
                />
              </td>
              <td className="p-3">
                <TagSelect
                  igMediaId={row.reels.ig_media_id}
                  field="funnel_stage"
                  value={localTags[row.reels.ig_media_id]?.funnel_stage !== undefined
                    ? localTags[row.reels.ig_media_id].funnel_stage ?? null
                    : row.reels.funnel_stage}
                  options={STAGE_OPTIONS}
                  onSave={handleTag}
                  flashing={flashKey === `${row.reels.ig_media_id}-funnel_stage`}
                />
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={11} className="p-10 text-center text-zinc-600">
                No reels synced yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
