// app/auth/forgot-password/ForgotPasswordForm.tsx
// "use client";

// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import { useMutation } from "@tanstack/react-query";
// import { Loader2 } from "lucide-react";
// import Link from "next/link";

// import { useAuth } from "@/api/hooks/useAuth";
// import { Button } from "@/app/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/app/components/ui/form";
// import { Input } from "@/app/components/ui/input";
// import { toast } from "@/app/components/hooks/use-toast";

// interface ForgotPasswordResponse {
//   message: string;
//   success: boolean;
// }

// interface ApiError {
//   response?: {
//     data?: {
//       errors?: Array<{ message: string }>;
//       message?: string;
//     };
//   };
//   message?: string;
// }

// const FormSchema = z.object({
//   email: z.string().email("Invalid email address"),
// });

// type ForgotPasswordData = z.infer<typeof FormSchema>;

// const ForgotPasswordForm = () => {
//   const { client } = useAuth();

//   const form = useForm<ForgotPasswordData>({
//     resolver: zodResolver(FormSchema),
//     defaultValues: {
//       email: "",
//     },
//   });

//   const forgotPasswordMutation = useMutation({
//     mutationFn: async (data: ForgotPasswordData) => {
//       const { data: response } = await client.post<ForgotPasswordResponse>(
//         "auth/forgot-password",
//         data
//       );
//       return response;
//     },
//     onSuccess: (data) => {
//       toast({
//         title: "Email Sent!",
//         description: "Check your email for a password reset link.",
//       });
//       form.reset();
//     },
//     onError: (error: ApiError) => {
//       const message =
//         error?.response?.data?.errors?.[0]?.message ||
//         error?.response?.data?.message ||
//         error?.message ||
//         "Failed to send reset email. Please try again.";
      
//       toast({
//         title: "Error",
//         description: message,
//         variant: "destructive",
//       });
//     },
//   });

//   const onSubmit = (data: ForgotPasswordData) => {
//     forgotPasswordMutation.mutate(data);
//   };

//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//         <FormField
//           control={form.control}
//           name="email"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Email Address</FormLabel>
//               <FormControl>
//                 <Input 
//                   placeholder="example@mail.com" 
//                   type="email"
//                   {...field} 
//                 />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         <Button
//           type="submit"
//           disabled={forgotPasswordMutation.isPending}
//           className="w-full bg-[#EAAB40] hover:bg-yellow-600"
//         >
//           {forgotPasswordMutation.isPending ? (
//             <>
//               <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
//               Sending...
//             </>
//           ) : (
//             "Send Reset Link"
//           )}
//         </Button>

//         <div className="text-center">
//           <Link 
//             href="/auth/login" 
//             className="text-sm text-blue-500 hover:underline"
//           >
//             Back to Login
//           </Link>
//         </div>
//       </form>
//     </Form>
//   );
// };

// export default ForgotPasswordForm;

"use client";

import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import Link from 'next/link';
import Head from 'next/head';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/api/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Interface for the full OTP metadata response
interface ForgotPasswordResponse {
  message: string;
  success: boolean;
  otpExpiresAt?: string;
  otpExpiresIn?: number;
  maxAttempts?: number;
  remainingAttempts?: number;
}

interface ApiError {
  response?: {
    data?: {
      errors?: Array<{ message: string }>;
      message?: string;
    };
  };
  message?: string;
}

interface RequestStatus {
  success: boolean;
  message: string;
}

interface FormValues {
  email: string;
}

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

