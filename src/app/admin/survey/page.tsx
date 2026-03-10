"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAllUsers } from "@/lib/api";
import { getTokenOrNull } from "@/lib/auth";
import { User } from "@/types";
import type { SurveyResponses } from "@/types";
import { ArrowLeft, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type SurveyKey = keyof SurveyResponses;

const QUESTION_LABELS: Record<SurveyKey, string> = {
  suggestionsOrRecommendations: "Suggestions",
  shouldRemove: "Should remove",
  mostTimeOrDifficult: "Most time/difficult",
  customersLikeLeast: "Like least",
  removeOneAndWhy: "Remove one & why",
};

const QUESTION_TITLES: Record<SurveyKey, string> = {
  suggestionsOrRecommendations: "Suggestions or recommendations",
  shouldRemove: "Should be removed from menu",
  mostTimeOrDifficult: "Most time or difficult to prepare",
  customersLikeLeast: "Customers like least",
  removeOneAndWhy: "Remove one and why",
};

/** Split free-text answer into items (dishes) for counting */
function parseItems(text: string): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/[,;\n]|\s+va\s+|\s+and\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Build summary: per question, count mentions per dish/item */
function buildSummary(
  withSurvey: User[]
): Record<SurveyKey, { item: string; count: number }[]> {
  const acc = {
    suggestionsOrRecommendations: {} as Record<string, number>,
    shouldRemove: {} as Record<string, number>,
    mostTimeOrDifficult: {} as Record<string, number>,
    customersLikeLeast: {} as Record<string, number>,
    removeOneAndWhy: {} as Record<string, number>,
  };

  withSurvey.forEach((user) => {
    const r = user.surveyResponses;
    if (!r) return;
    (Object.keys(acc) as SurveyKey[]).forEach((key) => {
      const raw = r[key];
      if (!raw?.trim()) return;
      const items =
        key === "removeOneAndWhy" || key === "suggestionsOrRecommendations"
          ? [raw]
          : parseItems(raw);
      items.forEach((item) => {
        const normalized = item.length > 50 ? item.slice(0, 47) + "…" : item;
        acc[key][normalized] = (acc[key][normalized] || 0) + 1;
      });
    });
  });

  const result = {} as Record<SurveyKey, { item: string; count: number }[]>;
  (Object.keys(acc) as SurveyKey[]).forEach((key) => {
    result[key] = Object.entries(acc[key])
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => b.count - a.count);
  });
  return result;
}

