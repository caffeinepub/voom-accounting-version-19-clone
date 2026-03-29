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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Filter,
  Plus,
  TrendingDown,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExpenseCategory, type ExpenseEntry, PaymentMode } from "../backend";
import {
  useAddExpenseEntry,
  useGetExpenseEntries,
  useUpdateExpenseEntry,
} from "../hooks/useQueries";

const PAGE_SIZE = 25;

export default function ExpenseView() {
  const { data: expenseEntries = [], isLoading } = useGetExpenseEntries();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ExpenseEntry | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleAddSuccess = () => {
    setIsDialogOpen(false);
    toast.success("Expense entry added successfully!");
  };

  const handleEditSuccess = () => {
    setIsDialogOpen(false);
    setEditingEntry(null);
    toast.success("Expense entry updated successfully!");
  };

  const handleEdit = (entry: ExpenseEntry) => {
    setEditingEntry(entry);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingEntry(null);
  };

  const filteredExpenses = useMemo(() => {
    let filtered = [...expenseEntries];

    if (filterCategory !== "all") {
      filtered = filtered.filter((entry) => entry.category === filterCategory);
    }

    if (filterDateFrom) {
      const fromTimestamp =
        BigInt(new Date(filterDateFrom).getTime()) * BigInt(1_000_000);
      filtered = filtered.filter((entry) => entry.date >= fromTimestamp);
    }

    if (filterDateTo) {
      const toTimestamp =
        BigInt(new Date(filterDateTo).getTime()) * BigInt(1_000_000);
      filtered = filtered.filter((entry) => entry.date <= toTimestamp);
    }

    // Sort newest first
    filtered.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));

    return filtered;
  }, [expenseEntries, filterCategory, filterDateFrom, filterDateTo]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredExpenses.length / PAGE_SIZE),
  );
  const pagedExpenses = filteredExpenses.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleFilterChange =
    (setter: (v: string) => void) => (value: string) => {
      setter(value);
      setCurrentPage(1);
    };

  const totalExpenses = filteredExpenses.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );

  const categoryTotal = useMemo(() => {
    if (filterCategory === "all") return null;
    return filteredExpenses.reduce((sum, entry) => sum + entry.amount, 0);
  }, [filteredExpenses, filterCategory]);

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getCategoryLabel = (category: ExpenseCategory): string => {
    const labels: Record<ExpenseCategory, string> = {
      [ExpenseCategory.salary]: "Salary",
      [ExpenseCategory.cngGas]: "CNG Gas",
      [ExpenseCategory.petrol]: "Petrol",
      [ExpenseCategory.diesel]: "Diesel",
      [ExpenseCategory.commissionVendor]: "Commission to Vendor",
      [ExpenseCategory.tollCharges]: "Toll Charges",
      [ExpenseCategory.parkingCharges]: "Parking Charges",
      [ExpenseCategory.fraud]: "Fraud",
      [ExpenseCategory.maintenanceAndRepair]: "Maintenance and Repair",
      [ExpenseCategory.otherExpenses]: "Other Expenses",
      [ExpenseCategory.purchase]: "Purchase",
    };
    return labels[category] || category;
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

  if (isLoading) {
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
            Expense Management
          </h2>
          <p className="text-muted-foreground">
            Track and manage business expenses
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingEntry(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? "Edit Expense Entry" : "Add Expense Entry"}
              </DialogTitle>
              <DialogDescription>
                {editingEntry
                  ? "Update the expense entry details below."
                  : "Enter the details of the expense."}
              </DialogDescription>
            </DialogHeader>
            <ExpenseForm
              entry={editingEntry}
              onSuccess={editingEntry ? handleEditSuccess : handleAddSuccess}
              onCancel={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-l-4 border-l-chart-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-chart-2" />
            Total Expenses
          </CardTitle>
          <CardDescription>
            Sum of{" "}
            {filterCategory !== "all" || filterDateFrom || filterDateTo
              ? "filtered"
              : "all"}{" "}
            expense entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-chart-2">
            {formatCurrency(totalExpenses)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="filterCategory">Category</Label>
              <Select
                value={filterCategory}
                onValueChange={handleFilterChange(setFilterCategory)}
              >
                <SelectTrigger id="filterCategory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value={ExpenseCategory.salary}>Salary</SelectItem>
                  <SelectItem value={ExpenseCategory.cngGas}>
                    CNG Gas
                  </SelectItem>
                  <SelectItem value={ExpenseCategory.petrol}>Petrol</SelectItem>
                  <SelectItem value={ExpenseCategory.diesel}>Diesel</SelectItem>
                  <SelectItem value={ExpenseCategory.commissionVendor}>
                    Commission to Vendor
                  </SelectItem>
                  <SelectItem value={ExpenseCategory.tollCharges}>
                    Toll Charges
                  </SelectItem>
                  <SelectItem value={ExpenseCategory.parkingCharges}>
                    Parking Charges
                  </SelectItem>
                  <SelectItem value={ExpenseCategory.fraud}>Fraud</SelectItem>
                  <SelectItem value={ExpenseCategory.maintenanceAndRepair}>
                    Maintenance and Repair
                  </SelectItem>
                  <SelectItem value={ExpenseCategory.otherExpenses}>
                    Other Expenses
                  </SelectItem>
                  <SelectItem value={ExpenseCategory.purchase}>
                    Purchase
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterDateFrom">From Date</Label>
              <Input
                id="filterDateFrom"
                type="date"
                value={filterDateFrom}
                onChange={(e) => {
                  setFilterDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterDateTo">To Date</Label>
              <Input
                id="filterDateTo"
                type="date"
                value={filterDateTo}
                onChange={(e) => {
                  setFilterDateTo(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {categoryTotal !== null && (
            <div className="mt-4 rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                Total for {getCategoryLabel(filterCategory as ExpenseCategory)}
              </p>
              <p className="text-2xl font-bold text-chart-2">
                {formatCurrency(categoryTotal)}
              </p>
            </div>
          )}

          {(filterCategory !== "all" || filterDateFrom || filterDateTo) && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setFilterCategory("all");
                setFilterDateFrom("");
                setFilterDateTo("");
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expense Entries</CardTitle>
          <CardDescription>
            {filteredExpenses.length}{" "}
            {filteredExpenses.length === 1 ? "entry" : "entries"} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-center"
              data-ocid="expense.empty_state"
            >
              <TrendingDown className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No expense entries found</p>
              <p className="text-sm text-muted-foreground">
                {expenseEntries.length === 0
                  ? "Add your first expense entry to get started"
                  : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead>Payment Details</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedExpenses.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(
                            Number(entry.date / BigInt(1_000_000)),
                          ).toLocaleDateString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                            {getCategoryLabel(entry.category)}
                          </span>
                        </TableCell>
                        <TableCell>{entry.description}</TableCell>
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
                            data-ocid="expense.edit_button"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    data-ocid="expense.pagination_prev"
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
                    data-ocid="expense.pagination_next"
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

function ExpenseForm({
  entry,
  onSuccess,
  onCancel,
}: {
  entry: ExpenseEntry | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const addExpense = useAddExpenseEntry();
  const updateExpense = useUpdateExpenseEntry();

  const [formData, setFormData] = useState({
    category: entry?.category || ExpenseCategory.salary,
    description: entry?.description || "",
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

    if (
      !formData.category ||
      !formData.description ||
      !formData.amount ||
      !formData.date
    ) {
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
        await updateExpense.mutateAsync({
          id: entry.id,
          category: formData.category,
          description: formData.description,
          amount,
          date: dateTimestamp,
          paymentMode: formData.paymentMode,
          paymentDescription: formData.paymentDescription,
        });
      } else {
        await addExpense.mutateAsync({
          category: formData.category,
          description: formData.description,
          amount,
          date: dateTimestamp,
          paymentMode: formData.paymentMode,
          paymentDescription: formData.paymentDescription,
        });
      }
      onSuccess();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to save expense entry: ${msg}`);
      console.error(error);
    }
  };

  const isPending = addExpense.isPending || updateExpense.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) =>
            setFormData({ ...formData, category: value as ExpenseCategory })
          }
          disabled={isPending}
        >
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ExpenseCategory.salary}>Salary</SelectItem>
            <SelectItem value={ExpenseCategory.cngGas}>CNG Gas</SelectItem>
            <SelectItem value={ExpenseCategory.petrol}>Petrol</SelectItem>
            <SelectItem value={ExpenseCategory.diesel}>Diesel</SelectItem>
            <SelectItem value={ExpenseCategory.commissionVendor}>
              Commission to Vendor
            </SelectItem>
            <SelectItem value={ExpenseCategory.tollCharges}>
              Toll Charges
            </SelectItem>
            <SelectItem value={ExpenseCategory.parkingCharges}>
              Parking Charges
            </SelectItem>
            <SelectItem value={ExpenseCategory.fraud}>Fraud</SelectItem>
            <SelectItem value={ExpenseCategory.maintenanceAndRepair}>
              Maintenance and Repair
            </SelectItem>
            <SelectItem value={ExpenseCategory.otherExpenses}>
              Other Expenses
            </SelectItem>
            <SelectItem value={ExpenseCategory.purchase}>Purchase</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Input
          id="description"
          placeholder="e.g., Monthly salary for driver"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
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
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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

      <div className="space-y-2">
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

      <div className="space-y-2">
        <Label htmlFor="date">Date *</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          disabled={isPending}
        />
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
            "Add Expense"
          )}
        </Button>
      </div>
    </form>
  );
}
