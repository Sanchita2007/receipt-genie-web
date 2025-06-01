// File: src/components/AdminDashboard.tsx
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
  GraduationCap,
  Eye,
  FolderOpen
} from 'lucide-react';
import FileUploadZone from '@/components/FileUploadZone';
import ReceiptList from '@/components/ReceiptList';
import ReceiptPreviewDialog from '@/components/ReceiptPreviewDialog';
import { sendReceiptEmail } from '@/utils/emailService';
import { downloadReceiptAsPDFFromHTML } from '@/utils/receiptStorage';

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
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // const [storageLocation, setStorageLocation] = useState<string>(''); // storageLocation seems unused, can be removed if not needed

  const validateRequiredFields = (headersFromFile: string[]): boolean => {
    const localMissingFields = REQUIRED_FIELDS.filter(reqField => {
      const reqFieldLower = reqField.trim().toLowerCase();
      const reqFieldUpper = reqField.trim().toUpperCase();
      return !headersFromFile.some(headerFromFile => {
        const headerLower = headerFromFile.trim().toLowerCase();
        const headerUpper = headerFromFile.trim().toUpperCase();
        // Prioritize exact (case-insensitive) match, then 'includes'
        return headerLower === reqFieldLower || headerUpper === reqFieldUpper || headerLower.includes(reqFieldLower);
      });
    });
    
    if (localMissingFields.length > 0) {
      setValidationErrors(localMissingFields);
      return false;
    }
    
    setValidationErrors([]); // Clear any previous errors
    return true;
  };

  const parseExcelFile = async (file: File): Promise<StudentData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string;
          // console.log('File content preview:', data.substring(0, 200));
          
          const lines = data.split('\n').filter(line => line.trim());
          if (lines.length < 2) {
            console.log('Not enough lines in file');
            toast({ title: "File Error", description: "File is empty or has no data rows.", variant: "destructive" });
            resolve([]);
            return;
          }
          
          let delimiter = ',';
          if (lines[0].includes(';') && !lines[0].includes(',')) {
            delimiter = ';';
          } else if (lines[0].includes('\t')) {
            delimiter = '\t';
          }
          // console.log('Using delimiter:', delimiter);

          const rawHeadersFromFile = lines[0].split(delimiter).map(h => h.trim().replace(/['"]/g, ''));
          console.log('Headers found in file:', rawHeadersFromFile);
          
          if (!validateRequiredFields(rawHeadersFromFile)) {
            toast({
              title: "Missing Required Fields in Header",
              description: `The Excel file is missing some required columns or they could not be matched: ${validationErrors.join(', ')}. Please check column names.`,
              variant: "destructive",
            });
            resolve([]);
            return;
          }
          
          // If validation passed, build the mapping from canonical field name to its column index
          const canonicalToHeaderIndexMap: { [canonicalKey: string]: number } = {};
          for (const reqField of REQUIRED_FIELDS) {
            const reqFieldLower = reqField.trim().toLowerCase();
            const reqFieldUpper = reqField.trim().toUpperCase();
            
            // Find the best matching header index
            let foundIndex = rawHeadersFromFile.findIndex(rawHeader => {
              const headerLower = rawHeader.trim().toLowerCase();
              return headerLower === reqFieldLower; // Exact case-insensitive match
            });

            if (foundIndex === -1) {
              foundIndex = rawHeadersFromFile.findIndex(rawHeader => {
                const headerUpper = rawHeader.trim().toUpperCase();
                return headerUpper === reqFieldUpper; // Exact match (should be covered by above)
              });
            }

            if (foundIndex === -1) { // Fallback to 'includes'
              foundIndex = rawHeadersFromFile.findIndex(rawHeader => {
                const headerLower = rawHeader.trim().toLowerCase();
                return headerLower.includes(reqFieldLower);
              });
            }
            
            if (foundIndex !== -1) {
              canonicalToHeaderIndexMap[reqField] = foundIndex;
            } else {
              // This should not happen if validateRequiredFields passed and has similar logic.
              // But as a safeguard:
              console.error(`Logic error: validateRequiredFields passed, but cannot map field: ${reqField}`);
              setValidationErrors(prev => [...new Set([...prev, reqField])]); // Add to validation errors
              toast({
                title: "Header Mapping Discrepancy",
                description: `Could not map previously validated field: ${reqField}. Please check column names.`,
                variant: "destructive",
              });
              resolve([]);
              return;
            }
          }
          
          const students: StudentData[] = [];
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const valuesInRow = lines[i].split(delimiter).map(v => v.trim().replace(/['"]/g, ''));
              const student: Partial<StudentData> = {};
              
              REQUIRED_FIELDS.forEach(reqField => {
                const columnIndex = canonicalToHeaderIndexMap[reqField];
                const value = (columnIndex !== undefined && columnIndex < valuesInRow.length && valuesInRow[columnIndex] !== undefined) 
                              ? valuesInRow[columnIndex] 
                              : '';
                student[reqField as keyof StudentData] = value;
              });
              
              // Handle 'email' separately as it's optional and might have varied names
              const emailHeaderCandidate = rawHeadersFromFile.find(h => h.toLowerCase().trim().includes('email') || h.toLowerCase().trim().includes('mail'));
              if (emailHeaderCandidate) {
                const emailIndex = rawHeadersFromFile.indexOf(emailHeaderCandidate);
                if (emailIndex !== -1 && emailIndex < valuesInRow.length && valuesInRow[emailIndex] !== undefined) {
                  student.email = valuesInRow[emailIndex];
                } else {
                  student.email = ''; // Ensure email is at least an empty string if header exists but value is missing
                }
              } else {
                student.email = ''; // Ensure email property exists as empty string if no email header found
              }
              
              // Ensure the main identifier field is present and non-empty to consider it a valid student record
              if (student['NAME OF THE STUDENT'] && student['NAME OF THE STUDENT'].trim() !== '') {
                  students.push(student as StudentData);
              } else {
                  console.warn('Skipping a row due to missing or empty NAME OF THE STUDENT:', valuesInRow.join(delimiter));
              }
            }
          }
          console.log('Total valid students parsed:', students.length);
          resolve(students);
        } catch (error) {
          console.error('Parse error in parseExcelFile:', error);
          toast({ title: "File Parsing Error", description: (error as Error).message, variant: "destructive" });
          reject(error);
        }
      };
      reader.onerror = () => {
        toast({ title: "File Read Error", description: "Failed to read the uploaded file.", variant: "destructive" });
        reject(new Error('Failed to read file'));
      }
      reader.readAsText(file); // Consider specific encodings if necessary, e.g. reader.readAsText(file, 'UTF-8');
    });
  };

  const handleFileUpload = async (files: { template?: File; dataSheet?: File }) => {
    // console.log('File upload triggered:', files);
    
    setUploadedFiles(prev => {
      const updated = { ...prev, ...files };
      // console.log('Updated files:', updated);
      return updated;
    });
    
    if (files.template) {
      const { setTemplate } = await import('@/utils/receiptStorage');
      setTemplate(files.template);
      toast({
        title: "Template Uploaded",
        description: "Template file has been uploaded and will be used for receipt generation.",
      });
    }
    
    if (files.dataSheet) {
      try {
        // console.log('Processing data sheet...');
        const students = await parseExcelFile(files.dataSheet);
        // console.log('Parsed students:', students);
        setStudentData(students); // This will trigger re-render if studentData changes
        if (students.length > 0 && validationErrors.length === 0) { // Check validationErrors state
          toast({
            title: "Data Sheet Processed",
            description: `Found ${students.length} student records.`,
          });
        } else if (students.length === 0 && validationErrors.length === 0) {
             toast({
                title: "No Student Data Found",
                description: "The data sheet was processed, but no valid student records were found.",
                variant: "default" // Or "warning" if you have one
            });
        }
        // If validationErrors.length > 0, a toast is already shown by parseExcelFile or validateRequiredFields
      } catch (error) {
        console.error('Error parsing file:', error);
        toast({
          title: "Error Processing File",
          description: "An error occurred while processing the data sheet. Check console for details.",
          variant: "destructive",
        });
      }
    }
  };

