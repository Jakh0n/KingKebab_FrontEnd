"use client";

import { ModeToggle } from "@/components/ui/mode-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  getAllTimeEntries,
  logout,
  registerWorker,
  updateAnnouncement,
} from "@/lib/api";
import { getTokenOrNull } from "@/lib/auth";
import { Announcement, TimeEntry } from "@/types";
import {
  AlertTriangle,
  Bell,
  Bike,
  CalendarDays,
  ChefHat,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  ExternalLink,
  FileText,
  LogOut,
  Menu,
  Pencil,
  Search,
  Settings,
  Timer,
  Trash2,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import AddWorkerModal from "./components/AddWorkerModal";
import AnnouncementModal from "./components/AnnouncementModal";

export default function AdminPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const router = useRouter();

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllTimeEntries();

      // Backend calculation bilan mos kelishi uchun hours ni normalize qilish
      const normalizedEntries = data.map((entry) => ({
        ...entry,
        hours: Number(entry.hours.toFixed(1)),
      }));

      setEntries(normalizedEntries);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes("Admin access required")
      ) {
        router.push("/dashboard");
      }
      console.error("Error loading entries:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadAnnouncements = useCallback(async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error("Error loading announcements:", err);
      setAnnouncements([]);
    }
  }, []);

  useEffect(() => {
    if (!getTokenOrNull()) {
      router.push("/login");
      return;
    }
    loadEntries();
    loadAnnouncements();
  }, [router, loadEntries, loadAnnouncements]);

  // Oy yoki yil o'zgarganda ma'lumotlarni yangilash
  useEffect(() => {
    loadEntries();
  }, [selectedMonth, selectedYear, loadEntries]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  // Vaqtlarni formatlash
  function formatTime(timeStr: string) {
    return new Date(timeStr).toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Oylar ro'yxati
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Tanlangan oyga tegishli yozuvlarni filterlash
  const filteredEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return (
      entryDate.getMonth() + 1 === selectedMonth &&
      entryDate.getFullYear() === selectedYear
    );
  });

  // Ishchilar bo'yicha statistika - useMemo bilan optimallashtirish
  const workerStats = useMemo(() => {
    return filteredEntries.reduce(
      (acc, entry) => {
        if (!entry.user?._id) return acc;

        const userId = entry.user._id;
        if (!acc[userId]) {
          acc[userId] = {
            id: userId,
            employeeId: entry.user.employeeId || entry.employeeId || "N/A",
            username: entry.user.username || "",
            position: entry.user.position || "worker",
            totalHours: 0,
            regularDays: 0,
            overtimeDays: 0,
          };
        }

        // Backend bilan mos kelishi uchun to'g'ri yumaloqlash
        const entryHours = Number(entry.hours.toFixed(1));
        acc[userId].totalHours += entryHours;

        if (entryHours <= 12) {
          acc[userId].regularDays++;
        } else {
          acc[userId].overtimeDays++;
        }
        return acc;
      },
      {} as Record<
        string,
        {
          id: string;
          employeeId: string;
          username: string;
          position: string;
          totalHours: number;
          regularDays: number;
          overtimeDays: number;
        }
      >,
    );
  }, [filteredEntries]);

  // Total hours ni to'g'ri yumaloqlash
  Object.values(workerStats).forEach((worker) => {
    worker.totalHours = Number(worker.totalHours.toFixed(1));
  });

  // Tanlangan ishchi ma'lumotlari
  const selectedWorkerData = useMemo(() => {
    return selectedWorker ? workerStats[selectedWorker] : null;
  }, [selectedWorker, workerStats]);

  // Filter workers based on search query
  const filteredWorkers = useMemo(() => {
    const workers = Object.values(workerStats);
    if (!searchQuery) return workers;

    const query = searchQuery.toLowerCase();
    return workers.filter((worker) =>
      worker.username.toLowerCase().includes(query),
    );
  }, [workerStats, searchQuery]);

  // async function handleDownloadPDF(userId: string) {
  // 	try {
  // 		setPdfLoading(true)
  // 		await downloadWorkerPDF(userId, selectedMonth, selectedYear)
  // 		toast.success('PDF downloaded successfully')
  // 	} catch (error) {
  // 		console.error('Error downloading PDF:', error)
  // 		toast.error('Error downloading PDF')
  // 	} finally {
  // 		setPdfLoading(false)
  // 	}
  // }

  const handleAddWorker = async (workerData: {
    username: string;
    password: string;
    position: string;
    isAdmin: boolean;
    employeeId: string;
  }) => {
    try {
      await registerWorker(workerData);
      setIsAddModalOpen(false);
      await loadEntries(); // Refresh the list
      toast.success("Worker added successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add worker",
      );
    }
  };

  const handleDownloadExcel = () => {
    console.log("Worker Stats before Excel:", Object.values(workerStats));

    // Filter out monthly users - only include worker and rider positions
    const regularWorkers = Object.values(workerStats).filter(
      (worker) => worker.position === "worker" || worker.position === "rider",
    );

    // Workers statistics in English (excluding monthly users)
    const excelData = regularWorkers.map((worker) => {
      console.log("Processing worker:", worker);
      return {
        "Employee ID": worker.employeeId || "N/A",
        "Employee Name": worker.username,
        "Total Hours": worker.totalHours,
        "Total Days": worker.regularDays + worker.overtimeDays,
        "Regular Days": worker.regularDays,
        "Overtime Days": worker.overtimeDays,
        Position: worker.position === "worker" ? "Worker" : "Rider",
      };
    });

    console.log("Excel Data:", excelData);

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      `${months[selectedMonth - 1]} ${selectedYear}`,
    );

    // Create filename with selected month and year
    const fileName = `King_Kebab_${
      months[selectedMonth - 1]
    }_${selectedYear}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleDownloadMonthlyExcel = () => {
    // Filter only monthly users
    const monthlyWorkers = Object.values(workerStats).filter(
      (worker) => worker.position === "monthly",
    );

    if (monthlyWorkers.length === 0) {
      toast.error("No monthly users found for this period");
      return;
    }

    // Monthly workers statistics in English
    const excelData = monthlyWorkers.map((worker) => {
      return {
        "Employee ID": worker.employeeId || "N/A",
        "Employee Name": worker.username,
        "Total Hours": worker.totalHours,
        "Total Days": worker.regularDays + worker.overtimeDays,
        "Regular Days": worker.regularDays,
        "Overtime Days": worker.overtimeDays,
        Position: "Monthly",
      };
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      `Monthly Users - ${months[selectedMonth - 1]} ${selectedYear}`,
    );

    // Create filename with selected month and year for monthly users only
    const fileName = `King_Kebab_Monthly_Users_${
      months[selectedMonth - 1]
    }_${selectedYear}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast.success(
      `Monthly users data downloaded (${monthlyWorkers.length} users)`,
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-2 sm:p-4">
        <div className="mx-auto flex h-screen max-w-[1400px] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-2 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-card sm:flex-row sm:items-center sm:gap-4 sm:p-4">
          <div className="flex w-full items-center gap-4 sm:w-auto">
            <Image
              src="/cropped-kinglogo.avif"
              alt="King Kebab Logo"
              className="h-10 w-10 object-contain sm:h-12 sm:w-12"
              width={100}
              height={100}
            />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg md:text-2xl">
                King Kebab | Admin Panel
              </h1>
            </div>
          </div>

          <div className="flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 flex-1 sm:flex-auto">
              <select
                className="w-full cursor-pointer rounded-xl border border-border bg-muted px-2 py-2 text-xs text-foreground outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 sm:w-[140px] sm:px-4 sm:text-sm"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                {months.map((month, index) => (
                  <option key={index + 1} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>

              <select
                className="w-[80px] cursor-pointer rounded-xl border border-border bg-muted px-2 py-2 text-xs text-foreground outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 sm:w-[100px] sm:px-4 sm:text-sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - 2 + i,
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <ModeToggle compact className="hidden shrink-0 sm:flex" />
            {/* Admin Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 bg-muted hover:bg-accent sm:h-10 sm:w-10"
                >
                  <Menu className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4 text-teal-500" />
                  <span>Add Worker</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    setEditingAnnouncement(null);
                    setIsAnnouncementModalOpen(true);
                  }}
                >
                  <Bell className="mr-2 h-4 w-4 text-teal-500" />
                  <span>Add Announcement</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => window.open("https://kingschadule.netlify.app", "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="mr-2 h-4 w-4 text-primary" />
                  <span>Schedule</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handleDownloadExcel}
                >
                  <Download className="mr-2 h-4 w-4 text-primary" />
                  <span>Download Excel (All)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handleDownloadMonthlyExcel}
                >
                  <CalendarDays className="mr-2 h-4 w-4 text-violet-500" />
                  <span>Download Monthly Users</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push("/admin/survey")}
                >
                  <ClipboardList className="mr-2 h-4 w-4 text-teal-500" />
                  <span>Menu Survey</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4 text-primary" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex shrink-0 sm:hidden">
              <ModeToggle compact />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <Card className="border-border bg-card p-4 text-card-foreground shadow-card transition-shadow duration-300 hover:shadow-card-hover sm:p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 text-sm text-muted-foreground">Total Staff</h3>
                  <p className="text-2xl font-bold tracking-tight text-primary">
                    {Object.values(workerStats).length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="border-border bg-card p-4 text-card-foreground shadow-card transition-shadow duration-300 hover:shadow-card-hover sm:p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-teal-500/10 p-3">
                  <ChefHat className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 text-sm text-muted-foreground">Worker(s)</h3>
                  <p className="text-2xl font-bold tracking-tight text-teal-600 dark:text-teal-400">
                    {
                      Object.values(workerStats).filter(
                        (w) => w.position === "worker",
                      ).length
                    }
                  </p>
                </div>
              </div>
            </Card>
            <Card className="border-border bg-card p-4 text-card-foreground shadow-card transition-shadow duration-300 hover:shadow-card-hover sm:p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-500/10 p-3">
                  <Bike className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 text-sm text-muted-foreground">Rider(s)</h3>
                  <p className="text-2xl font-bold tracking-tight text-violet-600 dark:text-violet-400">
                    {
                      Object.values(workerStats).filter(
                        (w) => w.position === "rider",
                      ).length
                    }
                  </p>
                </div>
              </div>
            </Card>
            <Card className="border-border bg-card p-4 text-card-foreground shadow-card transition-shadow duration-300 hover:shadow-card-hover sm:p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-500/10 p-3">
                  <CalendarDays className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 text-sm text-muted-foreground">Monthly</h3>
                  <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                    {
                      Object.values(workerStats).filter(
                        (w) => w.position === "monthly",
                      ).length
                    }
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Announcements */}
          <Card className="border-border bg-card p-4 text-card-foreground sm:p-5">
            <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <Bell className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                Announcements
              </h2>
              <Button
                onClick={() => {
                  setEditingAnnouncement(null);
                  setIsAnnouncementModalOpen(true);
                }}
                className="rounded-full bg-teal-600 text-primary-foreground hover:bg-teal-600/90 dark:bg-teal-500 dark:hover:bg-teal-500/90"
              >
                Add Announcement
              </Button>
            </div>
            <div className="custom-scrollbar max-h-[280px] space-y-3 overflow-y-auto pr-2">
              {announcements.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  No announcements yet. Add one to show on the dashboard.
                </p>
              ) : (
                announcements.map((a) => {
                  const typeColor =
                    a.type === "info"
                      ? "text-primary"
                      : a.type === "warning"
                        ? "text-yellow-600 dark:text-yellow-500"
                        : "text-teal-600 dark:text-teal-400";
                  return (
                    <div
                      key={a._id}
                      className="flex flex-col justify-between gap-2 rounded-xl border border-border bg-muted/50 p-3 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <FileText className={`h-4 w-4 shrink-0 ${typeColor}`} />
                          <p className="truncate font-medium">{a.title}</p>
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs ${typeColor} bg-foreground/5`}
                          >
                            {a.type}
                          </span>
                          {!a.isActive && (
                            <span className="text-xs text-muted-foreground">(hidden)</span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {a.content}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-primary hover:bg-primary/10"
                          onClick={() => {
                            setEditingAnnouncement(a);
                            setIsAnnouncementModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive hover:bg-destructive/10"
                          onClick={async () => {
                            if (!confirm("Delete this announcement?")) return;
                            try {
                              await deleteAnnouncement(a._id);
                              await loadAnnouncements();
                              toast.success("Announcement deleted");
                            } catch (err) {
                              toast.error(
                                err instanceof Error
                                  ? err.message
                                  : "Failed to delete",
                              );
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Workers List */}
            <div className="w-full rounded-2xl border border-border bg-card p-3 sm:p-4 lg:w-1/3">
              {/* Search Input */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search workers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted py-2.5 pl-9 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                />
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>

              <div className="custom-scrollbar h-[calc(100vh-380px)] space-y-3 overflow-y-auto pr-2 sm:h-[calc(100vh-320px)] lg:h-[calc(100vh-230px)]">
                {filteredWorkers.map((worker) => (
                  <Card
                    key={worker.id}
                    className={`cursor-pointer border border-transparent p-3 transition-all hover:bg-muted/80 sm:p-4 ${
                      selectedWorker === worker.id
                        ? "bg-muted ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "bg-background"
                    }`}
                    onClick={() => setSelectedWorker(worker.id)}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="mb-0.5 flex items-center gap-2 text-base font-semibold tracking-tight text-card-foreground sm:mb-1 sm:text-lg">
                            {worker.position === "worker" ? (
                              <ChefHat size={16} className="text-teal-600 dark:text-teal-400" />
                            ) : worker.position === "rider" ? (
                              <Bike size={16} className="text-violet-600 dark:text-violet-400" />
                            ) : (
                              <CalendarDays
                                size={16}
                                className="text-purple-600 dark:text-purple-400"
                              />
                            )}
                            {worker.username}
                          </h2>
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                            <p className="text-xs text-muted-foreground sm:text-sm">
                              {worker.position === "worker"
                                ? "Worker"
                                : worker.position === "rider"
                                  ? "Rider"
                                  : "Monthly"}
                            </p>
                            <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                              ID: {worker.employeeId || "N/A"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 sm:px-3 sm:py-1.5">
                          <Clock size={12} className="text-primary" />
                          <p className="text-xs font-medium text-primary sm:text-sm">
                            {worker.totalHours.toFixed(1)}h
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div className="rounded-lg bg-muted p-2 sm:p-3">
                          <p className="mb-0.5 flex items-center gap-1 text-xs text-muted-foreground sm:mb-1">
                            <CalendarDays size={12} />
                            Regular
                          </p>
                          <p className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                            {worker.regularDays}d
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted p-2 sm:p-3">
                          <p className="mb-0.5 flex items-center gap-1 text-xs text-muted-foreground sm:mb-1">
                            <Timer size={12} />
                            Overtime
                          </p>
                          <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                            {worker.overtimeDays}d
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Worker Details */}
            <div className="w-full lg:w-2/3">
              <Card className="h-[calc(100vh-380px)] border-border bg-card p-3 text-card-foreground sm:h-[calc(100vh-320px)] sm:p-4 lg:h-[calc(100vh-230px)] lg:p-6">
                {selectedWorkerData ? (
                  <div className="flex h-full flex-col">
                    <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center sm:gap-4">
                      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
                        {selectedWorkerData.position === "worker" ? (
                          <ChefHat size={20} className="text-teal-600 dark:text-teal-400" />
                        ) : selectedWorkerData.position === "rider" ? (
                          <Bike size={20} className="text-violet-600 dark:text-violet-400" />
                        ) : (
                          <CalendarDays size={20} className="text-purple-600 dark:text-purple-400" />
                        )}
                        {selectedWorkerData.username}
                      </h2>
                      {/* <Button
											className='bg-[#00875A] hover:bg-[#00875A]/90 w-full sm:w-auto px-4 sm:px-6 gap-2 h-9 sm:h-10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
											onClick={() =>
												selectedWorker && handleDownloadPDF(selectedWorker)
											}
											disabled={pdfLoading}
										>
											{pdfLoading ? (
												<Loader2 className='w-4 h-4 animate-spin' />
											) : (
												<Download size={16} />
											)}
											<span className='hidden sm:inline '>Download PDF</span>
											<span className='sm:hidden'>PDF</span>
										</Button> */}
                    </div>
                    <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-2 sm:space-y-3">
                      {filteredEntries
                        .filter(
                          (entry) =>
                            entry.user && entry.user._id === selectedWorker,
                        )
                        .map((entry) => {
                          const isOvertime = entry.hours > 12;
                          return (
                            <div
                              key={entry._id}
                              className={`rounded-xl border p-4 transition-colors duration-200 ${
                                isOvertime
                                  ? "border-yellow-500/25 bg-muted/40 hover:bg-muted/60"
                                  : "border-border bg-muted/30 hover:bg-muted/50"
                              }`}
                            >
                              <div className="flex flex-col gap-4">
                                {/* Sana va Soatlar */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-primary/10 p-2.5">
                                      <CalendarDays className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">
                                        Date
                                      </p>
                                      <p className="font-medium text-foreground">
                                        {new Date(
                                          entry.date,
                                        ).toLocaleDateString("en-US", {
                                          weekday: "short",
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <div
                                      className={`rounded-full px-3 py-1 ${
                                        isOvertime
                                          ? "bg-yellow-500/10"
                                          : "bg-emerald-500/10"
                                      }`}
                                    >
                                      <p
                                        className={`text-sm font-medium ${
                                          isOvertime
                                            ? "text-yellow-600 dark:text-yellow-500"
                                            : "text-emerald-600 dark:text-emerald-500"
                                        }`}
                                      >
                                        {isOvertime ? "Overtime" : "Regular"}
                                      </p>
                                    </div>
                                    <p className="text-sm font-medium text-primary">
                                      {entry.hours.toFixed(1)} hours
                                    </p>
                                  </div>
                                </div>

                                {/* Ish vaqti */}
                                <div className="flex items-center gap-3 rounded-xl bg-background/80 p-3 ring-1 ring-border/60">
                                  <div className="rounded-lg bg-teal-500/10 p-2.5">
                                    <Clock className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Working Hours
                                    </p>
                                    <p className="font-medium text-teal-600 dark:text-teal-400">
                                      {formatTime(entry.startTime)} -{" "}
                                      {formatTime(entry.endTime)}
                                    </p>
                                  </div>
                                </div>

                                {/* Overtime ma'lumotlari */}
                                {isOvertime && entry.overtimeReason && (
                                  <div className="space-y-3 rounded-xl border border-yellow-500/15 bg-yellow-500/5 p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="rounded-lg bg-yellow-500/10 p-2.5">
                                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">
                                          Overtime Reason
                                        </p>
                                        <p className="font-medium text-yellow-600 dark:text-yellow-500">
                                          {entry.overtimeReason}
                                        </p>
                                      </div>
                                    </div>

                                    {entry.overtimeReason ===
                                      "Company Request" &&
                                      entry.responsiblePerson && (
                                        <div className="flex items-center gap-3 border-t border-yellow-500/15 pt-2">
                                          <div className="rounded-lg bg-blue-500/10 p-2.5">
                                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">
                                              Responsible Person
                                            </p>
                                            <p className="font-medium text-blue-600 dark:text-blue-400">
                                              {entry.responsiblePerson}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <p className="flex h-full items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                    <ChevronRight size={18} aria-hidden />
                    Select a worker to view details
                  </p>
                )}
              </Card>
            </div>
          </div>

          <AddWorkerModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={handleAddWorker}
          />

          <AnnouncementModal
            key={editingAnnouncement?._id ?? "new"}
            isOpen={isAnnouncementModalOpen}
            onClose={() => {
              setEditingAnnouncement(null);
              setIsAnnouncementModalOpen(false);
            }}
            announcement={editingAnnouncement ?? undefined}
            onSubmit={async (data) => {
              try {
                if (editingAnnouncement) {
                  await updateAnnouncement(editingAnnouncement._id, {
                    ...data,
                    isActive: data.isActive ?? true,
                  });
                  toast.success("Announcement updated");
                } else {
                  await createAnnouncement(data);
                  toast.success("Announcement added successfully");
                }
                setEditingAnnouncement(null);
                setIsAnnouncementModalOpen(false);
                await loadAnnouncements();
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : editingAnnouncement
                      ? "Failed to update announcement"
                      : "Failed to add announcement",
                );
              }
            }}
          />
        </>
      </div>
    </main>
  );
}
