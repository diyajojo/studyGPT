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

const UserPage = () => {
  const router = useRouter();
  const [isUploadComplete, setIsUploadComplete] = useState<boolean>(false);
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

  // passing the tokens via body not headers
  const sendData = async (accessToken: string, refreshToken: string,userId:string,subject:string) => {

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
      return;
    }
  
    try {
      // Get session and user details
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
  
      if (!session || !user) 
      {
        console.log("No active session or user found");
        return false;
      }
  
      await sendData(session.access_token, session.refresh_token, user.id, subject);
  
      setUploadLoading(prev => ({ ...prev, [type]: true }));
  
      const timestamp = new Date().getTime();
      const fileName = `${user.id}/${subject}/${type}/${timestamp}-${file.name}`;
  
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

      // Show upload results
      //if (successCount === fileArray.length) {
       // alert(`All ${fileArray.length} files uploaded successfully!`);
     // } else {
       // alert(`${successCount} out of ${fileArray.length} files uploaded successfully.`);
     // }
      
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

  const handleDeleteFile = (type: keyof SelectedFiles, index: number) => {
    setSelectedFiles(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleUploadButton=()=>{
    router.push('/preparation');
  }

  const uploadTypes: UploadType[] = [
    { type: 'syllabus', title: "Syllabus", desc: "Upload your syllabus pdf" },
    { type: 'pyq', title: "PYQ papers", desc: "Upload all the PYQ's papers pdf" },
    { type: 'notes', title: "Notes", desc: "Upload all module's study notes pdf" }
  ];
  return (
    <div className="min-h-screen bg-[#125774] relative overflow-hidden">
      {/* Navbar remains the same */}
      <nav className="relative z-10 flex items-center h-20">
        <div
          className="w-1/2 h-full flex items-center pl-8"
          style={{ background: "rgba(255, 140, 90, 1)" }}
        >
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

      <div className="container mx-auto relative">
        {/* Welcome Section with adjusted spacing and larger profile picture */}
        <div className="flex items-start gap-4 mt-20">
          <div className="w-40 h-40 rounded-full overflow-hidden bg-white flex-shrink-0">
          <Image
              src="/assets/pfp.png"
              alt="Profile Picture"
              width={240}
              height={240}
              className="object-cover w-full h-full"
            />
          </div>

          <div className="flex flex-col ml-4">
            <div
              className="w-[568px] h-[130px] rounded-[30px_0_0_0] p-6"
              style={{
                background: "rgba(218, 236, 244, 0.49)",
              }}
            >
              <h2 className="text-4xl font-bold text-white mb-2">
                HEY {profile?.full_name.toLocaleUpperCase()}👋
              </h2>
            </div>
            <p className="text-white/90 mt-2 text-lg font-semibold">
              Organize, share, and succeed — all in one place!
            </p>
          </div>

        </div>

        {/* Upload Section with improved scrollbar styling */}
        <div className="mt-16 ml-8">
          <h3 className="text-[#FF8C5A] text-2xl font-bold mb-6 flex justify-center">
            Upload your essentials:
          </h3>

          {/* Subject Input Field remains the same */}
          <div className="mb-8 flex justify-center">
            <input
              type="text"
              placeholder="Enter subject name"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-[465px] px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/60 border-2 border-white/20 focus:outline-none focus:border-[#FF8C5A]"
            />
          </div>

          {errorMessage && (
      <div className="text-red-500 text-center mb-4">
        {errorMessage}
      </div>
          )}

          {/* Step Bar remains the same */}
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

      <div className="flex justify-center mt-8">
          <button
            className="flex items-center gap-12 px-12 py-7 rounded-[20px]"
            style={{
              background: "rgba(218, 236, 244, 0.49)",
            }}
            onClick={handleUploadButton} // Ensure this function navigates to the desired next step
          >
            <span className="text-white font-semibold">Done Uploading? Let's Proceed</span>
          </button>
        </div>


      {/* Laptop Image remains the same 
      <div className="absolute right-0 top-[100px] w-[700px] h-[700px]">
        <Image
          src="/assets/userpg.png"
          alt="Laptop"
          width={700}
          height={700}
          className="object-contain"
        />
      </div> */}
    </div>
  );
};

export default UserPage;