// src/components/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  Upload, FileText, Mail, Trash2, Download, Users, CheckCircle,
  AlertCircle, LogOut, GraduationCap, Eye, FolderOpen, Database
} from 'lucide-react';
import FileUploadZone from '@/components/FileUploadZone';
import ReceiptList from '@/components/ReceiptList';
// import ReceiptPreviewDialog from '@/components/ReceiptPreviewDialog'; // Preview dialog might be removed or rethought
import { sendReceiptEmail } from '@/utils/emailService'; // Keep if email sending is still desired
// import { downloadReceiptAsPDFFromHTML } from '@/utils/receiptStorage'; // Removed
import { getTemplate, setTemplate as storeTemplateInUtil } from '@/utils/receiptStorage'; // Renamed setTemplate
import { processWordTemplate } from '@/utils/wordTemplateProcessor';
import { supabase, supabaseStorageBucketName } from '@/supabaseClient';
import { saveAs } from 'file-saver'; // For client-side save

interface StudentCsvData { // Represents data parsed directly from CSV
  'NAME OF THE STUDENT': string;
  'DATE': string;
  'CAT': string;
  'IN WORDS': string;
  'YEAR & COURSE': string;
  'TUITION FEE': string;
  'DEV. FEE': string;
  'EXAM FEE': string;
  'ENROLLMENT FEE': string; // This is the fee amount
  'OTHER FEE': string;
  'TOTAL': string;
  'BANK NAME': string;
  'PAY ORDER NO.': string; // Unique ID for the receipt transaction
  'EMAIL': string; // Student's email for account and contact
  'STUDENT_ENROLLMENT_ID': string; // Student's unique ID, used as password
  [key: string]: any;
}

interface ReceiptContextData { // Data structure for the DOCX template
  receipt_no: string; // Corresponds to PAY ORDER NO.
  date: string;
  caste: string; // CAT
  name: string; // NAME OF THE STUDENT
  In_words: string; // IN WORDS
  engineering: string; // YEAR & COURSE
  Tuition_Fee: string;
  Development: string;
  Board_Exam: string;
  Enrollment_Fee: string; // The fee amount
  Others_fee: string;
  TOTAL: string;
  Bank_Name: string;
  Pay_Order: string; // PAY ORDER NO.
  // EMAIL and STUDENT_ENROLLMENT_ID are NOT typically part of the visual receipt context
}


interface Receipt { // Represents a generated receipt in the UI list
  id: number; // Client-side unique key for the list
  studentName: string;
  email: string;
  studentEnrollmentId: string; // For reference, was used as password
  payOrderNo: string; // Unique identifier for this receipt (from CSV)
  status: 'parsed' | 'generating' | 'uploading' | 'completed' | 'failed';
  sentStatus: boolean; // Email sent status
  generatedAt: string; // Timestamp of generation/upload
  docxContext: ReceiptContextData; // Data used for DOCX
  storagePath?: string; // Supabase storage path
  userId?: string; // Supabase auth user ID (of the student)
  uploadError?: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

// Define required CSV headers
const REQUIRED_FIELDS = [
  'NAME OF THE STUDENT', 'DATE', 'CAT', 'IN WORDS', 'YEAR & COURSE',
  'TUITION FEE', 'DEV. FEE', 'EXAM FEE', 'ENROLLMENT FEE', 'OTHER FEE',
  'TOTAL', 'BANK NAME', 'PAY ORDER NO.', 'EMAIL', 'STUDENT_ENROLLMENT_ID'
];

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<{
    template: File | null;
    dataSheet: File | null;
  }>({ template: null, dataSheet: null });

  const [studentCsvDataList, setStudentCsvDataList] = useState<StudentCsvData[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false); // Combined state for generating/uploading
  const [generatedReceipts, setGeneratedReceipts] = useState<Receipt[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null); // For preview dialog
  // const [isPreviewOpen, setIsPreviewOpen] = useState(false); // For preview dialog

  const validateRequiredFields = (headersFromFile: string[]): boolean => {
    const missingFields = REQUIRED_FIELDS.filter(reqField => {
      const reqFieldNormalized = reqField.trim().toLowerCase();
      return !headersFromFile.some(header => header.trim().toLowerCase() === reqFieldNormalized);
    });

    if (missingFields.length > 0) {
      setValidationErrors(missingFields);
      toast({
        title: "Missing Required Fields in Header",
        description: `The CSV/Excel file is missing: ${missingFields.join(', ')}. Please check column names (case-insensitive).`,
        variant: "destructive",
      });
      return false;
    }
    setValidationErrors([]);
    return true;
  };

