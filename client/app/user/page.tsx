'use client';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Upload, Book, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type SelectedFiles = {
  syllabus: File[];
  pyq: File[];
  notes: File[];
};

type UploadType = {
  type: keyof SelectedFiles;
  title: string;
  desc: string;
};

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

const UserPage = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [subject, setSubject] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState<Record<keyof SelectedFiles, boolean>>({
    syllabus: false,
    pyq: false,
    notes: false
  });
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFiles>({
    syllabus: [],
    pyq: [],
    notes: []
  });



  const fileInputRefs: Record<keyof SelectedFiles, React.RefObject<HTMLInputElement | null>> = {
    syllabus: useRef<HTMLInputElement | null>(null),
    pyq: useRef<HTMLInputElement | null>(null),
    notes: useRef<HTMLInputElement | null>(null)
  };

  useEffect(() => {
    fetchProfile();
  }, []);


  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        setProfile(profile);
      }
    } catch (error) {
      console.log('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateUploads = (selectedFiles: SelectedFiles, subject: string): ValidationResult => {
    const errors: string[] = [];
    
    // Check if subject is entered
    if (!subject.trim()) {
      errors.push("Please enter a subject name");
    }
  
    // Check if at least one file is uploaded in each category
    if (selectedFiles.syllabus.length === 0) {
      errors.push("Please upload at least one Syllabus PDF");
    }
    
    if (selectedFiles.pyq.length === 0) {
      errors.push("Please upload at least one PYQ paper PDF");
    }
    
    if (selectedFiles.notes.length === 0) {
      errors.push("Please upload at least one Notes PDF");
    }
  
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  
  // passing the tokens via body not headers     
  async function sendData (accessToken: string, refreshToken: string,userId:string,subject:string)  {

    console.log("access token:",accessToken);
    console.log("refresh token:",refreshToken);
    try {
      const response = await fetch('https://studygpt-z5rq.onrender.com/models/upload ', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          subject: subject,
          token: {
            access_token: accessToken,
            refresh_token: refreshToken
          }
        })
      });
      
      if (!response.ok) 
      {
        const errorText = await response.text();
        console.error('Token verification failed:', response.status, errorText);
        throw new Error(`Token verification failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error('Error in sendTokens:', error);
    }
  };

 

  const uploadToSupabase = async (file: File, type: keyof SelectedFiles) => {
    if (!subject.trim()) {
      alert('Please enter a subject before uploading files');
      return false;
    }
  
    try {
      const { data: { user } } = await supabase.auth.getUser();
  
      if (!user) {
        console.log("No active session or user found");
        return false;
      }
  
      setUploadLoading(prev => ({ ...prev, [type]: true }));
  
      // IMPORTANT MODIFICATION: Clear existing files for this subject and type before uploading
      const existingFiles = await supabase.storage
        .from('study_materials')
        .list(`${user.id}/${subject}/${type}/`);
  
      // Delete all existing files in this specific subject and type folder
      if (existingFiles.data?.length) {
        const filesToDelete = existingFiles.data.map(
          file => `${user.id}/${subject}/${type}/${file.name}`
        );
        
        const { error: deleteError } = await supabase.storage
          .from('study_materials')
          .remove(filesToDelete);
  
        if (deleteError) {
          console.error('Error clearing existing files:', deleteError);
          // Optionally, you might want to handle this error more robustly
        }
      }
  
      const timestamp = new Date().getTime();
      const fileName = `${user.id}/${subject}/${type}/${file.name}`;
  
      const { error } = await supabase.storage
        .from('study_materials')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
  
      if (error) throw error;
  
      setUploadLoading(prev => ({ ...prev, [type]: false }));
      return true;
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadLoading(prev => ({ ...prev, [type]: false }));
      return false;
    }
  };

  const handleFileSelect = async (type: keyof SelectedFiles, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      
      // Add new files to existing array
      setSelectedFiles(prev => ({
        ...prev,
        [type]: [...prev[type], ...fileArray]
      }));

      // Upload each file
      let successCount = 0;
      for (const file of fileArray) {
        const success = await uploadToSupabase(file, type);
        if (success) successCount++;
      }
      
      setUploadLoading(prev => ({ ...prev, [type]: false }));
    }
  }; 

  const handleUploadClick = (type: keyof SelectedFiles) => {
    if (!subject.trim()) {
      setErrorMessage('Please enter a subject before uploading files');
      return;
    }
    setErrorMessage(null); // Clear error message if subject is valid
    if (fileInputRefs[type].current) {
      fileInputRefs[type].current.click();
    }
};

const handleDeleteFile = async (type: keyof SelectedFiles, index: number) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error("No active session or user found");
      return;
    }

    // Get the file to delete
    const fileToDelete = selectedFiles[type][index];
    const filePath = `${user.id}/${subject}/${type}/${fileToDelete.name}`;

    // Delete the file from Supabase
    const { error } = await supabase.storage
      .from('study_materials')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file from Supabase:', error);
      return;
    }

    // Update the selectedFiles state to remove the file
    setSelectedFiles(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));

    console.log(`File ${fileToDelete.name} successfully deleted`);
  } catch (error) {
    console.error('Error in handleDeleteFile:', error);
  }
};


const handleUploadButton = async () => {
  try {
    // First validate all requirements
    const validation = validateUploads(selectedFiles, subject);
    
    if (!validation.isValid) {
      setErrorMessage(validation.errors.join('\n'));
      return; // Stop execution if validation fails
    }

    // Clear any existing error messages
    setErrorMessage(null);

    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !session) {
      setErrorMessage("Session expired. Please login again.");
      return;
    }

    // Show loading state
    setUploadLoading({
      syllabus: true,
      pyq: true,
      notes: true
    });

    // Send data to backend
    await sendData(session.access_token, session.refresh_token, user.id, subject);

    // If everything is successful, navigate to next page
    router.push('/preparation');
  } catch (error) {
    console.error('Error in handleUploadButton:', error);
    setErrorMessage("An error occurred while processing your upload. Please try again.");
  } finally {
    // Reset loading state
    setUploadLoading({
      syllabus: false,
      pyq: false,
      notes: false
    });
  }
};

const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8C5A]"></div>
      <p className="mt-4 text-gray-700">Processing your uploads...</p>
    </div>
  </div>
);

  const uploadTypes: UploadType[] = [
    { type: 'syllabus', title: "Syllabus", desc: "Upload your syllabus pdf" },
    { type: 'pyq', title: "PYQ papers", desc: "Upload all the PYQ's papers pdf" },
    { type: 'notes', title: "Notes", desc: "Upload all module's study notes pdf" }
  ];

  
  return (
    <div className="min-h-screen bg-[#125774] relative overflow-hidden">
    {/* Navbar */}
    <nav className="relative z-10 flex items-center h-20">
      <div className="w-1/2 h-full flex items-center pl-8" style={{ background: "rgba(255, 140, 90, 1)" }}>
        <div className="flex items-center gap-2">
          <Book className="h-6 w-6 text-gray-800" />
          <div className="text-2xl font-bold">
            <span className="font-montserrat text-white">Study</span>
            <span className="font-montserrat" style={{ color: "rgba(18, 87, 116, 1)" }}>GPT</span>
          </div>
        </div>
      </div>
      <div className="w-1/2 h-full bg-white" />
    </nav>

    <div className="container mx-auto p-4">
      {/* Welcome Section with Centered Layout */}
      <div className="flex justify-center items-start gap-4 mt-20">
        {/* Profile Section */}
        <div className="flex items-start gap-8">
          {/* Profile Picture */}
          <div className="w-40 h-40 rounded-full overflow-hidden bg-white flex-shrink-0">
            <img
              src="/assets/pfp.png"
              alt="Profile Picture"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Welcome Text */}
          <div>
            <div className="w-[568px] h-[130px] rounded-[30px_0_0_0] p-6"
              style={{ background: "rgba(218, 236, 244, 0.49)" }}>
              <h2 className="text-4xl font-bold text-white mb-2">
                HEY {profile?.full_name?.toLocaleUpperCase()}👋
              </h2>
            </div>
            <p className="text-white/90 mt-2 text-lg font-semibold">
              Organize, share, and succeed — all in one place!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 ml-8">
            <button
              className="flex items-center gap-12 px-12 py-7 rounded-[20px] shadow-lg transition-transform transform hover:scale-105 hover:shadow-xl"
              style={{
                background: "linear-gradient(135deg, rgba(218, 236, 244, 0.8), rgba(173, 216, 230, 0.8))",
              }}
              onClick={handleUploadButton}
              disabled={Object.values(uploadLoading).some(loading => loading)}
            >
              <span className="text-white text-2xl font-semibold">
                {Object.values(uploadLoading).some(loading => loading) 
                  ? "Processing..." 
                  : "Done Uploading? Let's Proceed"}
              </span>
            </button>

            <button
              className="flex items-center gap-12 px-12 py-7 rounded-[20px] shadow-lg transition-transform transform hover:scale-105 hover:shadow-xl"
              style={{
                background: "linear-gradient(135deg, rgba(218, 236, 244, 0.8), rgba(173, 216, 230, 0.8))",
              }}
              onClick={() => router.push('/schedule')}
            >
              <span className="text-white text-2xl font-semibold">
                Continue to Dashboard 🚀
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Section - Centered */}
      <div className="mt-16 flex flex-col items-center">
        <h3 className="text-[#FF8C5A] text-2xl font-bold mb-6">
          Upload your essentials:
        </h3>

        {/* Subject Input */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Enter subject name"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-[465px] px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/60 border-2 border-white/20 focus:outline-none focus:border-[#FF8C5A]"
          />
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="fixed top-5 right-5 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg max-w-md">
            {errorMessage.split('\n').map((error, index) => (
              <p key={index} className="mb-1">{error}</p>
            ))}
          </div>
        )}

        {/* Step Indicators */}
        <div className="flex justify-center items-center gap-10 mb-10">
          {[0, 1, 2].map((step) => (
            <div
              key={step}
              className={`w-6 h-6 rounded-full transition ${
                activeStep === step ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>

          {/* Updated Upload Boxes with improved scrollbar */}
          <div className="flex flex-row gap-10">
            {uploadTypes.map(({ type, title, desc }) => (
              <div key={type}>
                <input
                  type="file"
                  ref={fileInputRefs[type]}
                  accept=".pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(type, e)}
                />

                <div
                  className="w-[465px] h-[347px] p-6 cursor-pointer rounded-[30px] relative"
                  style={{
                    border: "6px solid rgba(245, 245, 245, 1)",
                    background: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(8px)",
                  }}
                  onClick={() => {
                    setActiveStep(uploadTypes.findIndex(t => t.type === type));
                    handleUploadClick(type);
                  }}
                >
                  <h4 className="text-white text-2xl font-semibold mb-2 mt-5">
                    {title}
                  </h4>
                  <p className="text-white/80 text-lg font-medium mb-4 mt-5">
                    {desc}
                  </p>

                  {/* Updated files list with custom scrollbar */}
                  {selectedFiles[type].length > 0 && (
                    <div 
                      className="space-y-2 mb-4 max-h-[120px] overflow-y-auto pr-2"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
                      }}
                    >
                      <style jsx>{`
                        div::-webkit-scrollbar {
                          width: 6px;
                        }
                        div::-webkit-scrollbar-track {
                          background: transparent;
                        }
                        div::-webkit-scrollbar-thumb {
                          background-color: rgba(255, 255, 255, 0.3);
                          border-radius: 20px;
                        }
                      `}</style>
                      {selectedFiles[type].map((file, index) => (
                        <div key={index} 
                          className="flex items-center justify-between p-2 bg-white/20 rounded backdrop-blur-sm"
                          style={{
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          <p className="text-white text-sm truncate max-w-[300px]">
                            {file.name}
                          </p>
                          <X
                            className="h-5 w-5 text-white cursor-pointer flex-shrink-0 hover:text-red-300 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(type, index);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    className="w-full bg-[#FF8C5A] text-white py-4 rounded-lg flex items-center justify-center gap-2 mt-auto hover:bg-[#ff7a40] transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUploadClick(type);
                    }}
                  >
                    <Upload className="h-5 w-5" />
                    Upload Multiple PDFs
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;