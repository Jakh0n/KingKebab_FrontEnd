import { TimeEntry } from "@/types";
import { useMemo } from "react";

const ITEMS_PER_PAGE = 10;

export interface DashboardStats {
  totalHours: number;
  regularDays: number;
  overtimeDays: number;
}

export function useDashboardStats(
  entries: TimeEntry[],
  selectedMonth: number,
  selectedYear: number,
  currentPage: number
) {
  return useMemo(() => {
    const allFilteredEntries = entries
      .filter((entry) => {
        const entryDate = new Date(entry.date);
        return (
          entryDate.getMonth() + 1 === selectedMonth &&
          entryDate.getFullYear() === selectedYear
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const filteredEntries = allFilteredEntries.slice(startIndex, endIndex);

    const stats: DashboardStats = allFilteredEntries.reduce(
      (acc, entry) => {
        const entryHours = Number(entry.hours.toFixed(1));
        acc.totalHours += entryHours;
        if (entryHours <= 12) {
          acc.regularDays++;
        } else {
          acc.overtimeDays++;
        }
        return acc;
      },
      { totalHours: 0, regularDays: 0, overtimeDays: 0 }
    );
    stats.totalHours = Number(stats.totalHours.toFixed(1));

    const totalPages = Math.ceil(allFilteredEntries.length / ITEMS_PER_PAGE);

    return {
      filteredEntries,
      stats,
      totalPages,
    };
  }, [entries, selectedMonth, selectedYear, currentPage]);
}
