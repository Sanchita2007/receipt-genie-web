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

const ReceiptPreviewDialog = ({ 
    isOpen, 
    onClose, 
    receipt, 
    onDownloadDocx,
    isDocxPreview = false
  }: ReceiptPreviewDialogProps) => {
  if (!receipt) return null;

  const handleDownload = async () => {
    if (!receipt) return;
    if (isDocxPreview && onDownloadDocx) {
      try {
        await onDownloadDocx();
        toast({
          title: "DOCX Downloaded",
          description: `Receipt for ${receipt.studentName} downloaded as DOCX.`
        });
      } catch (error) {
         console.error("Error downloading DOCX:", error);
         toast({
             title: "Download Error",
             description: "Could not generate DOCX for download.",
             variant: "destructive"
         });
      }
    } else {
      toast({
        title: "Preview Action Not Configured",
        description: "HTML preview is disabled. DOCX download not set up for this action.",
        variant: "destructive"
      });
    }
  };
  
  // If focusing purely on DOCX, this dialog might be removed entirely,
  // and "preview" actions directly trigger downloads.
  // For now, let's assume it might still be used if a DOCX preview/download is triggered.

  if (!isDocxPreview) {
     // If not docx preview and HTML preview is removed, then this dialog shouldn't show.
     // The AdminDashboard should control its `isOpen` state based on this.
     // For now, let's keep a minimal structure for DOCX download button if used.
     // If isOpen is true AND isDocxPreview is true, then this dialog is for DOCX download.
  }


  return (
    <Dialog open={isOpen && isDocxPreview} onOpenChange={onClose}> {/* Only open if DOCX preview mode */}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Download Receipt for {receipt.studentName}</span>
            <Button variant="ghost" size="sm" onClick={onClose} className="absolute right-4 top-4">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="border rounded-lg p-4 bg-white text-center">
          <p className="mb-4">This will download the receipt as a DOCX file.</p>
          <Button onClick={handleDownload} size="lg">
            <Download className="h-4 w-4 mr-2" />
            Download DOCX
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptPreviewDialog;