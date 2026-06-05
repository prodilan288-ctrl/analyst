"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type ChartPoint = { date: string; reach: number };

function fmtDate(d: string) {
  const [, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(day)} ${months[parseInt(m) - 1]}`;
}

export default function ReachChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={fmtDate}
          tick={{ fill: "#888888", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#888888", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid #27272a",
            borderRadius: 0,
            color: "#fff",
            fontSize: 12,
          }}
          labelFormatter={(d) => fmtDate(String(d))}
          cursor={{ stroke: "#3f3f46" }}
        />
        <Line
          type="monotone"
          dataKey="reach"
          stroke="#ffffff"
          strokeWidth={2}
          dot={{ fill: "#ffffff", r: 3 }}
          activeDot={{ r: 4, fill: "#ffffff", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
