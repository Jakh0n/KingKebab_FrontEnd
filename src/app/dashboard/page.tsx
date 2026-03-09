"use client";

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: unknown;
    webkitSpeechRecognition: unknown;
  }
}

import { EditTimeEntryModal } from "@/components/EditTimeEntryModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addTimeEntry,
  deleteTimeEntry,
  getAnnouncements,
  logout,
} from "@/lib/api";
import { getTokenOrNull } from "@/lib/auth";
import { notifyTimeEntry } from "@/lib/telegramNotifications";
import { Announcement, TimeEntry, TimeEntryFormData } from "@/types";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Mic,
  MicOff,
  Sparkles,
  User,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { TimePicker } from "../../components/ui/time-picker";
import { DashboardHeader } from "./components/DashboardHeader";
import { useDashboardStats } from "./hooks/useDashboardStats";
import { useMonthFilter } from "./hooks/useMonthFilter";
import { useTimeEntries } from "./hooks/useTimeEntries";
import { StatsCards } from "./components/StatsCards";
import { TimeEntriesList } from "./components/TimeEntriesList";

export default function DashboardPage() {
  const {
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    currentPage,
    setCurrentPage,
    months,
  } = useMonthFilter();
  const {
    entries,
    loading,
    error,
    setLoading,
    setError,
    loadEntries,
    setEntries,
  } = useTimeEntries(selectedMonth, selectedYear);
  const { filteredEntries, stats, totalPages } = useDashboardStats(
    entries,
    selectedMonth,
    selectedYear,
    currentPage,
  );

  const [userData, setUserData] = useState<{
    id: string;
    username: string;
    position: string;
    employeeId?: string;
  } | null>(null);
  const [formData, setFormData] = useState<TimeEntryFormData>({
    startTime: "",
    endTime: "",
    date: new Date().toISOString().split("T")[0],
    overtimeReason: null,
    responsiblePerson: "",
    latePerson: "",
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<{
    [key: string]: boolean;
  }>({});
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showBetaModal, setShowBetaModal] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Soatlarni hisoblash funksiyasi - backend bilan mos kelishi uchun
  const calculateHours = useCallback(
    (startTime: string, endTime: string): number => {
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);

      let workHours;
      if (
        endHours < startHours ||
        (endHours === startHours && endMinutes < startMinutes)
      ) {
        // Agar tugash vaqti boshlanish vaqtidan kichik bo'lsa (masalan, 21:00 - 09:00)
        workHours = 24 - startHours + endHours;
        workHours = workHours + (endMinutes - startMinutes) / 60;
      } else {
        // Oddiy holat (masalan, 09:00 - 17:00)
        workHours = endHours - startHours + (endMinutes - startMinutes) / 60;
      }

      // Backend bilan bir xil: Number(workHours.toFixed(1))
      return Number(workHours.toFixed(1));
    },
    [],
  );

  // Ish vaqtidan tashqari ishlash tekshiruvi
  const isOvertime = useMemo(() => {
    if (!formData.startTime || !formData.endTime) return false;
    return calculateHours(formData.startTime, formData.endTime) > 12;
  }, [formData.startTime, formData.endTime, calculateHours]);

  useEffect(() => {
    const token = getTokenOrNull();
    if (!token) {
      router.push("/login");
      return;
    }

    const payload = JSON.parse(atob(token.split(".")[1]));
    setUserData({
      id: payload.userId,
      username: payload.username,
      position: payload.position,
      employeeId: payload.employeeId,
    });

    loadEntries();
    getAnnouncements()
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]));
  }, [router, loadEntries]);

  // Oy o'zgarganda yangi ma'lumotlarni yuklash
  useEffect(() => {
    if (userData) {
      loadEntries();
    }
  }, [selectedMonth, selectedYear, loadEntries, userData]);

  const handleLogout = useCallback(async () => {
    try {
      setLogoutLoading(true);
      toast.info("Logging out...", {
        description: "Please wait while we log you out safely.",
        duration: 2000,
      });

      // Add a small delay to show the loading state
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await logout();

      // Clear all local storage data
      localStorage.removeItem("token");
      localStorage.removeItem("position");
      localStorage.removeItem("employeeId");

      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out. Please try again.");
    } finally {
      setLogoutLoading(false);
    }
  }, [router]);

  // Tahrirlash funksiyasi
  const handleEditEntry = useCallback((entry: TimeEntry) => {
    // 2 kundan ko'p vaqt o'tgan bo'lsa, tahrirlashga ruxsat bermaymiz
    const entryDate = new Date(entry.date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - entryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 2) {
      toast.error("Cannot edit!", {
        description: "Cannot edit time entries older than 2 days.",
        duration: 3000,
        style: {
          background: "#1A1F2E",
          border: "1px solid #FF3B6F",
          color: "white",
        },
      });
      return;
    }

    setEditingEntry(entry);
    setIsEditModalOpen(true);
  }, []);

  // Modal yopilganda
  const handleModalClose = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingEntry(null);
  }, []);

  // Yozuv yangilanganda
  const handleEntryUpdate = useCallback(
    (updatedEntry: TimeEntry) => {
      setEntries(
        entries.map((entry) =>
          entry._id === updatedEntry._id ? updatedEntry : entry,
        ),
      );
    },
    [entries],
  );

  // O'chirish funksiyasi
  const handleDelete = useCallback(
    async (entryId: string) => {
      if (!confirm("Are you sure you want to delete this time entry?")) {
        return;
      }

      try {
        await deleteTimeEntry(entryId);
        // Ma'lumotlarni yangilash
        setEntries(entries.filter((entry) => entry._id !== entryId));
      } catch (error) {
        console.error("Error:", error);
        setError(
          error instanceof Error ? error.message : "Error deleting entry",
        );
      }
    },
    [entries],
  );

  // Submit funksiyasi
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        const startDate = new Date(selectedDate);
        const endDate = new Date(selectedDate);

        const [startHours, startMinutes] = formData.startTime.split(":");
        const [endHours, endMinutes] = formData.endTime.split(":");

        startDate.setHours(parseInt(startHours), parseInt(startMinutes));
        endDate.setHours(parseInt(endHours), parseInt(endMinutes));

        if (endDate < startDate) {
          endDate.setDate(endDate.getDate() + 1);
        }

        let overtimeReason = null;
        let responsiblePerson: "" | "Adilcan" | "Boss" = "";

        if (isOvertime) {
          overtimeReason = formData.overtimeReason;
          if (
            overtimeReason === "Company Request" &&
            !formData.responsiblePerson
          ) {
            throw new Error("Please select a responsible person");
          }
          if (overtimeReason === "Late Arrival" && !formData.latePerson) {
            throw new Error("Please enter who was late");
          }
          responsiblePerson = formData.responsiblePerson || "";
        }

        const data: TimeEntryFormData = {
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          date: selectedDate.toISOString().split("T")[0],
          overtimeReason,
          responsiblePerson,
          latePerson:
            isOvertime && overtimeReason === "Late Arrival"
              ? formData.latePerson
              : "",
        };

        const newEntry = await addTimeEntry(data);

        // Format the new entry to match existing entries format
        const formattedEntry = {
          ...newEntry,
          date: new Date(newEntry.date).toISOString().split("T")[0],
          startTime: new Date(newEntry.startTime).toISOString(),
          endTime: new Date(newEntry.endTime).toISOString(),
          hours: Number(newEntry.hours.toFixed(1)),
        };

        setEntries([...entries, formattedEntry]);

        // Send Telegram notification from frontend
        if (userData) {
          try {
            await notifyTimeEntry(
              {
                user: userData,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                hours: formattedEntry.hours,
                overtimeReason: data.overtimeReason,
                responsiblePerson: data.responsiblePerson,
                latePerson: data.latePerson,
              },
              "added",
            );
          } catch (telegramError) {
            console.log("Telegram notification failed:", telegramError);
            // Don't show error to user - notifications are optional
          }
        }

        // Formani tozalash
        setFormData({
          startTime: "",
          endTime: "",
          date: new Date().toISOString().split("T")[0],
          overtimeReason: null,
          responsiblePerson: "",
          latePerson: "",
        });

        // Loading holatini o'zgartirish
        setLoading(false);

        // Xatolik xabarini tozalash
        setError("");
      } catch (error) {
        console.error("Error:", error);
        setError(error instanceof Error ? error.message : "Error saving data");
        setLoading(false);
      }
    },
    [selectedDate, formData, isOvertime, entries, userData],
  );

  // Vaqtlarni formatlash
  const formatTime = useCallback((timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Speech recognition functions
  useEffect(() => {
    // Check if speech recognition is supported
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      setSpeechSupported(true);
    }
  }, []);

  // Parse natural language time entry
  const parseTimeEntry = useCallback((text: string) => {
    const lowercaseText = text.toLowerCase();

    // Enhanced time extraction - catches AM/PM variants and periods
    const timeMatches = text.match(
      /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?m\.?|p\.?m\.?)?\b/gi,
    );

    if (timeMatches && timeMatches.length >= 2) {
      // Convert times to 24-hour format with better AM/PM logic
      const convertTo24Hour = (time: string, isEndTime = false) => {
        const match = time.match(
          /(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?m\.?|p\.?m\.?)?/i,
        );
        if (!match) return "";

        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const period = match[3]?.toLowerCase().replace(/\./g, "");

        console.log(
          `Parsing time: "${time}" -> hours: ${hours}, period: "${period}", isEndTime: ${isEndTime}`,
        );

        // Handle AM/PM conversion
        if (period === "pm" && hours !== 12) {
          hours += 12;
        } else if (period === "am" && hours === 12) {
          hours = 0;
        } else if (!period) {
          // Smart defaults when AM/PM is missing
          if (hours >= 1 && hours <= 7) {
            // 1-7 could be AM or PM
            if (isEndTime) {
              // End times 1-7 are likely PM
              hours += 12;
            }
            // Start times 1-7 stay as AM
          } else if (hours >= 8 && hours <= 11) {
            // 8-11 without AM/PM
            if (isEndTime) {
              // End time 8-11 is likely PM
              hours += 12;
            }
            // Start time 8-11 is likely AM (keep as is)
          }
          // 12 stays as 12 (noon), 13+ already in 24h format
        }

        return `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
      };

      const startTime = convertTo24Hour(timeMatches[0], false);
      const endTime = convertTo24Hour(timeMatches[1], true);

      // Additional validation: if end time seems before start time, try to fix it
      const startHour = parseInt(startTime.split(":")[0]);
      const endHour = parseInt(endTime.split(":")[0]);

      console.log(
        `Times parsed: start=${startTime} (${startHour}h), end=${endTime} (${endHour}h)`,
      );

      return { startTime, endTime };
    }

    // If no specific times found, try to extract from common phrases
    if (lowercaseText.includes("nine") || lowercaseText.includes("9")) {
      const startTime = "09:00";
      if (lowercaseText.includes("six") || lowercaseText.includes("6")) {
        return { startTime, endTime: "18:00" };
      }
    }

    return null;
  }, []);

  // Start speech recognition
  const startSpeechRecognition = useCallback(() => {
    if (!speechSupported) {
      toast.error("Speech recognition not supported in your browser");
      return;
    }

    // Type definitions for Speech Recognition API
    interface SpeechRecognitionEvent {
      results: {
        [key: number]: {
          [key: number]: {
            transcript: string;
          };
        };
      };
    }

    interface SpeechRecognitionErrorEvent {
      error: string;
    }

    interface SpeechRecognitionConstructor {
      new (): {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onstart: (() => void) | null;
        onresult: ((event: SpeechRecognitionEvent) => void) | null;
        onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
        onend: (() => void) | null;
        start: () => void;
      };
    }

    const SpeechRecognition = (window.SpeechRecognition ||
      window.webkitSpeechRecognition) as SpeechRecognitionConstructor;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    setIsListening(true);

    recognition.onstart = () => {
      toast.info("🎤 Listening...", {
        description: 'Say something like "worked from 9 AM to 6 PM"',
        duration: 3000,
      });
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      console.log("Speech result:", transcript);

      const parsedTime = parseTimeEntry(transcript);

      if (parsedTime && parsedTime.startTime && parsedTime.endTime) {
        setFormData((prev) => ({
          ...prev,
          startTime: parsedTime.startTime,
          endTime: parsedTime.endTime,
        }));

        toast.success("✅ Voice recognized!", {
          description: `Parsed: ${parsedTime.startTime} to ${parsedTime.endTime} (${transcript})`,
          duration: 4000,
        });
      } else {
        toast.warning("🤔 Could not understand time entry", {
          description: `Said: "${transcript}" - Try: "worked from 9 AM to 6 PM" or "start 9 end 6"`,
          duration: 5000,
        });
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      toast.error("Speech recognition error", {
        description:
          event.error === "no-speech"
            ? "No speech detected"
            : "Please try again",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [speechSupported, parseTimeEntry]);

  // Stop speech recognition
  const stopSpeechRecognition = useCallback(() => {
    setIsListening(false);
  }, []);

  // PDF yuklab olish funksiyasi
  // async function handleDownloadPDF() {
  // 	try {
  // 		await downloadMyPDF(selectedMonth, selectedYear)
  // 	} catch (error) {
  // 		console.error('Error downloading PDF:', error)
  // 		setError('PDF yuklab olishda xatolik yuz berdi')
  // 	}
  // }

  // Smart time suggestions based on worker's historical patterns
  const smartSuggestions = useMemo<{
    startTime: string;
    endTime: string;
    message: string;
    count: number;
  } | null>(() => {
    if (entries.length === 0) return null;

    // Get entries from the last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= threeMonthsAgo;
    });

    if (recentEntries.length === 0) return null;

    // Group entries by start and end time (rounded to nearest 15 minutes)
    const timeGroups = new Map<
      string,
      { count: number; startTime: string; endTime: string }
    >();

    recentEntries.forEach((entry) => {
      const startTime = new Date(entry.startTime);
      const endTime = new Date(entry.endTime);

      // Round to nearest 15 minutes for grouping
      const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
      const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

      const roundedStart = Math.round(startMinutes / 15) * 15;
      const roundedEnd = Math.round(endMinutes / 15) * 15;

      // Format as HH:MM (handle 24-hour overflow)
      const startHours = Math.floor(roundedStart / 60) % 24;
      const startMins = roundedStart % 60;
      const endHours = Math.floor(roundedEnd / 60) % 24;
      const endMins = roundedEnd % 60;

      const startStr = `${startHours.toString().padStart(2, "0")}:${startMins
        .toString()
        .padStart(2, "0")}`;
      const endStr = `${endHours.toString().padStart(2, "0")}:${endMins
        .toString()
        .padStart(2, "0")}`;

      const key = `${startStr}-${endStr}`;

      if (!timeGroups.has(key)) {
        timeGroups.set(key, { count: 0, startTime: startStr, endTime: endStr });
      }

      const group = timeGroups.get(key);
      if (group) {
        group.count++;
      }
    });

    // Find the most common time pattern
    let maxCount = 0;
    let mostCommonStartTime = "";
    let mostCommonEndTime = "";
    let mostCommonCount = 0;

    timeGroups.forEach((group) => {
      if (group.count > maxCount) {
        maxCount = group.count;
        mostCommonStartTime = group.startTime;
        mostCommonEndTime = group.endTime;
        mostCommonCount = group.count;
      }
    });

    if (maxCount < 2 || !mostCommonStartTime || !mostCommonEndTime) return null;

    return {
      startTime: mostCommonStartTime,
      endTime: mostCommonEndTime,
      message: `You usually work ${mostCommonStartTime} - ${mostCommonEndTime} (${mostCommonCount} times in last 3 months)`,
      count: mostCommonCount,
    };
  }, [entries]);

  // Handler to apply suggestion
  const handleApplySuggestion = useCallback(() => {
    if (!smartSuggestions) return;

    setFormData((prev) => ({
      ...prev,
      startTime: smartSuggestions.startTime,
      endTime: smartSuggestions.endTime,
    }));

    toast.success("Time suggestion applied!", {
      description: `Set to ${smartSuggestions.startTime} - ${smartSuggestions.endTime}`,
      duration: 3000,
    });
  }, [smartSuggestions]);

  const toggleAnnouncement = (id: string) => {
    setExpandedAnnouncements((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <main className="min-h-screen p-2 sm:p-4 bg-[#0A0F1C]">
      <div
        className={`${
          logoutLoading ? "opacity-60 pointer-events-none" : ""
        } transition-all duration-300`}
      >
        <Dialog open={showBetaModal} onOpenChange={setShowBetaModal}>
          <DialogContent className="bg-[#1A1F2E] border border-[#4E7BEE] text-white">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 bg-[#4E7BEE]/10 rounded-full flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-[#4E7BEE]" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                    Beta Version
                    <span className="px-1.5 py-0.5 rounded-full bg-[#4E7BEE]/10 text-[#4E7BEE] text-xs">
                      v0.1.0
                    </span>
                  </DialogTitle>
                </div>
              </div>
              <DialogDescription className="text-gray-400">
                This app is currently in Beta (test) mode. Please write your
                times in your notes. After the beta version, you can use it
                normally.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => setShowBetaModal(false)}
                className="bg-[#4E7BEE] hover:bg-[#4E7BEE]/90 text-white"
              >
                I Understand
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Toaster richColors position="top-right" theme="dark" />
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-6">
          <DashboardHeader
            userData={userData}
            onLogout={handleLogout}
            logoutLoading={logoutLoading}
          />

          {/* E'lonlar — faqat isActive: true bo‘lganlar ko‘rinadi; bitta ham bo‘lmasa blok yashirin */}
          {announcements.filter((a) => a.isActive).length > 0 && (
            <Card className="bg-[#0E1422] border-none text-white overflow-hidden">
              <div className="relative bg-gradient-to-r from-[#4E7BEE]/20 to-[#4CC4C0]/20 p-4 sm:p-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#4E7BEE]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#4CC4C0]/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="rounded-lg">
                      <Image src="/bell.png" alt="Bell" width={40} height={40} />
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold text-white">
                      Important Announcements
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {announcements
                      .filter((a) => a.isActive)
                      .map((announcement) => {
                        const isExpanded =
                          !!expandedAnnouncements[announcement._id];
                        const typeStyles = {
                          info: {
                            border:
                              "border-[#4E7BEE]/20 hover:border-[#4E7BEE]/40",
                            iconBg: "bg-[#4E7BEE]/10",
                            icon: FileText,
                            color: "text-[#4E7BEE]",
                            link: "text-[#4E7BEE]",
                          },
                          warning: {
                            border:
                              "border-yellow-500/20 hover:border-yellow-500/40",
                            iconBg: "bg-yellow-500/10",
                            icon: AlertTriangle,
                            color: "text-yellow-500",
                            link: "text-yellow-500",
                          },
                          success: {
                            border:
                              "border-[#4CC4C0]/20 hover:border-[#4CC4C0]/40",
                            iconBg: "bg-[#4CC4C0]/10",
                            icon: CheckCircle2,
                            color: "text-[#4CC4C0]",
                            link: "text-[#4CC4C0]",
                          },
                        };
                        const style =
                          typeStyles[announcement.type] ?? typeStyles.info;
                        const Icon = style.icon;

                        return (
                          <div
                            key={announcement._id}
                            className={`bg-[#1A1F2E] p-3 sm:p-4 rounded-lg border transition-all duration-300 ${style.border}`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className={`${style.iconBg} p-1.5 rounded`}
                              >
                                <Icon
                                  className={`w-4 h-4 ${style.color}`}
                                />
                              </div>
                              <p
                                className={`text-sm sm:text-base font-medium ${style.color}`}
                              >
                                {announcement.title}
                              </p>
                            </div>
                            <div className="relative">
                              <p
                                className={`text-xs sm:text-sm text-gray-400 mt-1 whitespace-pre-wrap ${
                                  !isExpanded ? "line-clamp-3" : ""
                                }`}
                              >
                                {announcement.content}
                              </p>
                              {announcement.content.length > 120 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleAnnouncement(announcement._id)
                                  }
                                  className={`${style.link} text-xs hover:underline mt-1`}
                                >
                                  {isExpanded
                                    ? "Show Less"
                                    : "Read More"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </Card>
          )}

          <StatsCards stats={stats} />

          {/* Vaqt kiritish formasi */}
          <Card className="bg-[#0E1422] border-none text-white">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#4E7BEE]" />
                  Add New Time Entry
                </h2>
                {speechSupported && (
                  <Button
                    type="button"
                    onClick={
                      isListening
                        ? stopSpeechRecognition
                        : startSpeechRecognition
                    }
                    className={`flex items-center gap-2 ${
                      isListening
                        ? "bg-red-500 hover:bg-red-600 animate-pulse"
                        : "bg-[#4CC4C0] hover:bg-[#4CC4C0]/90"
                    } text-white transition-all duration-300`}
                    disabled={loading || logoutLoading}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Voice
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Voice Instructions */}
              {speechSupported && (
                <div className="mb-4 p-3 bg-[#1A1F2E] rounded-lg border border-[#4CC4C0]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="w-4 h-4 text-[#4CC4C0]" />
                    <p className="text-sm font-medium text-[#4CC4C0]">
                      Voice Commands
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 space-y-1">
                    <span className="block">
                      Try saying:{" "}
                      <span className="text-[#4CC4C0] font-medium">
                        &quot;worked from 9 AM to 6 PM&quot;
                      </span>
                    </span>
                    <span className="block">
                      Or:{" "}
                      <span className="text-[#4CC4C0] font-medium">
                        &quot;start 9 end 6&quot;
                      </span>{" "}
                      (assumes 9 AM to 6 PM)
                    </span>
                  </p>
                </div>
              )}

              {/* Smart Time Suggestions */}
              {smartSuggestions && !formData.startTime && !formData.endTime && (
                <div className="mb-4 p-4 bg-gradient-to-r from-[#4E7BEE]/20 to-[#4CC4C0]/20 rounded-lg border border-[#4E7BEE]/30 hover:border-[#4E7BEE]/50 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-[#4E7BEE]" />
                        <p className="text-sm font-medium text-[#4E7BEE]">
                          💡 Smart Suggestion
                        </p>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {smartSuggestions.message}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleApplySuggestion}
                      className="bg-[#4E7BEE] hover:bg-[#4E7BEE]/90 text-white text-sm px-4 py-2 h-auto whitespace-nowrap flex-shrink-0 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Use This
                    </Button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <fieldset disabled={logoutLoading} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        Date
                      </Label>
                      <Input
                        type="date"
                        value={selectedDate.toISOString().split("T")[0]}
                        onChange={(e) =>
                          setSelectedDate(new Date(e.target.value))
                        }
                        required
                        className="bg-[#1A1F2E] border-none text-white text-sm h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        Start Time
                      </Label>
                      <TimePicker
                        value={formData.startTime}
                        onChange={(time) =>
                          setFormData({ ...formData, startTime: time })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        End Time
                      </Label>
                      <TimePicker
                        value={formData.endTime}
                        onChange={(time) =>
                          setFormData({ ...formData, endTime: time })
                        }
                      />
                    </div>
                  </div>

                  {/* Ish vaqtidan tashqari ishlash sababi */}
                  {isOvertime && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          Overtime Reason
                        </Label>
                        <select
                          value={formData.overtimeReason || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              overtimeReason: e.target
                                .value as TimeEntry["overtimeReason"],
                              responsiblePerson:
                                e.target.value === "Company Request"
                                  ? formData.responsiblePerson
                                  : "",
                              latePerson:
                                e.target.value === "Late Arrival"
                                  ? formData.latePerson
                                  : "",
                            })
                          }
                          className="w-full bg-[#1A1F2E] border-none text-white rounded px-3 py-2 text-sm h-10"
                          required
                        >
                          <option value="">Select reason</option>
                          <option value="Busy">Busy</option>
                          <option value="Last Order">Last Order</option>
                          <option value="Company Request">
                            Company Request
                          </option>
                          <option value="Late Arrival">Late Arrival</option>
                        </select>
                      </div>

                      {formData.overtimeReason === "Company Request" && (
                        <div className="space-y-2">
                          <Label className="text-sm flex items-center gap-1.5">
                            <User className="w-4 h-4 text-gray-400" />
                            Responsible Person
                          </Label>
                          <select
                            value={formData.responsiblePerson || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                responsiblePerson: e.target
                                  .value as TimeEntry["responsiblePerson"],
                              })
                            }
                            className="w-full bg-[#1A1F2E] border-none text-white rounded px-3 py-2 text-sm h-10"
                            required
                          >
                            <option value="">Select person</option>
                            <option value="Adilcan">Adilcan</option>
                            <option value="Boss">Boss</option>
                          </select>
                        </div>
                      )}

                      {formData.overtimeReason === "Late Arrival" && (
                        <div className="space-y-2">
                          <Label className="text-sm flex items-center gap-1.5">
                            <User className="w-4 h-4 text-gray-400" />
                            Who was late?
                          </Label>
                          <Input
                            type="text"
                            value={formData.latePerson || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                latePerson: e.target.value,
                              })
                            }
                            placeholder="Enter name of person who was late"
                            className="bg-[#1A1F2E] border-none text-white text-sm h-10"
                            required
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit tugmasi */}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="submit"
                      className="bg-[#4E7BEE] hover:bg-[#4E7BEE]/90 text-white gap-2"
                      disabled={loading || logoutLoading}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Add Entry
                        </>
                      )}
                    </Button>
                  </div>
                </fieldset>
              </form>
            </div>
          </Card>

          <TimeEntriesList
            filteredEntries={filteredEntries}
            loading={loading}
            error={error}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            setSelectedMonth={setSelectedMonth}
            setSelectedYear={setSelectedYear}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            months={months}
            logoutLoading={logoutLoading}
            formatTime={formatTime}
            onEditEntry={handleEditEntry}
            onDelete={handleDelete}
          />
        </div>

        {/* Edit Modal */}
        <EditTimeEntryModal
          isOpen={isEditModalOpen}
          onClose={handleModalClose}
          entry={editingEntry}
          onUpdate={handleEntryUpdate}
        />
      </div>
    </main>
  );
}
