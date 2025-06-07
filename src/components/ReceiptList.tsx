// src/components/ReceiptList.tsx
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


// Update Receipt interface to match the one in AdminDashboard or pass specific fields
interface ReceiptForList { // Simplified for list props if needed, or use full Receipt
  id: number;
  studentName: string;
  email: string;
  payOrderNo: string; // Key identifier
  status: string; // 'completed', 'failed', 'uploading' etc.
  sentStatus: boolean;
  generatedAt: string;
  storagePath?: string;
  uploadError?: string;
  // Add any other fields from AdminDashboard's Receipt type that are needed here
  docxContext: any; // For on-the-fly preview if storagePath is missing
  studentEnrollmentId: string; // If needed for display/actions
  userId?: string;
}

interface ReceiptListProps {
  receipts: ReceiptForList[];
  onDelete: (receipt: ReceiptForList) => void; // Pass the whole receipt object
  onPreview: (receipt: ReceiptForList) => void;
  isTemplateUploaded: boolean;
}

const ReceiptList = ({ receipts, onDelete, onPreview, isTemplateUploaded }: ReceiptListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipts, setSelectedReceipts] = useState<number[]>([]);

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
  // ... (rest of the component, selectedReceipts logic can remain)

  // handleDownloadSingleReceipt is now effectively handlePreview
  // The actual download logic is in AdminDashboard's handlePreviewReceipt

  const filteredReceipts = receipts.filter(receipt =>
    receipt.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.payOrderNo.toLowerCase().includes(searchTerm.toLowerCase())
  );


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
                  <TableCell>{receipt.payOrderNo}</TableCell> {/* Use payOrderNo or studentEnrollmentId */}
                  <TableCell>
                    <Badge variant={
                      receipt.status === 'completed' ? 'default' :
                        receipt.status === 'failed' ? 'destructive' :
                          'secondary'
                    } className={
                      receipt.status === 'completed' ? 'bg-green-600' :
                        receipt.status === 'failed' ? 'bg-red-600' : ''
                    }>
                      {receipt.status}
                    </Badge>
                    {receipt.status === 'failed' && receipt.uploadError && (
                      <p className="text-xs text-red-500 truncate" title={receipt.uploadError}>
                        {receipt.uploadError.substring(0, 30)}...
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{new Date(receipt.generatedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end space-x-1">
                      <Button variant="ghost" size="sm" title="Download/Preview DOCX" onClick={() => onPreview(receipt)}>
                        <Download className="h-4 w-4" /> {/* Changed Icon to Download for clarity */}
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
                              Permanently delete receipt for {receipt.studentName} (PO: {receipt.payOrderNo})? This includes deleting from Supabase.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(receipt)} // Pass the full receipt object
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
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