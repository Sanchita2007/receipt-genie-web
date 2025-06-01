// import { processWordTemplate, downloadWordReceipt } from './wordTemplateProcessor'; // This line is no longer needed here
import html2pdf from 'html2pdf.js';

export interface ReceiptStorageOptions {
  studentName: string;
  enrollmentNo: string;
  receiptData: any;
  storageLocation?: string; // This was never fully implemented for web, can be kept or removed
}

// This will store the uploaded template for processing
let uploadedTemplateFile: File | null = null;

export const setTemplate = (template: File | null) => {
  uploadedTemplateFile = template;
  if (template) {
    console.log('Template set in receiptStorage:', template.name);
  } else {
    console.log('Template cleared in receiptStorage.');
  }
};

export const getTemplate = (): File | null => {
  return uploadedTemplateFile;
};

// Generate HTML receipt (remains as fallback)
export const generateReceiptHTML = (context: any): string => {
  // ... (HTML generation code remains exactly the same as before)
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Fee Receipt - ${context.name}</title>
        <style>
            body { 
                font-family: 'Times New Roman', serif; 
                margin: 0; 
                padding: 20px; 
                background: white;
                color: black;
            }
            .receipt-container { 
                max-width: 800px; 
                margin: 0 auto; 
                border: 3px solid #000; 
                padding: 30px; 
                background: white;
            }
            .header { 
                text-align: center; 
                border-bottom: 3px double #000; 
                padding-bottom: 20px; 
                margin-bottom: 30px; 
            }
            .header h1 { 
                margin: 0; 
                font-size: 28px; 
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 2px;
            }
            .header h2 {
                margin: 10px 0;
                font-size: 16px;
                font-weight: normal;
            }
            .receipt-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                font-size: 14px;
            }
            .student-details {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            .student-details td {
                padding: 8px 12px;
                border: 1px solid #000;
                font-size: 14px;
            }
            .fee-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            .fee-table th, .fee-table td {
                padding: 10px;
                border: 1px solid #000;
                text-align: left;
                font-size: 14px;
            }
            .fee-table th {
                background-color: #f0f0f0;
                font-weight: bold;
                text-align: center;
            }
            .fee-table .amount {
                text-align: right;
            }
            .total-row {
                background-color: #e0e0e0;
                font-weight: bold;
                font-size: 16px;
            }
            .amount-words {
                margin: 20px 0;
                padding: 15px;
                border: 2px solid #000;
                background-color: #f8f8f8;
            }
            .payment-details {
                margin-top: 30px;
            }
            .signature-section {
                margin-top: 50px;
                display: flex;
                justify-content: space-between;
            }
            .signature-box {
                text-align: center;
                width: 200px;
            }
            .signature-line {
                border-top: 1px solid #000;
                margin-top: 60px;
                padding-top: 5px;
            }
        </style>
    </head>
    <body>
        <div class="receipt-container">
            <div class="header">
                <h1>Fee Receipt</h1>
                <h2>Academic Session 2024-25</h2>
            </div>
            
            <div class="receipt-info">
                <div><strong>Receipt No:</strong> ${context.receipt_no || 'N/A'}</div>
                <div><strong>Date:</strong> ${context.date || new Date().toLocaleDateString()}</div>
            </div>
            
            <table class="student-details">
                <tr>
                    <td><strong>Student Name:</strong></td>
                    <td>${context.name || 'N/A'}</td>
                    <td><strong>Course:</strong></td>
                    <td>${context.engineering || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>Category:</strong></td>
                    <td>${context.caste || 'N/A'}</td>
                    <td><strong>Enrollment No:</strong></td>
                    <td>ENR-${context.receipt_no || 'N/A'}</td>
                </tr>
            </table>
            
            <table class="fee-table">
                <thead>
                    <tr>
                        <th>Fee Description</th>
                        <th>Amount (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Tuition Fee</td>
                        <td class="amount">${context.Tuition_Fee || '0'}</td>
                    </tr>
                    <tr>
                        <td>Development Fee</td>
                        <td class="amount">${context.Development || '0'}</td>
                    </tr>
                    <tr>
                        <td>Examination Fee</td>
                        <td class="amount">${context.Board_Exam || '0'}</td>
                    </tr>
                    <tr>
                        <td>Enrollment Fee</td>
                        <td class="amount">${context.Enrollment_Fee || '0'}</td>
                    </tr>
                    <tr>
                        <td>Other Fees</td>
                        <td class="amount">${context.Others_fee || '0'}</td>
                    </tr>
                    <tr class="total-row">
                        <td><strong>Total Amount</strong></td>
                        <td class="amount"><strong>₹${context.TOTAL || '0'}</strong></td>
                    </tr>
                </tbody>
            </table>
            
            <div class="amount-words">
                <strong>Amount in Words:</strong> ${context.In_words || 'Zero Rupees Only'}
            </div>
            
            <div class="payment-details">
                <table class="student-details">
                    <tr>
                        <td><strong>Bank Name:</strong></td>
                        <td>${context.Bank_Name || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Pay Order No:</strong></td>
                        <td>${context.Pay_Order || 'N/A'}</td>
                    </tr>
                </table>
            </div>
            
            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-line">Student Signature</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line">Cashier Signature</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line">Authorized Signature</div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Function to download receipt as PDF generated from HTML (fallback)
export const downloadReceiptAsPDFFromHTML = async (options: ReceiptStorageOptions): Promise<void> => {
  const { studentName, enrollmentNo, receiptData } = options;
  const htmlContent = generateReceiptHTML(receiptData);
  
  const element = document.createElement('div');
  element.innerHTML = htmlContent; 

  const opt = {
    margin:       0.5,
    filename:     `Receipt_${studentName.replace(/\s+/g, '_')}_${enrollmentNo}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  try {
    await html2pdf().from(element).set(opt).save();
  } catch (error) {
    console.error("Error generating PDF from HTML:", error);
    throw new Error("Failed to generate PDF from HTML.");
  }
};


// downloadReceiptAsHTML can be kept if direct HTML file download is ever needed, or removed.
export const downloadReceiptAsHTML = (options: ReceiptStorageOptions) => {
  const { studentName, enrollmentNo, receiptData } = options;
  const htmlContent = generateReceiptHTML(receiptData);
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `Receipt_${studentName.replace(/\s+/g, '_')}_${enrollmentNo}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


export const selectStorageFolder = async (): Promise<string | null> => {
  return null; // Not applicable for web direct folder selection
};