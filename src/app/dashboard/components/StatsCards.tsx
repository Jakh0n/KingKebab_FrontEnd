"use client";

import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Timer } from "lucide-react";
import type { DashboardStats } from "../hooks/useDashboardStats";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <Card className="bg-[#0E1422] border-none text-white p-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#4E7BEE]/10 p-3 rounded-lg">
            <Timer className="w-6 h-6 text-[#4E7BEE]" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Hours</p>
            <p className="text-xl font-semibold text-[#4E7BEE]">
              {stats.totalHours.toFixed(1)}h
            </p>
          </div>
        </div>
      </Card>
      <Card className="bg-[#0E1422] border-none text-white p-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#4CC4C0]/10 p-3 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-[#4CC4C0]" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Regular Days</p>
            <p className="text-xl font-semibold text-[#4CC4C0]">
              {stats.regularDays}d
            </p>
          </div>
        </div>
      </Card>
      <Card className="bg-[#0E1422] border-none text-white p-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#FF3B6F]/10 p-3 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-[#FF3B6F]" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Overtime Days</p>
            <p className="text-xl font-semibold text-[#FF3B6F]">
              {stats.overtimeDays}d
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
