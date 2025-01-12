'use client';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Upload, Book ,X} from 'lucide-react';

// Define types
type SelectedFiles = {
  syllabus: File[];  // Changed to File[] for multiple files
  pyq: File[];
  notes: File[];
};

type UploadType = {
  type: keyof SelectedFiles;
  title: string;
  desc: string;
};

const User = () => {
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [subject, setSubject] = useState<string>(''); // Added subject state
  const [uploadLoading, setUploadLoading] = useState<Record<keyof SelectedFiles, boolean>>({
    syllabus: false,
    pyq: false,
    notes: false
  });
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFiles>({
    syllabus: [],  // Changed to empty arrays
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

  const handleFileRemove = (type: keyof SelectedFiles, index: number) => {
    setSelectedFiles(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  // Add handleUploadAll function
  const handleUploadAll = async () => {
    if (!subject.trim()) {
      alert('Please enter a subject name first');
      return;
    }

    try {
      // Upload files for each type
      for (const type of Object.keys(selectedFiles) as Array<keyof SelectedFiles>) {
        if (selectedFiles[type].length > 0) {
          await uploadToSupabase(selectedFiles[type], type);
        }
      }

      // Clear all selected files after successful upload
      setSelectedFiles({
        syllabus: [],
        pyq: [],
        notes: []
      });

      alert('All files uploaded successfully!');
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading some files. Please try again.');
    }
  };

  const uploadToSupabase = async (files: File[], type: keyof SelectedFiles) => {
    if (!subject.trim()) {
      alert('Please enter a subject name first');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      setUploadLoading(prev => ({ ...prev, [type]: true }));

      // Upload each file
      for (const file of files) {
        const timestamp = new Date().getTime();
        // Modified path to include subject
        const fileName = `${user.id}/${subject}/${type}/${timestamp}-${file.name}`;

        const { error } = await supabase.storage
          .from('study_materials')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) throw error;
      }

      alert(`${type} uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Error uploading ${type}. Please try again.`);
    } finally {
      setUploadLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleFileSelect = async (type: keyof SelectedFiles, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => ({
        ...prev,
        [type]: [...prev[type], ...files] // Add new files to existing ones
      }));
      
      // Upload files immediately after selection
      await uploadToSupabase(files, type);
    }
  };

  const handleUploadClick = (type: keyof SelectedFiles) => {
    if (!subject.trim()) {
      alert('Please enter a subject name first');
      return;
    }
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

      {/* Main Content */}
      <div className="container mx-auto relative">
        {/* Welcome Section */}
        <div className="flex items-center gap-0 mt-20">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-white">
            <Image src="/assets/pfp.png" alt="Profile Picture" width={128} height={128} className="object-cover rounded-full" />
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

        {/* Subject Input */}
        <div className="mt-16 ml-8">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter subject name"
            className="w-full max-w-md px-4 py-2 rounded bg-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#FF8C5A] mb-8"
          />

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
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(type, e)}
                />
                
                <div
                  className="w-[465px] h-auto min-h-[347px] p-6 cursor-pointer rounded-[30px]"
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
                  
                  {selectedFiles[type].length > 0 && (
                    <div className="mb-4 space-y-2">
                      {selectedFiles[type].map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white/20 rounded">
                          <p className="text-white text-sm truncate">{file.name}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileRemove(type, index);
                            }}
                            className="ml-2 p-1 hover:bg-white/10 rounded"
                          >
                            <X className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      ))}
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
                    Upload PDFs
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Upload All Button */}
          {Object.values(selectedFiles).some(files => files.length > 0) && (
            <button
              onClick={handleUploadAll}
              className="mt-8 bg-[#FF8C5A] text-white px-8 py-3 rounded-lg hover:bg-[#ff7c42]"
            >
              Upload All Files
            </button>
          )}
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

export default User;