const ForgotPasswordPage = () => {
  const { client } = useAuth();
  const router = useRouter();
  const [requestStatus, setRequestStatus] = useState<RequestStatus>({
    success: false,
    message: '',
  });
  const [apiError, setApiError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const forgotPasswordMutation = useMutation<
    ForgotPasswordResponse,
    ApiError,
    string
  >({
    mutationFn: async (email: string) => {
      const { data } = await client.post<ForgotPasswordResponse>(
        'auth/forgot-password',
        { email: email.toLowerCase() }
      );
      return data;
    },
    onSuccess: (data, email) => {
      setApiError(null);
      setRequestStatus({
        success: true,
        message: data.message || 'OTP sent to your email!',
      });

      // Store otpData in sessionStorage so the reset-password page can use it
      const otpData = {
        otpExpiresIn: data.otpExpiresIn ?? 600,
        maxAttempts: data.maxAttempts ?? 5,
        remainingAttempts: data.remainingAttempts ?? 5,
      };
      sessionStorage.setItem('resetOtpData', JSON.stringify(otpData));

      // Navigate to OTP entry screen
      setTimeout(() => {
        router.push(`/auth/reset-password?email=${encodeURIComponent(email.toLowerCase())}`);
      }, 800);
    },
    onError: (error: ApiError) => {
      const message =
        error?.response?.data?.errors?.[0]?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to send reset email. Please try again.';

      setApiError(message);
      setRequestStatus({
        success: false,
        message,
      });
    },
  });

  const handleSubmit = (
    values: FormValues, 
    { setSubmitting }: FormikHelpers<FormValues>
  ) => {
    setRequestStatus({ success: false, message: '' });
    setApiError(null);
    forgotPasswordMutation.mutate(values.email, {
      onSettled: () => {
        setSubmitting(false);
      }
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Forgot Password</title>
      </Head>
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
            width={40} 
            height={35} 
            src="/Group 1.png" 
            alt="Company Logo" 
            className="object-contain" 
          />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 
            className="monument-extended text-2xl font-normal text-[#1A1A1A] mb-3"
          >
            Forgot Password
          </h1>
          <p 
            className="manrope text-sm font-light text-[#9CA3AF]"
          >
            Enter your email and we&apos;ll send you a link to reset your password
          </p>
        </div>

        {/* Form */}
        <div className="flex-1">
          {requestStatus.success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              <p>{requestStatus.message}</p>
              <p className="mt-2">
                Please check your email for further instructions.
              </p>
            </div>
          ) : (
            <Formik
              initialValues={{ email: "" }}
              validationSchema={ForgotPasswordSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form>
                  <div className="mb-4">
                    <label
                      htmlFor="email"
                      className="manrope text-sm font-medium text-[#374151] mb-2 block"
                    >
                      Email Address
                    </label>
                    <div className={`mobile-input-container ${errors.email && touched.email ? 'error' : ''}`}>
                      <Field
                        type="email"
                        name="email"
                        id="email"
                        className="w-full"
                        placeholder=""
                      />
                    </div>
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="manrope text-xs text-[#EF4444] mt-1"
                    />
                  </div>

                  {apiError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                      {apiError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className={`w-full h-12 bg-[#5D2A8B] rounded-lg text-white manrope font-semibold text-base ${
                      isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Reset Link"}
                  </button>
                </Form>
              )}
            </Formik>
          )}

          <div className="text-center mt-auto">
            <Link
              href="/auth/login"
              className="manrope text-sm text-[#6E6E6E]"
            >
              Remember your password? <span className="font-medium text-[#5D2A8B]">Login</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="desktop-layout">
        <div className="relative" style={{ width: "1440px", minHeight: "1000px", margin: "0 auto" }}>
          {/* Left Image Section */}
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
                width={55} 
                height={48} 
                src="/Group 1.png" 
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
                  Forgot Password?
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
                  Enter your email and we'll send you a link to reset your password
                </p>
              </div>
            </div>

            {/* Error Alert */}
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

            {/* Success Message */}
            {requestStatus.success && (
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
                    background: "#D1FAE5",
                    border: "1px solid #10B981",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 11L10 13L14 7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div style={{ color: "#065F46", fontSize: "14px" }}>
                    <span style={{ fontWeight: 600 }}>Success!</span> {requestStatus.message}
                  </div>
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
                <Formik
                  initialValues={{ email: "" }}
                  validationSchema={ForgotPasswordSchema}
                  onSubmit={handleSubmit}
                >
                  {({ errors, touched, isSubmitting, values, handleChange }) => (
                    <Form>
                      <div className={`input-container ${values.email ? 'has-value' : ''} ${errors.email && touched.email ? 'error' : ''}`}>
                        <input
                          type="email"
                          name="email"
                          value={values.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                        />
                        {values.email && (
                          <label className="input-label">Email</label>
                        )}
                      </div>
                      <div style={{ color: "#ef4444", fontSize: "14px", marginTop: "4px", fontFamily: "Manrope" }}>
                        <ErrorMessage
                          name="email"
                          component="div"
                        />
                      </div>
                      
                      <button
                        type="submit"
                        className={`w-full mt-6 h-12 bg-[#5D2A8B] rounded-lg text-white manrope font-semibold text-base ${
                          isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                        disabled={isSubmitting}
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
                          cursor: isSubmitting ? "not-allowed" : "pointer",
                          opacity: isSubmitting ? 0.7 : 1
                        }}
                      >
                        {isSubmitting ? "Sending..." : "Send Reset Link"}
                      </button>
                    </Form>
                  )}
                </Formik>
              </div>

              {/* Footer - Position adjusts based on error */}
              <div 
                className="absolute"
                style={{
                  top: apiError ? "757px" : "682px",
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
                  Remember your password?{" "}
                  <Link
                    href="/auth/login"
                    style={{
                      fontWeight: 500,
                      color: "#5D2A8B",
                      textDecoration: "none"
                    }}
                  >
                    Login
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;