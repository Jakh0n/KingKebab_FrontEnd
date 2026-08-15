import {
  Announcement,
  ApiError,
  AuthResponse,
  Branch,
  BranchFormData,
  Schedule,
  ScheduleConflict,
  ScheduleFormData,
  SurveyResponses,
  TimeEntry,
  TimeEntryFormData,
  User,
  WeeklyScheduleData,
} from "@/types";
import {
  clearAuthStorage,
  getAuthHeaders,
  getRefreshToken,
  getTokenOrNull,
  isAccessTokenValid,
  persistAuthStorage,
} from "@/lib/auth";
import {
  clearTelegramSession,
  clearTelegramSignedOut,
  loadTelegramSession,
  markTelegramSignedOut,
  saveTelegramSession,
} from "@/lib/telegram";

// Determine API URL based on environment
const getApiUrl = () => {
  // For development, always use local backend
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000/api";
    }
  }

  // If environment variable is set, use it (for production)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Fallback to local for development
  return "http://localhost:5000/api";
};

const API_URL = getApiUrl();
const ACCESS_REFRESH_SKEW_MS = 60 * 1000;

let refreshPromise: Promise<boolean> | null = null;

async function handleResponse<T>(response: Response): Promise<T> {
  // Check if response has content
  const contentType = response.headers.get("content-type");
  const hasJsonContent =
    contentType && contentType.includes("application/json");

  let data;
  try {
    data = hasJsonContent
      ? await response.json()
      : { message: response.statusText };
  } catch {
    // If JSON parsing fails, create a generic error object
    data = { message: `HTTP ${response.status}: ${response.statusText}` };
  }

  if (!response.ok) {
    const errorMessage =
      (data as ApiError).message ||
      `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }
  return data as T;
}

function persistAuthSession(data: AuthResponse): AuthResponse {
  clearTelegramSignedOut();
  persistAuthStorage(data);
  saveTelegramSession(data.token, data.position, data.refreshToken);
  return data;
}

async function requestTokenRefresh(): Promise<AuthResponse> {
  const refreshToken = getRefreshToken();
  const accessToken = getTokenOrNull();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers,
    body: JSON.stringify(refreshToken ? { refreshToken } : {}),
  });

  return handleResponse<AuthResponse>(response);
}

export async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      if (!getTokenOrNull() && !getRefreshToken()) {
        return false;
      }
      const data = await requestTokenRefresh();
      if (!data?.token) return false;
      persistAuthSession(data);
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function ensureAuthenticated(): Promise<boolean> {
  const token = getTokenOrNull();
  if (isAccessTokenValid(token, ACCESS_REFRESH_SKEW_MS)) {
    if (!getRefreshToken()) {
      void refreshSession();
    }
    return true;
  }

  if (token || getRefreshToken()) {
    return refreshSession();
  }

  const cloudSession = await loadTelegramSession();
  if (!cloudSession) return false;

  if (cloudSession.token && isAccessTokenValid(cloudSession.token, ACCESS_REFRESH_SKEW_MS)) {
    persistAuthStorage({
      token: cloudSession.token,
      refreshToken: cloudSession.refreshToken,
      position: cloudSession.position,
    });
    saveTelegramSession(
      cloudSession.token,
      cloudSession.position,
      cloudSession.refreshToken,
    );
    return true;
  }

  if (cloudSession.token || cloudSession.refreshToken) {
    persistAuthStorage({
      refreshToken: cloudSession.refreshToken,
      position: cloudSession.position,
    });
    return refreshSession();
  }

  return false;
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  window.location.assign("/login");
}

async function authFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const ok = await ensureAuthenticated();
  if (!ok) {
    logout({ preserveTelegramCloud: true });
    redirectToLogin();
    throw new Error("Session expired. Please sign in again.");
  }

  const headers = new Headers(init.headers);
  const authHeaders = getAuthHeaders();
  Object.entries(authHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  const doFetch = () =>
    globalThis.fetch(`${API_URL}${path}`, {
      ...init,
      headers,
    });

  let response = await doFetch();
  if (response.status !== 401) {
    return response;
  }

  const refreshed = await refreshSession();
  if (!refreshed) {
    logout({ preserveTelegramCloud: true });
    redirectToLogin();
    throw new Error("Session expired. Please sign in again.");
  }

  const retryHeaders = new Headers(init.headers);
  Object.entries(getAuthHeaders()).forEach(([key, value]) => {
    retryHeaders.set(key, value);
  });

  return globalThis.fetch(`${API_URL}${path}`, {
    ...init,
    headers: retryHeaders,
  });
}

export async function login(
  username: string,
  password: string,
): Promise<AuthResponse> {
  // Avval barcha storage'larni tozalash (CloudStorage saqlanadi — Telegram cold start uchun)
  logout({ preserveTelegramCloud: true });

  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  const data = await handleResponse<AuthResponse>(response);

  return persistAuthSession(data);
}

export async function loginWithTelegram(
  initData: string,
): Promise<AuthResponse> {
  logout({ preserveTelegramCloud: true });

  const response = await fetch(`${API_URL}/auth/telegram`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ initData }),
  });

  const data = await handleResponse<AuthResponse>(response);
  return persistAuthSession(data);
}

export async function linkTelegramAccount(
  initData: string,
  username: string,
  password: string,
): Promise<AuthResponse> {
  logout({ preserveTelegramCloud: true });

  const response = await fetch(`${API_URL}/auth/telegram/link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ initData, username, password }),
  });

  const data = await handleResponse<AuthResponse>(response);
  return persistAuthSession(data);
}

