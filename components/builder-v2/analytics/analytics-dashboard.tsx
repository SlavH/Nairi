'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Eye, Clock, Globe, MousePointer, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';

interface AnalyticsData {
  visitors: { value: number; change: number };
  pageViews: { value: number; change: number };
  avgTime: { value: string; change: number };
  bounceRate: { value: number; change: number };
}

const mockData: AnalyticsData = {
  visitors: { value: 12453, change: 12.5 },
  pageViews: { value: 45678, change: 8.3 },
  avgTime: { value: '3m 24s', change: -2.1 },
  bounceRate: { value: 42.3, change: -5.2 }
};

const mockChartData = [
  { day: 'Mon', visitors: 1200, pageViews: 3400 },
  { day: 'Tue', visitors: 1400, pageViews: 4200 },
  { day: 'Wed', visitors: 1100, pageViews: 3100 },
  { day: 'Thu', visitors: 1800, pageViews: 5200 },
  { day: 'Fri', visitors: 2100, pageViews: 6100 },
  { day: 'Sat', visitors: 1600, pageViews: 4800 },
  { day: 'Sun', visitors: 1300, pageViews: 3900 }
];

const topPages = [
  { path: '/', views: 12453, avgTime: '2m 15s' },
  { path: '/products', views: 8234, avgTime: '3m 42s' },
  { path: '/about', views: 5621, avgTime: '1m 58s' },
  { path: '/contact', views: 3412, avgTime: '4m 12s' },
  { path: '/blog', views: 2891, avgTime: '5m 33s' }
];

const topCountries = [
  { country: 'United States', flag: '🇺🇸', visitors: 4521, percentage: 36 },
  { country: 'United Kingdom', flag: '🇬🇧', visitors: 2134, percentage: 17 },
  { country: 'Germany', flag: '🇩🇪', visitors: 1823, percentage: 15 },
  { country: 'France', flag: '🇫🇷', visitors: 1245, percentage: 10 },
  { country: 'Canada', flag: '🇨🇦', visitors: 987, percentage: 8 }
];

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('7d');

  const StatCard = ({ title, value, change, icon: Icon }: { title: string; value: string | number; change: number; icon: any }) => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-purple-400" />
        </div>
        <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  );

  const maxVisitors = Math.max(...mockChartData.map(d => d.visitors));

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] overflow-y-auto custom-scrollbar">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          Analytics Dashboard
        </h3>
        <div className="flex gap-2">
          {['24h', '7d', '30d', '90d'].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                dateRange === range
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Visitors" value={mockData.visitors.value} change={mockData.visitors.change} icon={Users} />
          <StatCard title="Page Views" value={mockData.pageViews.value} change={mockData.pageViews.change} icon={Eye} />
          <StatCard title="Avg. Time on Site" value={mockData.avgTime.value} change={mockData.avgTime.change} icon={Clock} />
          <StatCard title="Bounce Rate" value={`${mockData.bounceRate.value}%`} change={mockData.bounceRate.change} icon={MousePointer} />
        </div>

        {/* Chart */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            Visitors Overview
          </h4>
          <div className="h-48 flex items-end gap-2">
            {mockChartData.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all hover:from-purple-500 hover:to-purple-300"
                  style={{ height: `${(data.visitors / maxVisitors) * 100}%` }}
                />
                <span className="text-gray-400 text-xs">{data.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Top Pages */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              Top Pages
            </h4>
            <div className="space-y-3">
              {topPages.map((page, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{page.path}</p>
                    <p className="text-gray-500 text-xs">{page.avgTime} avg. time</p>
                  </div>
                  <span className="text-purple-400 font-medium">{page.views.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Countries */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" />
              Top Countries
            </h4>
            <div className="space-y-3">
              {topCountries.map((country, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-2xl">{country.flag}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm">{country.country}</span>
                      <span className="text-gray-400 text-xs">{country.visitors.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ width: `${country.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time indicator */}
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 font-medium">Real-time visitors</span>
          </div>
          <span className="text-2xl font-bold text-white">47</span>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
