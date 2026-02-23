import type { Order, Invoice } from "@shared/schema";

/**
 * Generate a professional PDF invoice as HTML string for client-side rendering
 * Uses HTML that can be printed to PDF via browser's print functionality
 */
export function generateInvoiceHTML(invoice: Invoice, order: Order | undefined, orderItems: Array<{ name: string; quantity: number; price: number }> = []): string {
  const issuedDate = invoice.createdAt ? new Date(invoice.createdAt) : new Date();
  const dueDate = new Date(issuedDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days later
  const subtotal = invoice.totalAmount - invoice.gstAmount;

  const itemsTotal = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${invoice.invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 900px;
            margin: 20px auto;
            background-color: white;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-radius: 8px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
        }
        
        .company-info h1 {
            color: #2563eb;
            font-size: 28px;
            margin-bottom: 5px;
        }
        
        .company-info p {
            color: #666;
            font-size: 13px;
            line-height: 1.6;
        }
        
        .invoice-details {
            text-align: right;
            font-size: 13px;
        }
        
        .invoice-details .label {
            color: #666;
            font-weight: 600;
        }
        
        .invoice-details .value {
            color: #333;
            font-weight: 700;
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 12px;
            margin-top: 10px;
        }
        
        .status-issued {
            background-color: #d1fae5;
            color: #065f46;
        }
        
        .status-pending {
            background-color: #fef3c7;
            color: #92400e;
        }
        
        .status-paid {
            background-color: #dcfce7;
            color: #166534;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section.bill-ship {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }
        
        .section-title {
            font-weight: 700;
            font-size: 13px;
            color: #333;
            text-transform: uppercase;
            margin-bottom: 12px;
            letter-spacing: 1px;
        }
        
        .section-content {
            font-size: 13px;
            line-height: 1.8;
            color: #555;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        thead {
            background-color: #f0f9ff;
            border-bottom: 2px solid #2563eb;
        }
        
        th {
            padding: 12px;
            text-align: left;
            font-weight: 700;
            font-size: 12px;
            color: #1e40af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        td {
            padding: 12px;
            font-size: 13px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        tr:last-child td {
            border-bottom: none;
        }
        
        .text-right {
            text-align: right;
        }
        
        .amount-column {
            width: 15%;
            text-align: right;
        }
        
        .qty-column {
            width: 10%;
            text-align: center;
        }
        
        .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 30px;
            margin-bottom: 40px;
        }
        
        .totals-box {
            width: 300px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 13px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .total-row.total-final {
            border-top: 2px solid #2563eb;
            border-bottom: 2px solid #2563eb;
            font-size: 16px;
            font-weight: 700;
            padding: 15px 0;
            color: #1e40af;
            background-color: #f0f9ff;
            padding-left: 10px;
            padding-right: 10px;
        }
        
        .total-label {
            font-weight: 600;
            color: #333;
        }
        
        .total-value {
            font-weight: 700;
            color: #1e40af;
        }
        
        .notes-disclaimer {
            margin-top: 40px;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 6px;
            font-size: 12px;
            color: #666;
            line-height: 1.6;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #999;
        }
        
        @media print {
            body {
                background-color: white;
            }
            
            .container {
                box-shadow: none;
                margin: 0;
                padding: 20px;
            }
            
            .no-print {
                display: none;
            }
        }
        
        .print-button {
            display: none;
            padding: 10px 20px;
            background-color: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        
        @media print {
            .print-button {
                display: none !important;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <button class="print-button no-print" onclick="window.print(); return false;">Print / Save as PDF</button>
        
        <div class="header">
            <div class="company-info">
                <h1>📱 BIZORA</h1>
                <p>Contact: +91 98765 43210<br>
                Email: business@bizora.in<br>
                Address: Mumbai, India</p>
            </div>
            <div class="invoice-details">
                <div class="label">INVOICE</div>
                <div class="value">${invoice.invoiceNumber}</div>
                <div class="label" style="margin-top: 10px;">Reference</div>
                <div class="value">Order #${invoice.orderId}</div>
                <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span>
            </div>
        </div>
        
        <div class="section bill-ship">
            <div>
                <div class="section-title">Billing Details</div>
                <div class="section-content">
                    <p><strong>Invoice Date</strong><br>${issuedDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p><strong>Due Date</strong><br>${dueDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>
            <div>
                <div class="section-title">Payment Status</div>
                <div class="section-content">
                    <p><strong>Status</strong><br>${invoice.status === 'paid' ? '✓ Payment Received' : invoice.status === 'issued' ? '⏳ Awaiting Payment' : ' Payment Pending'}</p>
                    <p><strong>Total Amount Due</strong><br><span style="font-size: 18px; font-weight: 700; color: #2563eb;">₹${(invoice.totalAmount / 100).toFixed(2)}</span></p>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title" style="margin-bottom: 15px;">Order Items</div>
            <table>
                <thead>
                    <tr>
                        <th>Item Description</th>
                        <th class="qty-column">Quantity</th>
                        <th class="amount-column">Unit Price</th>
                        <th class="amount-column">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${orderItems.map(item => `
                    <tr>
                        <td>${item.name.charAt(0).toUpperCase() + item.name.slice(1)}</td>
                        <td class="qty-column">${item.quantity}</td>
                        <td class="amount-column">₹${(item.price / 100).toFixed(2)}</td>
                        <td class="amount-column">₹${((item.quantity * item.price) / 100).toFixed(2)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="totals-section">
            <div class="totals-box">
                <div class="total-row">
                    <span class="total-label">Subtotal:</span>
                    <span class="total-value">₹${(subtotal / 100).toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span class="total-label">GST (18%):</span>
                    <span class="total-value">₹${(invoice.gstAmount / 100).toFixed(2)}</span>
                </div>
                <div class="total-row total-final">
                    <span class="total-label">TOTAL AMOUNT:</span>
                    <span class="total-value">₹${(invoice.totalAmount / 100).toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <div class="notes-disclaimer">
            <p><strong>Thank you for your business!</strong></p>
            <p style="margin-top: 10px;">This is a computer-generated invoice. No signature required. Payment should be made against this invoice within 30 days of invoice date.</p>
            <p style="margin-top: 10px;"><strong>Bank Details:</strong> Please contact for payment details.</p>
            <p style="margin-top: 10px; color: #999;"><em>For queries, contact us at +91 98765 43210 or business@bizora.in</em></p>
        </div>
        
        <div class="footer">
            <p>Generated on ${issuedDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p>© 2026 BIZORA. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
}
