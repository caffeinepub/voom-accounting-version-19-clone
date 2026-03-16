import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Calendar,
  DollarSign,
  Download,
  FileDown,
  FileText,
  Loader2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useGetAllPdfReports,
  useGetExpensesForPeriod,
  useGetIncomeForPeriod,
} from "../hooks/useQueries";
import { generatePDF } from "../lib/pdfGenerator";

type ReportType = "custom" | "daily" | "weekly" | "monthly" | "yearly";

export default function ReportsView() {
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [isGenerating, setIsGenerating] = useState(false);

  // Custom date range
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Daily
  const [dailyDate, setDailyDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  // Weekly
  const [weekStartDate, setWeekStartDate] = useState<string>("");

  // Monthly
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1,
  );

  // Yearly
  const [yearlyYear, setYearlyYear] = useState<number>(
    new Date().getFullYear(),
  );

  const { data: allReports = [], isLoading: reportsLoading } =
    useGetAllPdfReports();

  const { startDate, endDate, periodLabel } = useMemo(() => {
    let start: Date;
    let end: Date;
    let label: string;

    switch (reportType) {
      case "custom":
        if (!customStartDate || !customEndDate) {
          return {
            startDate: BigInt(0),
            endDate: BigInt(0),
            periodLabel: "Custom Range",
          };
        }
        start = new Date(customStartDate);
        end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        label = `${start.toLocaleDateString("en-IN")} - ${end.toLocaleDateString("en-IN")}`;
        break;

      case "daily":
        start = new Date(dailyDate);
        end = new Date(dailyDate);
        end.setHours(23, 59, 59, 999);
        label = start.toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        break;

      case "weekly":
        if (!weekStartDate) {
          return {
            startDate: BigInt(0),
            endDate: BigInt(0),
            periodLabel: "Weekly",
          };
        }
        start = new Date(weekStartDate);
        end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        label = `Week: ${start.toLocaleDateString("en-IN")} - ${end.toLocaleDateString("en-IN")}`;
        break;

      case "monthly":
        start = new Date(selectedYear, selectedMonth - 1, 1);
        end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
        label = `${start.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`;
        break;

      case "yearly":
        start = new Date(yearlyYear, 0, 1);
        end = new Date(yearlyYear, 11, 31, 23, 59, 59, 999);
        label = `Year ${yearlyYear}`;
        break;

      default:
        return { startDate: BigInt(0), endDate: BigInt(0), periodLabel: "" };
    }

    return {
      startDate: BigInt(start.getTime()) * BigInt(1_000_000),
      endDate: BigInt(end.getTime()) * BigInt(1_000_000),
      periodLabel: label,
    };
  }, [
    reportType,
    customStartDate,
    customEndDate,
    dailyDate,
    weekStartDate,
    selectedYear,
    selectedMonth,
    yearlyYear,
  ]);

  const isValidDateRange = startDate > BigInt(0) && endDate > BigInt(0);

  const { data: incomeEntries = [], isLoading: incomeLoading } =
    useGetIncomeForPeriod(startDate, endDate);
  const { data: expenseEntries = [], isLoading: expenseLoading } =
    useGetExpensesForPeriod(startDate, endDate);

  const stats = useMemo(() => {
    const totalIncome = incomeEntries.reduce(
      (sum, entry) => sum + entry.amount,
      0,
    );
    const totalExpenses = expenseEntries.reduce(
      (sum, entry) => sum + entry.amount,
      0,
    );
    const netProfitLoss = totalIncome - totalExpenses;

    const totalCash = incomeEntries
      .filter((e) => e.paymentMode === "cash")
      .reduce((sum, e) => sum + e.amount, 0);
    const totalBank = incomeEntries
      .filter((e) => e.paymentMode === "bank")
      .reduce((sum, e) => sum + e.amount, 0);
    const totalBalance = incomeEntries
      .filter((e) => e.paymentMode === "balancePayment")
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netProfitLoss,
      totalCash,
      totalBank,
      totalBalance,
    };
  }, [incomeEntries, expenseEntries]);

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getAvailableYears = (): number[] => {
    const currentYear = new Date().getFullYear();
    const yearsArray: number[] = [];
    for (let i = currentYear - 5; i <= currentYear; i++) {
      yearsArray.push(i);
    }
    return yearsArray;
  };

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

  const handleGenerateAndDownload = async () => {
    if (!isValidDateRange) {
      toast.error("Invalid Date Range", {
        description: "Please select a valid date range for the report.",
      });
      return;
    }

    if (incomeEntries.length === 0 && expenseEntries.length === 0) {
      toast.error("No Data Available", {
        description: `No income or expense entries found for ${periodLabel}. Please add some data first.`,
      });
      return;
    }

    try {
      setIsGenerating(true);

      await generatePDF({
        incomeEntries,
        expenseEntries,
        totalIncome: stats.totalIncome,
        totalExpenses: stats.totalExpenses,
        netProfitLoss: stats.netProfitLoss,
        period: periodLabel,
        totalCash: stats.totalCash,
        totalBank: stats.totalBank,
        totalBalance: stats.totalBalance,
      });

      toast.success("PDF Downloaded Successfully", {
        description: `${periodLabel} report has been downloaded.`,
      });
    } catch (error: any) {
      console.error("PDF generation error:", error);
      toast.error("Generation Failed", {
        description:
          error.message || "Unable to generate PDF. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async (report: any) => {
    try {
      const pdfBytes = await report.blob.getBytes();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Report Downloaded", {
        description: `${report.title} has been downloaded.`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download Failed", {
        description: "Unable to download the report. Please try again.",
      });
    }
  };

  const getReportTypeBadge = (period: any) => {
    if (period.__kind__ === "monthly") {
      return <Badge variant="default">Monthly</Badge>;
    }
    if (period.__kind__ === "weekly") {
      return <Badge variant="secondary">Weekly</Badge>;
    }
    if (period.__kind__ === "daily") {
      return <Badge variant="outline">Daily</Badge>;
    }
    if (period.__kind__ === "yearly") {
      return <Badge>Yearly</Badge>;
    }
    return <Badge variant="outline">Custom</Badge>;
  };

  const isLoading = incomeLoading || expenseLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Reports & PDF Generation
          </h2>
          <p className="text-muted-foreground">
            Generate and download Profit & Loss reports in PDF format with INR
            currency
          </p>
        </div>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Report Period
          </CardTitle>
          <CardDescription>
            Choose the time period for your PDF report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type</Label>
            <Select
              value={reportType}
              onValueChange={(value) => setReportType(value as ReportType)}
            >
              <SelectTrigger id="report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Date Range</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === "custom" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="custom-start">Start Date</Label>
                <Input
                  id="custom-start"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-end">End Date</Label>
                <Input
                  id="custom-end"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {reportType === "daily" && (
            <div className="space-y-2">
              <Label htmlFor="daily-date">Select Date</Label>
              <Input
                id="daily-date"
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
              />
            </div>
          )}

          {reportType === "weekly" && (
            <div className="space-y-2">
              <Label htmlFor="week-start">Week Start Date (Monday)</Label>
              <Input
                id="week-start"
                type="date"
                value={weekStartDate}
                onChange={(e) => setWeekStartDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Report will cover 7 days starting from the selected date
              </p>
            </div>
          )}

          {reportType === "monthly" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="month-year">Year</Label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) =>
                    setSelectedYear(Number.parseInt(value))
                  }
                >
                  <SelectTrigger id="month-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableYears().map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="month-select">Month</Label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) =>
                    setSelectedMonth(Number.parseInt(value))
                  }
                >
                  <SelectTrigger id="month-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((month, index) => (
                      <SelectItem key={month} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {reportType === "yearly" && (
            <div className="space-y-2">
              <Label htmlFor="yearly-year">Select Year</Label>
              <Select
                value={yearlyYear.toString()}
                onValueChange={(value) => setYearlyYear(Number.parseInt(value))}
              >
                <SelectTrigger id="yearly-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableYears().map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isValidDateRange &&
            (isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm font-medium mb-2">
                    Selected Period: {periodLabel}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Data found:</strong> {incomeEntries.length} income
                    entries, {expenseEntries.length} expense entries
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-l-4 border-l-chart-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Income
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-chart-1" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(stats.totalIncome)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {periodLabel}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-chart-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Expenses
                      </CardTitle>
                      <TrendingDown className="h-4 w-4 text-chart-2" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(stats.totalExpenses)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {periodLabel}
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className={`border-l-4 ${stats.netProfitLoss >= 0 ? "border-l-chart-4" : "border-l-destructive"}`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Net Profit/Loss
                      </CardTitle>
                      <DollarSign
                        className={`h-4 w-4 ${stats.netProfitLoss >= 0 ? "text-chart-4" : "text-destructive"}`}
                      />
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`text-2xl font-bold ${stats.netProfitLoss >= 0 ? "text-chart-4" : "text-destructive"}`}
                      >
                        {formatCurrency(stats.netProfitLoss)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stats.netProfitLoss >= 0 ? "Profit" : "Loss"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Button
                  onClick={handleGenerateAndDownload}
                  disabled={
                    isGenerating ||
                    (incomeEntries.length === 0 && expenseEntries.length === 0)
                  }
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <FileDown className="mr-2 h-4 w-4" />
                      Generate & Download PDF Report
                    </>
                  )}
                </Button>
              </>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Automated Reports
          </CardTitle>
          <CardDescription>
            View and download automatically generated weekly and monthly reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : allReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No automated reports generated yet.</p>
              <p className="text-sm mt-2">
                Reports are automatically generated at the start of each week
                and month.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {report.title}
                      </TableCell>
                      <TableCell>{getReportTypeBadge(report.period)}</TableCell>
                      <TableCell>
                        {new Date(
                          Number(report.createdDate) / 1_000_000,
                        ).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadReport(report)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Automated Report Scheduler:</strong> Weekly reports are
          generated every Monday for the previous week. Monthly reports are
          generated on the 1st of each month for the previous month. All reports
          are stored automatically with INR currency formatting and can be
          downloaded anytime.
        </AlertDescription>
      </Alert>
    </div>
  );
}
