"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type ReachChart from "./ReachChart";

// dynamic with ssr:false must live in a Client Component
const Chart = dynamic(() => import("./ReachChart"), { ssr: false });

export default function ReachChartWrapper(props: ComponentProps<typeof ReachChart>) {
  return <Chart {...props} />;
}
