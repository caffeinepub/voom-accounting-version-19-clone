import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Edit,
  Filter,
  Plus,
  Scale,
  Smartphone,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { type IncomeEntry, PaymentMode } from "../backend";
import {
  useAddIncomeEntry,
  useGetIncomeEntries,
  useGetIncomePaymentModeTotals,
  useUpdateIncomeEntry,
} from "../hooks/useQueries";

const PAGE_SIZE = 25;

export default function IncomeView() {
  const { data: incomeEntries = [], isLoading } = useGetIncomeEntries();
  const { data: paymentModeTotals, isLoading: totalsLoading } =
    useGetIncomePaymentModeTotals();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<IncomeEntry | null>(null);
  const [filterPaymentMode, setFilterPaymentMode] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const handleAddSuccess = () => {
    setIsDialogOpen(false);
    toast.success("Income entry added successfully!");
  };

  const handleEditSuccess = () => {
    setIsDialogOpen(false);
    setEditingEntry(null);
    toast.success("Income entry updated successfully!");
  };

  const handleEdit = (entry: IncomeEntry) => {
    setEditingEntry(entry);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingEntry(null);
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPaymentModeLabel = (mode: PaymentMode): string => {
    const labels: Record<PaymentMode, string> = {
      [PaymentMode.cash]: "Cash",
      [PaymentMode.bank]: "Bank",
      [PaymentMode.balancePayment]: "Balance Payment",
      [PaymentMode.upi]: "UPI",
      [PaymentMode.cheque]: "Cheque",
    };
    return labels[mode] || mode;
  };

  // Filter and sort income entries
  const filteredIncomeEntries = useMemo(() => {
    let filtered = [...incomeEntries];

    if (filterPaymentMode !== "all") {
      filtered = filtered.filter((entry) => {
        if (filterPaymentMode === "cash")
          return entry.paymentMode === PaymentMode.cash;
        if (filterPaymentMode === "bank")
          return entry.paymentMode === PaymentMode.bank;
        if (filterPaymentMode === "balance")
          return entry.paymentMode === PaymentMode.balancePayment;
        if (filterPaymentMode === "other") {
          return (
            entry.paymentMode === PaymentMode.upi ||
            entry.paymentMode === PaymentMode.cheque
          );
        }
        return true;
      });
    }

    // Sort newest first
    filtered.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));

    return filtered;
  }, [incomeEntries, filterPaymentMode]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredIncomeEntries.length / PAGE_SIZE),
  );
  const pagedEntries = filteredIncomeEntries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const filteredTotal = useMemo(() => {
    return filteredIncomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  }, [filteredIncomeEntries]);

  if (isLoading || totalsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Income Management
          </h2>
          <p className="text-muted-foreground">
            Track and manage income from transport trips
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingEntry(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Income
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? "Edit Income Entry" : "Add Income Entry"}
              </DialogTitle>
              <DialogDescription>
                {editingEntry
                  ? "Update the income entry details below."
                  : "Enter the details of the trip income."}
              </DialogDescription>
            </DialogHeader>
            <IncomeForm
              entry={editingEntry}
              onSuccess={editingEntry ? handleEditSuccess : handleAddSuccess}
              onCancel={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-l-4 border-l-chart-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">
              {formatCurrency(paymentModeTotals?.totalIncome || 0)}
            </div>
            <p className="text-xs text-muted-foreground">All income entries</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Income</CardTitle>
            <Wallet className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">
              {formatCurrency(paymentModeTotals?.totalCash || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Cash payments</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bank Income</CardTitle>
            <CreditCard className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">
              {formatCurrency(paymentModeTotals?.totalBank || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Bank transfers</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Balance Payment
            </CardTitle>
            <Scale className="h-4 w-4 text-chart-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5">
              {formatCurrency(paymentModeTotals?.totalBalancePayment || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Balance payments</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">UPI & Cheque</CardTitle>
            <Smartphone className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              {formatCurrency(
                (paymentModeTotals?.totalUpi || 0) +
                  (paymentModeTotals?.totalCheque || 0),
              )}
            </div>
            <p className="text-xs text-muted-foreground">UPI + Cheque</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter by Payment Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="filterPaymentMode">Payment Mode</Label>
              <Select
                value={filterPaymentMode}
                onValueChange={(v) => {
                  setFilterPaymentMode(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger id="filterPaymentMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Modes</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="balance">Balance Payment</SelectItem>
                  <SelectItem value="other">Other (UPI & Cheque)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterPaymentMode !== "all" && (
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-muted px-4 py-2">
                  <p className="text-sm text-muted-foreground">
                    Filtered Total
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(filteredTotal)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterPaymentMode("all");
                    setCurrentPage(1);
                  }}
                >
                  Clear Filter
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income Entries</CardTitle>
          <CardDescription>
            {filterPaymentMode !== "all"
              ? `Showing ${filteredIncomeEntries.length} ${filterPaymentMode === "other" ? "UPI & Cheque" : filterPaymentMode} entries`
              : `All recorded income from transport trips (${incomeEntries.length} entries)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredIncomeEntries.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-center"
              data-ocid="income.empty_state"
            >
              <TrendingUp className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">
                {incomeEntries.length === 0
                  ? "No income entries yet"
                  : "No entries match the selected filter"}
              </p>
              <p className="text-sm text-muted-foreground">
                {incomeEntries.length === 0
                  ? "Add your first income entry to get started"
                  : "Try selecting a different payment mode filter"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead>Payment Details</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedEntries.map((entry) => (
                      <TableRow key={entry.bytes}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(
                            Number(entry.date / BigInt(1_000_000)),
                          ).toLocaleDateString("en-IN")}
                        </TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>{entry.fromDestination}</TableCell>
                        <TableCell>{entry.toDestination}</TableCell>
                        <TableCell>{entry.driver}</TableCell>
                        <TableCell>{entry.vehicle}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                            {getPaymentModeLabel(entry.paymentMode)}
                          </span>
                        </TableCell>
                        <TableCell
                          className="max-w-[200px] truncate"
                          title={entry.paymentDescription}
                        >
                          {entry.paymentDescription || "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(entry.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(entry)}
                            data-ocid="income.edit_button"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {filterPaymentMode === "all" && (
                    <TableFooter>
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-right font-semibold"
                        >
                          Total Cash Income:
                        </TableCell>
                        <TableCell className="text-right font-bold text-chart-3">
                          {formatCurrency(paymentModeTotals?.totalCash || 0)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-right font-semibold"
                        >
                          Total Bank Income:
                        </TableCell>
                        <TableCell className="text-right font-bold text-chart-4">
                          {formatCurrency(paymentModeTotals?.totalBank || 0)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-right font-semibold"
                        >
                          Total Balance Payment:
                        </TableCell>
                        <TableCell className="text-right font-bold text-chart-5">
                          {formatCurrency(
                            paymentModeTotals?.totalBalancePayment || 0,
                          )}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-right font-semibold"
                        >
                          Total UPI Income:
                        </TableCell>
                        <TableCell className="text-right font-bold text-purple-500">
                          {formatCurrency(paymentModeTotals?.totalUpi || 0)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-right font-semibold"
                        >
                          Total Cheque Income:
                        </TableCell>
                        <TableCell className="text-right font-bold text-amber-600">
                          {formatCurrency(paymentModeTotals?.totalCheque || 0)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={8} className="text-right font-bold">
                          Total Income:
                        </TableCell>
                        <TableCell className="text-right font-bold text-chart-1">
                          {formatCurrency(paymentModeTotals?.totalIncome || 0)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  )}
                  {filterPaymentMode !== "all" && (
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={8} className="text-right font-bold">
                          Filtered Total (
                          {filterPaymentMode === "other"
                            ? "UPI & Cheque"
                            : filterPaymentMode}
                          ):
                        </TableCell>
                        <TableCell className="text-right font-bold text-chart-1">
                          {formatCurrency(filteredTotal)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    data-ocid="income.pagination_prev"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    data-ocid="income.pagination_next"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function IncomeForm({
  entry,
  onSuccess,
  onCancel,
}: {
  entry: IncomeEntry | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const addIncome = useAddIncomeEntry();
  const updateIncome = useUpdateIncomeEntry();

  const [formData, setFormData] = useState({
    description: entry?.description || "",
    fromDestination: entry?.fromDestination || "",
    toDestination: entry?.toDestination || "",
    assignee: entry?.assignee || "",
    driver: entry?.driver || "",
    vehicle: entry?.vehicle || "",
    amount: entry?.amount.toString() || "",
    date: entry
      ? new Date(Number(entry.date / BigInt(1_000_000)))
          .toISOString()
          .split("T")[0]
      : new Date().toISOString().split("T")[0],
    paymentMode: entry?.paymentMode || PaymentMode.cash,
    paymentDescription: entry?.paymentDescription || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description || !formData.amount || !formData.date) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = Number.parseFloat(formData.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const dateTimestamp =
      BigInt(new Date(formData.date).getTime()) * BigInt(1_000_000);

    try {
      if (entry) {
        await updateIncome.mutateAsync({
          id: entry.bytes,
          description: formData.description,
          fromDestination: formData.fromDestination,
          toDestination: formData.toDestination,
          assignee: formData.assignee,
          driver: formData.driver,
          vehicle: formData.vehicle,
          amount,
          date: dateTimestamp,
          paymentMode: formData.paymentMode,
          paymentDescription: formData.paymentDescription,
        });
      } else {
        await addIncome.mutateAsync({
          description: formData.description,
          fromDestination: formData.fromDestination,
          toDestination: formData.toDestination,
          assignee: formData.assignee,
          driver: formData.driver,
          vehicle: formData.vehicle,
          amount,
          date: dateTimestamp,
          paymentMode: formData.paymentMode,
          paymentDescription: formData.paymentDescription,
        });
      }
      onSuccess();
    } catch (error) {
      toast.error("Failed to save income entry");
      console.error(error);
    }
  };

  const isPending = addIncome.isPending || updateIncome.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Trip Description *</Label>
          <Input
            id="description"
            placeholder="e.g., Airport pickup"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fromDestination">From Destination</Label>
          <Input
            id="fromDestination"
            placeholder="e.g., Downtown"
            value={formData.fromDestination}
            onChange={(e) =>
              setFormData({ ...formData, fromDestination: e.target.value })
            }
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toDestination">To Destination</Label>
          <Input
            id="toDestination"
            placeholder="e.g., Airport"
            value={formData.toDestination}
            onChange={(e) =>
              setFormData({ ...formData, toDestination: e.target.value })
            }
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignee">Assignee</Label>
          <Input
            id="assignee"
            placeholder="e.g., John Doe"
            value={formData.assignee}
            onChange={(e) =>
              setFormData({ ...formData, assignee: e.target.value })
            }
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="driver">Driver</Label>
          <Input
            id="driver"
            placeholder="e.g., Jane Smith"
            value={formData.driver}
            onChange={(e) =>
              setFormData({ ...formData, driver: e.target.value })
            }
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicle">Vehicle</Label>
          <Input
            id="vehicle"
            placeholder="e.g., Toyota Camry - ABC123"
            value={formData.vehicle}
            onChange={(e) =>
              setFormData({ ...formData, vehicle: e.target.value })
            }
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (₹) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentMode">Payment Mode *</Label>
          <Select
            value={formData.paymentMode}
            onValueChange={(value) =>
              setFormData({ ...formData, paymentMode: value as PaymentMode })
            }
            disabled={isPending}
          >
            <SelectTrigger id="paymentMode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PaymentMode.cash}>Cash</SelectItem>
              <SelectItem value={PaymentMode.bank}>Bank</SelectItem>
              <SelectItem value={PaymentMode.balancePayment}>
                Balance Payment
              </SelectItem>
              <SelectItem value={PaymentMode.upi}>UPI</SelectItem>
              <SelectItem value={PaymentMode.cheque}>Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="paymentDescription">Payment Description</Label>
          <Input
            id="paymentDescription"
            placeholder="e.g., Transaction ID, Check number, etc."
            value={formData.paymentDescription}
            onChange={(e) =>
              setFormData({ ...formData, paymentDescription: e.target.value })
            }
            disabled={isPending}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Saving...
            </>
          ) : entry ? (
            "Update"
          ) : (
            "Add Income"
          )}
        </Button>
      </div>
    </form>
  );
}
