// Clean Telegram notification utility for frontend
// SECURITY: Bot token removed from frontend - all calls go through backend
// Note: Direct Telegram calls removed due to CORS - using backend proxy instead

import { getAuthHeaders, getTokenOrNull } from "@/lib/auth";

interface TimeEntryData {
  user: {
    username: string;
    employeeId?: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  overtimeReason?: string | null;
  responsiblePerson?: string;
  latePerson?: string;
}

// Direct Telegram messaging removed due to CORS issues
// All notifications now go through backend proxy at /api/notify/telegram

/**
 * Send time entry notification to all admins
 */
export async function notifyTimeEntry(
  data: TimeEntryData,
  action: "added" | "updated" = "added",
): Promise<void> {
  // Create simple message
  const message = `🔔 Time Entry ${action}

Employee: ${data.user.username}
Date: ${new Date(data.date).toLocaleDateString()}
Start: ${new Date(data.startTime).toLocaleTimeString().slice(0, 5)}
End: ${new Date(data.endTime).toLocaleTimeString().slice(0, 5)}
Hours: ${data.hours}h${
    data.overtimeReason ? `\nOvertime: ${data.overtimeReason}` : ""
  }${
    data.overtimeReason === "Late Arrival" && data.latePerson
      ? `\nLate Person: ${data.latePerson}`
      : ""
  }`;

  // Use backend proxy to avoid CORS issues
  try {
    if (!getTokenOrNull()) {
      console.warn("❌ No auth token found");
      return;
    }
    console.log("📤 Sending via backend proxy...");
    const headers = { "Content-Type": "application/json", ...getAuthHeaders() };

    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
      }/notify/telegram`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          message,
          user: data.user,
        }),
      },
    );

    const result = await response.json();

    if (result.success) {
      console.log(
        "✅ Telegram notifications sent via backend:",
        result.message,
      );
    } else {
      console.error("❌ Backend notification failed:", result.message);
    }
  } catch (error) {
    console.error("❌ Failed to send via backend:", error);
  }
}

/**
 * Test Telegram connection (via backend for security)
 */
export async function testTelegram(): Promise<boolean> {
  try {
    if (!getTokenOrNull()) {
      console.error("❌ No auth token found");
      return false;
    }
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/telegram/test`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      },
    );

    const result = await response.json();

    if (result.success) {
      console.log("✅ Telegram bot connected via backend");
      return true;
    } else {
      console.error("❌ Telegram bot connection failed:", result.message);
      return false;
    }
  } catch (error) {
    console.error("❌ Telegram connection error:", error);
    return false;
  }
}