export async function attachTelegramAccount(
  initData: string,
): Promise<AuthResponse> {
  const response = await authFetch("/auth/telegram/attach", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ initData }),
  });

  const data = await handleResponse<AuthResponse>(response);
  return persistAuthSession(data);
}

export async function register(
  username: string,
  password: string,
  position: string,
  employeeId: string,
): Promise<AuthResponse> {
  // Avval barcha storage'larni tozalash
  logout({ preserveTelegramCloud: true });

  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
      position,
      employeeId,
    }),
  });
  const data = await handleResponse<AuthResponse>(response);

  return persistAuthSession({
    ...data,
    employeeId: data.employeeId,
  });
}

export async function requestPasswordReset(
  employeeId: string,
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeId: employeeId.trim() }),
  });
  return handleResponse<{ message: string }>(response);
}

export async function resetPassword(
  employeeId: string,
  newPassword: string,
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employeeId: employeeId.trim(),
      newPassword: newPassword.trim(),
    }),
  });
  return handleResponse<{ message: string }>(response);
}

export async function addTimeEntry(
  data: TimeEntryFormData,
): Promise<TimeEntry> {
  // Ma'lumotlarni tekshirish
  if (!data.startTime || !data.endTime || !data.date) {
    throw new Error("Please fill in all fields");
  }

  // Vaqtlarni to'g'ri formatga o'tkazish
  const formattedData = {
    ...data,
    startTime: data.startTime,
    endTime: data.endTime,
    date: data.date,
    ...(data.employeeId ? { employeeId: data.employeeId } : {}),
  };

  console.log("Sending data:", formattedData);

  const response = await authFetch(`/time`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formattedData),
  });

  return handleResponse<TimeEntry>(response);
}

export async function getMyTimeEntries(): Promise<TimeEntry[]> {
  const response = await authFetch(`/time/my-entries`);
  return handleResponse<TimeEntry[]>(response);
}

export async function getAllTimeEntries(): Promise<TimeEntry[]> {
  const response = await authFetch(`/time/all`);
  return handleResponse<TimeEntry[]>(response);
}

