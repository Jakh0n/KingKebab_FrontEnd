import { getMyTimeEntries } from "@/lib/api";
import { TimeEntry } from "@/types";
import { useCallback, useEffect, useState } from "react";

const CACHE_KEY_PREFIX = "timeEntries_";

export function useTimeEntries(selectedMonth: number, selectedYear: number) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyTimeEntries();

      if (!Array.isArray(data)) {
        setError("Invalid data format");
        return;
      }

      const validEntries = data.map((entry) => ({
        ...entry,
        date: new Date(entry.date).toISOString().split("T")[0],
        startTime: new Date(entry.startTime).toISOString(),
        endTime: new Date(entry.endTime).toISOString(),
        hours: Number(entry.hours.toFixed(1)),
      }));

      const cacheKey = `${CACHE_KEY_PREFIX}${selectedMonth}_${selectedYear}`;
      localStorage.setItem(cacheKey, JSON.stringify(validEntries));
      setEntries(validEntries);
    } catch (err) {
      console.error("Error loading entries:", err);
      const cacheKey = `${CACHE_KEY_PREFIX}${selectedMonth}_${selectedYear}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        setEntries(JSON.parse(cachedData));
      } else {
        setError(err instanceof Error ? err.message : "Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  return {
    entries,
    loading,
    error,
    setLoading,
    setError,
    loadEntries,
    setEntries,
  };
}
