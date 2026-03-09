"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar, CalendarDays } from "lucide-react";

interface MonthOption {
  value: number;
  label: string;
}

interface MonthYearFilterProps {
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (v: number) => void;
  setSelectedYear: (v: number) => void;
  currentPage: number;
  setCurrentPage: (v: number | ((prev: number) => number)) => void;
  totalPages: number;
  months: readonly MonthOption[];
  loading: boolean;
  logoutLoading: boolean;
}

const YEARS = [2025, 2026];

export function MonthYearFilter({
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear,
  currentPage,
  setCurrentPage,
  totalPages,
  months,
  logoutLoading,
}: MonthYearFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h2 className="text-base sm:text-xl flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-[#4E7BEE]" />
        My Time Entries
      </h2>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Label className="text-sm min-w-[50px] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            Month:
          </Label>
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(parseInt(e.target.value, 10));
              setCurrentPage(1);
            }}
            className="flex-1 sm:flex-none bg-[#1A1F2E] border-none text-white rounded px-3 py-2 text-sm h-10 cursor-pointer min-w-[120px]"
            disabled={logoutLoading}
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Label className="text-sm min-w-[50px] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            Year:
          </Label>
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(parseInt(e.target.value, 10));
              setCurrentPage(1);
            }}
            className="flex-1 sm:flex-none bg-[#1A1F2E] border-none text-white rounded px-3 py-2 text-sm h-10 cursor-pointer min-w-[120px]"
            disabled={logoutLoading}
          >
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export function MonthYearPagination({
  currentPage,
  setCurrentPage,
  totalPages,
  logoutLoading,
}: {
  currentPage: number;
  setCurrentPage: (v: number | ((prev: number) => number)) => void;
  totalPages: number;
  logoutLoading: boolean;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
        disabled={currentPage === 1 || logoutLoading}
        className="bg-[#1A1F2E] border-none text-white hover:bg-[#2A3447] cursor-pointer"
      >
        Previous
      </Button>
      <span className="text-sm text-gray-400">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage((prev) => prev + 1)}
        disabled={currentPage >= totalPages || logoutLoading}
        className="bg-[#1A1F2E] border-none text-white hover:bg-[#2A3447] cursor-pointer"
      >
        Next
      </Button>
    </div>
  );
}