export async function downloadWorkerPDF(
  userId: string,
  month: number,
  year: number,
) {
  const response = await authFetch(
    `/time/worker-pdf/${userId}/${month}/${year}`,
  );

  if (!response.ok) {
    throw new Error("Failed to download PDF");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  // Get filename from Content-Disposition header
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = `worker-time-${userId}-${month}-${year}.pdf`;

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function downloadMyPDF(month: number, year: number) {
  const response = await authFetch(`/time/my-pdf/${month}/${year}`);

  if (!response.ok) {
    throw new Error("Failed to download PDF");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  // Get filename from Content-Disposition header
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = `my-time-${month}-${year}.pdf`;

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function deleteTimeEntry(entryId: string): Promise<void> {
  const response = await authFetch(`/time/${entryId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Error deleting entry");
  }
}

export async function updateTimeEntry(
  id: string,
  data: TimeEntryFormData,
): Promise<TimeEntry> {
  // Ma'lumotlarni tekshirish
  if (!data.startTime || !data.endTime || !data.date) {
    throw new Error("Please fill in all fields");
  }

  // Vaqtlarni to'g'ri formatga o'tkazish
  const formattedData = {
    ...data,
    startTime: data.startTime,
    endTime: data.endTime,
    date: data.date,
  };

  const response = await authFetch(`/time/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formattedData),
  });

  return handleResponse<TimeEntry>(response);
}

// Logout funksiyasini qo'shamiz
export function logout(options?: { preserveTelegramCloud?: boolean }) {
  const revokeOnServer = !options?.preserveTelegramCloud;
  const refreshToken = revokeOnServer ? getRefreshToken() : null;
  const accessToken = revokeOnServer ? getTokenOrNull() : null;

  if (revokeOnServer && (refreshToken || accessToken)) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    void fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers,
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    }).catch(() => {
      // local sign-out still proceeds
    });
  }

  localStorage.clear();
  sessionStorage.clear();
  clearAuthStorage();

  if (options?.preserveTelegramCloud) {
    return;
  }

  clearTelegramSession();
  markTelegramSignedOut();
}

export async function registerWorker(data: {
  username: string;
  password: string;
  position: string;
  isAdmin: boolean;
  employeeId: string;
}) {
  const response = await authFetch(`/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

// Announcements
export async function getAnnouncements(): Promise<Announcement[]> {
  const response = await authFetch(`/announcements`);

  if (!response.ok) {
    throw new Error("Failed to fetch announcements");
  }

  return response.json();
}

export async function createAnnouncement(data: {
  title: string;
  content: string;
  type: "info" | "warning" | "success";
}): Promise<Announcement> {
  const response = await authFetch(`/announcements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create announcement");
  }

  return response.json();
}

export async function updateAnnouncement(
  id: string,
  data: {
    title: string;
    content: string;
    type: "info" | "warning" | "success";
    isActive: boolean;
  },
): Promise<Announcement> {
  const response = await authFetch(`/announcements/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update announcement");
  }

  return response.json();
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const response = await authFetch(`/announcements/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete announcement");
  }
}

// Profile API functions
export async function getUserProfile(): Promise<User> {
  const response = await authFetch(`/profile`);

  const user = await handleResponse<User>(response);

  // Convert relative URL to absolute URL for images
  if (
    user.photoUrl &&
    !user.photoUrl.startsWith("http") &&
    !user.photoUrl.startsWith("data:")
  ) {
    const baseUrl = API_URL.replace("/api", "");
    user.photoUrl = `${baseUrl}${user.photoUrl}`;
  }

  return user;
}

