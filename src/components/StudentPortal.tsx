
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Download, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  LogOut,
  GraduationCap,
  User,
  Mail,
  Calendar,
  DollarSign
} from 'lucide-react';

interface StudentData {
  name: string;
  email: string;
  rollNumber: string;
  receipt?: {
    id: number;
    status: 'available' | 'generating' | 'not_available';
    generatedAt?: string;
    amount?: number;
    semester?: string;
    isDeleted: boolean;
  };
}

interface StudentPortalProps {
  onLogout: () => void;
  studentEmail?: string;
}

const StudentPortal = ({ onLogout, studentEmail = 'student@university.edu' }: StudentPortalProps) => {
  const [student, setStudent] = useState<StudentData>({
    name: 'Student User',
    email: studentEmail,
    rollNumber: 'STU001',
    receipt: {
      id: 1,
      status: 'not_available',
      isDeleted: false
    }
  });

  // Simulate fetching student data based on logged-in email
  useEffect(() => {
    // In a real app, this would fetch from your backend/database
    const fetchStudentData = () => {
      // Check if there are any receipts generated for this student
      const savedReceipts = localStorage.getItem('generatedReceipts');
      if (savedReceipts) {
        try {
          const receipts = JSON.parse(savedReceipts);
          const studentReceipt = receipts.find((r: any) => 
            r.email.toLowerCase() === studentEmail.toLowerCase()
          );
          
          if (studentReceipt) {
            setStudent({
              name: studentReceipt.studentName,
              email: studentReceipt.email,
              rollNumber: studentReceipt.rollNumber,
              receipt: {
                id: studentReceipt.id,
                status: 'available',
                generatedAt: studentReceipt.generatedAt,
                amount: studentReceipt.amount || 5000,
                semester: studentReceipt.semester || 'Current Semester',
                isDeleted: false
              }
            });
          }
        } catch (error) {
          console.error('Error parsing receipts:', error);
        }
      }
    };

    fetchStudentData();
    
    // Listen for storage changes (when admin generates new receipts)
    const handleStorageChange = () => {
      fetchStudentData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [studentEmail]);

  const handleDownloadReceipt = () => {
    if (student.receipt?.status === 'available' && !student.receipt.isDeleted) {
      toast({
        title: "Download Started",
        description: "Your fee receipt is being downloaded.",
      });
      
      // Simulate PDF download
      setTimeout(() => {
        // Create a mock PDF download
        const link = document.createElement('a');
        link.href = '#'; // In real app, this would be the actual PDF URL
        link.download = `receipt_${student.rollNumber}_${new Date().getTime()}.pdf`;
        
        toast({
          title: "Download Complete",
          description: "Receipt saved to your downloads folder.",
        });
      }, 1500);
    }
  };

  const handleRequestEmail = () => {
    toast({
      title: "Email Requested",
      description: "A copy of your receipt will be sent to your email address.",
    });
  };

  const getStatusBadge = () => {
    const receipt = student.receipt;
    
    if (!receipt || receipt.isDeleted) {
      return <Badge variant="destructive">Not Available</Badge>;
    }
    
    switch (receipt.status) {
      case 'available':
        return <Badge variant="default" className="bg-green-600">Available</Badge>;
      case 'generating':
        return <Badge variant="secondary">Generating</Badge>;
      case 'not_available':
        return <Badge variant="destructive">Not Generated</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = () => {
    const receipt = student.receipt;
    
    if (!receipt || receipt.isDeleted) {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
    
    switch (receipt.status) {
      case 'available':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'generating':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'not_available':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const canDownload = student.receipt?.status === 'available' && !student.receipt.isDeleted;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Student Portal</h1>
                <p className="text-sm text-gray-500">Fee Receipt Access</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Student
              </Badge>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {student.name}
          </h2>
          <p className="text-gray-600">
            Access and download your fee receipts from this secure portal.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Student Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Student Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{student.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{student.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Roll Number</p>
                    <p className="font-medium">{student.rollNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Receipt Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Fee Receipt</span>
                  </div>
                  {getStatusBadge()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!student.receipt || student.receipt.isDeleted ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Receipt Not Available</h3>
                    <p className="text-gray-600">
                      No receipt has been generated for your account yet. 
                      Please contact the administration office if you believe this is an error.
                    </p>
                  </div>
                ) : student.receipt.status === 'generating' ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Receipt Being Generated</h3>
                    <p className="text-gray-600">
                      Your receipt is currently being processed. Please check back shortly.
                    </p>
                  </div>
                ) : student.receipt.status === 'not_available' ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Receipt Available</h3>
                    <p className="text-gray-600">
                      No fee receipt has been generated for your account yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Receipt Details */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        {getStatusIcon()}
                        <h3 className="font-semibold text-green-900">Receipt Available</h3>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        {student.receipt.generatedAt && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-green-600" />
                            <div>
                              <span className="text-green-700">Generated: </span>
                              <span className="font-medium">{student.receipt.generatedAt}</span>
                            </div>
                          </div>
                        )}
                        
                        {student.receipt.amount && (
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <div>
                              <span className="text-green-700">Amount: </span>
                              <span className="font-medium">₹{student.receipt.amount}</span>
                            </div>
                          </div>
                        )}
                        
                        {student.receipt.semester && (
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-green-600" />
                            <div>
                              <span className="text-green-700">Semester: </span>
                              <span className="font-medium">{student.receipt.semester}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Download Section */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        onClick={handleDownloadReceipt}
                        disabled={!canDownload}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Receipt PDF
                      </Button>
                      
                      <Button variant="outline" onClick={handleRequestEmail}>
                        <Mail className="h-4 w-4 mr-2" />
                        Request Email Copy
                      </Button>
                    </div>

                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                      <strong>Note:</strong> Keep your receipt safe for your records. 
                      If you encounter any issues with the download, please contact the administration office.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Help Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p><strong>Q:</strong> I can't download my receipt. What should I do?</p>
                  <p className="text-gray-600 ml-4">
                    Ensure you're using a supported browser and have a stable internet connection. 
                    If the issue persists, contact the administration.
                  </p>
                  
                  <p><strong>Q:</strong> My receipt shows incorrect information.</p>
                  <p className="text-gray-600 ml-4">
                    Please contact the administration office immediately to report any discrepancies.
                  </p>
                  
                  <p><strong>Q:</strong> Can I get multiple copies of my receipt?</p>
                  <p className="text-gray-600 ml-4">
                    Yes, you can download your receipt multiple times or request an email copy.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentPortal;
