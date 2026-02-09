'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useStore } from '@/lib/store';
import type { Transaction } from '@/lib/types';
import { formatCurrency, groupByMonth } from '@/lib/utils';
import { Calendar, BarChart3, TrendingUp } from 'lucide-react';

interface TimelineChartProps {
  transactions: Transaction[];
  currency: string;
}

type TimePeriod = '7days' | '30days' | '90days' | '1year' | 'all';
type AggregationType = 'daily' | 'weekly' | 'monthly';
type ViewMode = 'income-vs-expenses' | 'net-flow' | 'cumulative';

interface ChartData {
  date: string;
  income: number;
  expenses: number;
  net: number;
  cumulative: number;
}

export default function TimelineChart({ transactions, currency }: TimelineChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30days');
  const [aggregationType, setAggregationType] = useState<AggregationType>('daily');
  const [viewMode, setViewMode] = useState<ViewMode>('income-vs-expenses');
  const [showComparison, setShowComparison] = useState(false);

  // Filter transactions by time period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    switch (timePeriod) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    return transactions.filter((t) => new Date(t.date) >= startDate);
  }, [transactions, timePeriod]);

  // Aggregate data based on aggregation type
  const chartData = useMemo((): ChartData[] => {
    const grouped: Record<string, { income: number; expenses: number }> = {};

    filteredTransactions.forEach((t) => {
      const date = new Date(t.date);
      let key: string;

      switch (aggregationType) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!grouped[key]) {
        grouped[key] = { income: 0, expenses: 0 };
      }

      if (t.type === 'income') {
        grouped[key].income += t.amount;
      } else {
        grouped[key].expenses += t.amount;
      }
    });

    // Convert to array and sort
    let data = Object.entries(grouped)
      .map(([date, { income, expenses }]) => ({
        date,
        income,
        expenses,
        net: income - expenses,
        cumulative: 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate cumulative
    let cumulativeSum = 0;
    data = data.map((item) => ({
      ...item,
      cumulative: (cumulativeSum += item.net),
    }));

    return data;
  }, [filteredTransactions, aggregationType]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalIncome = chartData.reduce((sum, d) => sum + d.income, 0);
    const totalExpenses = chartData.reduce((sum, d) => sum + d.expenses, 0);
    const netFlow = totalIncome - totalExpenses;
    const avgMonthly =
      chartData.length > 0 ? netFlow / chartData.length : 0;

    return { totalIncome, totalExpenses, netFlow, avgMonthly };
  }, [chartData]);

  // Format tooltip
  const tooltipFormatter = (value: number) => formatCurrency(value, currency);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Financial Timeline
            </CardTitle>
            <CardDescription>
              Track your income, expenses, and cash flow over time
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="space-y-4">
          {/* Time Period */}
          <div>
            <p className="text-sm font-medium mb-2">Time Period</p>
            <div className="flex flex-wrap gap-2">
              {(['7days', '30days', '90days', '1year', 'all'] as TimePeriod[]).map(
                (period) => (
                  <Button
                    key={period}
                    variant={timePeriod === period ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimePeriod(period)}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    {period === '7days'
                      ? '7 Days'
                      : period === '30days'
                      ? '30 Days'
                      : period === '90days'
                      ? '90 Days'
                      : period === '1year'
                      ? '1 Year'
                      : 'All Time'}
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Aggregation Type */}
          <div>
            <p className="text-sm font-medium mb-2">Group By</p>
            <div className="flex flex-wrap gap-2">
              {(['daily', 'weekly', 'monthly'] as AggregationType[]).map((agg) => (
                <Button
                  key={agg}
                  variant={aggregationType === agg ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAggregationType(agg)}
                >
                  {agg.charAt(0).toUpperCase() + agg.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* View Mode */}
          <div>
            <p className="text-sm font-medium mb-2">View Mode</p>
            <div className="flex flex-wrap gap-2">
              {(['income-vs-expenses', 'net-flow', 'cumulative'] as ViewMode[]).map(
                (mode) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode(mode)}
                  >
                    <BarChart3 className="w-3 h-3 mr-1" />
                    {mode === 'income-vs-expenses'
                      ? 'Income vs Expenses'
                      : mode === 'net-flow'
                      ? 'Net Flow'
                      : 'Cumulative'}
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Comparison Toggle */}
          {timePeriod !== '7days' && (
            <div>
              <Button
                variant={showComparison ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
              >
                {showComparison ? '✓' : '○'} Show Comparison
              </Button>
              {showComparison && (
                <p className="text-xs text-muted-foreground mt-2">
                  Compare this period with the same period last year
                </p>
              )}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-green-50">
            <p className="text-xs text-muted-foreground">Total Income</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(stats.totalIncome, currency)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-red-50">
            <p className="text-xs text-muted-foreground">Total Expenses</p>
            <p className="text-lg font-semibold text-red-600">
              {formatCurrency(stats.totalExpenses, currency)}
            </p>
          </div>
          <div
            className={`p-3 rounded-lg ${
              stats.netFlow >= 0 ? 'bg-blue-50' : 'bg-amber-50'
            }`}
          >
            <p className="text-xs text-muted-foreground">Net Flow</p>
            <p
              className={`text-lg font-semibold ${
                stats.netFlow >= 0 ? 'text-blue-600' : 'text-amber-600'
              }`}
            >
              {formatCurrency(stats.netFlow, currency)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-purple-50">
            <p className="text-xs text-muted-foreground">Avg per Period</p>
            <p className="text-lg font-semibold text-purple-600">
              {formatCurrency(stats.avgMonthly, currency)}
            </p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="w-full h-96">
            {viewMode === 'income-vs-expenses' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={tooltipFormatter}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" stackId="a" name="Income" />
                  <Bar
                    dataKey="expenses"
                    fill="#ef4444"
                    stackId="a"
                    name="Expenses"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}

            {viewMode === 'net-flow' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={tooltipFormatter}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Bar
                    dataKey="net"
                    fill="#3b82f6"
                    name="Net Flow"
                    shape={
                      <rect
                        x={0}
                        y={0}
                        width={0}
                        height={0}
                        fill="none"
                      />
                    }
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.net >= 0 ? '#3b82f6' : '#f59e0b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {viewMode === 'cumulative' && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={tooltipFormatter}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Income" />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Cumulative Net Worth"
                    yAxisId="right"
                  />
                  <YAxis yAxisId="right" orientation="right" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            No data available for the selected period
          </div>
        )}

        {/* Legend */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <p>
            <strong>Income vs Expenses:</strong> Compare income and expenses side by side
          </p>
          <p>
            <strong>Net Flow:</strong> Positive (blue) or negative (amber) balance each period
          </p>
          <p>
            <strong>Cumulative:</strong> Running total of your net worth over time (purple line)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
