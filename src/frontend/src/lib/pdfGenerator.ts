import type { ExpenseEntry, IncomeEntry, PaymentMode } from "../backend";

interface PDFData {
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  totalIncome: number;
  totalExpenses: number;
  netProfitLoss: number;
  period: string;
  totalCash: number;
  totalBank: number;
  totalBalance: number;
}

// Load external libraries
async function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(script);
  });
}

async function loadPDFLibraries(): Promise<void> {
  if (
    typeof (window as any).html2canvas !== "undefined" &&
    typeof (window as any).jspdf !== "undefined"
  ) {
    return;
  }

  await Promise.all([
    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
    ),
    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    ),
  ]);

  await new Promise((resolve) => setTimeout(resolve, 100));
}

export async function generatePDF(data: PDFData): Promise<void> {
  let container: HTMLElement | null = null;

  try {
    const {
      incomeEntries,
      expenseEntries,
      totalIncome,
      totalExpenses,
      netProfitLoss,
      period,
      totalCash,
      totalBank,
      totalBalance,
    } = data;

    if (incomeEntries.length === 0 && expenseEntries.length === 0) {
      throw new Error("No data available to generate PDF");
    }

    await loadPDFLibraries();

    const formatCurrency = (amount: number): string => {
      return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (timestamp: bigint): string => {
      return new Date(Number(timestamp / BigInt(1_000_000))).toLocaleDateString(
        "en-IN",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        },
      );
    };

    const getCategoryLabel = (category: any): string => {
      const labels: Record<string, string> = {
        salary: "Salary",
        cngGas: "CNG Gas",
        petrol: "Petrol",
        diesel: "Diesel",
        commissionVendor: "Commission to Vendor",
        tollCharges: "Toll Charges",
        parkingCharges: "Parking Charges",
      };
      return labels[category] || category;
    };

    const getPaymentModeLabel = (mode: PaymentMode): string => {
      const labels: Record<PaymentMode, string> = {
        cash: "Cash",
        bank: "Bank",
        balancePayment: "Balance Payment",
        upi: "UPI",
        cheque: "Cheque",
      };
      return labels[mode] || mode;
    };

    const totalUpi = incomeEntries
      .filter((e) => e.paymentMode === "upi")
      .reduce((sum, e) => sum + e.amount, 0);
    const totalCheque = incomeEntries
      .filter((e) => e.paymentMode === "cheque")
      .reduce((sum, e) => sum + e.amount, 0);

    container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "210mm";
    container.style.padding = "20mm";
    container.style.backgroundColor = "#ffffff";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.fontSize = "10pt";
    container.style.color = "#000000";

    container.innerHTML = `
      <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #2563eb;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="margin: 0; font-size: 24pt; color: #2563eb;">Voom Accounting</h1>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16pt; font-weight: bold; margin-bottom: 5px; color: #000000;">Profit & Loss Report</div>
            <div style="font-size: 10pt; color: #000000;">Period: ${period}</div>
            <div style="font-size: 9pt; color: #000000;">Generated: ${new Date().toLocaleDateString(
              "en-IN",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              },
            )}</div>
          </div>
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <div style="font-size: 12pt; font-weight: 600; margin-bottom: 10px;">Financial Summary</div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
          <div style="text-align: center;">
            <div style="font-size: 9pt; opacity: 0.9; margin-bottom: 5px;">TOTAL INCOME</div>
            <div style="font-size: 18pt; font-weight: bold;">${formatCurrency(totalIncome)}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 9pt; opacity: 0.9; margin-bottom: 5px;">TOTAL EXPENSES</div>
            <div style="font-size: 18pt; font-weight: bold;">${formatCurrency(totalExpenses)}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 9pt; opacity: 0.9; margin-bottom: 5px;">NET ${netProfitLoss >= 0 ? "PROFIT" : "LOSS"}</div>
            <div style="font-size: 18pt; font-weight: bold;">${formatCurrency(Math.abs(netProfitLoss))}</div>
          </div>
        </div>
      </div>

      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
        <div style="font-size: 12pt; font-weight: bold; margin-bottom: 10px; color: #000000;">Income Summary by Payment Mode</div>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;">
          <div style="background: #ffffff; padding: 10px; border-radius: 6px; text-align: center;">
            <div style="font-size: 8pt; color: #000000; margin-bottom: 3px;">Cash</div>
            <div style="font-size: 11pt; font-weight: bold; color: #000000;">${formatCurrency(totalCash)}</div>
          </div>
          <div style="background: #ffffff; padding: 10px; border-radius: 6px; text-align: center;">
            <div style="font-size: 8pt; color: #000000; margin-bottom: 3px;">Bank</div>
            <div style="font-size: 11pt; font-weight: bold; color: #000000;">${formatCurrency(totalBank)}</div>
          </div>
          <div style="background: #ffffff; padding: 10px; border-radius: 6px; text-align: center;">
            <div style="font-size: 8pt; color: #000000; margin-bottom: 3px;">Balance</div>
            <div style="font-size: 11pt; font-weight: bold; color: #000000;">${formatCurrency(totalBalance)}</div>
          </div>
          <div style="background: #ffffff; padding: 10px; border-radius: 6px; text-align: center;">
            <div style="font-size: 8pt; color: #000000; margin-bottom: 3px;">UPI</div>
            <div style="font-size: 11pt; font-weight: bold; color: #000000;">${formatCurrency(totalUpi)}</div>
          </div>
          <div style="background: #ffffff; padding: 10px; border-radius: 6px; text-align: center;">
            <div style="font-size: 8pt; color: #000000; margin-bottom: 3px;">Cheque</div>
            <div style="font-size: 11pt; font-weight: bold; color: #000000;">${formatCurrency(totalCheque)}</div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 25px;">
        <div style="background: #f3f4f6; padding: 10px; border-left: 4px solid #10b981; margin-bottom: 10px; font-size: 13pt; font-weight: bold; color: #000000;">
          Income Entries
        </div>
        ${
          incomeEntries.length > 0
            ? `
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
            <thead style="background: #2563eb; color: #ffffff;">
              <tr>
                <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold;">Date</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold;">Description</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold;">From</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold;">To</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold;">Driver</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold;">Vehicle</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold;">Payment</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb; font-weight: bold;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${incomeEntries
                .map(
                  (entry) => `
                <tr>
                  <td style="padding: 6px; border: 1px solid #e5e7eb; color: #000000;">${formatDate(entry.date)}</td>
                  <td style="padding: 6px; border: 1px solid #e5e7eb; color: #000000;">${entry.description}</td>
                  <td style="padding: 6px; border: 1px solid #e5e7eb; color: #000000;">${entry.fromDestination || "-"}</td>
                  <td style="padding: 6px; border: 1px solid #e5e7eb; color: #000000;">${entry.toDestination || "-"}</td>
                  <td style="padding: 6px; border: 1px solid #e5e7eb; color: #000000;">${entry.driver || "-"}</td>
                  <td style="padding: 6px; border: 1px solid #e5e7eb; color: #000000;">${entry.vehicle || "-"}</td>
                  <td style="padding: 6px; border: 1px solid #e5e7eb; color: #000000;">${getPaymentModeLabel(entry.paymentMode)}</td>
                  <td style="padding: 6px; border: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #000000;">${formatCurrency(entry.amount)}</td>
                </tr>
              `,
                )
                .join("")}
              <tr style="background: #f9fafb; font-weight: bold;">
                <td colspan="7" style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; color: #000000;">Total Income:</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; color: #000000; font-weight: bold;">${formatCurrency(totalIncome)}</td>
              </tr>
            </tbody>
          </table>
        `
            : '<div style="text-align: center; padding: 20px; color: #000000; font-style: italic;">No income entries for this period</div>'
        }
      </div>

      <div style="margin-bottom: 25px;">
        <div style="background: #f3f4f6; padding: 10px; border-left: 4px solid #ef4444; margin-bottom: 10px; font-size: 13pt; font-weight: bold; color: #000000;">
          Expense Entries
        </div>
        ${
          expenseEntries.length > 0
            ? `
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
            <thead style="background: #2563eb; color: #ffffff;">
              <tr>
                <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold;">Date</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold;">Category</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold;">Description</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold;">Payment Mode</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb; font-weight: bold;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${expenseEntries
                .map(
                  (entry) => `
                <tr>
                  <td style="padding: 6px; border: 1px solid #e5e7eb; color: #000000;">${formatDate(entry.date)}</td>
                  <td style="padding: 6px; border: 1px solid #e5e7eb; color: #000000;">${getCategoryLabel(entry.category)}</td>
                  <td style="padding: 6px; border: 1px solid #e5e7eb; color: #000000;">${entry.description}</td>
                  <td style="padding: 6px; border: 1px solid #e5e7eb; color: #000000;">${getPaymentModeLabel(entry.paymentMode)}</td>
                  <td style="padding: 6px; border: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #000000;">${formatCurrency(entry.amount)}</td>
                </tr>
              `,
                )
                .join("")}
              <tr style="background: #f9fafb; font-weight: bold;">
                <td colspan="4" style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; color: #000000;">Total Expenses:</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; color: #000000; font-weight: bold;">${formatCurrency(totalExpenses)}</td>
              </tr>
            </tbody>
          </table>
        `
            : '<div style="text-align: center; padding: 20px; color: #000000; font-style: italic;">No expense entries for this period</div>'
        }
      </div>

      <div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #e5e7eb; text-align: center; color: #000000; font-size: 8pt;">
        <p style="margin: 5px 0;">All amounts displayed in Indian Rupees (INR)</p>
        <p style="margin: 5px 0;">© 2026 Voom Accounting. Built with caffeine.ai</p>
      </div>
    `;

    document.body.appendChild(container);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const html2canvas = (window as any).html2canvas;
    const { jsPDF } = (window as any).jspdf;

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const filename = `Voom_PL_Report_${period.replace(/\s+/g, "_")}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error("Failed to generate PDF. Please try again.");
  } finally {
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
