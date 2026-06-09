"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuthContext } from '@/AuthContext';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Navbar from '@/app/components/navbar';
import { RefreshCw, Upload, Camera, Trash2 } from 'lucide-react';
import UploadImageSignUpModal from '@/components/modals/UploadImageSignUpModal';
import { BASE_URL } from '@/config/api';

const UploadPageContent = ({ searchParams }: { searchParams: { type?: string } }) => {
  const { token } = useAuthContext();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploadSignupModal, setShowUploadSignupModal] = useState(false);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [sideImage, setSideImage] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState({
    chest: '0.00',
    waist: '0.00',
    hips: '0.00',
    legs: '0.00'
  });
  const [showAllMeasurements, setShowAllMeasurements] = useState(false);
  const [userHeight, setUserHeight] = useState<string>('');
  const [showHeightModal, setShowHeightModal] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'front' | 'side' | 'complete'>('front');
  const [measurementType, setMeasurementType] = useState<'yourself' | 'object'>('yourself');

  const allMeasurements = {
    chest: '10.00',
    waist: '20.00',
    hips: '38.00',
    legs: '40.00',
    shoulders: '45.00',
    neck: '15.00',
    sleeve: '60.00',
    inseam: '80.00'
  };

  const displayedMeasurements = showAllMeasurements
    ? allMeasurements
    : {
        chest: measurements.chest,
        waist: measurements.waist,
        hips: measurements.hips,
        legs: measurements.legs
      };
  const [analyzingFront, setAnalyzingFront] = useState(false);
  const [analyzingSide, setAnalyzingSide] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const sideInputRef = useRef<HTMLInputElement>(null);

  // Check authentication on component mount and get measurement type from URL
  useEffect(() => {
    // Get measurement type from URL parameters
    const type = searchParams?.type;
    if (type === 'object' || type === 'yourself') {
      setMeasurementType(type);
    }
    
    // Remove the automatic modal showing on component mount
    // The modal should only show when user tries to download/save, not on page load
  }, [searchParams]);

  // Add font loading effect
  useEffect(() => {
    // Preload fonts
    const link1 = document.createElement('link');
    link1.href = 'https://fonts.cdnfonts.com/css/monument-extended';
    link1.rel = 'stylesheet';
    
    const link2 = document.createElement('link');
    link2.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600&display=swap';
    link2.rel = 'stylesheet';
    
    document.head.appendChild(link1);
    document.head.appendChild(link2);
    
    return () => {
      document.head.removeChild(link1);
      document.head.removeChild(link2);
    };
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'side') => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setUploadError('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size exceeds 10MB limit.');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          if (type === 'front') {
            setFrontImage(result);
            await analyzeAndUploadImage(result, 'front');
          } else {
            setSideImage(result);
            await analyzeAndUploadImage(result, 'side');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHeightSubmit = async () => {
    if (!userHeight || isNaN(parseFloat(userHeight))) {
      setUploadError("Please enter a valid height");
      return;
    }

    const heightInCm = parseFloat(userHeight);

    if (heightInCm < 1 || heightInCm > 300) {
      setUploadError("Height must be between 1 and 300 centimeters");
      return;
    }

    setShowHeightModal(false);
    setUploadError(null);
  };

  // Convert image data URL to base64
  const convertDataUrlToBase64 = (dataUrl: string): string => {
    const base64 = dataUrl.split(',')[1];
    return base64 || '';
  };

  // Get file name from data URL
  const getFileNameFromDataUrl = (dataUrl: string): string => {
    const timestamp = Date.now();
    const extension = dataUrl.split(';')[0].split('/')[1] || 'jpg';
    return `image_${timestamp}.${extension}`;
  };

  // Get mime type from data URL
  const getMimeTypeFromDataUrl = (dataUrl: string): string => {
    const mimeType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg';
    return mimeType;
  };

  const analyzeAndUploadImage = async (imageData: string, type: 'front' | 'side') => {
    if (type === 'front') {
      setAnalyzingFront(true);
    } else {
      setAnalyzingSide(true);
    }

    try {
      // Convert height to cm - assuming input is already in centimeters
      const heightInCm = parseFloat(userHeight);
      
      // Validate height is in reasonable range (1-300 cm)
      if (heightInCm < 1 || heightInCm > 300) {
        throw new Error('Height must be between 1 and 300 centimeters');
      }
      
      console.log('Uploading with height:', heightInCm, 'cm (input was:', userHeight, ')');
      
      // Prepare data for upload
      const base64Data = convertDataUrlToBase64(imageData);
      const fileName = getFileNameFromDataUrl(imageData);
      const mimeType = getMimeTypeFromDataUrl(imageData);
      
      // Upload directly to backend API
      const backendUrl = BASE_URL;
      console.log('Uploading to backend with token:', token);
      const response = await fetch(`${backendUrl}/api/photos/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          imageData: base64Data, // Send just the base64 data, not the full data URL
          height: heightInCm,
          mimeType: mimeType,
          fileName: fileName
        })
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload successful:', result);

      // Update measurements with actual data if available
      if (result.data?.measurements) {
        console.log('Setting measurements from result.data.measurements:', result.data.measurements);
        setMeasurements(result.data.measurements);
      } else if (result.measurements) {
        console.log('Setting measurements from result.measurements:', result.measurements);
        setMeasurements(result.measurements);
      } else {
        console.log('No measurements in response, using simulated measurements');
        // Simulate measurements if not provided
        if (type === 'front') {
          setMeasurements({
            chest: '10.00',
            waist: '20.00',
            hips: '38.00',
            legs: '40.00'
          });
        }
      }

      // Move to next step
      if (type === 'front') {
        setCurrentStep('side');
      } else {
        setCurrentStep('complete');
      }
    } catch (error) {
      console.error('Analysis or upload failed:', error);
      setUploadError('Failed to analyze image or upload photo');
    } finally {
      if (type === 'front') {
        setAnalyzingFront(false);
      } else {
        setAnalyzingSide(false);
      }
    }
  };

  const clearImage = (type: 'front' | 'side') => {
    if (type === 'front') {
      setFrontImage(null);
      if (frontInputRef.current) frontInputRef.current.value = '';
      setCurrentStep('front');
    } else {
      setSideImage(null);
      if (sideInputRef.current) sideInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    // Check if user is authenticated before allowing download
    if (!token || token === '') {
      setShowUploadSignupModal(true);
      return;
    }
    
    const data = `Body Measurements

Chest: ${measurements.chest} cm
Waist: ${measurements.waist} cm
Hips: ${measurements.hips} cm
Legs: ${measurements.legs} cm`;
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'measurements.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const triggerFileInput = (type: 'front' | 'side') => {
    if (type === 'front') {
      frontInputRef.current?.click();
    } else {
      sideInputRef.current?.click();
    }
  };

  const triggerCamera = (type: 'front' | 'side') => {
    if (type === 'front') {
      if (frontInputRef.current) {
        frontInputRef.current.setAttribute('capture', 'environment');
        frontInputRef.current.click();
      }
    } else {
      if (sideInputRef.current) {
        sideInputRef.current.setAttribute('capture', 'environment');
        sideInputRef.current.click();
      }
    }
  };

  const handleLoginRedirect = () => {
    setShowAuthModal(false);
    setShowUploadSignupModal(false);
    router.push('/auth/login');
  };

  const handleSignupRedirect = () => {
    setShowAuthModal(false);
    setShowUploadSignupModal(false);
    router.push('/auth/signup');
  };

  const handleGoogleSignup = () => {
    // For now, redirect to signup page which should have Google option
    setShowAuthModal(false);
    setShowUploadSignupModal(false);
    router.push('/auth/signup');
  };

  return (
    <>
      <Head>
        <link href="https://fonts.cdnfonts.com/css/monument-extended" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <UploadImageSignUpModal 
          isOpen={showUploadSignupModal} 
          onClose={() => setShowUploadSignupModal(false)} 
        />

        {showHeightModal && token && (
          <div className="fixed inset-0 flex items-center justify-center z-[60]" style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
            <div
              className="bg-white rounded-[20px] shadow-lg"
              style={{
                width: "596px",
                height: "330px",
                borderRadius: "20px",
                background: "#FFFFFF",
                padding: "52px 60px 42px 60px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "Manrope",
                    fontWeight: 600,
                    fontSize: "22px",
                    lineHeight: "100%",
                    color: "#1A1A1A",
                    marginBottom: "32px"
                  }}
                >
                  Input Height
                </div>

                <div>
                  <div
                    style={{
                      fontFamily: "Manrope",
                      fontWeight: 500,
                      fontSize: "14px",
                      lineHeight: "100%",
                      color: "#1A1A1A",
                      marginBottom: "12px",
                    }}
                  >
                    Enter your Height (Centimeters)
                  </div>

                  <input
                    type="number"
                    value={userHeight}
                    onChange={(e) => setUserHeight(e.target.value)}
                    placeholder="Height in centimeters"
                    className="border rounded-[10px]"
                    style={{
                      width: "493px",
                      height: "50px",
                      borderRadius: "10px",
                      borderWidth: "1px",
                      borderColor: "#6E6E6E4D",
                      fontFamily: "Manrope",
                      padding: "0 16px",
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-center" style={{ gap: "20px" }}>
                <button
                  onClick={() => {
                    setShowHeightModal(false);
                    setUploadError(null);
                  }}
                  className="rounded-[20px]"
                  style={{
                    width: "73px",
                    height: "38px",
                    borderRadius: "20px",
                    borderWidth: "1px",
                    borderColor: "#E4D8F3",
                    border: "1px solid #E4D8F3",
                    fontFamily: "Manrope",
                    fontWeight: 500,
                    fontSize: "16px",
                    padding: "8px 10px",
                    background: "transparent"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleHeightSubmit}
                  className="rounded-[20px] text-white"
                  style={{
                    width: "81px",
                    height: "38px",
                    backgroundColor: '#5D2A8B',
                    borderRadius: "20px",
                    fontFamily: "Manrope",
                    fontWeight: 500,
                    fontSize: "16px",
                    padding: "8px 10px",
                    opacity: !userHeight ? 0.5 : 1,
                    cursor: !userHeight ? 'not-allowed' : 'pointer'
                  }}
                  disabled={!userHeight}
                >
                  Confirm
                </button>
              </div>

              {uploadError && (
                <div className="text-center text-red-500 text-sm" style={{ marginTop: "12px" }}>
                  {uploadError}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-24 pb-8 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Fixed Header Section with better styling */}
            <div className="text-center mt-8">
              <div className="mb-6 mt-4">
                <h1 className="text-3xl md:text-4xl lg:text-2xl font-bold text-gray-900 mt-3"
                  style={{
                    fontFamily: "'Monument Extended', sans-serif",
                    fontWeight: 400,
                    letterSpacing: '0%',
                    lineHeight: '1.1'
                  }}>
                  Take Image
                </h1>
                <p className="text-lg md:text-xl text-gray-600"
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 400,
                    letterSpacing: '0%',
                    lineHeight: '1.5',
                    opacity: 0.7
                  }}>
                  Snap, analyze and get measurements instantly
                </p>
              </div>
                
              {userHeight && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg inline-block">
                  <p className="text-purple-800 font-medium">
                    Height: {userHeight} cm
                  </p>
                  <button
                    onClick={() => setShowHeightModal(true)}
                    className="ml-3 text-purple-600 underline text-sm"
                  >
                    Change
                  </button>
                </div>
              )}

              {uploadError && !showHeightModal && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg max-w-md mx-auto">
                  <p className="text-red-600">{uploadError}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Mobile View - Single Image at a Time */}
              <div className="md:hidden">
                <div className="flex justify-center gap-2 mb-4">
                  <div className={`w-3 h-3 rounded-full ${currentStep === 'front' ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                  <div className={`w-3 h-3 rounded-full ${currentStep === 'side' ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                </div>

                {/* Show Front Image Upload */}
                {currentStep === 'front' && (
                  <div className="mb-6">
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                      {frontImage ? (
                        <>
                          <img
                            src={frontImage}
                            alt="Front view"
                            className="w-full h-full object-cover"
                          />
                          {analyzingFront && (
                            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                              <div className="text-center">
                                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Analyzing image...</p>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <label className="cursor-pointer text-center">
                            <div className="w-12 h-12 text-gray-400 mx-auto mb-2 flex items-center justify-center">
                              <Camera className="w-full h-full" />
                            </div>
                            <span className="text-sm text-gray-500">Click to take photo or upload</span>
                            <input
                              ref={frontInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, 'front')}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <p className="text-xs" style={{ color: '#5D2A8B99' }}>
                        {frontImage ? '**Front image measured**' : '**Front image**'}
                      </p>
                      {frontImage && (
                        <span className="text-lg" style={{ color: '#5D2A8B99' }}>✓</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Show Side Image Upload */}
                {currentStep === 'side' && (
                  <div>
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ height: '400px' }}>
                      {sideImage ? (
                        <>
                          <img
                            src={sideImage}
                            alt="Side view"
                            className="w-full h-full object-cover"
                          />
                          {analyzingSide && (
                            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                              <div className="text-center">
                                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Analyzing image...</p>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <label className="cursor-pointer text-center">
                            <div className="w-12 h-12 text-gray-400 mx-auto mb-2 flex items-center justify-center">
                              <Camera className="w-full h-full" />
                            </div>
                            <span className="text-sm text-gray-500">Click to take photo or upload</span>
                            <input
                              ref={sideInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, 'side')}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-center justify-center gap-2 mb-6">
                      <p className="text-xs" style={{ color: '#5D2A8B99' }}>
                        {sideImage ? '**Side image measured**' : '**Side image**'}
                      </p>
                      {sideImage && (
                        <span className="text-lg" style={{ color: '#5D2A8B99' }}>✓</span>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium mb-3" style={{ color: '#5D2A8B' }}>Measurements:</h3>
                      <div className="space-y-2">
                        {Object.entries(displayedMeasurements).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span style={{ color: '#6E6E6E', textTransform: 'capitalize' }}>{key}:</span>
                            <span className="font-medium" style={{ color: '#6E6E6E' }}>{value} cm</span>
                          </div>
                        ))}
                      </div>
                      
                      <button
                        onClick={handleDownload}
                        className="mt-4 w-full hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg transition-opacity"
                        style={{ 
                          backgroundColor: '#5D2A8B',
                          opacity: !frontImage ? 0.5 : 1
                        }}
                        disabled={!frontImage}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                )}

                {/* Show Completion State */}
                {currentStep === 'complete' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-3" style={{ color: '#5D2A8B' }}>Measurements:</h3>
                    <div className="space-y-2">
                      {Object.entries(displayedMeasurements).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span style={{ color: '#6E6E6E', textTransform: 'capitalize' }}>{key}:</span>
                          <span className="font-medium" style={{ color: '#6E6E6E' }}>{value} cm</span>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={handleDownload}
                      className="mt-4 w-full hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg transition-opacity"
                      style={{ 
                        backgroundColor: '#5D2A8B',
                        opacity: !frontImage ? 0.5 : 1
                      }}
                      disabled={!frontImage}
                    >
                      Download
                    </button>
                  </div>
                )}
              </div>

              {/* Desktop View - All Images Side by Side */}
              <div className="hidden md:grid md:grid-cols-3 gap-6">
                {(currentStep === 'front' || currentStep === 'side' || currentStep === 'complete') && (
                  <div className="lg:col-span-1">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Front View</span>
                      <div className="flex gap-2">
                        <button
                          className="p-2 hover:bg-gray-100 rounded"
                          title="Take Photo"
                          onClick={() => triggerCamera('front')}
                        >
                          <Camera className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          className="p-2 hover:bg-gray-100 rounded"
                          title="Upload"
                          onClick={() => triggerFileInput('front')}
                        >
                          <Upload className="w-4 h-4 text-gray-600" />
                        </button>
                        {frontImage && (
                          <button
                            className="p-2 hover:bg-gray-100 rounded"
                            title="Delete"
                            onClick={() => clearImage('front')}
                          >
                            <Trash2 className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                      {frontImage ? (
                        <>
                          <div className="w-full h-full relative">
                            <img
                              src={frontImage}
                              alt="Front view"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {analyzingFront && (
                            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                              <div className="text-center">
                                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Analyzing front image...</p>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <label className="cursor-pointer text-center">
                            <div className="w-12 h-12 text-gray-400 mx-auto mb-2 flex items-center justify-center">
                              <Camera className="w-full h-full" />
                            </div>
                            <span className="text-sm text-gray-500">Click to take photo or upload</span>
                            <input
                              ref={frontInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, 'front')}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <p className="text-xs" style={{ color: '#5D2A8B99' }}>
                        {frontImage ? '**Front image measured**' : '**Front image**'}
                      </p>
                      {frontImage && (
                        <span className="text-lg" style={{ color: '#5D2A8B99' }}>✓</span>
                      )}
                    </div>
                  </div>
                )}

                {(currentStep === 'side' || currentStep === 'complete') && (
                  <div className="lg:col-span-1">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Side View</span>
                      <div className="flex gap-2">
                        <button
                          className="p-2 hover:bg-gray-100 rounded"
                          title="Take Photo"
                          onClick={() => triggerCamera('side')}
                        >
                          <Camera className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          className="p-2 hover:bg-gray-100 rounded"
                          title="Upload"
                          onClick={() => triggerFileInput('side')}
                        >
                          <Upload className="w-4 h-4 text-gray-600" />
                        </button>
                        {sideImage && (
                          <button
                            className="p-2 hover:bg-gray-100 rounded"
                            title="Delete"
                            onClick={() => clearImage('side')}
                          >
                            <Trash2 className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="relative rounded-lg overflow-hidden" style={{ height: '400px' }}>
                      {sideImage ? (
                        <>
                          <div className="w-full h-full relative">
                            <img
                              src={sideImage}
                              alt="Side view"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {analyzingSide && (
                            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                              <div className="text-center">
                                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Analyzing side image...</p>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center" style={{
                          background: '#FAF7FD',
                          border: '1px dashed #EEB0FE99',
                          borderRadius: '20px'
                        }}>
                          <label className="cursor-pointer text-center">
                            <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                              <Camera className="w-10 h-10" style={{ color: '#5D2A8B' }} />
                            </div>
                            <p style={{
                              fontFamily: 'Manrope, sans-serif',
                              fontWeight: 300,
                              fontSize: '18px',
                              lineHeight: '100%',
                              letterSpacing: '0%',
                              color: '#5D2A8B'
                            }}>Take a side view picture</p>
                            <input
                              ref={sideInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, 'side')}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <p className="text-xs" style={{ color: '#5D2A8B99' }}>
                        {sideImage ? '**Side image measured**' : '**Side image**'}
                      </p>
                      {sideImage && (
                        <span className="text-lg" style={{ color: '#5D2A8B99' }}>✓</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-lg p-6 h-full flex flex-col shadow-md">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium" style={{ color: '#5D2A8B' }}>Measurement:</h3>
                        <button
                          onClick={() => setShowAllMeasurements(!showAllMeasurements)}
                          className="hover:opacity-80 transition-opacity"
                          style={{ color: '#5D2A8B' }}
                        >
                          {showAllMeasurements ? 'Show Less' : 'Show More'}
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {Object.entries(displayedMeasurements).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span style={{ color: '#6E6E6E', textTransform: 'capitalize' }}>{key}:</span>
                            <span className="font-medium" style={{ color: '#6E6E6E' }}>{value} cm</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleDownload}
                      className="mt-auto w-full hover:opacity-90 text-white font-medium py-3 px-6 rounded-lg transition-opacity"
                      style={{ 
                        backgroundColor: '#5D2A8B',
                        opacity: !frontImage ? 0.5 : 1
                      }}
                      disabled={!frontImage}
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Main page component - this is the Server Component
export default function UploadPage({ searchParams }: { searchParams: { type?: string } }) {
  return (
    <UploadPageContent searchParams={searchParams} />
  );
};