export async function updateUserProfile(data: {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  department?: string;
  photoUrl?: string;
  hireDate?: string;
  hourlyWage?: number;
  skills?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  surveyCompleted?: boolean;
  surveyResponses?: SurveyResponses;
}): Promise<User> {
  const response = await authFetch(`/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse<User>(response);
}

export async function uploadProfileImage(file: File): Promise<{
  message: string;
  imageUrl: string;
  user: User;
}> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await authFetch(`/profile/upload-image`, {
    method: "POST",
    body: formData,
  });

  const result = await handleResponse<{
    message: string;
    imageUrl: string;
    user: User;
  }>(response);

  // Convert relative URL to absolute URL
  const baseUrl = API_URL.replace("/api", "");
  result.user.photoUrl = result.user.photoUrl
    ? `${baseUrl}${result.user.photoUrl}`
    : "";
  result.imageUrl = `${baseUrl}${result.imageUrl}`;

  return result;
}

// ================================
// Branch Management API Functions
// ================================

export async function getAllBranches(
  includeInactive = false,
): Promise<Branch[]> {
  const params = new URLSearchParams();
  if (includeInactive) params.append("includeInactive", "true");

  const response = await authFetch(`/branches?${params}`, {
    method: "GET",
  });
  return handleResponse<Branch[]>(response);
}

export async function getBranch(id: string): Promise<Branch> {
  const response = await authFetch(`/branches/${id}`, {
    method: "GET",
  });
  return handleResponse<Branch>(response);
}

export async function createBranch(
  data: BranchFormData,
): Promise<{ message: string; branch: Branch }> {
  if (
    !data.name ||
    !data.code ||
    !data.location.address ||
    !data.location.city
  ) {
    throw new Error("Name, code, address, and city are required");
  }

  const response = await authFetch(`/branches`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse<{ message: string; branch: Branch }>(response);
}

export async function updateBranch(
  id: string,
  data: BranchFormData,
): Promise<{ message: string; branch: Branch }> {
  const response = await authFetch(`/branches/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse<{ message: string; branch: Branch }>(response);
}

export async function deleteBranch(id: string): Promise<{ message: string }> {
  const response = await authFetch(`/branches/${id}`, {
    method: "DELETE",
  });
  return handleResponse<{ message: string }>(response);
}

export async function getActiveBranches(): Promise<Branch[]> {
  const response = await fetch(`${API_URL}/branches/public/active`, {
    method: "GET",
  });
  return handleResponse<Branch[]>(response);
}

export async function getAllUsers(): Promise<User[]> {
  const response = await authFetch(`/users`, {
    method: "GET",
  });
  return handleResponse<User[]>(response);
}

// =================================
// Schedule Management API Functions
// =================================

export async function getSchedules(params: {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  workerId?: string;
  status?: string;
  shiftType?: string;
  page?: number;
  limit?: number;
}): Promise<{
  schedules: Schedule[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });

  const response = await authFetch(`/schedules?${searchParams}`, {
    method: "GET",
  });
  return handleResponse<{
    schedules: Schedule[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>(response);
}

export async function getSchedule(id: string): Promise<Schedule> {
  const response = await authFetch(`/schedules/${id}`, {
    method: "GET",
  });
  return handleResponse<Schedule>(response);
}

export async function createSchedule(
  data: ScheduleFormData,
): Promise<{ message: string; schedule: Schedule; recurringCount?: number }> {
  if (
    !data.branchId ||
    !data.workerId ||
    !data.startTime ||
    !data.endTime ||
    !data.shiftType ||
    !data.role ||
    !data.duration ||
    !data.workingDays ||
    data.workingDays.length === 0
  ) {
    throw new Error(
      "Branch, worker, start time, end time, shift type, role, duration, and working days are required",
    );
  }

  const response = await authFetch(`/schedules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse<{
    message: string;
    schedule: Schedule;
    recurringCount?: number;
  }>(response);
}

export async function updateSchedule(
  id: string,
  data: Partial<ScheduleFormData>,
): Promise<{ message: string; schedule: Schedule }> {
  const response = await authFetch(`/schedules/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse<{ message: string; schedule: Schedule }>(response);
}

export async function deleteSchedule(id: string): Promise<{ message: string }> {
  const response = await authFetch(`/schedules/${id}`, {
    method: "DELETE",
  });
  return handleResponse<{ message: string }>(response);
}

export async function confirmSchedule(
  id: string,
): Promise<{ message: string; schedule: Schedule }> {
  const response = await authFetch(`/schedules/${id}/confirm`, {
    method: "PATCH",
  });
  return handleResponse<{ message: string; schedule: Schedule }>(response);
}

export async function checkScheduleConflicts(params: {
  workerId: string;
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
}): Promise<{
  hasConflicts: boolean;
  conflicts: ScheduleConflict[];
}> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });

  const response = await authFetch(
    `/schedules/conflicts/check?${searchParams}`,
    { method: "GET" },
  );
  return handleResponse<{
    hasConflicts: boolean;
    conflicts: ScheduleConflict[];
  }>(response);
}

export async function getWeeklySchedule(
  year: number,
  week: number,
  branchId?: string,
  shiftType?: string,
): Promise<WeeklyScheduleData> {
  const params = new URLSearchParams();
  if (branchId) params.append("branchId", branchId);
  if (shiftType) params.append("shiftType", shiftType);

  const response = await authFetch(
    `/schedules/weekly/${year}/${week}?${params}`,
    { method: "GET" },
  );
  return handleResponse<WeeklyScheduleData>(response);
}
