"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarDays, LogOut, Menu, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface DashboardUserData {
  id: string;
  username: string;
  position: string;
  employeeId?: string;
}

interface DashboardHeaderProps {
  userData: DashboardUserData | null;
  onLogout: () => void;
  logoutLoading: boolean;
}

export function DashboardHeader({
  userData,
  onLogout,
  logoutLoading,
}: DashboardHeaderProps) {
  const router = useRouter();

  const positionLabel =
    userData?.position === "worker"
      ? "Worker"
      : userData?.position === "rider"
        ? "Rider"
        : "Monthly";

  return (
    <div className="flex flex-row justify-between items-start gap-2 sm:gap-4 bg-[#0E1422] p-3 sm:p-4 rounded-lg">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <Image
          src="/cropped-kinglogo.avif"
          alt="King Kebab Logo"
          className="w-12 h-12 object-contain"
          width={100}
          height={100}
        />
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-white">
            Dashboard
          </h1>
          {userData && (
            <div className="flex items-center gap-2">
              <p className="text-sm sm:text-base text-gray-400">
                {userData.username}
              </p>
              <span className="px-2 py-0.5 bg-[#4E7BEE]/10 text-[#4E7BEE] text-xs rounded-full border border-[#4E7BEE]/20">
                ID: {userData.employeeId ?? "N/A"}
              </span>
              <span className="text-sm sm:text-base text-gray-400">
                - {positionLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 sm:w-auto flex-wrap items-center flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden h-9 w-9 bg-[#1A1F2E] hover:bg-[#2A3447] flex-shrink-0"
            >
              <Menu className="h-5 w-5 text-[#4E7BEE]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-[#1A1F2E] border-[#2A3447] text-white"
          >
            <DropdownMenuItem
              className="hover:bg-[#2A3447] cursor-pointer group"
              asChild
            >
              <Link
                href="https://kingschadule.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <CalendarDays className="mr-2 h-4 w-4 text-[#4E7BEE] group-hover:text-[#4E7BEE]/80" />
                Schedule
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="hover:bg-[#2A3447] cursor-pointer group"
              onClick={() => router.push("/dashboard/profile")}
            >
              <User className="mr-2 h-4 w-4 text-[#4CC4C0] group-hover:text-[#4CC4C0]/80" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#2A3447]" />
            <DropdownMenuItem
              className="hover:bg-[#2A3447] cursor-pointer group text-[#FF3B6F] focus:text-[#FF3B6F]"
              onClick={onLogout}
              disabled={logoutLoading}
            >
              {logoutLoading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2" />
                  Logging out...
                </span>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4 group-hover:text-[#FF3B6F]/80" />
                  Logout
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="hidden sm:flex gap-2 flex-wrap">
          <Button
            asChild
            variant="outline"
            className="flex-none bg-transparent border-[#4E7BEE]/20 text-[#4E7BEE] hover:bg-[#4E7BEE]/15 hover:border-[#4E7BEE]/50 hover:shadow-[0_0_14px_rgba(78,123,238,0.25)] transition-all duration-200 hover:scale-[1.02] text-sm"
          >
            <Link
              href="https://kingschadule.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              <CalendarDays size={16} className="mr-1" />
              Schedule
            </Link>
          </Button>
          <Button
            onClick={() => router.push("/dashboard/profile")}
            variant="outline"
            className="flex-none bg-transparent border-[#4CC4C0]/20 text-[#4CC4C0] hover:bg-[#4CC4C0]/10 text-sm"
            disabled={logoutLoading}
          >
            <User size={16} className="mr-1" />
            Profile
          </Button>
          <Button
            onClick={onLogout}
            className="flex-none bg-[#FF3B6F] hover:bg-[#FF3B6F]/90 text-sm cursor-pointer"
            disabled={logoutLoading}
          >
            {logoutLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2" />
                Logging out...
              </>
            ) : (
              <>
                <span className="ml-1">Logout</span>
                <LogOut size={16} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
