"use client";

import { useState, useEffect, useCallback } from "react";

type Outlier = {
  ig_media_id: string;
  caption_preview: string;
  reason: string;
  thumbnail_url: string | null;
  permalink: string | null;
};

type InsightsData = {
  outliers: Outlier[];
  patterns: string[];
  recommendation: string;
};

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 bg-zinc-800/60 rounded-none" />
        ))}
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-4 bg-zinc-800/60 rounded-none" style={{ width: `${75 - i * 12}%` }} />
        ))}
      </div>
      <div className="h-14 bg-zinc-800/60 rounded-none" />
    </div>
  );
}

export default function InsightsPanel() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insights");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  return (
    <div className="border border-[#2a2a2a] bg-[#1c1c1c] p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">AI Insights</p>
        <button
          onClick={fetch_}
          disabled={loading}
          className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors"
        >
          {loading ? "Analyzing…" : "Refresh"}
        </button>
      </div>

      {loading && <Skeleton />}

      {error && !loading && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {data && !loading && (
        <div className="space-y-6">

          {/* Outliers */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 mb-3">Top Performers</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {data.outliers.map((o) => (
                <div key={o.ig_media_id} className="border border-[#2a2a2a] bg-[#141414] p-3 flex gap-3">
                  {o.thumbnail_url && (
                    <img
                      src={o.thumbnail_url}
                      alt=""
                      className="w-20 aspect-video object-cover shrink-0 bg-zinc-800"
                    />
                  )}
                  <div className="flex flex-col justify-between min-w-0 flex-1">
                    <div>
                      <p className="text-xs text-zinc-300 leading-snug mb-1 line-clamp-2">
                        {o.caption_preview.slice(0, 50)}
                      </p>
                      <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-4">
                        {o.reason}
                      </p>
                    </div>
                    {o.permalink && (
                      <div className="flex justify-end mt-2">
                        <a
                          href={o.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          View on Instagram ↗
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patterns */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 mb-3">Patterns</p>
            <ul className="space-y-2">
              {data.patterns.map((p, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-400 leading-relaxed">
                  <span className="text-zinc-700 shrink-0 tabular-nums">{i + 1}.</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendation */}
          <div className="border-l-2 border-amber-400 pl-4 py-1">
            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 mb-2">This Week</p>
            <p className="text-sm text-zinc-200 leading-relaxed">{data.recommendation}</p>
          </div>

        </div>
      )}
    </div>
  );
}
