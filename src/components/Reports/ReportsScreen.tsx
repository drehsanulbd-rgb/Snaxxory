/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Expense } from '../../types';
import { formatTaka } from '../../utils/storage';
import { ConfirmDialog } from '../Modals/ConfirmDialog';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Percent,
  Plus,
  Trash2,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

interface TooltipPayload {
  payload: {
    date: string;
    label: string;
    dayName: string;
    sales: number;
    profit: number;
    cogs: number;
    ordersCount: number;
    itemsCount: number;
  };
}

const CustomSalesTooltip: React.FC<{
  active?: boolean;
  payload?: TooltipPayload[];
}> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-stone-900 border border-stone-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[190px]">
        <div className="flex items-center justify-between gap-3 border-b border-stone-800 pb-1.5">
          <span className="font-bold text-stone-200">{data.date}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-semibold">
            {data.dayName}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 pt-0.5">
          <span className="text-stone-400">মোট বিক্রয় (Sales):</span>
          <span className="font-mono font-black text-orange-400">{formatTaka(data.sales)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-stone-400">অর্ডার ও আইটেম:</span>
          <span className="font-mono text-stone-200">
            {data.ordersCount} টি ({data.itemsCount} pcs)
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-stone-400">গ্রস প্রফিট:</span>
          <span
            className={`font-mono font-bold ${
              data.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatTaka(data.profit)}
          </span>
        </div>
        <div className="text-[10px] text-stone-500 pt-1 border-t border-stone-800/80 text-center">
          ক্লিক করে বিস্তারিত বিবরণ দেখুন
        </div>
      </div>
    );
  }
  return null;
};

export const ReportsScreen: React.FC = () => {
  const { orders, expenses, addExpense, deleteExpense } = useApp();

  const [activeReportTab, setActiveReportTab] = useState<'daily' | 'monthly'>('daily');

  // Date selection for Daily Sales
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Month selection for Monthly P/L
  const currentMonthStr = todayStr.slice(0, 7); // 'YYYY-MM'
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Add expense modal state
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('utilities');
  const [expenseDate, setExpenseDate] = useState(todayStr);

  // Delete expense confirmation
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // --- Daily Sales Calculations ---
  const dailyOrders = useMemo(() => {
    return orders.filter(o => o.date === selectedDate && o.status !== 'voided');
  }, [orders, selectedDate]);

  const dailyStats = useMemo(() => {
    let totalOrders = dailyOrders.length;
    let itemsSold = 0;
    let grossSales = 0;
    let totalDiscount = 0;
    let netSales = 0;
    let cogs = 0;

    // Per item breakdown map
    const itemMap: Record<
      string,
      { name: string; quantity: number; revenue: number; cost: number }
    > = {};

    dailyOrders.forEach(o => {
      grossSales += o.subtotal;
      totalDiscount += o.discount;
      netSales += o.total;
      cogs += o.totalCost;

      o.items.forEach(item => {
        itemsSold += item.quantity;
        if (!itemMap[item.menuItemId]) {
          itemMap[item.menuItemId] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
            cost: 0,
          };
        }
        itemMap[item.menuItemId].quantity += item.quantity;
        itemMap[item.menuItemId].revenue += item.price * item.quantity;
        itemMap[item.menuItemId].cost += item.recipeCost * item.quantity;
      });
    });

    const grossProfit = netSales - cogs;
    const marginPercent = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

    return {
      totalOrders,
      itemsSold,
      grossSales,
      totalDiscount,
      netSales,
      cogs,
      grossProfit,
      marginPercent,
      items: Object.values(itemMap),
    };
  }, [dailyOrders]);

  // --- Last 7 Days Daily Sales for Recharts Bar Chart ---
  const { last7DaysData, total7DaysSales, avg7DaysSales } = useMemo(() => {
    const baseDate = new Date();
    const selDateObj = new Date(selectedDate);
    const useDate = !isNaN(selDateObj.getTime()) && selectedDate > todayStr ? selDateObj : baseDate;

    const data: Array<{
      date: string;
      label: string;
      dayName: string;
      sales: number;
      profit: number;
      cogs: number;
      ordersCount: number;
      itemsCount: number;
      isSelected: boolean;
    }> = [];

    let total7Sales = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(useDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const dayOrders = orders.filter(o => o.date === dateStr && o.status !== 'voided');
      const sales = dayOrders.reduce((sum, o) => sum + o.total, 0);
      const cogs = dayOrders.reduce((sum, o) => sum + o.totalCost, 0);
      const profit = sales - cogs;
      const itemsCount = dayOrders.reduce(
        (sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0),
        0
      );

      total7Sales += sales;

      const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const dayName = d.toLocaleDateString('bn-BD', { weekday: 'short' });

      data.push({
        date: dateStr,
        label,
        dayName,
        sales,
        profit,
        cogs,
        ordersCount: dayOrders.length,
        itemsCount,
        isSelected: dateStr === selectedDate,
      });
    }

    return {
      last7DaysData: data,
      total7DaysSales: total7Sales,
      avg7DaysSales: Math.round(total7Sales / 7),
    };
  }, [orders, selectedDate, todayStr]);

  // --- Monthly Profit/Loss Calculations ---
  const monthlyOrders = useMemo(() => {
    return orders.filter(o => o.date.startsWith(selectedMonth) && o.status !== 'voided');
  }, [orders, selectedMonth]);

  const monthlyExpenses = useMemo(() => {
    return expenses.filter(e => e.date.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  const monthlyStats = useMemo(() => {
    let netSales = 0;
    let cogs = 0;

    // Daily breakdown for the month
    const perDayMap: Record<
      string,
      { orders: number; netSales: number; cogs: number; expenses: number }
    > = {};

    // Collect all orders in the month
    monthlyOrders.forEach(o => {
      netSales += o.total;
      cogs += o.totalCost;

      if (!perDayMap[o.date]) {
        perDayMap[o.date] = { orders: 0, netSales: 0, cogs: 0, expenses: 0 };
      }
      perDayMap[o.date].orders += 1;
      perDayMap[o.date].netSales += o.total;
      perDayMap[o.date].cogs += o.totalCost;
    });

    // Collect all expenses in the month
    let totalOtherExpenses = 0;
    monthlyExpenses.forEach(e => {
      totalOtherExpenses += e.amount;
      if (!perDayMap[e.date]) {
        perDayMap[e.date] = { orders: 0, netSales: 0, cogs: 0, expenses: 0 };
      }
      perDayMap[e.date].expenses += e.amount;
    });

    const grossProfit = netSales - cogs;
    const netProfitOrLoss = grossProfit - totalOtherExpenses;

    // Sort days descending
    const daysList = Object.keys(perDayMap)
      .sort()
      .reverse()
      .map(date => {
        const d = perDayMap[date];
        const dayGrossProfit = d.netSales - d.cogs;
        const dayNetProfit = dayGrossProfit - d.expenses;
        return {
          date,
          orders: d.orders,
          netSales: d.netSales,
          cogs: d.cogs,
          grossProfit: dayGrossProfit,
          expenses: d.expenses,
          netProfit: dayNetProfit,
        };
      });

    return {
      netSales,
      cogs,
      grossProfit,
      otherExpenses: totalOtherExpenses,
      netProfitOrLoss,
      daysList,
    };
  }, [monthlyOrders, monthlyExpenses]);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseAmount);
    if (!expenseTitle.trim() || isNaN(amountNum) || amountNum <= 0) return;

    addExpense(expenseCategory, expenseTitle.trim(), amountNum, expenseDate);
    setIsAddingExpense(false);
    setExpenseTitle('');
    setExpenseAmount('');
  };

  const getExpenseCategoryLabel = (cat: Expense['category']) => {
    switch (cat) {
      case 'rent':
        return 'দোকান ভাড়া';
      case 'salary':
        return 'কর্মচারী বেতন';
      case 'utilities':
        return 'বিদ্যুৎ ও গ্যাস';
      case 'fuel':
        return 'জ্বালানি ও কয়লা';
      case 'other':
        return 'অন্যান্য খরচ';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-950 p-3 sm:p-4 pb-20 md:pb-4">
      {/* Top Report Segment Control Tabs */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-stone-900 border border-stone-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveReportTab('daily')}
            className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeReportTab === 'daily'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            দৈনিক বিক্রয় রিপোর্ট (Daily Sales)
          </button>
          <button
            type="button"
            onClick={() => setActiveReportTab('monthly')}
            className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeReportTab === 'monthly'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            মাসিক লাভ-ক্ষতি (Monthly P&amp;L)
          </button>
        </div>

        {/* Date / Month Picker */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeReportTab === 'daily' ? (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded-xl p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedDate('2026-11-01')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    selectedDate === '2026-11-01' ? 'bg-orange-600 text-white shadow-xs' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  ০১/১১/২০২৬ (৳440)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate('2026-11-02')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    selectedDate === '2026-11-02' ? 'bg-orange-600 text-white shadow-xs' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  ০২/১১/২০২৬ (৳750)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    selectedDate === todayStr && selectedDate !== '2026-11-01' && selectedDate !== '2026-11-02'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  আজ
                </button>
              </div>

              <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs">
                <Calendar className="w-4 h-4 text-orange-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-transparent text-stone-100 text-xs font-mono focus:outline-hidden cursor-pointer"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs">
              <Calendar className="w-4 h-4 text-orange-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-transparent text-stone-100 text-xs font-mono focus:outline-hidden"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {activeReportTab === 'daily' ? (
          <>
            {/* Daily Summary Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm">
                <span className="text-[11px] font-medium text-stone-400 block mb-1">
                  মোট অর্ডার
                </span>
                <span className="text-xl font-black text-stone-100 font-mono">
                  {dailyStats.totalOrders}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm">
                <span className="text-[11px] font-medium text-stone-400 block mb-1">
                  বিক্রিত আইটেম
                </span>
                <span className="text-xl font-black text-stone-100 font-mono">
                  {dailyStats.itemsSold}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm">
                <span className="text-[11px] font-medium text-stone-400 block mb-1">
                  মোট বিক্রয় (Net Sales)
                </span>
                <span className="text-xl font-black text-orange-500 font-mono tabular-nums">
                  {formatTaka(dailyStats.netSales)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm">
                <span className="text-[11px] font-medium text-stone-400 block mb-1">
                  ছাড় (Discount)
                </span>
                <span className="text-xl font-black text-stone-300 font-mono tabular-nums">
                  {formatTaka(dailyStats.totalDiscount)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm">
                <span className="text-[11px] font-medium text-stone-400 block mb-1">
                  উপকরণ খরচ (COGS)
                </span>
                <span className="text-xl font-black text-stone-300 font-mono tabular-nums">
                  {formatTaka(dailyStats.cogs)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm">
                <span className="text-[11px] font-medium text-stone-400 block mb-1">
                  মোট মুনাফা (Gross Profit)
                </span>
                <span
                  className={`text-xl font-black font-mono tabular-nums ${
                    dailyStats.grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {formatTaka(dailyStats.grossProfit)}
                </span>
              </div>
            </div>

            {/* Last 7 Days Sales Visual Bar Chart (Recharts) */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-orange-600/10 text-orange-500 border border-orange-500/20">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
                      <span>বিগত ৭ দিনের দৈনিক বিক্রয়</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-normal">
                        Last 7 Days Sales Trend
                      </span>
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      যেকোনো বারে ট্যাপ করে ঐ দিনের বিস্তারিত রিপোর্ট দেখুন
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono self-start sm:self-auto bg-stone-950/60 px-3 py-1.5 rounded-xl border border-stone-800/80">
                  <div>
                    <span className="text-stone-400 text-[10px] block">৭ দিনের মোট:</span>
                    <span className="font-bold text-orange-400 font-mono">
                      {formatTaka(total7DaysSales)}
                    </span>
                  </div>
                  <div className="w-px h-6 bg-stone-800" />
                  <div>
                    <span className="text-stone-400 text-[10px] block">দৈনিক গড়:</span>
                    <span className="font-bold text-stone-200 font-mono">
                      {formatTaka(avg7DaysSales)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chart Visualizer */}
              <div className="h-60 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={last7DaysData}
                    margin={{ top: 12, right: 8, left: -16, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#78716c"
                      tick={{ fill: '#a8a29e', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: '#44403c' }}
                    />
                    <YAxis
                      stroke="#78716c"
                      tick={{ fill: '#a8a29e', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val: number) => `৳${val}`}
                    />
                    <Tooltip
                      content={<CustomSalesTooltip />}
                      cursor={{ fill: 'rgba(234, 88, 12, 0.1)' }}
                    />
                    <Bar
                      dataKey="sales"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={44}
                      onClick={(entry: any) => {
                        if (entry && entry.date) {
                          setSelectedDate(entry.date);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {last7DaysData.map((entry, index) => {
                        const isSelected = entry.date === selectedDate;
                        const hasSales = entry.sales > 0;
                        const fillColor = isSelected
                          ? '#ea580c'
                          : hasSales
                          ? '#f97316'
                          : '#44403c';
                        const opacity = isSelected ? 1 : hasSales ? 0.85 : 0.35;
                        return (
                          <Cell
                            key={`bar-cell-${index}`}
                            fill={fillColor}
                            fillOpacity={opacity}
                            stroke={isSelected ? '#fed7aa' : 'transparent'}
                            strokeWidth={isSelected ? 1.5 : 0}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Mobile Quick Selector Strip */}
              <div className="grid grid-cols-7 gap-1.5 pt-2 border-t border-stone-800/80">
                {last7DaysData.map(day => {
                  const isSelected = day.date === selectedDate;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => setSelectedDate(day.date)}
                      className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-center transition-all ${
                        isSelected
                          ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-950 scale-102 ring-1 ring-orange-400'
                          : day.sales > 0
                          ? 'bg-stone-800/80 hover:bg-stone-800 text-stone-200'
                          : 'bg-stone-900/40 hover:bg-stone-800/40 text-stone-500'
                      }`}
                    >
                      <span className="text-[10px] leading-tight block">{day.dayName}</span>
                      <span className="text-[11px] font-mono leading-tight font-semibold mt-0.5">
                        {day.date.slice(8)}
                      </span>
                      <span
                        className={`text-[10px] font-mono mt-1 font-bold ${
                          isSelected
                            ? 'text-white'
                            : day.sales > 0
                            ? 'text-orange-400'
                            : 'text-stone-600'
                        }`}
                      >
                        {day.sales > 0 ? `৳${day.sales}` : '৳০'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Item Breakdown Table */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-sm text-stone-100 mb-3 flex items-center justify-between">
                <span>আইটেম অনুযায়ী বিক্রয় বিবরণী ({selectedDate})</span>
                <span className="text-xs text-stone-400 font-normal">
                  গড় মার্জিন:{' '}
                  <strong className="text-emerald-400 font-mono">
                    {dailyStats.marginPercent.toFixed(1)}%
                  </strong>
                </span>
              </h3>

              {dailyStats.items.length === 0 ? (
                <div className="py-10 text-center text-stone-500 text-xs">
                  এই তারিখে কোনো বিক্রয়ের তথ্য নেই।
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-stone-800 text-stone-400 font-medium">
                        <th className="pb-2">আইটেমের নাম</th>
                        <th className="pb-2 text-center">পরিমাণ</th>
                        <th className="pb-2 text-right">মোট বিক্রয় (৳)</th>
                        <th className="pb-2 text-right">উপকরণ খরচ (৳)</th>
                        <th className="pb-2 text-right">মুনাফা (৳)</th>
                        <th className="pb-2 text-right">মার্জিন %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60 font-mono">
                      {dailyStats.items.map((row, idx) => {
                        const profit = row.revenue - row.cost;
                        const margin = row.revenue > 0 ? (profit / row.revenue) * 100 : 0;
                        return (
                          <tr key={idx} className="hover:bg-stone-800/30">
                            <td className="py-2.5 font-sans font-semibold text-stone-200">
                              {row.name}
                            </td>
                            <td className="py-2.5 text-center text-stone-300">{row.quantity}</td>
                            <td className="py-2.5 text-right text-stone-100">
                              {formatTaka(row.revenue)}
                            </td>
                            <td className="py-2.5 text-right text-stone-400">
                              {formatTaka(row.cost)}
                            </td>
                            <td
                              className={`py-2.5 text-right font-bold ${
                                profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {formatTaka(profit)}
                            </td>
                            <td className="py-2.5 text-right text-stone-300">
                              {margin.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Monthly Profit/Loss Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm">
                <span className="text-[11px] font-medium text-stone-400 block mb-1">
                  নেট বিক্রয় (Net Sales)
                </span>
                <span className="text-xl font-black text-orange-500 font-mono tabular-nums">
                  {formatTaka(monthlyStats.netSales)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm">
                <span className="text-[11px] font-medium text-stone-400 block mb-1">
                  উপকরণ খরচ (COGS)
                </span>
                <span className="text-xl font-black text-stone-300 font-mono tabular-nums">
                  {formatTaka(monthlyStats.cogs)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm">
                <span className="text-[11px] font-medium text-stone-400 block mb-1">
                  গ্রস প্রফিট (Gross Profit)
                </span>
                <span className="text-xl font-black text-stone-100 font-mono tabular-nums">
                  {formatTaka(monthlyStats.grossProfit)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm">
                <span className="text-[11px] font-medium text-stone-400 block mb-1">
                  অন্যান্য খরচ (Expenses)
                </span>
                <span className="text-xl font-black text-amber-400 font-mono tabular-nums">
                  {formatTaka(monthlyStats.otherExpenses)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm col-span-2 lg:col-span-1">
                <span className="text-[11px] font-medium text-stone-400 block mb-1">
                  নিট লাভ / ক্ষতি (Net P&amp;L)
                </span>
                <span
                  className={`text-2xl font-black font-mono tabular-nums flex items-center gap-1 ${
                    monthlyStats.netProfitOrLoss >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {monthlyStats.netProfitOrLoss >= 0 ? (
                    <TrendingUp className="w-5 h-5 shrink-0" />
                  ) : (
                    <TrendingDown className="w-5 h-5 shrink-0" />
                  )}
                  {formatTaka(monthlyStats.netProfitOrLoss)}
                </span>
              </div>
            </div>

            {/* Monthly Expenses Manager Section */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-stone-100">
                    মাসিক খরচসমূহ ({selectedMonth})
                  </h3>
                  <p className="text-xs text-stone-400">
                    দোকান ভাড়া, বেতন, বিদ্যুৎ বিল, গ্যাস ও জ্বালানি খরচ যুক্ত করুন
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingExpense(true)}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>খরচ যোগ করুন</span>
                </button>
              </div>

              {monthlyExpenses.length === 0 ? (
                <div className="py-4 text-center text-xs text-stone-500">
                  এই মাসে কোনো অন্যান্য খরচ এন্ট্রি করা নেই।
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {monthlyExpenses.map(exp => (
                    <div
                      key={exp.id}
                      className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-200 truncate">{exp.title}</div>
                        <div className="text-[10px] text-stone-400">
                          {getExpenseCategoryLabel(exp.category)} • {exp.date}
                        </div>
                        <div className="text-sm font-black text-amber-400 font-mono mt-0.5">
                          {formatTaka(exp.amount)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpenseToDelete(exp.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Per-Day Table for the Month */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-sm text-stone-100 mb-3">
                প্রতিদিনের লাভ-ক্ষতি বিবরণী ({selectedMonth})
              </h3>
              {monthlyStats.daysList.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500">
                  এই মাসে কোনো বিক্রয় বা খরচ হয়নি।
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-stone-800 text-stone-400 font-medium">
                        <th className="pb-2">তারিখ</th>
                        <th className="pb-2 text-center">অর্ডার</th>
                        <th className="pb-2 text-right">বিক্রয় (৳)</th>
                        <th className="pb-2 text-right">উপকরণ খরচ (৳)</th>
                        <th className="pb-2 text-right">গ্রস লাভ (৳)</th>
                        <th className="pb-2 text-right">অন্যান্য খরচ (৳)</th>
                        <th className="pb-2 text-right">নিট লাভ (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60 font-mono">
                      {monthlyStats.daysList.map((day, idx) => (
                        <tr key={idx} className="hover:bg-stone-800/30">
                          <td className="py-2.5 font-bold text-stone-300">{day.date}</td>
                          <td className="py-2.5 text-center text-stone-400">{day.orders}</td>
                          <td className="py-2.5 text-right text-stone-100">
                            {formatTaka(day.netSales)}
                          </td>
                          <td className="py-2.5 text-right text-stone-400">
                            {formatTaka(day.cogs)}
                          </td>
                          <td className="py-2.5 text-right font-semibold text-stone-200">
                            {formatTaka(day.grossProfit)}
                          </td>
                          <td className="py-2.5 text-right text-amber-400/80">
                            {formatTaka(day.expenses)}
                          </td>
                          <td
                            className={`py-2.5 text-right font-black ${
                              day.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {formatTaka(day.netProfit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Expense Modal */}
      {isAddingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleSaveExpense}
            className="w-full max-w-sm rounded-2xl bg-stone-900 border border-stone-800 p-5 text-stone-100 shadow-2xl space-y-3.5"
          >
            <h3 className="font-bold text-base text-stone-100">নতুন খরচ যোগ করুন</h3>

            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1">
                খরচের বিবরণ
              </label>
              <input
                type="text"
                required
                value={expenseTitle}
                onChange={e => setExpenseTitle(e.target.value)}
                placeholder="যেমন: দোকান ভাড়া বা গ্যাস সিলিন্ডার"
                className="w-full h-10 px-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">
                  ক্যাটাগরি
                </label>
                <select
                  value={expenseCategory}
                  onChange={e => setExpenseCategory(e.target.value as any)}
                  className="w-full h-10 px-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 focus:outline-hidden focus:border-orange-500"
                >
                  <option value="rent">দোকান ভাড়া</option>
                  <option value="salary">বেতন</option>
                  <option value="utilities">বিদ্যুৎ ও গ্যাস</option>
                  <option value="fuel">জ্বালানি/কয়লা</option>
                  <option value="other">অন্যান্য</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">
                  টাকার পরিমাণ (৳)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                  placeholder="৳ 0"
                  className="w-full h-10 px-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 font-mono focus:outline-hidden focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1">তারিখ</label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={e => setExpenseDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 font-mono focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingExpense(false)}
                className="h-10 rounded-xl border border-stone-700 bg-stone-800 text-stone-300 text-xs font-medium hover:bg-stone-700"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="h-10 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-500 shadow-sm"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Expense Dialog */}
      <ConfirmDialog
        isOpen={expenseToDelete !== null}
        title="খরচ মুছে ফেলবেন?"
        message="এই খরচের এন্ট্রিটি স্থায়ীভাবে মুছে ফেলতে চান?"
        confirmLabel="হ্যাঁ, মুছুন"
        isDestructive={true}
        onConfirm={() => {
          if (expenseToDelete) deleteExpense(expenseToDelete);
          setExpenseToDelete(null);
        }}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
};