// From AdminDashboard.tsx
const generateReceiptContext = (student: StudentData, index: number) => {
    // student object now has canonical keys like 'NAME OF THE STUDENT'
    const name = student['NAME OF THE STUDENT'] || ""; // Add fallback for safety, though parseExcelFile should ensure strings
    return {
      receipt_no: (index + 1).toString(), // Ensure it's a string if template expects string
      date: (student['DATE'] || "").toString(),
      caste: (student['CAT'] || "").toString(),
      name: name.toString(), 
      In_words: (student['IN WORDS'] || "").toString(), 
      engineering: (student['YEAR & COURSE'] || "").toString(),
      Tuition_Fee: (student['TUITION FEE'] || "0").toString(), 
      Development: (student['DEV. FEE'] || "0").toString(), 
      Board_Exam: (student['EXAM FEE'] || "0").toString(), 
      Enrollment_Fee: (student['ENROLLMENT FEE'] || "0").toString(), 
      Others_fee: (student['OTHER FEE'] || "0").toString(), 
      TOTAL: (student['TOTAL'] || "0").toString(),
      Bank_Name: (student['BANK NAME'] || "").toString(),
      Pay_Order: (student['PAY ORDER NO.'] || "").toString(),
      email: (student.email || "").toString(), // Ensure email is included if needed by templates
    };
  };

  const handleGenerateReceipts = () => {    if (!uploadedFiles.template && !uploadedFiles.dataSheet) { // Allow generation if only datasheet is present (for PDF from HTML)
      toast({
        title: "Missing Data Sheet",
        description: "Please upload at least the data sheet file.",
        variant: "destructive",
      });
      return;
    }
        if (!uploadedFiles.dataSheet) {
       toast({
        title: "Missing Data Sheet",
        description: "Please upload the data sheet file.",
        variant: "destructive",
      });
      return;
    }

    if (studentData.length === 0) {
      if (validationErrors.length > 0) {
        toast({
          title: "Cannot Generate Receipts",
          description: "Please resolve the header validation errors before generating receipts.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "No Student Data",
          description: "No valid student data found in the uploaded file to generate receipts.",
          variant: "destructive",
        });
      }
      return;
    }
    if (validationErrors.length > 0) {
       toast({
          title: "Validation Errors",
          description: "Please fix the validation errors listed before generating receipts.",
          variant: "destructive",
        });
        return;
    }


    setIsGenerating(true);
    setGenerationProgress(0);

    const newReceipts: Receipt[] = studentData.map((student, index) => ({
      id: Date.now() + index,
      studentName: student['NAME OF THE STUDENT'] || 'N/A', // Fallback for studentName
      email: student.email || '',
      rollNumber: `ENR-${index + 1}-${Date.now()}`, // This is a generated roll number
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
          description: `Successfully generated ${newReceipts.length} receipts!`,
        });
      }
    }, 200);
  };
  
  const handlePreviewReceipt = async (receipt: Receipt) => {
    if (uploadedFiles.template) {
      const { processAndDownloadWordTemplateWithDocxtemplater } = await import('@/utils/wordTemplateProcessor');
      try {
        await processAndDownloadWordTemplateWithDocxtemplater({
          templateFile: uploadedFiles.template,
          studentName: receipt.studentName,
          enrollmentNo: receipt.rollNumber, // Using the generated rollNumber
          studentData: receipt.context, // This context should now have correct string values
        });
      } catch (error) {
        console.error("Preview error (DOCX):", error);
        toast({ title: "Preview Error", description: `Could not generate Word preview: ${(error as Error).message}`, variant: "destructive" });
      }
    } else {
      setPreviewReceipt(receipt);
      setIsPreviewOpen(true);
    }
  };

  const handleDownloadAll = async () => {
    if (receipts.length === 0) {
      toast({
        title: "No Receipts",
        description: "No receipts available to download.",
        variant: "destructive",
      });
      return;
    }

    const { getTemplate, downloadReceiptAsPDFFromHTML } = await import('@/utils/receiptStorage');
    const { processAndDownloadWordTemplateWithDocxtemplater } = await import('@/utils/wordTemplateProcessor');
    const templateFile = getTemplate();

    if (templateFile) {
      toast({
        title: "Processing Word Templates",
        description: `Generating ${receipts.length} DOCX receipts...`,
      });

      try {
        for (const receipt of receipts) {
          await processAndDownloadWordTemplateWithDocxtemplater({
            templateFile: templateFile,
            studentName: receipt.studentName,
            enrollmentNo: receipt.rollNumber,
            studentData: receipt.context // This context is key
          });
          await new Promise(resolve => setTimeout(resolve, 500)); 
        }
        toast({
          title: "DOCX Receipts Generated",
          description: `Successfully generated and downloaded ${receipts.length} Word receipts.`,
        });
      } catch (error) {
        console.error('Word template processing loop failed:', error);
        toast({
          title: "DOCX Processing Failed",
          description: `Could not generate all Word receipts: ${(error as Error).message}. Falling back to PDF from HTML.`,
          variant: "destructive",
        });
        for (const receipt of receipts) {
          try {
            await downloadReceiptAsPDFFromHTML({
              studentName: receipt.studentName,
              enrollmentNo: receipt.rollNumber,
              receiptData: receipt.context // Pass context here too
            });
            await new Promise(resolve => setTimeout(resolve, 300)); 
          } catch (pdfError) {
            console.error(`Failed to generate PDF for ${receipt.studentName}`, pdfError);
            toast({ title: "PDF Generation Error", description: `Could not generate PDF for ${receipt.studentName}.`, variant: "destructive"});
          }
        }
      }
    } else {
      toast({
        title: "Processing PDF Receipts",
        description: `Generating ${receipts.length} PDF receipts from HTML...`,
      });
      for (const receipt of receipts) {
        try {
            await downloadReceiptAsPDFFromHTML({
            studentName: receipt.studentName,
            enrollmentNo: receipt.rollNumber,
            receiptData: receipt.context // And here
            });
            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (pdfError) {
            console.error(`Failed to generate PDF for ${receipt.studentName}`, pdfError);
            toast({ title: "PDF Generation Error", description: `Could not generate PDF for ${receipt.studentName}.`, variant: "destructive"});
        }
      }
      toast({
        title: "PDF Receipts Downloaded",
        description: `Attempted to download ${receipts.length} PDF receipts.`,
      });
    }
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
        // Ensure receipt.email is valid and receipt.context is populated
        if (receipt.email && receipt.context) {
          await sendReceiptEmail(receipt.email, receipt.studentName, receipt.context);
          
          setReceipts(prev => prev.map(r => 
            r.id === receipt.id ? { ...r, sentStatus: true } : r
          ));
          
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.warn(`Skipping email for ${receipt.studentName} due to missing email or context.`);
        }
      }
      
      toast({
        title: "Emails Sent Successfully",
        description: `Attempted to deliver ${pendingReceipts.length} emails.`,
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      toast({
        title: "Email Sending Failed",
        description: "Some emails could not be sent. Please check your email configuration and data.",
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
                <p className="text-red-700 mb-2">Your Excel file is missing the following required fields or they could not be matched:</p>
                <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                  {validationErrors.map((field, index) => (
                    <li key={index}>{field}</li>
                  ))}
                </ul>
                <p className="text-red-700 text-sm mt-3">
                  Please ensure your Excel file contains all these column headers (case-insensitive, variations like spaces around name might be okay, but exact names are best).
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Preview - Show only if data is present AND no validation errors */}
        {studentData.length > 0 && validationErrors.length === 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">
                  ✅ Found {studentData.length} students with all required fields mapped.
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
                    onFileRemove={async () => {
                      setUploadedFiles(prev => ({ ...prev, template: null }));
                      const { setTemplate } = await import('@/utils/receiptStorage');
                      setTemplate(null);
                    }}
                    uploadedFile={uploadedFiles.template}
                  />
                  <FileUploadZone
                    title="Excel Data"
                    description="Upload student data with ALL required template fields (.xlsx, .csv)"
                    acceptedTypes=".xlsx,.csv"
                    onFileUpload={(file) => handleFileUpload({ dataSheet: file })}
                    onFileRemove={() => {
                      setUploadedFiles(prev => ({ ...prev, dataSheet: null }));
                      setStudentData([]); // Clear student data
                      setValidationErrors([]); // Clear validation errors
                      setReceipts([]); // Clear generated receipts
                      setGenerationProgress(0); // Reset progress
                    }}
                    uploadedFile={uploadedFiles.dataSheet}
                  />
                </div>

                {uploadedFiles.dataSheet && (
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-4">
                      {studentData.length > 0 && validationErrors.length === 0 ? 'Ready to Generate' : 
                       validationErrors.length > 0 ? 'File Issues Detected' : 'Processing Files...'}
                    </h3>
                    
                    {studentData.length > 0 && validationErrors.length === 0 && (
                      <div className="mb-4 p-3 bg-green-100 rounded-lg">
                        <p className="text-green-800 text-sm">
                          ✅ Found {studentData.length} student records with all required template fields mapped.
                        </p>
                      </div>
                    )}
                     {validationErrors.length > 0 && (
                      <div className="mb-4 p-3 bg-red-100 rounded-lg">
                        <p className="text-red-800 text-sm">
                          ❌ Please fix the {validationErrors.length} validation error(s) listed above before generating.
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

                    <div className="flex flex-wrap gap-4">
                      <Button 
                        onClick={handleGenerateReceipts}
                        disabled={isGenerating || studentData.length === 0 || validationErrors.length > 0}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {studentData.length > 0 && validationErrors.length === 0 
                          ? `Generate ${studentData.length} Receipts` 
                          : 'Generate Receipts'
                        }
                      </Button>

                      {receipts.length > 0 && !isGenerating && ( // Show only after generation is complete
                        <>
                          <Button onClick={handleSendEmails} className="bg-green-600 hover:bg-green-700"
                            disabled={receipts.filter(r => !r.sentStatus && r.email).length === 0}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Send All Emails ({receipts.filter(r => !r.sentStatus && r.email).length})
                          </Button>
                          
                          <Button onClick={handleDownloadAll} variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download All Receipts
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage">
            <div className="space-y-6">
              {receipts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Receipt Management</span>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => receipts.length > 0 && handlePreviewReceipt(receipts[0])}
                          variant="outline"
                          size="sm"
                          disabled={!receipts.length}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview Sample ({uploadedFiles.template ? 'DOCX' : 'HTML/PDF'})
                        </Button>
                        <Button onClick={handleDownloadAll} variant="outline" size="sm" disabled={!receipts.length}>
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Save All to Folder
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                </Card>
              )}
              
              <ReceiptList 
                receipts={receipts} 
                onDelete={handleDeleteReceipt}
                onPreview={handlePreviewReceipt}
                isTemplateUploaded={!!uploadedFiles.template}
              />
            </div>
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
                    <p className="text-sm text-gray-600">Configure SMTP settings for email delivery (placeholder).</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Template Settings</h4>
                    <p className="text-sm text-gray-600">Manage default templates and formatting (placeholder).</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Security Settings</h4>
                    <p className="text-sm text-gray-600">Configure access controls and permissions (placeholder).</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <ReceiptPreviewDialog
        isOpen={isPreviewOpen && !uploadedFiles.template} 
        onClose={() => setIsPreviewOpen(false)}
        receipt={previewReceipt}
      />
    </div>
  );
};

export default AdminDashboard;