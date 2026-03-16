import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { AlertCircle, Download, Eye, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PaymentMode } from "../backend";
import { generateInvoicePDF } from "../lib/invoiceGenerator";

interface BillingFormData {
  partyName: string;
  gstNumber: string;
  vehicleUsed: string;
  totalAmount: number;
  modeOfPayment: PaymentMode;
  distanceTraveled: number;
  ratePerKm: number;
}

export default function BillingView() {
  const [formData, setFormData] = useState<BillingFormData>({
    partyName: "",
    gstNumber: "",
    vehicleUsed: "",
    totalAmount: 0,
    modeOfPayment: PaymentMode.cash,
    distanceTraveled: 0,
    ratePerKm: 0,
  });

  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Automatically calculate total amount when distance or rate changes
  useEffect(() => {
    if (formData.distanceTraveled > 0 && formData.ratePerKm > 0) {
      const calculatedTotal = formData.distanceTraveled * formData.ratePerKm;
      setFormData((prev) => ({ ...prev, totalAmount: calculatedTotal }));
    }
  }, [formData.distanceTraveled, formData.ratePerKm]);

  const handleInputChange = (
    field: keyof BillingFormData,
    value: string | number | PaymentMode,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreview = () => {
    if (
      !formData.partyName ||
      !formData.vehicleUsed ||
      formData.totalAmount <= 0
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    setShowPreview(true);
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      await generateInvoicePDF(formData);
      toast.success("Invoice PDF generated successfully!");
      setShowPreview(false);
      // Reset form
      setFormData({
        partyName: "",
        gstNumber: "",
        vehicleUsed: "",
        totalAmount: 0,
        modeOfPayment: PaymentMode.cash,
        distanceTraveled: 0,
        ratePerKm: 0,
      });
    } catch (error: any) {
      console.error("Invoice generation error:", error);
      const errorMessage =
        error.message || "Unable to generate invoice. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPaymentModeLabel = (mode: PaymentMode): string => {
    const labels: Record<PaymentMode, string> = {
      [PaymentMode.cash]: "Cash",
      [PaymentMode.bank]: "Bank Transfer",
      [PaymentMode.balancePayment]: "Balance Payment",
      [PaymentMode.upi]: "UPI",
      [PaymentMode.cheque]: "Cheque",
    };
    return labels[mode] || mode;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Billing & Invoices
          </h2>
          <p className="text-muted-foreground">
            Generate professional invoices for VOOM TRANSPORTS
          </p>
        </div>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create New Invoice
          </CardTitle>
          <CardDescription>
            Fill in the details to generate a professional invoice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="partyName">
                Name of Party <span className="text-destructive">*</span>
              </Label>
              <Input
                id="partyName"
                placeholder="Enter party name"
                value={formData.partyName}
                onChange={(e) => handleInputChange("partyName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstNumber">GST Number (Optional)</Label>
              <Input
                id="gstNumber"
                placeholder="Enter GST number"
                value={formData.gstNumber}
                onChange={(e) => handleInputChange("gstNumber", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleUsed">
                Vehicle Used <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vehicleUsed"
                placeholder="e.g., Toyota Innova, DL-01-AB-1234"
                value={formData.vehicleUsed}
                onChange={(e) =>
                  handleInputChange("vehicleUsed", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modeOfPayment">Mode of Payment</Label>
              <Select
                value={formData.modeOfPayment}
                onValueChange={(value) =>
                  handleInputChange("modeOfPayment", value as PaymentMode)
                }
              >
                <SelectTrigger id="modeOfPayment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentMode.cash}>Cash</SelectItem>
                  <SelectItem value={PaymentMode.bank}>
                    Bank Transfer
                  </SelectItem>
                  <SelectItem value={PaymentMode.balancePayment}>
                    Balance Payment
                  </SelectItem>
                  <SelectItem value={PaymentMode.upi}>UPI</SelectItem>
                  <SelectItem value={PaymentMode.cheque}>Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="distanceTraveled">Distance Traveled (km)</Label>
              <Input
                id="distanceTraveled"
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={formData.distanceTraveled || ""}
                onChange={(e) =>
                  handleInputChange(
                    "distanceTraveled",
                    Number.parseFloat(e.target.value) || 0,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ratePerKm">Rate per Kilometer (₹)</Label>
              <Input
                id="ratePerKm"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.ratePerKm || ""}
                onChange={(e) =>
                  handleInputChange(
                    "ratePerKm",
                    Number.parseFloat(e.target.value) || 0,
                  )
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="totalAmount">
                Total Amount (₹) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="totalAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.totalAmount || ""}
                onChange={(e) =>
                  handleInputChange(
                    "totalAmount",
                    Number.parseFloat(e.target.value) || 0,
                  )
                }
                className="text-lg font-semibold"
              />
              {formData.distanceTraveled > 0 && formData.ratePerKm > 0 && (
                <p className="text-sm text-muted-foreground">
                  Calculated: {formData.distanceTraveled} km ×{" "}
                  {formatCurrency(formData.ratePerKm)} ={" "}
                  {formatCurrency(
                    formData.distanceTraveled * formData.ratePerKm,
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button onClick={handlePreview} className="w-full sm:w-auto">
              <Eye className="mr-2 h-4 w-4" />
              Preview Invoice
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> If you experience issues viewing invoices,
          please ensure pop-ups are enabled for this site. The invoice will open
          in a new window where you can print or save it.
        </AlertDescription>
      </Alert>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>
              Review the invoice before generating the PDF
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 rounded-lg border bg-card p-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <h3 className="text-2xl font-bold text-primary">
                  VOOM TRANSPORTS
                </h3>
                <p className="text-sm text-muted-foreground">
                  Transport Services
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">INVOICE</p>
                <p className="text-xs text-muted-foreground">
                  Date: {new Date().toLocaleDateString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Invoice #: INV-{Date.now().toString().slice(-8)}
                </p>
              </div>
            </div>

            {/* Bill To */}
            <div className="space-y-2">
              <h4 className="font-semibold">Bill To:</h4>
              <p className="text-sm">{formData.partyName}</p>
              {formData.gstNumber && (
                <p className="text-sm text-muted-foreground">
                  GST: {formData.gstNumber}
                </p>
              )}
            </div>

            {/* Details Table */}
            <div className="space-y-3">
              <h4 className="font-semibold">Service Details:</h4>
              <div className="rounded-lg border">
                <table className="w-full">
                  <tbody className="divide-y">
                    <tr>
                      <td className="p-3 text-sm font-medium">Vehicle Used</td>
                      <td className="p-3 text-sm text-right">
                        {formData.vehicleUsed}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-sm font-medium">
                        Distance Traveled
                      </td>
                      <td className="p-3 text-sm text-right">
                        {formData.distanceTraveled} km
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-sm font-medium">
                        Rate per Kilometer
                      </td>
                      <td className="p-3 text-sm text-right">
                        {formatCurrency(formData.ratePerKm)}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-sm font-medium">
                        Mode of Payment
                      </td>
                      <td className="p-3 text-sm text-right">
                        {getPaymentModeLabel(formData.modeOfPayment)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-end border-t pt-4">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-primary">
                    {formatCurrency(formData.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-semibold">VOOM TRANSPORTS</p>
                  <div className="mt-8 border-t border-muted-foreground/30 pt-1">
                    <p className="text-xs text-muted-foreground">
                      Authorized Signature
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button onClick={handleDownloadPDF} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate PDF
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
