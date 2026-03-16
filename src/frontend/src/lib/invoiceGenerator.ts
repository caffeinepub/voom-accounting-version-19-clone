import { PaymentMode } from "../backend";

interface InvoiceData {
  partyName: string;
  gstNumber: string;
  vehicleUsed: string;
  totalAmount: number;
  modeOfPayment: PaymentMode;
  distanceTraveled: number;
  ratePerKm: number;
}

export function generateInvoicePDF(data: InvoiceData): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const printWindow = window.open("", "_blank", "width=800,height=600");

      if (!printWindow) {
        reject(
          new Error(
            "Unable to open print window. Please allow pop-ups for this site and try again.",
          ),
        );
        return;
      }

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

      const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
      const invoiceDate = new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice - ${invoiceNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: A4 portrait;
              margin: 20mm;
            }
            
            @media print {
              body {
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .invoice-container {
                border: none;
                padding: 0;
              }
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 30px;
              color: #1f2937;
              line-height: 1.6;
              max-width: 210mm;
              margin: 0 auto;
            }
            
            .invoice-container {
              width: 100%;
              border: 2px solid #2563eb;
              border-radius: 10px;
              padding: 30px;
              background: white;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: start;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #2563eb;
            }
            
            .company-info {
              flex: 1;
            }
            
            .company-name {
              font-size: 28px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 5px;
            }
            
            .company-tagline {
              font-size: 13px;
              color: #6b7280;
            }
            
            .invoice-info {
              text-align: right;
            }
            
            .invoice-title {
              font-size: 22px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 8px;
            }
            
            .invoice-details {
              font-size: 12px;
              color: #6b7280;
              line-height: 1.8;
            }
            
            .section {
              margin-bottom: 25px;
            }
            
            .section-title {
              font-size: 15px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 10px;
              padding-bottom: 5px;
              border-bottom: 2px solid #e5e7eb;
            }
            
            .bill-to {
              background: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #2563eb;
            }
            
            .bill-to-name {
              font-size: 15px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 5px;
            }
            
            .bill-to-gst {
              font-size: 12px;
              color: #6b7280;
            }
            
            .details-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
            }
            
            .details-table tr {
              border-bottom: 1px solid #e5e7eb;
            }
            
            .details-table tr:last-child {
              border-bottom: none;
            }
            
            .details-table td {
              padding: 10px 12px;
              font-size: 13px;
            }
            
            .details-table td:first-child {
              font-weight: 500;
              color: #6b7280;
              width: 50%;
            }
            
            .details-table td:last-child {
              text-align: right;
              color: #1f2937;
            }
            
            .total-section {
              margin-top: 25px;
              padding: 18px;
              background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
              border-radius: 8px;
              color: white;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .total-label {
              font-size: 16px;
              font-weight: 600;
            }
            
            .total-amount {
              font-size: 24px;
              font-weight: bold;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 25px;
              border-top: 2px solid #e5e7eb;
            }
            
            .signature-section {
              display: flex;
              justify-content: space-between;
              align-items: end;
            }
            
            .signature-box {
              text-align: left;
            }
            
            .company-signature {
              font-size: 13px;
              font-weight: 600;
              color: #2563eb;
              margin-bottom: 40px;
            }
            
            .signature-line {
              width: 180px;
              border-top: 2px solid #1f2937;
              padding-top: 5px;
              font-size: 11px;
              color: #6b7280;
            }
            
            .footer-note {
              text-align: center;
              margin-top: 25px;
              font-size: 11px;
              color: #9ca3af;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="company-info">
                <div class="company-name">VOOM TRANSPORTS</div>
                <div class="company-tagline">Professional Transport Services</div>
              </div>
              <div class="invoice-info">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-details">
                  <div><strong>Invoice #:</strong> ${invoiceNumber}</div>
                  <div><strong>Date:</strong> ${invoiceDate}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Bill To</div>
              <div class="bill-to">
                <div class="bill-to-name">${data.partyName}</div>
                ${data.gstNumber ? `<div class="bill-to-gst">GST Number: ${data.gstNumber}</div>` : ""}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Service Details</div>
              <table class="details-table">
                <tbody>
                  <tr>
                    <td>Vehicle Used</td>
                    <td>${data.vehicleUsed}</td>
                  </tr>
                  <tr>
                    <td>Distance Traveled</td>
                    <td>${data.distanceTraveled.toLocaleString("en-IN")} km</td>
                  </tr>
                  <tr>
                    <td>Rate per Kilometer</td>
                    <td>${formatCurrency(data.ratePerKm)}</td>
                  </tr>
                  <tr>
                    <td>Mode of Payment</td>
                    <td>${getPaymentModeLabel(data.modeOfPayment)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="total-section">
              <div class="total-row">
                <div class="total-label">Total Amount</div>
                <div class="total-amount">${formatCurrency(data.totalAmount)}</div>
              </div>
            </div>

            <div class="footer">
              <div class="signature-section">
                <div class="signature-box">
                  <div class="company-signature">VOOM TRANSPORTS</div>
                  <div class="signature-line">Authorized Signature</div>
                </div>
              </div>
              
              <div class="footer-note">
                <p>Thank you for your business!</p>
                <p style="margin-top: 5px;">This is a computer-generated invoice.</p>
              </div>
            </div>
          </div>

          <script>
            // Wait for content to load
            window.addEventListener('load', function() {
              // Small delay to ensure everything is rendered
              setTimeout(function() {
                try {
                  window.print();
                } catch (_error) {
                  console.error('Print error:', error);
                  alert('Unable to print. Please use your browser\\'s print function (Ctrl+P or Cmd+P).');
                }
              }, 500);
            });

            // Handle after print
            window.addEventListener('afterprint', function() {
              window.close();
            });

            // Fallback: close window if user cancels print within 30 seconds
            setTimeout(function() {
              if (!window.closed) {
                var shouldClose = confirm('Print dialog closed. Would you like to close this window?');
                if (shouldClose) {
                  window.close();
                }
              }
            }, 30000);
          </script>
        </body>
        </html>
      `;

      try {
        printWindow.document.write(html);
        printWindow.document.close();

        // Set up error handler
        printWindow.onerror = (error) => {
          console.error("Print window error:", error);
          reject(new Error("Failed to generate invoice preview"));
        };

        // Resolve after a short delay to ensure window is set up
        setTimeout(() => {
          resolve();
        }, 300);
      } catch (_error) {
        printWindow.close();
        reject(new Error("Failed to generate invoice content"));
      }
    } catch (error) {
      console.error("Invoice generation error:", error);
      reject(
        error instanceof Error
          ? error
          : new Error("Failed to generate invoice"),
      );
    }
  });
}
