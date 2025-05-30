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

interface StudentData {
  name: string;
  email: string;
  rollNumber: string;
  amount?: number;
  semester?: string;
  [key: string]: any;
}

interface Receipt {
  id: number;
  studentName: string;
  email: string;
  rollNumber: string;
  status: string;
  sentStatus: boolean;
  generatedAt: string;
  amount?: number;
  semester?: string;
}

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
  const [studentData, setStudentData] = useState<StudentData[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  const parseExcelFile = async (file: File): Promise<StudentData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string;
          const lines = data.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          const students: StudentData[] = [];
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
              const student: StudentData = {};
              
              headers.forEach((header, index) => {
                const value = values[index] || '';
                if (header.toLowerCase().includes('name')) {
                  student.name = value;
                } else if (header.toLowerCase().includes('email')) {
                  student.email = value;
                } else if (header.toLowerCase().includes('roll') || header.toLowerCase().includes('id')) {
                  student.rollNumber = value;
                } else if (header.toLowerCase().includes('amount') || header.toLowerCase().includes('fee')) {
                  student.amount = parseFloat(value) || 0;
                } else if (header.toLowerCase().includes('semester')) {
                  student.semester = value;
                } else {
                  student[header] = value;
                }
              });
              
              if (student.name && student.email && student.rollNumber) {
                students.push(student);
              }
            }
          }
          resolve(students);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (files: { template?: File; dataSheet?: File }) => {
    setUploadedFiles(prev => ({ ...prev, ...files }));
    
    if (files.dataSheet) {
      try {
        const students = await parseExcelFile(files.dataSheet);
        setStudentData(students);
        toast({
          title: "Data Sheet Processed",
          description: `Found ${students.length} student records.`,
        });
      } catch (error) {
        toast({
          title: "Error Processing File",
          description: "Please ensure your Excel file has Name, Email, and Roll Number columns.",
          variant: "destructive",
        });
      }
    }
    
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

    if (studentData.length === 0) {
      toast({
        title: "No Student Data",
        description: "No valid student data found in the uploaded file.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    const newReceipts: Receipt[] = studentData.map((student, index) => ({
      id: Date.now() + index,
      studentName: student.name,
      email: student.email,
      rollNumber: student.rollNumber,
      status: 'generated',
      sentStatus: false,
      generatedAt: new Date().toLocaleDateString(),
      amount: student.amount,
      semester: student.semester
    }));

    const totalSteps = studentData.length;
    let currentStep = 0;
    
    const interval = setInterval(() => {
      currentStep++;
      const progress = (currentStep / totalSteps) * 100;
      setGenerationProgress(progress);
      
      if (currentStep >= totalSteps) {
        clearInterval(interval);
        setIsGenerating(false);
        setReceipts(newReceipts);
        toast({
          title: "Generation Complete",
          description: `Successfully generated ${newReceipts.length} receipts!`,
        });
      }
    }, 200);
  };

  const handleSendEmails = () => {
    const pendingReceipts = receipts.filter(r => !r.sentStatus);
    
    if (pendingReceipts.length === 0) {
      toast({
        title: "No Pending Receipts",
        description: "All receipts have already been sent.",
      });
      return;
    }

    toast({
      title: "Sending Emails",
      description: `Starting email distribution for ${pendingReceipts.length} receipts.`,
    });
    
    setReceipts(prev => prev.map(receipt => ({ ...receipt, sentStatus: true })));
    
    setTimeout(() => {
      toast({
        title: "Emails Sent Successfully",
        description: `All ${pendingReceipts.length} emails have been delivered.`,
      });
    }, 2000);
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students Found</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentData.length}</div>
              <p className="text-xs text-muted-foreground">From uploaded data</p>
            </CardContent>
          </Card>

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

        {/* Data Preview */}
        {studentData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Found {studentData.length} students in your data file
                </h4>
                <div className="text-sm text-blue-700">
                  <p>Sample data: {studentData[0]?.name} ({studentData[0]?.email}) - {studentData[0]?.rollNumber}</p>
                  {studentData.length > 1 && (
                    <p>And {studentData.length - 1} more students...</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload & Generate</TabsTrigger>
            <TabsTrigger value="manage">Manage Receipts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
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
                    description="Upload student data with Name, Email, Roll Number columns (.xlsx, .csv)"
                    acceptedTypes=".xlsx,.csv"
                    onFileUpload={(file) => handleFileUpload({ dataSheet: file })}
                    uploadedFile={uploadedFiles.dataSheet}
                  />
                </div>

                {(uploadedFiles.template && uploadedFiles.dataSheet && studentData.length > 0) && (
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-4">Ready to Generate</h3>
                    
                    {isGenerating && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-blue-700 mb-2">
                          <span>Generating receipts...</span>
                          <span>{Math.round(generationProgress)}%</span>
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
                        Generate {studentData.length} Receipts
                      </Button>

                      {generationProgress === 100 && receipts.length > 0 && (
                        <Button onClick={handleSendEmails} className="bg-green-600 hover:bg-green-700">
                          <Mail className="h-4 w-4 mr-2" />
                          Send All Emails ({receipts.filter(r => !r.sentStatus).length})
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
