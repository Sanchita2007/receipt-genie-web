// src/components/StudentPortal.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge'; // Badge seems unused
import { toast } from '@/hooks/use-toast';
import { Download, LogOut, GraduationCap } from 'lucide-react'; // Simplified imports
import { supabase, supabaseStorageBucketName } from '@/supabaseClient';
import { saveAs } from 'file-saver';
import { Session, User as SupabaseUser } from '@supabase/supabase-js'; // Explicitly import User

interface FetchedReceipt {
  id: number;
  student_name: string;
  student_year_course: string;
  generated_at: string;
  pdf_storage_path: string; // This is the docx_storage_path
  student_fee_receipt_no: string;
}

interface UserProfileData {
  name: string;
  email: string;
  // rollNumber: string; // Removed as it's not directly fetched/used this way
}

interface StudentPortalProps {
  onLogout: () => void;
  studentEmail?: string; // Can be derived from session
  session: Session | null;
}

const StudentPortal = ({ onLogout, session }: StudentPortalProps) => {
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [receipts, setReceipts] = useState<FetchedReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null); // For displaying errors

  useEffect(() => {
    const fetchStudentDataAndReceipts = async () => {
      setIsLoading(true);
      setErrorState(null); // Reset error state on new fetch attempt

      const currentUser: SupabaseUser | undefined = session?.user;

      if (!currentUser) {
        setErrorState("No active session. Please log in.");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch user profile from public.users
        console.log(`Fetching profile for user ID: ${currentUser.id}`);
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', currentUser.id)
          .single(); // .single() will error if 0 or >1 rows.

        if (profileError) {
          // PGRST116 means "JSON object requested, multiple (or no) rows returned"
          if (profileError.code === 'PGRST116') {
            console.error(`Profile not found in public.users for ID: ${currentUser.id}`, profileError);
            setErrorState(`Your user profile could not be found. Please contact support. (User ID: ${currentUser.id})`);
          } else {
            console.error('Error fetching student profile:', profileError);
            setErrorState(`Error loading profile: ${profileError.message}`);
          }
          // Do not proceed if profile fetch failed
          setIsLoading(false);
          return;
        }

        // If profileError was null, profileData should exist due to .single()
        if (!profileData) { // Defensive check, should be caught by profileError
            console.error(`Profile data is unexpectedly null for ID: ${currentUser.id}`);
            setErrorState("Profile data is missing after successful fetch. Contact support.");
            setIsLoading(false);
            return;
        }
        
        setUserProfile({
            name: profileData.full_name || currentUser.email || 'Student User', // Fallback name
            email: profileData.email || currentUser.email || 'No email found', // Fallback email
        });
        console.log("Profile data fetched:", profileData);

        // Fetch receipts from generated_receipts
        console.log(`Fetching receipts for user ID: ${currentUser.id}`);
        const { data: receiptsData, error: receiptsError } = await supabase
          .from('generated_receipts')
          .select('id, student_name, student_year_course, generated_at, pdf_storage_path, student_fee_receipt_no') // Select specific columns
          .eq('student_user_id', currentUser.id)
          .order('generated_at', { ascending: false });

        if (receiptsError) {
          console.error('Error fetching receipts:', receiptsError);
          // Don't set main errorState here if profile loaded, receipts can be empty or fail separately
          toast({ title: "Receipts Error", description: `Could not load receipts: ${receiptsError.message}`, variant: "destructive" });
          setReceipts([]); // Set to empty array on error
        } else {
          setReceipts(receiptsData || []);
          console.log("Receipts data fetched:", receiptsData);
        }

      } catch (error: any) { // Catch any unexpected errors from the try block itself
        console.error('Unexpected error in fetchStudentDataAndReceipts:', error);
        setErrorState(`An unexpected error occurred: ${error.message}`);
        // toast({ title: "Unexpected Error", description: "An unexpected error occurred while loading your data.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    if (session) { // Only fetch if session exists
        fetchStudentDataAndReceipts();
    } else {
        setErrorState("No active session. Please log in.");
        setIsLoading(false);
    }
  }, [session]); // Re-run effect when session changes

  const handleDownloadReceipt = async (receipt: FetchedReceipt) => {
    if (!receipt.pdf_storage_path) {
      toast({ title: "Error", description: "Receipt file path not found.", variant: "destructive" });
      return;
    }
    try {
      toast({ title: "Downloading...", description: "Your receipt is being downloaded." });
      const { data: blob, error } = await supabase.storage
        .from(supabaseStorageBucketName) // Ensure this is correctly imported and set
        .download(receipt.pdf_storage_path);

      if (error) {
          console.error("Supabase storage download error:", error);
          toast({ title: "Download Failed", description: `Could not download: ${error.message}. Check permissions or file path.`, variant: "destructive" });
          return;
      };
      if (blob) {
        saveAs(blob, `Receipt_${receipt.student_name.replace(/\s+/g, '_')}_${receipt.student_fee_receipt_no}.docx`);
        toast({ title: "Download Complete", description: "Receipt saved." });
      } else {
        toast({ title: "Download Issue", description: "Downloaded file data is empty.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error('Error downloading receipt:', error);
      toast({ title: "Download Failed", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading student portal...</p></div>;
  }

  if (errorState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-600 mb-4">{errorState}</p>
        <Button onClick={onLogout}>Logout and Try Again</Button>
      </div>
    );
  }

  if (!userProfile) {
    // This case should ideally be covered by isLoading or errorState,
    // but as a fallback:
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p>Could not load student profile data. Please ensure your profile is set up correctly.</p>
        <Button onClick={onLogout}>Logout</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-600 rounded-lg"><GraduationCap className="h-6 w-6 text-white" /></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Student Portal</h1>
                <p className="text-sm text-gray-500">Welcome, {userProfile.name}</p>
              </div>
            </div>
            <Button variant="outline" onClick={onLogout}><LogOut className="h-4 w-4 mr-2" />Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader><CardTitle>My Profile</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Name:</strong> {userProfile.name}</p>
            <p><strong>Email:</strong> {userProfile.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>My Fee Receipts</CardTitle></CardHeader>
          <CardContent>
            {receipts.length === 0 ? (
              <p>No receipts found for your account at this time.</p>
            ) : (
              <ul className="space-y-4">
                {receipts.map((receipt) => (
                  <li key={receipt.id} className="p-4 border rounded-md flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="flex-grow">
                      <p className="font-semibold">Receipt (PO No: {receipt.student_fee_receipt_no})</p>
                      <p className="text-sm text-gray-600">Generated: {new Date(receipt.generated_at).toLocaleDateString()}</p>
                      {receipt.student_year_course && <p className="text-sm text-gray-600">Course: {receipt.student_year_course}</p>}
                    </div>
                    <Button 
                      onClick={() => handleDownloadReceipt(receipt)} 
                      disabled={!receipt.pdf_storage_path}
                      className="w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4 mr-2" /> Download DOCX
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-lg">Need Help?</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">If you have any questions or cannot find your receipt, please contact the administration office.</p>
          </CardContent>
        </Card>
      </main>
      <footer className="mt-10 border-t pt-4 text-sm text-gray-500 text-center">
      <p>Developed by <strong>Sanchita Jarare</strong> and <strong>Atharva Jagtap</strong> © 2025.</p>
      </footer>

    </div>
  );
};

export default StudentPortal;