
export interface ReceiptStorageOptions {
  studentName: string;
  enrollmentNo: string;
  receiptData: any;
  storageLocation?: string;
}

export const generateReceiptHTML = (context: any): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Fee Receipt - ${context.name}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .receipt-container { max-width: 800px; margin: 0 auto; border: 2px solid #000; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; }
            .receipt-details { margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px 0; border-bottom: 1px solid #ccc; }
            .total-row { background-color: #f0f0f0; font-weight: bold; padding: 10px; margin-top: 15px; }
        </style>
    </head>
    <body>
        <div class="receipt-container">
            <div class="header">
                <h1>FEE RECEIPT</h1>
                <p>Receipt No: ${context.receipt_no} | Date: ${context.date}</p>
            </div>
            
            <div class="receipt-details">
                <div class="detail-row">
                    <span>Student Name:</span>
                    <span>${context.name}</span>
                </div>
                <div class="detail-row">
                    <span>Course:</span>
                    <span>${context.engineering}</span>
                </div>
                <div class="detail-row">
                    <span>Category:</span>
                    <span>${context.caste}</span>
                </div>
                <div class="detail-row">
                    <span>Tuition Fee:</span>
                    <span>₹${context.Tuition_Fee}</span>
                </div>
                <div class="detail-row">
                    <span>Development Fee:</span>
                    <span>₹${context.Development}</span>
                </div>
                <div class="detail-row">
                    <span>Exam Fee:</span>
                    <span>₹${context.Board_Exam}</span>
                </div>
                <div class="detail-row">
                    <span>Enrollment Fee:</span>
                    <span>₹${context.Enrollment_Fee}</span>
                </div>
                <div class="detail-row">
                    <span>Other Fee:</span>
                    <span>₹${context.Others_fee}</span>
                </div>
                <div class="total-row">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Total Amount:</span>
                        <span>₹${context.TOTAL}</span>
                    </div>
                </div>
                <div class="detail-row">
                    <span>Amount in Words:</span>
                    <span>${context.In_words}</span>
                </div>
                <div class="detail-row">
                    <span>Bank Name:</span>
                    <span>${context.Bank_Name}</span>
                </div>
                <div class="detail-row">
                    <span>Pay Order No:</span>
                    <span>${context.Pay_Order}</span>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

export const downloadReceiptAsHTML = (options: ReceiptStorageOptions) => {
  const { studentName, enrollmentNo, receiptData } = options;
  const htmlContent = generateReceiptHTML(receiptData);
  
  // Create a blob with the HTML content
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  // Create download link
  const link = document.createElement('a');
  link.href = url;
  link.download = `Receipt_${studentName.replace(/\s+/g, '_')}_${enrollmentNo}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
};

export const selectStorageFolder = async (): Promise<string | null> => {
  // For web applications, we can't directly select folders
  // We'll provide a download option instead
  return null;
};
