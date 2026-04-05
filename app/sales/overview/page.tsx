"use client";

import { useMemo, useState } from "react";

import { useRegisterAIVisibleContext } from "@/components/providers/AIVisibleContextProvider";
import { SalesPageHeader } from "@/features/sales/components/SalesPageHeader";
import { OverviewHeader } from "@/components/sales/overview/OverviewHeader";
import { OverviewMetrics } from "@/components/sales/overview/OverviewMetrics";
import { OverviewPrimarySection } from "@/components/sales/overview/OverviewPrimarySection";
import { OverviewSecondarySection } from "@/components/sales/overview/OverviewSecondarySection";
import { OverviewSupplementaryCards } from "@/components/sales/overview/OverviewSupplementaryCards";
import { formatCurrency } from "@/components/sales/overview/helpers";
import {
  PerformanceView,
  Summary,
  Timeframe,
} from "@/components/sales/overview/types";
import { safeDivide } from "@/lib/api/riosBackend";
import {
  buildComparisonSeries,
  buildDistributionData,
  buildPerformanceData,
  buildRevenueSeries,
  getTimeWindowLines,
  useSalesDashboardData,
} from "@/features/sales/services/salesDashboardApi";

export default function SalesOverviewPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("day");
  const {
    anchorDate,
    baseUrl,
    categories,
    categoriesByParent,
    fetchError,
    lines,
    loading,
    parentCategories,
  } = useSalesDashboardData(timeframe);
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>("Parent Category");
  const [selectedCategory, setSelectedCategory] = useState<string>("Category");
  const [view, setView] = useState<PerformanceView>("product");

  const parentCategoryOptions = useMemo(
    () => ["Parent Category", ...parentCategories],
    [parentCategories],
  );
  const categoryOptions = useMemo(
    () =>
      selectedParentCategory === "Parent Category"
        ? ["Category", ...categories]
        : ["Category", ...(categoriesByParent[selectedParentCategory] || [])],
    [categories, categoriesByParent, selectedParentCategory],
  );

  const filter = useMemo(
    () => ({
      parentCategory:
        selectedParentCategory !== "Parent Category" ? selectedParentCategory : null,
      category: selectedCategory !== "Category" ? selectedCategory : null,
    }),
    [selectedCategory, selectedParentCategory],
  );

  const activeLabel =
    selectedCategory !== "Category"
      ? selectedCategory
      : selectedParentCategory !== "Parent Category"
        ? selectedParentCategory
        : "Total Revenue";

  const revenueSeries = useMemo(
    () => buildRevenueSeries(lines, timeframe, filter, anchorDate),
    [anchorDate, filter, lines, timeframe],
  );
  const salesData = useMemo(
    () =>
      revenueSeries.map((point) => ({
        label: point.label,
        current: point.current,
        forecast: point.current,
      })),
    [revenueSeries],
  );
  const transactionsData = useMemo(
    () => buildComparisonSeries(lines, timeframe, filter, anchorDate, "transactions"),
    [anchorDate, filter, lines, timeframe],
  );
  const unitsTrendData = useMemo(
    () => buildComparisonSeries(lines, timeframe, filter, anchorDate, "quantity"),
    [anchorDate, filter, lines, timeframe],
  );
  const performanceData = useMemo(
    () => buildPerformanceData(lines, timeframe, filter, anchorDate, view),
    [anchorDate, filter, lines, timeframe, view],
  );
  const mixDistribution = useMemo(
    () =>
      buildDistributionData(
        lines,
        timeframe,
        filter,
        anchorDate,
        selectedCategory !== "Category" ? "product" : "category",
      ),
    [anchorDate, filter, lines, selectedCategory, timeframe],
  );
  const currentWindowLines = useMemo(
    () => getTimeWindowLines(lines, timeframe, filter, anchorDate),
    [anchorDate, filter, lines, timeframe],
  );
  const overallCurrentWindowLines = useMemo(
    () => getTimeWindowLines(lines, timeframe, {}, anchorDate),
    [anchorDate, lines, timeframe],
  );

  const summary = useMemo<Summary>(() => {
    const latest = salesData[salesData.length - 1] || {
      current: 0,
    };
    const previous = salesData[salesData.length - 2]?.current || 0;
    const variance = previous === 0 ? 0 : ((latest.current - previous) / previous) * 100;

    return {
      actual: formatCurrency(latest.current),
      forecast: formatCurrency(latest.current),
      variance: `${variance >= 0 ? "+" : ""}${variance.toFixed(1)}%`,
      forecastStatus: variance >= 0 ? "up" : "down",
    };
  }, [salesData]);

  const latestTransactions = transactionsData[transactionsData.length - 1] || {
    current: 0,
    previous: 0,
  };
  const latestUnits = unitsTrendData[unitsTrendData.length - 1] || {
    current: 0,
    previous: 0,
  };
  const latestTransactionsCurrent = latestTransactions.current;
  const latestUnitsCurrent = latestUnits.current;
  const totalRevenue = currentWindowLines.reduce((sum, line) => sum + line.revenue, 0);
  const totalCost = currentWindowLines.reduce((sum, line) => sum + line.cost, 0);
  const profit = totalRevenue - totalCost;
  const margin = safeDivide(profit, Math.max(totalRevenue, 1)) * 100;
  const aov = safeDivide(totalRevenue, Math.max(latestTransactions.current, 1));
  const unitsPerTransaction = safeDivide(
    latestUnits.current,
    Math.max(latestTransactions.current, 1),
  );
  const unitsGrowth =
    latestUnits.previous === 0
      ? 0
      : ((latestUnits.current - latestUnits.previous) / latestUnits.previous) * 100;
  const predictedDemand = Math.round((latestUnits.current + latestUnits.previous) / 2);
  const demandGapValue = latestUnits.current - predictedDemand;
  const demandGapPercent =
    predictedDemand === 0 ? 0 : (demandGapValue / predictedDemand) * 100;
  const demandGapIsPositive = demandGapValue >= 0;

  const parentCategoryBreakdown = useMemo(() => {
    const grouped = new Map<string, number>();

    overallCurrentWindowLines.forEach((line) => {
      grouped.set(line.parentCategory, (grouped.get(line.parentCategory) || 0) + line.revenue);
    });

    return Array.from(grouped.entries()).sort((left, right) => right[1] - left[1]);
  }, [overallCurrentWindowLines]);
  const totalRevenueForRatio = overallCurrentWindowLines.reduce(
    (sum, line) => sum + line.revenue,
    0,
  );
  const selectedParentCategoryRevenue =
    selectedParentCategory !== "Parent Category"
      ? parentCategoryBreakdown.find(([name]) => name === selectedParentCategory)?.[1] || 0
      : parentCategoryBreakdown[0]?.[1] || 0;
  const parentCategoryLabel =
    selectedParentCategory !== "Parent Category"
      ? selectedParentCategory
      : parentCategoryBreakdown[0]?.[0] || "No parent category";
  const parentCategoryRatio =
    totalRevenueForRatio === 0 ? 0 : (selectedParentCategoryRevenue / totalRevenueForRatio) * 100;

  const overviewMetrics = useMemo(
    () => [
      {
        title: "Revenue",
        value: summary.actual,
        highlight: summary.variance,
        color: "emerald" as const,
        sub: [],
      },
      {
        title: "Sales Quality",
        value: formatCurrency(aov),
        highlight: "AOV",
        sub: [
          { label: "Transactions :", value: latestTransactionsCurrent.toLocaleString() },
          { label: "Units :", value: latestUnitsCurrent.toLocaleString() },
        ],
        color: "sky" as const,
      },
      {
        title: "Profitability",
        value: `${margin.toFixed(1)}%`,
        highlight: "Margin",
        sub: [
          { label: "Profit:", value: formatCurrency(profit) }
        ],
        color: "rose" as const,
      },
      {
        title: "Units Sold",
        value: latestUnitsCurrent.toLocaleString(),
        highlight: "Units",
        sub: [
          { label: "Per Transaction:", value: unitsPerTransaction.toFixed(1) },
          { label: "Growth:", value: `${unitsGrowth >= 0 ? "+" : ""}${unitsGrowth.toFixed(1)}%` },
        ],
        color: "sky" as const,
      },
      {
        title: "Demand Gap",
        value: `${demandGapPercent >= 0 ? "+" : ""}${demandGapPercent.toFixed(1)}%`,
        highlight: "Gap",
        sub: [
          { label: "Predicted:", value: predictedDemand.toLocaleString() },
          { label: "Actual:", value: latestUnitsCurrent.toLocaleString() },
        ],
        color: demandGapIsPositive ? ("emerald" as const) : ("rose" as const),
      },
    ],
    [
      aov,
      demandGapIsPositive,
      demandGapPercent,
      latestTransactionsCurrent,
      latestUnitsCurrent,
      margin,
      predictedDemand,
      profit,
      summary,
      unitsGrowth,
      unitsPerTransaction,
    ],
  );
  const visibleContextInput = useMemo(
    () => ({
      page: "sales-overview",
      title: "Sales Overview",
      filters: {
        timeframe,
        view,
        parentCategory:
          selectedParentCategory !== "Parent Category"
            ? selectedParentCategory
            : null,
        category: selectedCategory !== "Category" ? selectedCategory : null,
      },
      visibleKpis: Object.fromEntries(
        overviewMetrics.flatMap((metric) => [
          [metric.title, metric.value],
          ...(metric.sub || []).map((item) => [
            `${metric.title} ${item.label.replace(/\s*:\s*$/, "")}`,
            item.value,
          ]),
        ]),
      ),
      visibleCharts: [
        {
          title: "Revenue Trend",
          type: "line",
          data: salesData,
        },
        {
          title: "Performance Breakdown",
          type: view === "product" ? "bar" : "pie",
          data: performanceData,
        },
        {
          title: "Transactions Comparison",
          type: "line",
          data: transactionsData,
        },
        {
          title: "Mix Distribution",
          type: "pie",
          data: mixDistribution,
        },
      ],
      selectedEntity:
        selectedCategory !== "Category"
          ? {
              type: "category",
              id: selectedCategory,
              label: selectedCategory,
            }
          : selectedParentCategory !== "Parent Category"
            ? {
                type: "parent-category",
                id: selectedParentCategory,
                label: selectedParentCategory,
              }
            : undefined,
    }),
    [
      mixDistribution,
      overviewMetrics,
      performanceData,
      salesData,
      selectedCategory,
      selectedParentCategory,
      timeframe,
      transactionsData,
      view,
    ],
  );
  useRegisterAIVisibleContext("sales-overview-main", visibleContextInput);

  return (
    <div className="space-y-6">
      <SalesPageHeader />

      {loading ? (
        <div className="h-[32rem] rounded-2xl border border-slate-200 bg-white" />
      ) : fetchError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Sales data service unavailable</p>
          <p className="mt-2">
            Start the backend at <code>{baseUrl}</code> or set <code>NEXT_PUBLIC_API_BASE_URL</code>.
          </p>
        </div>
      ) : salesData.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-500">
          No sales data was returned by the backend.
        </div>
      ) : (
        <>
          <OverviewHeader timeframe={timeframe} onTimeframeChange={setTimeframe} />
          <OverviewMetrics metrics={overviewMetrics} />

          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:items-start">
              <OverviewPrimarySection
                activeLabel={activeLabel}
                summary={summary}
                chartData={salesData}
                parentCategoryOptions={parentCategoryOptions}
                categoryOptions={categoryOptions}
                selectedParentCategory={selectedParentCategory}
                selectedCategory={selectedCategory}
                onParentCategoryChange={(nextParentCategory) => {
                  setSelectedParentCategory(nextParentCategory);
                  setSelectedCategory("Category");
                }}
                onCategoryChange={setSelectedCategory}
              />
              <OverviewSecondarySection
                view={view}
                performanceData={performanceData}
                parentCategoryRatio={parentCategoryRatio}
                parentCategoryLabel={parentCategoryLabel}
                onViewChange={setView}
              />
            </div>

            <OverviewSupplementaryCards
              transactionsData={transactionsData}
              mixDistribution={mixDistribution}
              parentCategoryOptions={parentCategoryOptions}
              categoryOptions={categoryOptions}
              selectedParentCategory={selectedParentCategory}
              selectedCategory={selectedCategory}
              onParentCategoryChange={(nextParentCategory) => {
                setSelectedParentCategory(nextParentCategory);
                setSelectedCategory("Category");
              }}
              onCategoryChange={setSelectedCategory}
            />
          </div>
        </>
      )}
    </div>
  );
}
