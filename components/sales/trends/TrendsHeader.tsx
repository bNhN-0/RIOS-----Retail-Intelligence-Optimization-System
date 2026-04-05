"use client";

import { SalesSectionHeader } from "@/features/sales/components/SalesSectionHeader";
import { Card, CardHeader } from "@/components/ui/card";

import { GroupByKey, MetricKey, RangeKey } from "./types";

type TrendsHeaderProps = {
  range: RangeKey;
  ranges: Array<{ key: RangeKey; label: string }>;
  metric: MetricKey;
  metrics: Array<{ key: MetricKey; label: string }>;
  groupBy: GroupByKey;
  groups: Array<{ key: GroupByKey; label: string }>;
  onRangeChange: (range: RangeKey) => void;
  onMetricChange: (metric: MetricKey) => void;
  onGroupByChange: (groupBy: GroupByKey) => void;
};

export function TrendsHeader({
  range,
  ranges,
  metric,
  metrics,
  groupBy,
  groups,
  onRangeChange,
  onMetricChange,
  onGroupByChange,
}: TrendsHeaderProps) {
  return (
null
  );
}
