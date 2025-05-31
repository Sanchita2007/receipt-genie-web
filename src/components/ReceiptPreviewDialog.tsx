
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { generateReceiptHTML, downloadReceiptAsHTML } from '@/utils/receiptStorage';

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

  const handleDownload = () => {
    downloadReceiptAsHTML({
      studentName: receipt.studentName,
      enrollmentNo: receipt.rollNumber,
      receiptData: receipt.context
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Receipt Preview - {receipt.studentName}</span>
            <div className="flex items-center space-x-2">
              <Button onClick={handleDownload} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
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
            className="receipt-preview"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptPreviewDialog;
