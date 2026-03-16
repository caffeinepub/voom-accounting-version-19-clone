import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  useGenerateMonthlyReport,
  useGenerateWeeklyReport,
  useGetAllPdfReports,
} from "../hooks/useQueries";

const LAST_MONTHLY_CHECK_KEY = "voom_last_monthly_check";
const LAST_WEEKLY_CHECK_KEY = "voom_last_weekly_check";
const CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour

export function useCheckAndGenerateMonthlyReport(isAuthenticated: boolean) {
  const generateMonthlyReport = useGenerateMonthlyReport();
  const { data: reports = [] } = useGetAllPdfReports();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || hasChecked.current) return;

    const checkAndGenerate = async () => {
      try {
        const now = new Date();
        const _currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11

        // Calculate target month (previous month)
        let targetMonth: number;
        let targetYear: number;

        if (currentMonth === 0) {
          // January -> check for December of previous year
          targetMonth = 12; // 1-indexed for comparison
          targetYear = _currentYear - 1;
        } else {
          targetMonth = currentMonth; // Convert to 1-indexed
          targetYear = _currentYear;
        }

        // Check if report for previous month already exists
        const reportExists = reports.some((report) => {
          if (report.period.__kind__ === "monthly") {
            const reportMonth = Number(report.period.monthly.month);
            const reportYear = Number(report.period.monthly.year);
            return reportMonth === targetMonth && reportYear === targetYear;
          }
          return false;
        });

        // Check last check timestamp
        const lastCheck = localStorage.getItem(LAST_MONTHLY_CHECK_KEY);
        const lastCheckTime = lastCheck ? Number.parseInt(lastCheck, 10) : 0;
        const timeSinceLastCheck = now.getTime() - lastCheckTime;

        // Only generate if:
        // 1. Report doesn't exist for previous month
        // 2. It's been more than CHECK_INTERVAL since last check
        // 3. We're in the first 7 days of the month (to catch the start of month)
        const isEarlyInMonth = now.getDate() <= 7;
        const shouldCheck = timeSinceLastCheck > CHECK_INTERVAL;

        if (!reportExists && shouldCheck && isEarlyInMonth) {
          const monthNames = [
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
          const targetMonthName =
            currentMonth === 0 ? "December" : monthNames[currentMonth - 1];

          console.log(
            `Generating monthly report for ${targetMonthName} ${targetYear}`,
          );
          const result = await generateMonthlyReport.mutateAsync();
          toast.success("Monthly Report Generated", {
            description: `${result.period} report created successfully (${(result.size / 1024).toFixed(2)} KB)`,
          });
          localStorage.setItem(
            LAST_MONTHLY_CHECK_KEY,
            now.getTime().toString(),
          );
        } else if (shouldCheck) {
          // Update last check time even if we don't generate
          localStorage.setItem(
            LAST_MONTHLY_CHECK_KEY,
            now.getTime().toString(),
          );
        }
      } catch (error: any) {
        console.error("Error checking/generating monthly report:", error);
        // Don't show error toast for automatic generation to avoid annoying users
      }
    };

    // Run check after a short delay to ensure reports are loaded
    const timeoutId = setTimeout(() => {
      checkAndGenerate();
      hasChecked.current = true;
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, reports, generateMonthlyReport]);
}

export function useCheckAndGenerateWeeklyReport(isAuthenticated: boolean) {
  const generateWeeklyReport = useGenerateWeeklyReport();
  const { data: reports = [] } = useGetAllPdfReports();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || hasChecked.current) return;

    const checkAndGenerate = async () => {
      try {
        const now = new Date();
        const _currentYear = now.getFullYear();

        // Get the Monday of the previous week
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days since last Monday
        const lastMonday = new Date(now);
        lastMonday.setDate(now.getDate() - daysToMonday - 7); // Go back to previous week's Monday
        lastMonday.setHours(0, 0, 0, 0);

        // Calculate week number (ISO week)
        const getWeekNumber = (date: Date): number => {
          const d = new Date(
            Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
          );
          const dayNum = d.getUTCDay() || 7;
          d.setUTCDate(d.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
          return Math.ceil(
            ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
          );
        };

        const targetWeek = getWeekNumber(lastMonday);
        const targetYear = lastMonday.getFullYear();

        // Check if report for previous week already exists
        const reportExists = reports.some((report) => {
          if (report.period.__kind__ === "weekly") {
            const reportWeek = Number(report.period.weekly.week);
            const reportYear = Number(report.period.weekly.year);
            return reportWeek === targetWeek && reportYear === targetYear;
          }
          return false;
        });

        // Check last check timestamp
        const lastCheck = localStorage.getItem(LAST_WEEKLY_CHECK_KEY);
        const lastCheckTime = lastCheck ? Number.parseInt(lastCheck, 10) : 0;
        const timeSinceLastCheck = now.getTime() - lastCheckTime;

        // Only generate if:
        // 1. Report doesn't exist for previous week
        // 2. It's been more than CHECK_INTERVAL since last check
        // 3. It's Monday or Tuesday (to catch the start of week)
        const isEarlyInWeek = dayOfWeek === 1 || dayOfWeek === 2; // Monday or Tuesday
        const shouldCheck = timeSinceLastCheck > CHECK_INTERVAL;

        if (!reportExists && shouldCheck && isEarlyInWeek) {
          console.log(
            `Generating weekly report for Week ${targetWeek}, ${targetYear}`,
          );
          const result = await generateWeeklyReport.mutateAsync();
          toast.success("Weekly Report Generated", {
            description: `${result.period} report created successfully (${(result.size / 1024).toFixed(2)} KB)`,
          });
          localStorage.setItem(LAST_WEEKLY_CHECK_KEY, now.getTime().toString());
        } else if (shouldCheck) {
          // Update last check time even if we don't generate
          localStorage.setItem(LAST_WEEKLY_CHECK_KEY, now.getTime().toString());
        }
      } catch (error: any) {
        console.error("Error checking/generating weekly report:", error);
        // Don't show error toast for automatic generation to avoid annoying users
      }
    };

    // Run check after a short delay to ensure reports are loaded
    const timeoutId = setTimeout(() => {
      checkAndGenerate();
      hasChecked.current = true;
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, reports, generateWeeklyReport]);
}
