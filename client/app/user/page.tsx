'use client';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Upload, Book } from 'lucide-react';

// Define types
type SelectedFiles = {
  syllabus: File | null;
  pyq: File | null;
  notes: File | null;
};

type UploadType = {
  type: keyof SelectedFiles;
  title: string;
  desc: string;
};

const UserPage = () => {
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadLoading, setUploadLoading] = useState<Record<keyof SelectedFiles, boolean>>({
    syllabus: false,
    pyq: false,
    notes: false
  });
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFiles>({
    syllabus: null,
    pyq: null,
    notes: null
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

  const uploadToSupabase = async (file: File, type: keyof SelectedFiles) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      setUploadLoading(prev => ({ ...prev, [type]: true }));

      // Create a unique file name using timestamp and original name
      const timestamp = new Date().getTime();
      const fileName = `${user.id}/${type}/${timestamp}-${file.name}`;

      // Upload file to Supabase Storage
      const { error } = await supabase.storage
        .from('study_materials')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      alert(`${type} uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Error uploading ${type}. Please try again.`);
    } finally {
      setUploadLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleFileSelect = async (type: keyof SelectedFiles, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFiles(prev => ({
        ...prev,
        [type]: file
      }));
      
      // Upload file immediately after selection
      await uploadToSupabase(file, type);
    }
  };

  const handleUploadClick = (type: keyof SelectedFiles) => {
    fileInputRefs[type].current?.click();
  };

  const uploadTypes: UploadType[] = [
    { type: 'syllabus', title: "Syllabus", desc: "Upload your syllabus pdf" },
    { type: 'pyq', title: "PYQ papers", desc: "Upload your PYQ pdf" },
    { type: 'notes', title: "Notes", desc: "Upload your study notes pdf" }
  ];

  return (
    <div className="min-h-screen bg-[#125774] relative overflow-hidden">
      {/* Navbar */}
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

      {/* Main Content */}
      <div className="container mx-auto relative">
        {/* Welcome Section */}
        <div className="flex items-center gap-0 mt-20">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-white">
            <Image
              src="/assets/pfp.png"
              alt="Profile Picture"
              width={128}
              height={128}
              className="object-cover rounded-full"
            />
          </div>

          <div className="flex flex-col">
            <div
              className="w-[568px] h-[130px] rounded-[30px_0_0_0] p-6"
              style={{
                background: "rgba(218, 236, 244, 0.49)",
                marginLeft: "156px",
              }}
            >
              <h2 className="text-4xl font-bold text-white mb-2">
                Hi {profile?.full_name}!
              </h2>
            </div>
            <p className="text-white/90 ml-[156px] mt-2 text-lg font-semibold">
              Organize, share, and succeed—all in one place!
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mt-16 ml-8">
          <h3 className="text-[#FF8C5A] text-2xl font-bold mb-6">
            Upload your essentials:
          </h3>

          {/* Step Bar */}
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

          {/* Upload Boxes */}
          <div className="flex flex-row gap-10">
            {uploadTypes.map(({ type, title, desc }) => (
              <div key={type}>
                <input
                  type="file"
                  ref={fileInputRefs[type]}
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFileSelect(type, e)}
                />
                
                <div
                  className="w-[465px] h-[347px] p-6 cursor-pointer rounded-[30px]"
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
                  
                  {selectedFiles[type] && (
                    <div className="mb-4 p-2 bg-white/20 rounded">
                      <p className="text-white text-sm">
                        Selected: {selectedFiles[type]?.name}
                      </p>
                    </div>
                  )}
                  
                  <button 
                    className="w-full bg-[#FF8C5A] text-white py-4 rounded-lg flex items-center justify-center gap-2 mt-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUploadClick(type);
                    }}
                  >
                    <Upload className="h-5 w-5" />
                    Upload
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Display selected files */}
          <div className="mt-8 p-4 bg-white/10 rounded-lg">
            <h3 className="text-white text-xl mb-4">Selected Files (Ready to send to Backend):</h3>
            <pre className="text-white text-sm">
              {JSON.stringify(
                Object.entries(selectedFiles).reduce<Record<string, {
                  fileName: string;
                  fileType: string;
                  fileSize: string;
                  documentType: string;
                }>>((acc, [type, file]) => {
                  if (file) {
                    acc[type] = {
                      fileName: file.name,
                      fileType: file.type,
                      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                      documentType: type
                    };
                  }
                  return acc;
                }, {}),
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </div>

      {/* Laptop Image */}
      <div className="absolute right-0 top-[100px] w-[700px] h-[700px]">
        <Image
          src="/assets/userpg.png"
          alt="Laptop"
          width={700}
          height={700}
          className="object-contain"
        />
      </div>
    </div>
  );
};

export default UserPage;