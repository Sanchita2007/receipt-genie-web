
interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

export const sendReceiptEmail = async (
  email: string, 
  studentName: string, 
  receiptContext: any
): Promise<boolean> => {
  try {
    console.log(`Sending receipt email to ${email} for ${studentName}`);
    
    // Create email template
    const emailTemplate: EmailTemplate = {
      to: email,
      subject: `Fee Receipt - ${studentName}`,
      html: generateEmailHTML(studentName, receiptContext)
    };

    // In a real implementation, you would send this to your email service
    // For now, we'll simulate the email sending
    console.log('Email template created:', emailTemplate);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demonstration, we'll always return true
    // In production, you would call your actual email service API here
    console.log(`Email sent successfully to ${email}`);
    return true;
    
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error(`Failed to send email to ${email}`);
  }
};

const generateEmailHTML = (studentName: string, context: any): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fee Receipt</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #2563eb; margin: 0; font-size: 28px; }
            .receipt-details { background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            .detail-label { font-weight: bold; color: #374151; }
            .detail-value { color: #6b7280; }
            .total-row { background-color: #2563eb; color: white; font-weight: bold; font-size: 18px; padding: 15px; border-radius: 4px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Fee Receipt</h1>
                <p>Receipt No: ${context.receipt_no}</p>
                <p>Date: ${context.date}</p>
            </div>
            
            <h2>Dear ${studentName},</h2>
            <p>Please find your fee receipt details below:</p>
            
            <div class="receipt-details">
                <div class="detail-row">
                    <span class="detail-label">Student Name:</span>
                    <span class="detail-value">${context.name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Course:</span>
                    <span class="detail-value">${context.engineering}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Category:</span>
                    <span class="detail-value">${context.caste}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tuition Fee:</span>
                    <span class="detail-value">₹${context.Tuition_Fee}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Development Fee:</span>
                    <span class="detail-value">₹${context.Development}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Exam Fee:</span>
                    <span class="detail-value">₹${context.Board_Exam}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Enrollment Fee:</span>
                    <span class="detail-value">₹${context.Enrollment_Fee}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Other Fee:</span>
                    <span class="detail-value">₹${context.Others_fee}</span>
                </div>
                <div class="total-row">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Total Amount:</span>
                        <span>₹${context.TOTAL}</span>
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Amount in Words:</span>
                    <span class="detail-value">${context.In_words}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Bank Name:</span>
                    <span class="detail-value">${context.Bank_Name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Pay Order No:</span>
                    <span class="detail-value">${context.Pay_Order}</span>
                </div>
            </div>
            
            <div class="footer">
                <p>This is an automatically generated receipt. Please keep this for your records.</p>
                <p>If you have any questions, please contact the administration office.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

export default { sendReceiptEmail };
