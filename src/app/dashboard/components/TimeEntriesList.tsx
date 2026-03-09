"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TimeEntry } from "@/types";
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  Clock,
  Pencil,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { MonthYearFilter, MonthYearPagination } from "./MonthYearFilter";

interface MonthOption {
  value: number;
  label: string;
}

interface TimeEntriesListProps {
  filteredEntries: TimeEntry[];
  loading: boolean;
  error: string;
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (v: number) => void;
  setSelectedYear: (v: number) => void;
  currentPage: number;
  setCurrentPage: (v: number | ((prev: number) => number)) => void;
  totalPages: number;
  months: readonly MonthOption[];
  logoutLoading: boolean;
  formatTime: (timeStr: string) => string;
  onEditEntry: (entry: TimeEntry) => void;
  onDelete: (entryId: string) => void;
}

export function TimeEntriesList({
  filteredEntries,
  loading,
  error,
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear,
  currentPage,
  setCurrentPage,
  totalPages,
  months,
  logoutLoading,
  formatTime,
  onEditEntry,
  onDelete,
}: TimeEntriesListProps) {
  return (
    <Card className="bg-[#0E1422] border-none text-white">
      <div className="p-4 sm:p-6">
        <MonthYearFilter
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          setSelectedMonth={setSelectedMonth}
          setSelectedYear={setSelectedYear}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          months={months}
          loading={loading}
          logoutLoading={logoutLoading}
        />

        <div className="h-[400px] overflow-y-auto custom-scrollbar pr-2 mb-4">
          {loading ? (
            <p className="text-center text-gray-400 text-sm">Loading...</p>
          ) : error ? (
            <p className="text-center text-red-500 text-sm">{error}</p>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">
              <XCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No time entries for this month</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => {
                const isOvertime = entry.hours > 12;
                const daysDiff = Math.ceil(
                  Math.abs(
                    new Date().getTime() - new Date(entry.date).getTime()
                  ) / (1000 * 60 * 60 * 24)
                );
                const canEdit = daysDiff <= 2;

                return (
                  <div
                    key={entry._id}
                    className={`bg-gradient-to-r ${
                      isOvertime
                        ? "from-[#1A1F2E] to-yellow-950/10 border-l-4 border-l-yellow-500"
                        : "from-[#1A1F2E] to-[#1A1F2E] border-l-4 border-l-emerald-500"
                    } rounded-lg transition-all duration-300 hover:shadow-lg`}
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-[#4E7BEE]/10 p-2.5 rounded-lg">
                            <CalendarDays className="w-5 h-5 text-[#4E7BEE]" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Date</p>
                            <p className="font-medium">
                              {new Date(entry.date).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div
                            className={`px-3 py-1.5 rounded-full ${
                              isOvertime
                                ? "bg-yellow-500/10"
                                : "bg-emerald-500/10"
                            }`}
                          >
                            <p
                              className={`text-sm font-medium ${
                                isOvertime
                                  ? "text-yellow-500"
                                  : "text-emerald-500"
                              }`}
                            >
                              {isOvertime ? "Overtime" : "Regular"}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              onClick={() => onEditEntry(entry)}
                              disabled={logoutLoading || !canEdit}
                              className={`hover:bg-[#2A3447] h-8 w-8 ${
                                !canEdit
                                  ? "text-gray-500 cursor-not-allowed"
                                  : "text-[#4E7BEE] hover:text-[#4E7BEE]/80"
                              }`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => onDelete(entry._id)}
                              className="hover:bg-[#2A3447] text-red-500 hover:text-red-600 h-8 w-8"
                              disabled={logoutLoading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-[#0E1422] p-4 rounded-lg">
                          <div className="bg-[#4CC4C0]/10 p-2.5 rounded-lg">
                            <Clock className="w-5 h-5 text-[#4CC4C0]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-400">
                              Working Hours
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-[#4CC4C0]">
                                {formatTime(entry.startTime)} -{" "}
                                {formatTime(entry.endTime)}
                              </p>
                              <p className="text-[#4E7BEE] font-medium">
                                {entry.hours.toFixed(1)} hours
                              </p>
                            </div>
                          </div>
                        </div>

                        {isOvertime && entry.overtimeReason && (
                          <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-yellow-500/20" />
                            <div className="space-y-4 pl-8">
                              <div className="flex items-center gap-3">
                                <div className="bg-yellow-500/10 p-2.5 rounded-lg">
                                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">
                                    Overtime Reason
                                  </p>
                                  <p className="font-medium text-yellow-500">
                                    {entry.overtimeReason}
                                  </p>
                                </div>
                              </div>
                              {entry.overtimeReason === "Company Request" &&
                                entry.responsiblePerson && (
                                  <div className="flex items-center gap-3">
                                    <div className="bg-blue-500/10 p-2.5 rounded-lg">
                                      <User className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-400">
                                        Responsible Person
                                      </p>
                                      <p className="font-medium text-blue-500">
                                        {entry.responsiblePerson}
                                      </p>
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <MonthYearPagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          logoutLoading={logoutLoading}
        />
      </div>
    </Card>
  );
}
