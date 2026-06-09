"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { useState, useRef } from "react"
import { BASE_URL } from '@/config/api';

const CallToActionSection = () => {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showHeightModal, setShowHeightModal] = useState(false)
  const [userHeight, setUserHeight] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const handleUploadClick = () => {
    // First, ask for user's height
    setShowHeightModal(true)
  }

  const handleHeightSubmit = () => {
    if (!userHeight || isNaN(parseFloat(userHeight))) {
      setUploadError("Please enter a valid height")
      return
    }
    
    setShowHeightModal(false)
    setUploadError(null)
    
    // Access device camera
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          streamRef.current = stream
          videoRef.current.srcObject = stream
          videoRef.current.play()
          // Show camera capture modal
          setTimeout(() => {
            const cameraModal = document.getElementById('camera-modal')
            if (cameraModal) cameraModal.style.display = 'flex'
          }, 100)
        }
      })
      .catch(err => {
        console.error("Error accessing camera:", err)
        setUploadError("Could not access camera. Please ensure you've granted camera permissions.")
        // Fallback to file upload if camera is not accessible
        fileInputRef.current?.click()
      })
  }

  const captureImage = () => {
    if (!videoRef.current) return
    
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(async (blob) => {
        if (blob) {
          // Stop camera stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
          }
          
          // Hide camera modal
          const cameraModal = document.getElementById('camera-modal')
          if (cameraModal) cameraModal.style.display = 'none'
          
          // Convert to file and upload
          const file = new File([blob], `captured-${Date.now()}.jpg`, { type: 'image/jpeg' })
          await uploadPhoto(file, parseFloat(userHeight))
        }
      }, 'image/jpeg')
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please upload a JPEG, PNG, or WebP image.')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit.')
      return
    }

    await uploadPhoto(file, parseFloat(userHeight))
  }

  const uploadPhoto = async (file: File, heightInCm: number) => {
    setIsUploading(true)
    setUploadError(null)

    try {
      // Convert image to base64
      const base64Data = await convertToBase64(file)
      
      // Upload photo
      const backendUrl = BASE_URL;
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${backendUrl}/api/photos/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          imageData: base64Data,
          height: heightInCm,
          mimeType: file.type,
          fileName: file.name
        })
      })

      const result = await response.json()

      if (result.success) {
        console.log('Photo uploaded:', result.data.photo)
        // Navigate to upload page after successful upload
        router.push("/upload-image")
      } else {
        throw new Error(result.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      setUploadError(error instanceof Error ? error.message : 'An unknown error occurred during upload')
    } finally {
      setIsUploading(false)
    }
  }

  // Helper function to convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix for the API
          const base64Data = reader.result.split(',')[1]
          resolve(base64Data)
        } else {
          reject(new Error('Failed to convert file to base64'))
        }
      }
      reader.onerror = error => reject(error)
    })
  }

  const closeModal = () => {
    setShowHeightModal(false)
    setUploadError(null)
    
    // Stop camera stream if active
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    // Hide camera modal
    const cameraModal = document.getElementById('camera-modal')
    if (cameraModal) cameraModal.style.display = 'none'
  }

  return (
    <section 
      className="relative bg-[#5D2A8B] text-white overflow-hidden w-full mobile-cta-section"
      style={{
        maxWidth: "1441px",
        minHeight: "417px",
        marginBottom: "200px",
        marginLeft: "auto",
        marginRight: "auto",
        padding: "0 20px",
      }}
    >
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-cta-section {
            height: 367px !important;
            min-height: 367px !important;
            margin-bottom: 0 !important;
            padding: 0 !important;
          }
          .cta-inner-container {
            padding: 102px 0 20px 39px !important;
            align-items: flex-start !important;
          }
          .cta-content-wrapper {
            max-width: 311px !important;
          }
          .cta-text-container {
            gap: 16px !important;
            margin-bottom: 24px !important;
          }
          .cta-heading {
            font-size: 24px !important;
            line-height: 100% !important;
            width: 311px !important;
          }
          .cta-description {
            font-size: 16px !important;
            line-height: 100% !important;
            width: 311px !important;
            color: #FFFFFFB2 !important;
          }
          .cta-decorative-image {
            width: 80px !important;
            height: 45.41px !important;
            top: -13px !important;
            left: 319px !important;
            right: auto !important;
          }
          .cta-decorative-image img {
            width: 80px !important;
            height: 45.41px !important;
            transform: rotate(52.18deg) !important;
          }
        }
        
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: none;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal-content {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          max-width: 400px;
          width: 90%;
          color: #333;
        }
        
        .camera-view {
          width: 100%;
          max-width: 500px;
          height: 400px;
          background-color: #000;
          position: relative;
        }
        
        .camera-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .capture-btn {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: white;
          border: 3px solid #5D2A8B;
          cursor: pointer;
        }
      `}</style>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={isUploading}
      />

    
      <div id="height-modal" className="modal" style={{ display: showHeightModal ? 'flex' : 'none' }}>
        <div className="modal-content">
          <h3 className="text-xl font-bold mb-4" style={{ color: '#5D2A8B' }}>Enter Your Height</h3>
          <p className="mb-4">Please enter your height in centimeters for accurate measurements:</p>
          
          {uploadError && (
            <div className="text-red-500 text-sm mb-2">{uploadError}</div>
          )}
          
          <input
            type="number"
            value={userHeight}
            onChange={(e) => setUserHeight(e.target.value)}
            placeholder="Height in cm (e.g., 175.5)"
            className="w-full p-2 border border-gray-300 rounded mb-4"
            step="0.1"
            min="50"
            max="300"
          />
          
          <div className="flex justify-end gap-2">
            <button 
              onClick={closeModal}
              className="px-4 py-2 border border-gray-300 rounded"
            >
              Cancel
            </button>
            <button 
              onClick={handleHeightSubmit}
              className="px-4 py-2 rounded text-white"
              style={{ backgroundColor: '#5D2A8B' }}
              disabled={!userHeight}
            >
              Continue
            </button>
          </div>
        </div>
      </div> 

      {/* Camera Capture Modal */}
      <div id="camera-modal" className="modal">
        <div className="modal-content" style={{ maxWidth: '500px', padding: 0 }}>
          <div className="camera-view">
            <video 
              ref={videoRef} 
              className="camera-video"
              autoPlay
              playsInline
            />
            <button 
              className="capture-btn"
              onClick={captureImage}
              aria-label="Capture photo"
            />
          </div>
          <div className="p-4 flex justify-between">
            <button 
              onClick={closeModal}
              className="px-4 py-2 border border-gray-300 rounded"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                // Stop camera stream
                if (streamRef.current) {
                  streamRef.current.getTracks().forEach(track => track.stop())
                }
                // Switch to file upload
                const cameraModal = document.getElementById('camera-modal')
                if (cameraModal) cameraModal.style.display = 'none'
                fileInputRef.current?.click()
              }}
              className="px-4 py-2 rounded text-white"
              style={{ backgroundColor: '#5D2A8B' }}
            >
              Upload Instead
            </button>
          </div>
        </div>
      </div>

      {/* Inner Container */}
      <div 
        className="absolute inset-0 flex items-center justify-center cta-inner-container"
        style={{
          padding: "95px 20px 20px 20px",
        }}
      >
        <div
          className="cta-content-wrapper"
          style={{
            maxWidth: "605px",
            width: "100%",
          }}
        >
          {/* H1 and P Tag Container */}
          <div 
            className="cta-text-container"
            style={{
              width: "100%",
              maxWidth: "605px",
              gap: "16px",
              marginBottom: "32px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <h2 
              className="cta-heading"
              style={{
                fontFamily: "Monument Extended",
                fontWeight: 400,
                fontSize: "clamp(24px, 5vw, 36px)",
                lineHeight: "100%",
                letterSpacing: "0%",
                textAlign: "center",
                color: "#FFFFFF",
                width: "100%",
                margin: 0,
              }}
            >
              Ready to capture now?
            </h2>
            <p 
              className="cta-description"
              style={{
                fontFamily: "Manrope",
                fontWeight: 400,
                fontSize: "clamp(16px, 3vw, 20px)",
                lineHeight: "100%",
                letterSpacing: "0%",
                textAlign: "center",
                color: "#FFFFFFB2",
                width: "100%",
                maxWidth: "532px",
                margin: 0,
              }}
            >
              Experience instant, accurate measurements with AI.
            </p>
            
            {/* Error message display */}
            {uploadError && !showHeightModal && (
              <div className="text-red-300 text-sm text-center mt-2">
                {uploadError}
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex justify-center">
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              onMouseEnter={(e) => {
                if (!isUploading) {
                  e.currentTarget.style.transform = "scale(1.06)"
                  e.currentTarget.style.boxShadow = "0 14px 36px rgba(255,255,255,0.3)"
                  e.currentTarget.style.border = "2px solid #C8A2E0"
                }
              }}
              onMouseLeave={(e) => {
                if (!isUploading) {
                  e.currentTarget.style.transform = "scale(1)"
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"
                  e.currentTarget.style.border = "2px solid transparent"
                }
              }}
              onMouseDown={(e) => {
                if (!isUploading) {
                  e.currentTarget.style.transform = "scale(0.98)"
                }
              }}
              onMouseUp={(e) => {
                if (!isUploading) {
                  e.currentTarget.style.transform = "scale(1.06)"
                }
              }}
              className="inline-flex items-center justify-center bg-white text-[#5D2A8B] font-semibold transition-all duration-300 ease-in-out cursor-pointer"
              style={{
                paddingLeft: "24px",
                paddingRight: "24px",
                paddingTop: "10px",
                paddingBottom: "10px",
                borderRadius: "9999px",
                transformOrigin: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                border: "2px solid transparent",
                fontFamily: "Manrope",
                fontWeight: 600,
                fontSize: "16px",
                opacity: isUploading ? 0.7 : 1,
                cursor: isUploading ? "not-allowed" : "pointer"
              }}
            >
              {isUploading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#5D2A8B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </div>
              ) : (
                "Capture Image"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Decorative Image */}
      <div 
        className="absolute cta-decorative-image"
        style={{
          top: "4px",
          right: "32px",
        }}
      >
        <Image
          src="/Warm.png"
          alt="silhouette"
          width={140}
          height={220}
          className="object-contain"
        />
      </div>
    </section>
  )
}

export default CallToActionSection