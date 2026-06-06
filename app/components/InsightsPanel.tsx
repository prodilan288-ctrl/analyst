"use client";

import { useState, useEffect, useCallback } from "react";

function Thumbnail({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <div className="w-16 aspect-video rounded bg-zinc-800 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-zinc-600" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6 4l6 4-6 4V4z" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className="w-16 aspect-video object-cover rounded shrink-0"
      onError={() => setFailed(true)}
    />
  );
}

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
    <div className="border border-[#2a2a2a] bg-[#1a1a1a] p-6">
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
            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-3">Top Performers</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {data.outliers.map((o) => (
                <div key={o.ig_media_id} className="border border-[#2a2a2a] bg-[#1a1a1a] rounded-lg p-4 flex gap-3">
                  <Thumbnail url={o.thumbnail_url} />
                  <div className="flex flex-col justify-between min-w-0 flex-1">
                    <div>
                      <p className="text-xs text-zinc-200 leading-snug line-clamp-2 mb-1">
                        {o.caption_preview.slice(0, 80)}
                      </p>
                      <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                        {o.reason}
                      </p>
                    </div>
                    {o.permalink && (
                      <a
                        href={o.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors self-end mt-2"
                      >
                        View on Instagram ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patterns */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-3">Patterns</p>
            <ul className="space-y-2">
              {data.patterns.map((p, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-300 leading-relaxed line-clamp-2">
                  <span className="text-zinc-600 shrink-0 tabular-nums">{i + 1}.</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendation */}
          <div className="bg-amber-950/30 border-l-2 border-amber-400 p-4 rounded-r-lg">
            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-2">This Week</p>
            <p className="text-sm text-zinc-200 leading-relaxed line-clamp-4">{data.recommendation}</p>
          </div>

        </div>
      )}
    </div>
  );
}
