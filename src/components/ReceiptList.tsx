import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Search, 
  Trash2, 
  Download, 
  Mail, 
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast'; // Import toast

interface Receipt {
  id: number;
  studentName: string;
  email: string;
  rollNumber: string;
  status: string;
  sentStatus: boolean;
  generatedAt: string;
  context: any;
}

interface ReceiptListProps {
  receipts: Receipt[];
  onDelete: (id: number) => void;
  onPreview: (receipt: Receipt) => void;
  isTemplateUploaded: boolean;
}

const ReceiptList = ({ receipts, onDelete, onPreview, isTemplateUploaded }: ReceiptListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipts, setSelectedReceipts] = useState<number[]>([]);

  const handleDownloadSingleReceipt = async (receipt: Receipt) => {
    const { downloadReceiptAsPDFFromHTML, getTemplate } = await import('@/utils/receiptStorage');
    const { processAndDownloadWordTemplateWithDocxtemplater } = await import('@/utils/wordTemplateProcessor');
    
    const templateFile = getTemplate(); // Get the actual template File object

    const optionsForDocxtemplater = { 
        templateFile: templateFile!, // Assert non-null if isTemplateUploaded is true
        studentName: receipt.studentName, 
        enrollmentNo: receipt.rollNumber, 
        studentData: receipt.context 
    };
    const optionsForPDF = {
        studentName: receipt.studentName, 
        enrollmentNo: receipt.rollNumber, 
        receiptData: receipt.context 
    }

    try {
        if (isTemplateUploaded && templateFile) { // Check if templateFile is actually available
            await processAndDownloadWordTemplateWithDocxtemplater(optionsForDocxtemplater);
            toast({ title: "DOCX Downloaded", description: `Receipt for ${receipt.studentName} downloaded as DOCX.` });
        } else {
            if (!isTemplateUploaded) {
              console.warn("Template not uploaded, falling back to PDF for single download.");
            }
            if (isTemplateUploaded && !templateFile) {
              console.warn("isTemplateUploaded is true, but templateFile is null. Falling back to PDF.");
            }
            await downloadReceiptAsPDFFromHTML(optionsForPDF);
            toast({ title: "PDF Downloaded", description: `Receipt for ${receipt.studentName} downloaded as PDF.` });
        }
    } catch (error) {
        toast({ title: "Download Error", description: `Could not download receipt: ${(error as Error).message}`, variant: "destructive" });
        console.error("Download error for single receipt:", error);
    }
  };

  const filteredReceipts = receipts.filter(receipt =>
    receipt.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectReceipt = (id: number) => {
    setSelectedReceipts(prev => 
      prev.includes(id) 
        ? prev.filter(receiptId => receiptId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedReceipts.length === filteredReceipts.length) {
      setSelectedReceipts([]);
    } else {
      setSelectedReceipts(filteredReceipts.map(receipt => receipt.id));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Receipt Management</span>
          <Badge variant="secondary">
            {filteredReceipts.length} receipts
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Bulk Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {selectedReceipts.length > 0 && (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Send Selected ({selectedReceipts.length})
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>

        {/* Receipt Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedReceipts.length === filteredReceipts.length && filteredReceipts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roll Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedReceipts.includes(receipt.id)}
                      onChange={() => handleSelectReceipt(receipt.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{receipt.studentName}</TableCell>
                  <TableCell>{receipt.email}</TableCell>
                  <TableCell>{receipt.rollNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {receipt.sentStatus ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <Badge variant={receipt.sentStatus ? "default" : "secondary"}>
                        {receipt.sentStatus ? 'Sent' : 'Pending'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{receipt.generatedAt}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => onPreview(receipt)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadSingleReceipt(receipt)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {!receipt.sentStatus && (
                        <Button variant="ghost" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Receipt</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the receipt for {receipt.studentName}? 
                              This action cannot be undone and the student will no longer be able to access this receipt.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => onDelete(receipt.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Receipt
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredReceipts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No receipts found matching your search.' : 'No receipts generated yet.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReceiptList;