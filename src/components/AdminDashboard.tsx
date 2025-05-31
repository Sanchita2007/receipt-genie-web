
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
import { sendReceiptEmail } from '@/utils/emailService';

interface StudentData {
  'NAME OF THE STUDENT': string;
  'DATE': string;
  'CAT': string;
  'IN WORDS': string;
  'YEAR & COURSE': string;
  'TUITION FEE': string;
  'DEV. FEE': string;
  'EXAM FEE': string;
  'ENROLLMENT FEE': string;
  'OTHER FEE': string;
  'TOTAL': string;
  'BANK NAME': string;
  'PAY ORDER NO.': string;
  email?: string;
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
  context: any;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

const REQUIRED_FIELDS = [
  'NAME OF THE STUDENT',
  'DATE',
  'CAT',
  'IN WORDS',
  'YEAR & COURSE',
  'TUITION FEE',
  'DEV. FEE',
  'EXAM FEE',
  'ENROLLMENT FEE',
  'OTHER FEE',
  'TOTAL',
  'BANK NAME',
  'PAY ORDER NO.'
];

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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateRequiredFields = (headers: string[]): boolean => {
    const missingFields = REQUIRED_FIELDS.filter(field => 
      !headers.some(header => header.toLowerCase().includes(field.toLowerCase()) || 
        header.toUpperCase() === field)
    );
    
    if (missingFields.length > 0) {
      setValidationErrors(missingFields);
      return false;
    }
    
    setValidationErrors([]);
    return true;
  };

  const parseExcelFile = async (file: File): Promise<StudentData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string;
          console.log('File content preview:', data.substring(0, 200));
          
          const lines = data.split('\n').filter(line => line.trim());
          if (lines.length < 2) {
            console.log('Not enough lines in file');
            resolve([]);
            return;
          }
          
          let delimiter = ',';
          if (lines[0].includes(';') && !lines[0].includes(',')) {
            delimiter = ';';
          } else if (lines[0].includes('\t')) {
            delimiter = '\t';
          }
          
          console.log('Using delimiter:', delimiter);
          const headers = lines[0].split(delimiter).map(h => h.trim().replace(/['"]/g, ''));
          console.log('Headers found:', headers);
          
          // Validate required fields
          if (!validateRequiredFields(headers)) {
            toast({
              title: "Missing Required Fields",
              description: `The following required fields are missing: ${validationErrors.join(', ')}`,
              variant: "destructive",
            });
            resolve([]);
            return;
          }
          
          const students: StudentData[] = [];
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(delimiter).map(v => v.trim().replace(/['"]/g, ''));
              const student: Partial<StudentData> = {};
              
              headers.forEach((header, index) => {
                const value = values[index] || '';
                student[header] = value;
                
                // Also map email field if present
                if (header.toLowerCase().includes('email') || header.toLowerCase().includes('mail')) {
                  student.email = value;
                }
              });
              
              console.log('Parsed student:', student);
              if (student['NAME OF THE STUDENT']) {
                students.push(student as StudentData);
              }
            }
          }
          console.log('Total valid students:', students.length);
          resolve(students);
        } catch (error) {
          console.error('Parse error:', error);
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (files: { template?: File; dataSheet?: File }) => {
    console.log('File upload triggered:', files);
    
    setUploadedFiles(prev => {
      const updated = { ...prev, ...files };
      console.log('Updated files:', updated);
      return updated;
    });
    
    if (files.dataSheet) {
      try {
        console.log('Processing data sheet...');
        const students = await parseExcelFile(files.dataSheet);
        console.log('Parsed students:', students);
        setStudentData(students);
        if (students.length > 0) {
          toast({
            title: "Data Sheet Processed",
            description: `Found ${students.length} student records with all required fields.`,
          });
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        toast({
          title: "Error Processing File",
          description: "Please ensure your Excel file has all required template fields.",
          variant: "destructive",
        });
      }
    }
    
    if (files.template) {
      toast({
        title: "Template Uploaded",
        description: "Template file has been uploaded successfully.",
      });
    }
  };

  const generateReceiptContext = (student: StudentData, index: number) => {
    const name = student['NAME OF THE STUDENT'];
    return {
      receipt_no: index + 1,
      date: student['DATE'],
      caste: student['CAT'],
      name: name,
      In_words: student['IN WORDS'],
      engineering: student['YEAR & COURSE'],
      Tuition_Fee: student['TUITION FEE'],
      Development: student['DEV. FEE'],
      Board_Exam: student['EXAM FEE'],
      Enrollment_Fee: student['ENROLLMENT FEE'],
      Others_fee: student['OTHER FEE'],
      TOTAL: student['TOTAL'],
      Bank_Name: student['BANK NAME'],
      Pay_Order: student['PAY ORDER NO.']
    };
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
        description: "No valid student data found or missing required fields in the uploaded file.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    const newReceipts: Receipt[] = studentData.map((student, index) => ({
      id: Date.now() + index,
      studentName: student['NAME OF THE STUDENT'],
      email: student.email || '',
      rollNumber: `Receipt-${index + 1}`,
      status: 'generated',
      sentStatus: false,
      generatedAt: new Date().toLocaleDateString(),
      context: generateReceiptContext(student, index)
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
          description: `Successfully generated ${newReceipts.length} receipts with all required data!`,
        });
      }
    }, 200);
  };

  const handleSendEmails = async () => {
    const pendingReceipts = receipts.filter(r => !r.sentStatus && r.email);
    
    if (pendingReceipts.length === 0) {
      toast({
        title: "No Pending Receipts",
        description: "All receipts have been sent or no email addresses found.",
      });
      return;
    }

    toast({
      title: "Sending Emails",
      description: `Starting email distribution for ${pendingReceipts.length} receipts.`,
    });

    try {
      for (const receipt of pendingReceipts) {
        await sendReceiptEmail(receipt.email, receipt.studentName, receipt.context);
        
        // Update receipt status
        setReceipts(prev => prev.map(r => 
          r.id === receipt.id ? { ...r, sentStatus: true } : r
        ));
        
        // Small delay between emails
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast({
        title: "Emails Sent Successfully",
        description: `All ${pendingReceipts.length} emails have been delivered.`,
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      toast({
        title: "Email Sending Failed",
        description: "Some emails could not be sent. Please check your email configuration.",
        variant: "destructive",
      });
    }
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

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Card className="mb-8 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800">Missing Required Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-red-700 mb-2">Your Excel file is missing the following required fields:</p>
                <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                  {validationErrors.map((field, index) => (
                    <li key={index}>{field}</li>
                  ))}
                </ul>
                <p className="text-red-700 text-sm mt-3">
                  Please ensure your Excel file contains all these exact column headers before proceeding.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Preview */}
        {studentData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">
                  ✅ Found {studentData.length} students with all required fields
                </h4>
                <div className="text-sm text-green-700">
                  <p>Sample: {studentData[0]?.['NAME OF THE STUDENT']} - {studentData[0]?.['YEAR & COURSE']}</p>
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
                    description="Upload student data with ALL required template fields (.xlsx, .csv)"
                    acceptedTypes=".xlsx,.csv"
                    onFileUpload={(file) => handleFileUpload({ dataSheet: file })}
                    uploadedFile={uploadedFiles.dataSheet}
                  />
                </div>

                {/* Generate Button - Show when both files are uploaded and data is valid */}
                {uploadedFiles.template && uploadedFiles.dataSheet && (
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-4">
                      {studentData.length > 0 ? 'Ready to Generate' : 'Processing Files...'}
                    </h3>
                    
                    {studentData.length > 0 && validationErrors.length === 0 && (
                      <div className="mb-4 p-3 bg-green-100 rounded-lg">
                        <p className="text-green-800 text-sm">
                          ✅ Found {studentData.length} student records with all required template fields
                        </p>
                      </div>
                    )}
                    
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
                        disabled={isGenerating || studentData.length === 0 || validationErrors.length > 0}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {studentData.length > 0 
                          ? `Generate ${studentData.length} Receipts` 
                          : 'Generate Receipts'
                        }
                      </Button>

                      {generationProgress === 100 && receipts.length > 0 && (
                        <Button onClick={handleSendEmails} className="bg-green-600 hover:bg-green-700">
                          <Mail className="h-4 w-4 mr-2" />
                          Send All Emails ({receipts.filter(r => !r.sentStatus && r.email).length})
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