  const parseExcelFile = async (file: File): Promise<StudentCsvData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string;
          const lines = data.split('\n').filter(line => line.trim());
          if (lines.length < 2) {
            toast({ title: "File Error", description: "File is empty or has no data rows.", variant: "destructive" });
            resolve([]);
            return;
          }

          let delimiter = ',';
          if (lines[0].includes(';') && !lines[0].includes(',')) delimiter = ';';
          else if (lines[0].includes('\t')) delimiter = '\t';

          const rawHeadersFromFile = lines[0].split(delimiter).map(h => h.trim().replace(/['"]/g, ''));
          if (!validateRequiredFields(rawHeadersFromFile)) {
            resolve([]); // Validation errors already toasted
            return;
          }

          const headerMap: { [key: string]: number } = {};
          rawHeadersFromFile.forEach((header, index) => {
            const normalizedHeader = header.trim().toLowerCase();
            // Find the canonical name from REQUIRED_FIELDS that matches this normalizedHeader
            const canonicalName = REQUIRED_FIELDS.find(rf => rf.trim().toLowerCase() === normalizedHeader);
            if (canonicalName) {
              headerMap[canonicalName] = index;
            } else {
              // Also map any extra columns that might exist in CSV but are not in REQUIRED_FIELDS
              headerMap[header.trim()] = index;
            }
          });

          const students: StudentCsvData[] = [];
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const valuesInRow = lines[i].split(delimiter).map(v => v.trim().replace(/['"]/g, ''));
              const student: Partial<StudentCsvData> = {};

              REQUIRED_FIELDS.forEach(reqField => {
                const columnIndex = headerMap[reqField];
                const value = (columnIndex !== undefined && columnIndex < valuesInRow.length && valuesInRow[columnIndex] !== undefined)
                  ? valuesInRow[columnIndex]
                  : '';
                (student as any)[reqField] = value;
              });

              // Ensure required fields are not empty
              if (!student['NAME OF THE STUDENT'] || !student['EMAIL'] || !student['STUDENT_ENROLLMENT_ID'] || !student['PAY ORDER NO.']) {
                console.warn('Skipping row due to missing critical identifier (Name, Email, Enrollment ID, or Pay Order No.):', valuesInRow.join(delimiter));
                continue;
              }
              students.push(student as StudentCsvData);
            }
          }
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
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (files: { template?: File; dataSheet?: File }) => {
    setUploadedFiles(prev => ({ ...prev, ...files }));

    if (files.template) {
      storeTemplateInUtil(files.template); // Use renamed util function
      toast({ title: "Template Uploaded", description: "Word template stored." });
    }

    if (files.dataSheet) {
      try {
        const students = await parseExcelFile(files.dataSheet);
        setStudentCsvDataList(students);
        if (students.length > 0 && validationErrors.length === 0) {
          toast({ title: "Data Sheet Processed", description: `Found ${students.length} student records.` });
        } else if (students.length === 0 && validationErrors.length === 0) {
          toast({ title: "No Student Data", description: "No valid student records found." });
        }
        // Initialize generatedReceipts state for UI based on parsed data
        const initialReceipts: Receipt[] = students.map((s, idx) => ({
          id: Date.now() + idx, // Simple client-side ID
          studentName: s['NAME OF THE STUDENT'],
          email: s['EMAIL'],
          studentEnrollmentId: s['STUDENT_ENROLLMENT_ID'],
          payOrderNo: s['PAY ORDER NO.'],
          status: 'parsed',
          sentStatus: false,
          generatedAt: new Date().toISOString(),
          docxContext: mapStudentDataToReceiptContext(s),
        }));
        setGeneratedReceipts(initialReceipts);

      } catch (error) {
        console.error('Error parsing file:', error);
        toast({ title: "Error Processing File", description: "Could not process data sheet.", variant: "destructive" });
      }
    }
  };

  const mapStudentDataToReceiptContext = (student: StudentCsvData): ReceiptContextData => {
    return {
      receipt_no: student['PAY ORDER NO.'] || (Date.now() % 100000).toString(), // Fallback if PAY ORDER NO. is empty
      date: student['DATE'] || new Date().toLocaleDateString(),
      caste: student['CAT'] || "",
      name: student['NAME OF THE STUDENT'] || "",
      In_words: student['IN WORDS'] || "",
      engineering: student['YEAR & COURSE'] || "",
      Tuition_Fee: student['TUITION FEE'] || "0",
      Development: student['DEV. FEE'] || "0",
      Board_Exam: student['EXAM FEE'] || "0",
      Enrollment_Fee: student['ENROLLMENT FEE'] || "0", // This is the fee amount
      Others_fee: student['OTHER FEE'] || "0",
      TOTAL: student['TOTAL'] || "0",
      Bank_Name: student['BANK NAME'] || "",
      Pay_Order: student['PAY ORDER NO.'] || "",
    };
  };

  const handleGenerateAndUploadReceipts = async () => {
    const templateFile = getTemplate();
    if (!templateFile) {
      toast({ title: "Missing Template", description: "Please upload a Word template file.", variant: "destructive" });
      return;
    }
    if (studentCsvDataList.length === 0) {
      toast({ title: "No Student Data", description: "No student data to process.", variant: "destructive" });
      return;
    }
    if (validationErrors.length > 0) {
      toast({ title: "Validation Errors", description: "Fix CSV validation errors first.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setGenerationProgress(0);
    const totalSteps = studentCsvDataList.length;
    let processedCount = 0;

    const updatedGeneratedReceipts: Receipt[] = [];

    for (const studentData of studentCsvDataList) {
      const currentReceiptIndex = generatedReceipts.findIndex(r => r.payOrderNo === studentData['PAY ORDER NO.']);

      const updateLocalReceiptStatus = (payOrderNo: string, status: Receipt['status'], errorMsg?: string, storageP?: string, studentUserId?: string) => {
        setGeneratedReceipts(prev => prev.map(r =>
          r.payOrderNo === payOrderNo ? { ...r, status, uploadError: errorMsg, storagePath: storageP || r.storagePath, userId: studentUserId || r.userId } : r
        ));
      };

      updateLocalReceiptStatus(studentData['PAY ORDER NO.'], 'generating');

      try {
        // Inside handleGenerateAndUploadReceipts

        let studentUserId = '';
        let studentEmail = studentData['EMAIL']; // Ensure this key is correct
        let studentPassword = studentData['STUDENT_ENROLLMENT_ID']; // Ensure this key is correct

        // 1. Check if a profile ALREADY exists in public.users for this email
        const { data: existingUserProfile, error: profileCheckError } = await supabase
          .from('users')
          .select('id')
          .eq('email', studentEmail)
          .maybeSingle();

        if (profileCheckError) {
          throw new Error(`DB error checking user profile for ${studentEmail}: ${profileCheckError.message}`);
        }

        if (existingUserProfile) {
          studentUserId = existingUserProfile.id;
          console.log(`Profile for ${studentEmail} already exists in public.users. User ID: ${studentUserId}`);
        } else {
          // Profile does not exist in public.users, so we need to create an auth user
          console.log(`Profile for ${studentEmail} not found. Attempting auth.signUp...`);
          const { data: signUpResponse, error: signUpError } = await supabase.auth.signUp({
            email: studentEmail,
            password: studentPassword,
          });

          if (signUpError) {
            if (signUpError.message.toLowerCase().includes("user already registered")) {
              // This is a tricky state: auth user exists, but profile didn't.
              // This implies a previous partial failure. We need to get the auth user's ID.
              // This usually requires admin rights or a backend function.
              // For a client-side first approach, this is a data inconsistency.
              // A possible recovery: attempt login to get session, then use session.user.id. Risky in a loop.
              console.error(`Data inconsistency: User ${studentEmail} registered in auth but no profile. Manual check needed or implement recovery.`);
              // For now, let's try to fetch the user by email IF an admin is doing this.
              // However, supabase.auth.admin functions are not for client-side.
              // Simplest to mark as error for now.
              throw new Error(`User ${studentEmail} in auth, but no profile. Please resolve manually.`);
            }
            if (signUpError.message.includes("rate limit exceeded")) {
              toast({ title: "Rate Limit Hit", description: "User creation rate limit. Try later or disable email confirmations.", variant: "destructive", duration: 10000 });
            }
            throw new Error(`User signUp error for ${studentEmail}: ${signUpError.message}`);
          }
          if (!signUpResponse || !signUpResponse.user) {
            throw new Error(`Auth user object not returned after signUp for ${studentEmail}.`);
          }
          studentUserId = signUpResponse.user.id;
          console.log(`User ${studentEmail} signed up (auth) with ID: ${studentUserId}`);
        }

        // At this point, studentUserId should be set (either from existing profile or new auth user)
        if (!studentUserId) {
          throw new Error(`Could not determine studentUserId for ${studentEmail}.`);
        }

        // 2. Upsert the profile in public.users to ensure it exists and details are current
        console.log(`Upserting profile for student ID ${studentUserId} with email ${studentEmail}`);
        const { error: profileUpsertError } = await supabase
          .from('users')
          .upsert(
            {
              id: studentUserId, // This is the conflict target
              email: studentEmail,
              full_name: studentData['NAME OF THE STUDENT'],
              role: 'student',
            },
            {
              onConflict: 'id', // If 'id' (PK) matches, it will update. Otherwise, insert.
            }
          );

        if (profileUpsertError) {
          console.error(`Error upserting profile for ${studentEmail} (ID: ${studentUserId}):`, profileUpsertError);
          throw new Error(`Failed to upsert user profile for ${studentEmail}: ${profileUpsertError.message}`);
        }
        console.log(`Profile upserted/confirmed in public.users for ${studentEmail} (ID: ${studentUserId})`);

        updateLocalReceiptStatus(studentData['PAY ORDER NO.'], 'generating', undefined, undefined, studentUserId);


        // 2. Insert into student_info table (if not exists for this payOrderNo)
        const studentInfoPayload = {
          fee_receipt_no: studentData['PAY ORDER NO.'],
          date: studentData['DATE'],
          cat: studentData['CAT'],
          student_name: studentData['NAME OF THE STUDENT'],
          amount_in_words: studentData['IN WORDS'],
          year_and_course: studentData['YEAR & COURSE'],
          tuition_fee: studentData['TUITION FEE'],
          development_fee: studentData['DEV. FEE'],
          exam_fee: studentData['EXAM FEE'],
          enrollment_fee: studentData['ENROLLMENT FEE'],
          other_fee: studentData['OTHER FEE'],
          total_fee: studentData['TOTAL'],
          bank_name: studentData['BANK NAME'],
          pay_order_no: studentData['PAY ORDER NO.'], // Redundant with fee_receipt_no but schema has it
          user_id: studentUserId,
        };

        const { error: studentInfoError } = await supabase
          .from('student_info')
          .upsert(studentInfoPayload, { onConflict: 'fee_receipt_no' });

        if (studentInfoError) {
          console.error(`Error upserting student_info for ${studentData['PAY ORDER NO.']}: ${studentInfoError.message}`);
          // Decide if this is a critical failure
        }

        // 3. Generate DOCX Blob
        const docxContext = mapStudentDataToReceiptContext(studentData);
        const docxBlob = await processWordTemplate({ templateFile, studentData: docxContext });

        // 4. Upload DOCX to Supabase Storage
        updateLocalReceiptStatus(studentData['PAY ORDER NO.'], 'uploading');
        const filePath = `${studentUserId}/${studentData['PAY ORDER NO.']}_${Date.now()}.docx`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(supabaseStorageBucketName)
          .upload(filePath, docxBlob, {
            cacheControl: '3600',
            upsert: true, // Overwrite if exists
          });

        if (uploadError) throw new Error(`Storage upload error (${studentData['PAY ORDER NO.']}): ${uploadError.message}`);
        const storagePath = uploadData?.path;
        if (!storagePath) throw new Error(`Storage path not returned after upload (${studentData['PAY ORDER NO.']})`);

        // 5. Insert into generated_receipts table
        const generatedReceiptPayload = {
          student_fee_receipt_no: studentData['PAY ORDER NO.'],
          student_name: studentData['NAME OF THE STUDENT'],
          student_year_course: studentData['YEAR & COURSE'],
          pdf_storage_path: storagePath, // Schema uses pdf_storage_path, adapt if changed
          student_user_id: studentUserId,
          email_sent_status: false, // Default
        };
        const { error: dbInsertError } = await supabase
          .from('generated_receipts')
          .insert(generatedReceiptPayload);

        if (dbInsertError) throw new Error(`DB insert error for generated_receipts (${studentData['PAY ORDER NO.']}): ${dbInsertError.message}`);

        updateLocalReceiptStatus(studentData['PAY ORDER NO.'], 'completed', undefined, storagePath);

        // Update the receipt in the main list
        const completedReceipt: Receipt = {
          id: Date.now() + processedCount, // existing client ID or new
          studentName: studentData['NAME OF THE STUDENT'],
          email: studentEmail,
          studentEnrollmentId: studentPassword,
          payOrderNo: studentData['PAY ORDER NO.'],
          status: 'completed',
          sentStatus: false,
          generatedAt: new Date().toISOString(),
          docxContext: docxContext,
          storagePath: storagePath,
          userId: studentUserId,
        };
        // Find and update or add
        const existingIndex = generatedReceipts.findIndex(r => r.payOrderNo === studentData['PAY ORDER NO.']);
        if (existingIndex > -1) {
          updatedGeneratedReceipts[existingIndex] = completedReceipt;
        } else {
          updatedGeneratedReceipts.push(completedReceipt);
        }


      } catch (error: any) {
        console.error(`Failed processing for ${studentData['NAME OF THE STUDENT']}:`, error);
        toast({ title: "Processing Error", description: `Error for ${studentData['NAME OF THE STUDENT']}: ${error.message}`, variant: "destructive" });
        updateLocalReceiptStatus(studentData['PAY ORDER NO.'], 'failed', error.message);

        const failedReceipt: Receipt = {
          id: Date.now() + processedCount,
          studentName: studentData['NAME OF THE STUDENT'],
          email: studentData['EMAIL'],
          studentEnrollmentId: studentData['STUDENT_ENROLLMENT_ID'],
          payOrderNo: studentData['PAY ORDER NO.'],
          status: 'failed',
          sentStatus: false,
          generatedAt: new Date().toISOString(),
          docxContext: mapStudentDataToReceiptContext(studentData),
          uploadError: error.message,
        };
        const existingIndex = generatedReceipts.findIndex(r => r.payOrderNo === studentData['PAY ORDER NO.']);
        if (existingIndex > -1) {
          updatedGeneratedReceipts[existingIndex] = failedReceipt;
        } else {
          updatedGeneratedReceipts.push(failedReceipt);
        }

      } finally {
        processedCount++;
        setGenerationProgress((processedCount / totalSteps) * 100);
      }
    }
    setGeneratedReceipts(updatedGeneratedReceipts); // Final update to the list
    setIsProcessing(false);
    toast({ title: "Processing Complete", description: `${processedCount} receipts processed. Check status for details.` });
  };

  const handlePreviewReceipt = async (receipt: Receipt) => {
    if (!receipt.storagePath) {
      // Try to generate and download on the fly if not uploaded yet but template exists
      const templateFile = getTemplate();
      if (templateFile && receipt.docxContext) {
        try {
          toast({ title: "Generating Preview...", description: "Please wait." });
          const blob = await processWordTemplate({ templateFile, studentData: receipt.docxContext });
          saveAs(blob, `Receipt_${receipt.studentName.replace(/\s+/g, '_')}_${receipt.payOrderNo}.docx`);
        } catch (error) {
          toast({ title: "Preview Error", description: `Could not generate DOCX: ${(error as Error).message}`, variant: "destructive" });
        }
      } else {
        toast({ title: "Cannot Preview", description: "Receipt not uploaded or template missing.", variant: "destructive" });
      }
      return;
    }
    // Download from storage
    try {
      toast({ title: "Fetching from Storage...", description: "Please wait." });
      const { data: blob, error } = await supabase.storage
        .from(supabaseStorageBucketName)
        .download(receipt.storagePath);
      if (error) throw error;
      if (blob) {
        saveAs(blob, `Receipt_${receipt.studentName.replace(/\s+/g, '_')}_${receipt.payOrderNo}.docx`);
      }
    } catch (error) {
      console.error("Download error (DOCX):", error);
      toast({ title: "Download Error", description: `Could not download DOCX: ${(error as Error).message}`, variant: "destructive" });
    }
  };

  const handleDownloadAll = async () => {
    const receiptsToDownload = generatedReceipts.filter(r => r.status === 'completed' && r.storagePath);
    if (receiptsToDownload.length === 0) {
      toast({ title: "No Receipts", description: "No successfully uploaded receipts to download.", variant: "destructive" });
      return;
    }

    toast({ title: "Downloading All", description: `Starting download for ${receiptsToDownload.length} receipts.` });
    for (const receipt of receiptsToDownload) {
      if (receipt.storagePath) {
        try {
          const { data: blob, error } = await supabase.storage
            .from(supabaseStorageBucketName)
            .download(receipt.storagePath);
          if (error) throw error;
          if (blob) {
            saveAs(blob, `Receipt_${receipt.studentName.replace(/\s+/g, '_')}_${receipt.payOrderNo}.docx`);
            await new Promise(resolve => setTimeout(resolve, 300)); // Stagger downloads
          }
        } catch (error) {
          console.error(`Failed to download ${receipt.studentName}:`, error);
          toast({ title: "Download Error", description: `Could not download for ${receipt.studentName}.`, variant: "destructive" });
        }
      }
    }
    toast({ title: "Download All Complete", description: `Attempted to download ${receiptsToDownload.length} receipts.` });
  };

  const handleSendEmails = async () => { // Keep if needed
    const pendingReceipts = generatedReceipts.filter(r => r.status === 'completed' && r.email && !r.sentStatus && r.storagePath);
    if (pendingReceipts.length === 0) {
      toast({ title: "No Pending Emails", description: "All receipts sent or no emails/storage paths." });
      return;
    }
    toast({ title: "Sending Emails", description: `Starting email for ${pendingReceipts.length} receipts.` });
    // Email sending logic using receipt.docxContext (or fetch DOCX and attach if service supports)
    // For now, marks as sent:
    for (const receipt of pendingReceipts) {
      // Actual email sending would go here, possibly attaching the DOCX from storagePath
      // await sendReceiptEmail(receipt.email, receipt.studentName, receipt.docxContext, receipt.storagePath);
      setGeneratedReceipts(prev => prev.map(r => r.id === receipt.id ? { ...r, sentStatus: true } : r));
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    toast({ title: "Email Sending Simulated", description: `${pendingReceipts.length} marked as sent.` });
  };

  const handleDeleteReceipt = async (receiptToDelete: Receipt) => { // Now deletes from Supabase too
    try {
      if (receiptToDelete.storagePath) {
        const { error: storageError } = await supabase.storage
          .from(supabaseStorageBucketName)
          .remove([receiptToDelete.storagePath]);
        if (storageError) {
          console.warn(`Could not delete from storage ${receiptToDelete.storagePath}: ${storageError.message}. Proceeding to delete DB record.`);
        }
      }

      const { error: dbError } = await supabase.from('generated_receipts')
        .delete()
        .match({ student_fee_receipt_no: receiptToDelete.payOrderNo, student_user_id: receiptToDelete.userId });

      if (dbError) throw new Error(`DB delete error: ${dbError.message}`);

      // Also consider deleting from student_info if this receipt (payOrderNo) should be fully purged
      // const { error: studentInfoDeleteError } = await supabase.from('student_info')
      //   .delete()
      //   .match({ fee_receipt_no: receiptToDelete.payOrderNo });
      // if (studentInfoDeleteError) console.warn("Error deleting from student_info: " + studentInfoDeleteError.message);


      setGeneratedReceipts(prev => prev.filter(r => r.id !== receiptToDelete.id));
      toast({ title: "Receipt Deleted", description: "Successfully deleted from system." });

    } catch (error) {
      console.error("Error deleting receipt:", error);
      toast({ title: "Deletion Failed", description: (error as Error).message, variant: "destructive" });
    }
  };

  const stats = {
    totalParsed: studentCsvDataList.length,
    totalCompleted: generatedReceipts.filter(r => r.status === 'completed').length,
    totalFailed: generatedReceipts.filter(r => r.status === 'failed').length,
    emailsSent: generatedReceipts.filter(r => r.sentStatus).length,
  };


  return (
    <div className="min-h-screen bg-gray-50">
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
              <CardTitle className="text-sm font-medium">Students in CSV</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalParsed}</div>
              <p className="text-xs text-muted-foreground">From uploaded data</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receipts Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalCompleted}</div>
              <p className="text-xs text-muted-foreground">Generated & Uploaded</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing Failed</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.totalFailed}</div>
              <p className="text-xs text-muted-foreground">Check logs/status</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
              <Mail className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.emailsSent}</div>
              <p className="text-xs text-muted-foreground">(Simulated)</p>
            </CardContent>
          </Card>
        </div>

        {/* Validation Errors Display */}
        {validationErrors.length > 0 && (
          <Card className="mb-8 border-red-200">
            <CardHeader><CardTitle className="text-red-800">CSV Header Validation Errors</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-red-600 text-sm">
                {validationErrors.map((field, index) => <li key={index}>{field}</li>)}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Data Preview (simplified) */}
        {studentCsvDataList.length > 0 && validationErrors.length === 0 && (
          <Card className="mb-8">
            <CardHeader><CardTitle>Data Preview (CSV)</CardTitle></CardHeader>
            <CardContent className="bg-green-50 p-4 rounded-lg text-green-700">
              Found {studentCsvDataList.length} student records. Ready for processing.
              Sample: {studentCsvDataList[0]?.['NAME OF THE STUDENT']} - {studentCsvDataList[0]?.['STUDENT_ENROLLMENT_ID']}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Process Data</TabsTrigger>
            <TabsTrigger value="manage">Manage Receipts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" /><span>File Upload</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FileUploadZone
                    title="Word Template (.docx)"
                    description="Upload .docx receipt template"
                    acceptedTypes=".docx"
                    onFileUpload={(file) => handleFileUpload({ template: file })}
                    onFileRemove={() => {
                      setUploadedFiles(prev => ({ ...prev, template: null }));
                      storeTemplateInUtil(null);
                    }}
                    uploadedFile={uploadedFiles.template}
                  />
                  <FileUploadZone
                    title="Student Data Sheet (.csv)"
                    description="Upload .csv with student data (Headers: {REQUIRED_FIELDS.join(', ')})"
                    acceptedTypes=".csv" // Simplified to CSV for robust parsing
                    onFileUpload={(file) => handleFileUpload({ dataSheet: file })}
                    onFileRemove={() => {
                      setUploadedFiles(prev => ({ ...prev, dataSheet: null }));
                      setStudentCsvDataList([]);
                      setGeneratedReceipts([]);
                      setValidationErrors([]);
                      setGenerationProgress(0);
                    }}
                    uploadedFile={uploadedFiles.dataSheet}
                  />
                </div>

                {uploadedFiles.dataSheet && studentCsvDataList.length > 0 && validationErrors.length === 0 && (
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-4">Ready to Process</h3>
                    {isProcessing && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-blue-700 mb-2">
                          <span>Processing receipts...</span>
                          <span>{Math.round(generationProgress)}%</span>
                        </div>
                        <Progress value={generationProgress} className="h-2" />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4">
                      <Button
                        onClick={handleGenerateAndUploadReceipts}
                        disabled={isProcessing || !uploadedFiles.template || studentCsvDataList.length === 0 || validationErrors.length > 0}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Generate & Upload All to Supabase
                      </Button>
                      {generatedReceipts.filter(r => r.status === 'completed').length > 0 && !isProcessing && (
                        <>
                          <Button onClick={handleSendEmails} className="bg-green-600 hover:bg-green-700"
                            disabled={generatedReceipts.filter(r => r.status === 'completed' && !r.sentStatus && r.email).length === 0}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Send All Emails ({generatedReceipts.filter(r => r.status === 'completed' && !r.sentStatus && r.email).length})
                          </Button>
                          <Button onClick={handleDownloadAll} variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download All (from Supabase)
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
            <ReceiptList
              receipts={generatedReceipts}
              onDelete={handleDeleteReceipt} // Pass the correct receipt object
              onPreview={handlePreviewReceipt}
              isTemplateUploaded={!!uploadedFiles.template} // To determine if preview-on-the-fly is possible
            />
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
      {/* 
     ReceiptPreviewDialog is removed / rethought. 
     If used, it needs to be adapted for DOCX download trigger.
     For simplicity, direct download on preview click might be better.
   */}
    </div>
  );
};

export default AdminDashboard;