export default function AdminSurveyPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes("Admin access required")
      ) {
        router.push("/dashboard");
        return;
      }
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getTokenOrNull()) {
      router.push("/login");
      return;
    }
    loadUsers();
  }, [router, loadUsers]);

  const withSurvey = useMemo(
    () => users.filter((u) => u.surveyCompleted && u.surveyResponses),
    [users]
  );

  const summary = useMemo(() => buildSummary(withSurvey), [withSurvey]);

  if (loading) {
    return (
      <main className="min-h-screen p-2 sm:p-4 bg-[#0A0F1C]">
        <div className="max-w-[1400px] mx-auto flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#4E7BEE] border-t-transparent" />
            <p className="text-gray-400 text-sm">Loading survey results...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-2 sm:p-4 lg:p-6 bg-[#0A0F1C]">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl bg-[#1A1F2E] hover:bg-[#2A3447] border border-[#2A3447]"
              >
                <ArrowLeft className="h-5 w-5 text-[#4E7BEE]" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-[#4E7BEE]/20 flex items-center justify-center border border-[#4E7BEE]/30">
                <ClipboardList className="h-6 w-6 text-[#4E7BEE]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Menu Survey Results
                </h1>
                <p className="text-gray-400 text-sm">
                  {withSurvey.length} response{withSurvey.length !== 1 ? "s" : ""}
                  {users.length - withSurvey.length > 0 &&
                    ` · ${users.length - withSurvey.length} pending`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {withSurvey.length === 0 ? (
          <Card className="bg-[#0E1422] border-[#2A3447] rounded-xl p-12 text-center">
            <p className="text-gray-400">No survey responses yet.</p>
          </Card>
        ) : (
          <>
            {/* Summary by category */}
            <Card className="bg-[#0E1422] border-[#2A3447] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-[#2A3447]">
                <h2 className="text-lg font-semibold text-white">Summary by category</h2>
                <p className="text-gray-400 text-sm mt-0.5">
                  Which dish received which type of feedback (mention count)
                </p>
              </div>
              <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(QUESTION_TITLES) as SurveyKey[]).map((key) => {
                  const items = summary[key] || [];
                  return (
                    <div
                      key={key}
                      className="rounded-lg bg-[#1A1F2E] border border-[#2A3447] p-4"
                    >
                      <h3 className="text-sm font-medium text-gray-300 mb-3">
                        {QUESTION_TITLES[key]}
                      </h3>
                      {items.length === 0 ? (
                        <p className="text-gray-500 text-sm">—</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {items.slice(0, 8).map(({ item, count }) => (
                            <li
                              key={item}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-gray-200 truncate pr-2">
                                {item}
                              </span>
                              <span className="shrink-0 text-[#4E7BEE] font-medium">
                                {count}
                              </span>
                            </li>
                          ))}
                          {items.length > 8 && (
                            <li className="text-gray-500 text-xs">
                              +{items.length - 8} more
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* List of responses */}
            <Card className="bg-[#0E1422] border-[#2A3447] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-[#2A3447]">
                <h2 className="text-lg font-semibold text-white">
                  Response list
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#2A3447] bg-[#1A1F2E]">
                      <th className="p-3 font-medium text-gray-400">#</th>
                      <th className="p-3 font-medium text-gray-400">User</th>
                      <th className="p-3 font-medium text-gray-400 hidden sm:table-cell">
                        ID
                      </th>
                      <th className="p-3 font-medium text-gray-400 hidden md:table-cell">
                        Position
                      </th>
                      <th className="p-3 font-medium text-gray-400">
                        Suggestions
                      </th>
                      <th className="p-3 font-medium text-gray-400">
                        Should remove
                      </th>
                      <th className="p-3 font-medium text-gray-400 hidden lg:table-cell">
                        Most time/diff.
                      </th>
                      <th className="p-3 font-medium text-gray-400 hidden lg:table-cell">
                        Like least
                      </th>
                      <th className="p-3 font-medium text-gray-400">
                        Remove one & why
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {withSurvey.map((user, index) => (
                      <tr
                        key={user._id}
                        className="border-b border-[#2A3447] hover:bg-[#1A1F2E]/50"
                      >
                        <td className="p-3 text-gray-500">{index + 1}</td>
                        <td className="p-3 font-medium text-white">
                          {user.username}
                        </td>
                        <td className="p-3 text-gray-400 hidden sm:table-cell">
                          {user.employeeId}
                        </td>
                        <td className="p-3 text-gray-400 hidden md:table-cell capitalize">
                          {user.position}
                        </td>
                        <td className="p-3 text-gray-300 max-w-[140px] lg:max-w-[160px] truncate" title={user.surveyResponses?.suggestionsOrRecommendations}>
                          {user.surveyResponses?.suggestionsOrRecommendations || "—"}
                        </td>
                        <td className="p-3 text-gray-300 max-w-[120px] truncate" title={user.surveyResponses?.shouldRemove}>
                          {user.surveyResponses?.shouldRemove || "—"}
                        </td>
                        <td className="p-3 text-gray-300 max-w-[120px] truncate hidden lg:table-cell" title={user.surveyResponses?.mostTimeOrDifficult}>
                          {user.surveyResponses?.mostTimeOrDifficult || "—"}
                        </td>
                        <td className="p-3 text-gray-300 max-w-[120px] truncate hidden lg:table-cell" title={user.surveyResponses?.customersLikeLeast}>
                          {user.surveyResponses?.customersLikeLeast || "—"}
                        </td>
                        <td className="p-3 text-gray-300 max-w-[180px] truncate" title={user.surveyResponses?.removeOneAndWhy}>
                          {user.surveyResponses?.removeOneAndWhy || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
