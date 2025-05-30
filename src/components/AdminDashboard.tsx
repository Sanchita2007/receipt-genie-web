
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Mail, 
  Trash2, 
  Download, 
  Users, 
  CheckCircle, 
  AlertCircle,
  LogOut,
  GraduationCap
} from 'lucide-react';
import FileUploadZone from '@/components/FileUploadZone';
import ReceiptList from '@/components/ReceiptList';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<{
    template: File | null;
    dataSheet: File | null;
  }>({
    template: null,
    dataSheet: null
  });
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [receipts, setReceipts] = useState([
    {
      id: 1,
      studentName: 'John Doe',
      email: 'john.doe@university.edu',
      rollNumber: 'CS001',
      status: 'generated',
      sentStatus: true,
      generatedAt: '2024-01-15'
    },
    {
      id: 2,
      studentName: 'Jane Smith',
      email: 'jane.smith@university.edu',
      rollNumber: 'CS002',
      status: 'generated',
      sentStatus: false,
      generatedAt: '2024-01-15'
    }
  ]);

  const handleFileUpload = (files: { template?: File; dataSheet?: File }) => {
    setUploadedFiles(prev => ({ ...prev, ...files }));
    toast({
      title: "File Uploaded Successfully",
      description: `${Object.keys(files)[0]} has been uploaded and is ready for processing.`,
    });
  };

  const handleGenerateReceipts = () => {
    if (!uploadedFiles.template || !uploadedFiles.dataSheet) {
      toast({
        title: "Missing Files",
        description: "Please upload both template and data sheet files.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          toast({
            title: "Generation Complete",
            description: "All receipts have been generated successfully!",
          });
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleSendEmails = () => {
    toast({
      title: "Sending Emails",
      description: "Email distribution has started. You'll be notified when complete.",
    });
    
    // Update receipt status
    setReceipts(prev => prev.map(receipt => ({ ...receipt, sentStatus: true })));
  };

  const handleDeleteReceipt = (id: number) => {
    setReceipts(prev => prev.filter(receipt => receipt.id !== id));
    toast({
      title: "Receipt Deleted",
      description: "The receipt has been successfully deleted.",
    });
  };

  const stats = {
    totalReceipts: receipts.length,
    sentReceipts: receipts.filter(r => r.sentStatus).length,
    pendingReceipts: receipts.filter(r => !r.sentStatus).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Fee Receipt Generator</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Administrator
              </Badge>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReceipts}</div>
              <p className="text-xs text-muted-foreground">Generated this session</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sent Receipts</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.sentReceipts}</div>
              <p className="text-xs text-muted-foreground">Successfully delivered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingReceipts}</div>
              <p className="text-xs text-muted-foreground">Awaiting distribution</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload & Generate</TabsTrigger>
            <TabsTrigger value="manage">Manage Receipts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* File Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>File Upload</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FileUploadZone
                    title="Word Template"
                    description="Upload your receipt template (.docx)"
                    acceptedTypes=".docx"
                    onFileUpload={(file) => handleFileUpload({ template: file })}
                    uploadedFile={uploadedFiles.template}
                  />
                  <FileUploadZone
                    title="Excel Data"
                    description="Upload student data (.xlsx)"
                    acceptedTypes=".xlsx"
                    onFileUpload={(file) => handleFileUpload({ dataSheet: file })}
                    uploadedFile={uploadedFiles.dataSheet}
                  />
                </div>

                {/* Generation Section */}
                {(uploadedFiles.template && uploadedFiles.dataSheet) && (
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-4">Ready to Generate</h3>
                    
                    {isGenerating && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-blue-700 mb-2">
                          <span>Generating receipts...</span>
                          <span>{generationProgress}%</span>
                        </div>
                        <Progress value={generationProgress} className="h-2" />
                      </div>
                    )}

                    <div className="flex space-x-4">
                      <Button 
                        onClick={handleGenerateReceipts}
                        disabled={isGenerating}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Receipts
                      </Button>

                      {generationProgress === 100 && (
                        <Button onClick={handleSendEmails} className="bg-green-600 hover:bg-green-700">
                          <Mail className="h-4 w-4 mr-2" />
                          Send All Emails
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage">
            <ReceiptList receipts={receipts} onDelete={handleDeleteReceipt} />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Email Configuration</h4>
                    <p className="text-sm text-gray-600">Configure SMTP settings for email delivery</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Template Settings</h4>
                    <p className="text-sm text-gray-600">Manage default templates and formatting</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Security Settings</h4>
                    <p className="text-sm text-gray-600">Configure access controls and permissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
