import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { generateReceiptHTML, downloadReceiptAsPDFFromHTML } from '@/utils/receiptStorage';
import { toast } from '@/hooks/use-toast';

interface ReceiptPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: {
    studentName: string;
    rollNumber: string;
    context: any;
  } | null;
}

const ReceiptPreviewDialog = ({ isOpen, onClose, receipt }: ReceiptPreviewDialogProps) => {
  if (!receipt) return null;

  const handleDownload = async () => {
    if (!receipt) return;
    try {
      await downloadReceiptAsPDFFromHTML({ // Use PDF from HTML for this dialog's download
        studentName: receipt.studentName,
        enrollmentNo: receipt.rollNumber,
        receiptData: receipt.context
      });
      toast({
        title: "PDF Downloaded",
        description: `Receipt for ${receipt.studentName} downloaded as PDF.`
      });
    } catch (error) {
      console.error("Error downloading PDF from HTML:", error);
      toast({
        title: "Download Error",
        description: "Could not generate PDF for download.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Receipt Preview - {receipt.studentName} (HTML)</span>
            <div className="flex items-center space-x-2">
              <Button onClick={handleDownload} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download as PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="border rounded-lg p-4 bg-white">
          <div 
            dangerouslySetInnerHTML={{ 
              __html: generateReceiptHTML(receipt.context) 
            }}
            className="receipt-preview" // You might want to add specific styles for this class
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptPreviewDialog;