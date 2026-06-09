// This file has been modified to redirect organizations to the subscription page after login
"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useAuthContext } from "@/AuthContext";
import Link from "next/link";
import { toast } from "@/app/components/hooks/use-toast";
import { routes } from "@/services/apiRoutes";
import axios from 'axios';
import UserSubscriptionService from '@/services/UserSubscriptionService';
import { BASE_URL } from '@/config/api';

interface FormValues {
  email: string
  password: string
}

type ApiError = {
  response?: {
    status?: number
    statusText?: string
    data?: {
      errors?: Array<{ message: string }>
      message?: string
    }
  }
  message?: string
  code?: string
  name?: string
}

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuthContext();

  // Create axios instance for login
  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const [formValues, setFormValues] = useState<FormValues>({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<Partial<FormValues>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const { mutate: submitMutate, isPending } = useMutation({
    mutationFn: async (values: { email: string; password: string }) => {
      const payload = {
        email: values.email.toLowerCase(),
        password: values.password,
      }
      
      console.log('🚀 Sending LOGIN request to backend:', payload)
      
      // Use axios directly instead of the client from useAuth
      const response = await client.post(routes.login(), payload, {
        baseURL: BASE_URL,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      return response.data
    },

    onSuccess: async (response) => {
      setApiError(null)
      const data = response.data
      if (data && data.requiresEmailVerification) {
        // If email verification is required, redirect to email verification page
        toast({ 
          title: "EMAIL VERIFICATION REQUIRED",
          description: "Please verify your email before logging in"
        })
        router.push(`/auth/verify-email?email=${encodeURIComponent(formValues.email)}`)
      } else if (data && data.requiresOtp) {
        // If OTP verification is required after login, redirect to OTP verification page
        toast({ 
          title: "OTP REQUIRED",
          description: "Please verify your identity with the code sent to your email"
        })
        router.push(`/auth/verify-otp?email=${encodeURIComponent(formValues.email)}`)
      } else if (data && data.jwtToken && data.user) {
        signIn(data.jwtToken, data.user)
        
        const userRole = data.user.role?.toLowerCase();
        
        // Check subscription status ONLY for admin/organization users
        if (userRole === 'admin' || userRole === 'organisation' || userRole === 'organization') {
          try {
            const subscriptionResponse = await UserSubscriptionService.getUserSubscriptionStatus(data.user.id);
            
            // subscriptionResponse is the full API response: { success, data, message }
            // subscriptionResponse.data contains: { hasActiveSubscription, shouldShowSubscription, subscription }
            const hasActiveSubscription = subscriptionResponse.data.hasActiveSubscription;
            
            // Route based on subscription status from API response
            if (hasActiveSubscription) {
              // User has active subscription - redirect to admin dashboard
              toast({ 
                title: "LOGIN SUCCESSFUL!",
                description: "Welcome back! Redirecting to dashboard..."
              });
              router.replace("/admin");
            } else {
              // No active subscription - redirect to subscription page
              toast({ 
                title: "SUBSCRIPTION NEEDED",
                description: "Please select a subscription package to continue"
              });
              router.replace("/subscription");
            }
          } catch (subscriptionError: any) {
            // Fallback: redirect to admin dashboard when subscription check fails
            console.error('Subscription check failed, redirecting to admin:', subscriptionError);
            router.replace("/admin");
          }
        } else {
          // Non-admin users - route based on role without subscription check
          toast({ 
            title: "LOGIN SUCCESSFUL!",
            description: "Welcome back! Redirecting to dashboard..."
          });
          
          if (userRole === 'super_admin') {
            router.replace("/super-admin");
          } else {
            router.replace("/user");
          }
        }
      } else {
        const errorMsg = "Invalid response from server"
        setApiError(errorMsg)
        toast({ 
          title: "Login Error",
          description: errorMsg,
          variant: "destructive"
        })
      }
    },
    onError: (error: ApiError) => {
      const message =
        error?.response?.data?.errors?.[0]?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Login failed"
      setApiError(message)
      toast({ 
        title: "Login Failed",
        description: message,
        variant: "destructive"
      })
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormValues]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<FormValues> = {}
    if (!formValues.email.trim()) newErrors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) newErrors.email = "Invalid email address"
    if (!formValues.password) newErrors.password = "Password is required"
    else if (formValues.password.length < 8) newErrors.password = "Password must be at least 8 characters"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)
    if (!validate()) return
    submitMutate({ email: formValues.email, password: formValues.password })
  }

  const handleGoogleLogin = () => {
    toast({
      title: 'Google Login',
      description: 'This feature will be implemented soon'
    })
  }

  return (
    <div className="min-h-screen bg-white">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .monument-extended { font-family: 'Monument Extended', sans-serif; }
        .manrope { font-family: 'Manrope', sans-serif; }
        
        /* Mobile-first responsive layout */
        .desktop-layout {
          display: none;
        }
        
        .mobile-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          padding: 24px;
          max-width: 400px;
          margin: 0 auto;
        }
        
        @media (min-width: 1024px) {
          .desktop-layout {
            display: block;
          }
          
          .mobile-layout {
            display: none;
          }
        }
        
        .mobile-input-container {
          position: relative;
          width: 100%;
          height: 50px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          background: white;
          margin-bottom: 16px;
        }
        
        .mobile-input-container input {
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          background: white !important;
          padding: 14px 16px;
          font-family: 'Manrope', sans-serif;
          font-size: 16px;
          color: #374151;
        }
        
        .mobile-input-container input::placeholder {
          color: #9CA3AF;
        }
        
        .mobile-input-container.error {
          border-color: #EF4444;
        }
        
        .mobile-password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          color: #6B7280;
        }
        
        /* Desktop styles */
        .input-container {
          position: relative;
          width: 484px;
          height: 60px;
          border: 1px solid #6E6E6E4D;
          border-radius: 10px;
          background: white;
          transition: border-color 0.2s ease;
        }
        
        .input-container input {
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          background: white !important;
          padding: 17px 30px;
          font-family: 'Manrope', sans-serif;
          font-size: 20px;
          color: #6E6E6E;
        }
        
        .input-container input:-webkit-autofill,
        .input-container input:-webkit-autofill:hover,
        .input-container input:-webkit-autofill:focus,
        .input-container input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: #6E6E6E !important;
          background-color: white !important;
          background: white !important;
        }
        
        .input-container input::placeholder {
          color: #6E6E6E;
          opacity: 1;
        }
        
        .input-container.has-value {
          border: 1px solid #5D2A8B99;
        }
        
        .input-container.has-value input {
          padding-top: 25px;
          padding-bottom: 9px;
          background: white;
        }
        
        .input-label {
          position: absolute;
          top: -10px;
          left: 30px;
          font-family: 'Manrope', sans-serif;
          font-weight: 400;
          font-size: 14px;
          color: #5D2A8B;
          background: white;
          padding: 0 5px;
          pointer-events: none;
          transition: all 0.2s ease;
        }
        
        .input-container:focus-within {
          border: 1px solid #5D2A8B99;
        }
        
        .input-container:focus-within .input-label {
          color: #5D2A8B;
        }
        
        .input-container.error {
          border-color: #ef4444;
        }
        
        .password-toggle {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          color: #6E6E6E;
        }
        
        /* Hide left image on tablet and mobile */
        @media (max-width: 1023px) {
          .hide-on-tablet {
            display: none;
          }
        }
      `}</style>

      {/* Mobile Layout */}
      <div className="mobile-layout">
        {/* Logo */}
        <div className="mb-8">
          <Image 
            width={100} 
            height={80} 
            src="/assets/vetra.png" 
            alt="Company Logo" 
            className="object-contain" 
          />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 
            className="monument-extended text-2xl font-normal text-[#1A1A1A] mb-3"
          >
            Login
          </h1>
          <p 
            className="manrope text-sm font-light text-[#9CA3AF]"
          >
            Sign in to continue
          </p>
        </div>

        {/* Form */}
        <div className="flex-1">
          {/* Email Input */}
          <div className="mb-4">
            <label className="manrope text-sm font-medium text-[#374151] mb-2 block">
              Email
            </label>
            <div className={`mobile-input-container ${errors.email ? 'error' : ''}`}>
              <input
                type="email"
                name="email"
                value={formValues.email}
                onChange={handleChange}
                placeholder="Demola Alo"
              />
            </div>
            {errors.email && (
              <p className="manrope text-xs text-[#EF4444] mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="manrope text-sm font-medium text-[#374151] mb-2 block">
              Password
            </label>
            <div className={`mobile-input-container ${errors.password ? 'error' : ''}`}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formValues.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={{ paddingRight: "45px" }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="mobile-password-toggle"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="manrope text-xs text-[#EF4444] mt-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Forgot Password */}
          <div className="text-right mb-6">
            <Link
              href="/auth/forgot-password"
              className="manrope text-sm text-[#5D2A8B] underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full h-12 bg-[#5D2A8B] rounded-lg text-white manrope font-semibold text-base disabled:opacity-70 disabled:cursor-not-allowed mb-4"
          >
            {isPending ? 'Logging in...' : 'Login'}
          </button>

          {/* Footer */}
          <p className="manrope text-sm text-center text-[#6E6E6E] mt-auto">
            Don&ldquo;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-[#5D2A8B]"
            >
              Signup
            </Link>
          </p>
        </div>
      </div>
 {/* Desktop Layout - Fixed positioning issue */}
<div className="desktop-layout">
  <div className="relative" style={{ width: "1440px", minHeight: "1000px", margin: "0 auto" }}>
    {/* Left Image Section - Same */}
    <div 
      className="absolute hide-on-tablet"
      style={{
        width: "700px",
        height: "935px",
        top: "35px",
        left: "45px",
        borderRadius: "40px",
        background: "linear-gradient(180deg, #F4EFFA 0%, #5D2A8B1A 10%)",
        overflow: "hidden"
      }}
    >
      <Image 
        src="/Frame 1.png" 
        alt="Data Capturing Illustration" 
        width={700} 
        height={935} 
        priority 
        className="w-full h-full object-cover" 
      />
    </div>

    {/* Right Form Section */}
    <div 
      className="absolute"
      style={{
        width: "609px",
        height: "935px",
        top: "35px",
        left: "785px",
        borderRadius: "40px",
        background: "#FBFAFC"
      }}
    >
      {/* Logo */}
      <div 
        className="absolute"
        style={{
          top: "50px",
          left: "50px"
        }}
      >
        <Image 
          width={100} 
          height={80} 
          src="/assets/vetra.png" 
          alt="Company Logo" 
          className="object-contain" 
        />
      </div>

      {/* Header */}
      <div 
        className="absolute"
        style={{
          width: "501px",
          height: "77px",
          top: "136px",
          left: "50px",
          gap: "16px"
        }}
      >
        <h1 
          className="monument-extended"
          style={{
            fontSize: "30px",
            fontWeight: 400,
            lineHeight: "100%",
            color: "#1A1A1A",
            width: "317px",
            height: "36px",
            margin: 0,
            marginBottom: "16px"
          }}
        >
          Welcome Back
        </h1>
        <p 
          className="manrope"
          style={{
            fontWeight: 300,
            fontSize: "18px",
            lineHeight: "100%",
            color: "#6E6E6EB2",
            width: "501px",
            height: "25px",
            margin: 0
          }}
        >
          Login to your account to continue tracking your measurement
        </p>
      </div>

      {/* Google Login Button */}
      <div 
        className="absolute"
        style={{
          top: "273px",
          left: "50px"
        }}
      >
        <button 
          type="button" 
          onClick={handleGoogleLogin}
          style={{
            width: "484px",
            height: "60px",
            border: "1px solid #6E6E6E4D",
            borderRadius: "10px",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            cursor: "pointer"
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.8 10.2273C19.8 9.52045 19.7364 8.83636 19.6182 8.18182H10.2V12.05H15.5891C15.3545 13.3 14.6182 14.3591 13.5182 15.0682V17.5773H16.8091C18.7091 15.8364 19.8 13.2727 19.8 10.2273Z" fill="#4285F4"/>
            <path d="M10.2 20C12.9 20 15.1636 19.1045 16.8091 17.5773L13.5182 15.0682C12.5909 15.6682 11.4182 16.0227 10.2 16.0227C7.59545 16.0227 5.39091 14.2636 4.57273 11.9H1.16364V14.4909C2.79545 17.7591 6.26364 20 10.2 20Z" fill="#34A853"/>
            <path d="M4.57273 11.9C4.37273 11.3 4.25909 10.6591 4.25909 10C4.25909 9.34091 4.37273 8.7 4.57273 8.1V5.50909H1.16364C0.477273 6.85909 0.0909091 8.38636 0.0909091 10C0.0909091 11.6136 0.477273 13.1409 1.16364 14.4909L4.57273 11.9Z" fill="#FBBC04"/>
            <path d="M10.2 3.97727C11.5318 3.97727 12.7136 4.43182 13.6409 5.30909L16.5682 2.38182C15.1591 1.08182 12.8955 0.227273 10.2 0.227273C6.26364 0.227273 2.79545 2.46818 1.16364 5.50909L4.57273 8.1C5.39091 5.73636 7.59545 3.97727 10.2 3.97727Z" fill="#EA4335"/>
          </svg>
          <span className="manrope" style={{ fontSize: "20px", fontWeight: 400, color: "#1A1A1A" }}>
            Sign up with Google
          </span>
        </button>
      </div>

      {/* Divider */}
      <div 
        className="absolute flex items-center"
        style={{
          width: "484px",
          height: "25px",
          top: "393px",
          left: "50px"
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "#d1d5db" }} />
        <span className="manrope" style={{ padding: "0 16px", fontSize: "14px", color: "#9ca3af" }}>or</span>
        <div style={{ flex: 1, height: "1px", background: "#d1d5db" }} />
      </div>

      {/* Error Alert - Now with dynamic positioning */}
      {apiError && (
        <div 
          className="absolute"
          style={{
            top: "438px",
            left: "50px",
            width: "484px"
          }}
        >
          <div 
            className="manrope"
            style={{
              background: "#FEE2E2",
              border: "1px solid #EF4444",
              borderRadius: "10px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 6V10" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 14H10.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ color: "#991B1B", fontSize: "14px", flex: 1 }}>
              {apiError}
            </span>
            <button 
              type="button"
              onClick={() => setApiError(null)}
              style={{ 
                background: "none", 
                border: "none", 
                cursor: "pointer",
                color: "#991B1B",
                fontSize: "18px",
                lineHeight: "1"
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Dynamic form positioning based on error state */}
      <div>
        {/* Email Input - Position adjusts based on error */}
        <div 
          className="absolute"
          style={{
            top: apiError ? "538px" : "463px",
            left: "50px",
            transition: "top 0.3s ease"
          }}
        >
          <div className={`input-container ${formValues.email ? 'has-value' : ''} ${errors.email ? 'error' : ''}`}>
            <input
              type="email"
              name="email"
              value={formValues.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
            {formValues.email && (
              <label className="input-label">Email</label>
            )}
          </div>
          {errors.email && (
            <p style={{ color: "#ef4444", fontSize: "14px", marginTop: "4px", fontFamily: "Manrope" }}>
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Input with Forgot Password - Position adjusts based on error */}
        <div 
          className="absolute"
          style={{
            top: apiError ? "643px" : "568px",
            left: "50px",
            width: "484px",
            height: "88px",
            transition: "top 0.3s ease"
          }}
        >
          <div className={`input-container ${formValues.password ? 'has-value' : ''} ${errors.password ? 'error' : ''}`}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formValues.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={{ paddingRight: "50px" }}
            />
            {formValues.password && (
              <label className="input-label">Password</label>
            )}
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p style={{ color: "#ef4444", fontSize: "14px", marginTop: "4px", fontFamily: "Manrope" }}>
              {errors.password}
            </p>
          )}
          <Link
            href="/auth/forgot-password"
            style={{
              fontFamily: "Manrope",
              fontWeight: 300,
              fontSize: "16px",
              lineHeight: "100%",
              textAlign: "right",
              textDecoration: "underline",
              color: "#5D2A8B",
              display: "block",
              width: "484px",
              height: "22px",
              marginTop: "6px"
            }}
          >
            Forgot Password?
          </Link>
        </div>

        {/* Login Button - Position adjusts based on error */}
        <div 
          className="absolute"
          style={{
            top: apiError ? "757px" : "682px",
            left: "50px",
            transition: "top 0.3s ease"
          }}
        >
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            style={{
              width: "484px",
              height: "60px",
              background: "#5D2A8B",
              borderRadius: "10px",
              border: "none",
              color: "white",
              fontFamily: "Manrope",
              fontWeight: 600,
              fontSize: "20px",
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.7 : 1
            }}
          >
            {isPending ? 'Logging in...' : 'Login'}
          </button>
        </div>

        {/* Footer - Position adjusts based on error */}
        <div 
          className="absolute"
          style={{
            top: apiError ? "832px" : "757px",
            left: "50px",
            width: "484px",
            height: "25px",
            transition: "top 0.3s ease"
          }}
        >
          <p 
            className="manrope"
            style={{
              fontWeight: 300,
              fontSize: "18px",
              lineHeight: "100%",
              color: "#6E6E6E",
              textAlign: "center",
              margin: 0
            }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              style={{
                fontWeight: 500,
                color: "#5D2A8B",
                textDecoration: "none"
              }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
   
    </div>
  )
}