// 'use client';

// import React, { useState, useEffect } from 'react';
// import { Eye, EyeOff } from 'lucide-react';
// import Image from 'next/image';
// import { useRouter } from 'next/navigation';
// import { useMutation } from '@tanstack/react-query';
// import { useAuth } from '@/api/hooks/useAuth';
// import { toast } from '@/app/components/hooks/use-toast';
// import Link from "next/link";

// interface FormValues {
//   name: string;
//   email: string;
//   phone: string;
//   password: string;
//   confirmPassword: string;
//   organizationName: string;
//   country: string;
//   industry: string;
//   category: string;
// }

// interface Industry {
//   id: string;
//   name: string;
//   description?: string;
// }


// interface CarouselImage {
//   src: string;
//   alt: string;
//   title?: string;
//   titlePosition?: 'top' | 'bottom';
//   backgroundColor?: string;
// }

// type ApiError = {
//   response?: {
//     status?: number;
//     statusText?: string;
//     data?: {
//       errors?: Array<{ message: string }>;
//       message?: string;
//       debug?: string;
//     };
//   };
//   message?: string;
//   code?: string;
//   name?: string;
// };

// export default function OrganizationSignupPage() {
//   const router = useRouter();
//   const { client } = useAuth();

//   const [formValues, setFormValues] = useState<FormValues>({
//     name: '',
//     email: '',
//     phone: '',
//     password: '',
//     confirmPassword: '',
//     organizationName: '',
//     country: '',
//     industry: '',
//     category: '',
//   });
//   const [errors, setErrors] = useState<Partial<FormValues>>({});
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [showErrorModal, setShowErrorModal] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');
//   const [industries, setIndustries] = useState<Industry[]>([]);
//   const [loadingIndustries, setLoadingIndustries] = useState(false);
//   const [showIndustriesDropdown, setShowIndustriesDropdown] = useState(false);
//   const [industrySearch, setIndustrySearch] = useState('');

//   const { mutate: submitMutate, isPending } = useMutation({
//     mutationFn: async (values: { name: string; email: string; phone: string; password: string; organizationName: string; country: string; industry: string; category: string }) => {
//       // Use the full name as provided
//       const firstName = '';
//       const lastName = '';
      
//       // Normalize phone number
//       let normalizedPhone = values.phone.replace(/\s/g, '').replace(/[()-]/g, '');
      
//       if (normalizedPhone.startsWith('0')) {
//         normalizedPhone = '+234' + normalizedPhone.substring(1);
//       }
      
//       if (!normalizedPhone.startsWith('+') && normalizedPhone.length === 10) {
//         normalizedPhone = '+234' + normalizedPhone;
//       }
      
//       // Find the selected industry to get its name
//       const selectedIndustry = industries.find(ind => ind.id === values.industry);
      
//       const payload = {
//         fullName: values.name,
//         email: values.email.toLowerCase().trim(),
//         password: values.password,
//         phoneNumber: normalizedPhone,
//         organizationName: values.organizationName,
//         country: values.country,
//         industryId: values.industry,
//         industryName: selectedIndustry?.name || '',
//         categoryId: values.category,
//         role: "ORGANIZATION"
//       };
      
//       console.log('🚀 Sending ORGANIZATION registration to backend:', payload);

//       const { data } = await client.post(`${BASE_URL}/api/auth/register`, payload);
//       return data;
//     },
//     onSuccess: (response) => {
//       // Always redirect to email verification after registration
//       toast({ 
//         title: 'ORGANIZATION REGISTRATION SUCCESSFUL!',
//         description: 'Please check your email for the verification code'
//       });
//       router.push(`/auth/verify-email?email=${encodeURIComponent(formValues.email)}`);
//     },
//     onError: (error: ApiError) => {
//       let message = 'Registration failed';
      
//       if (error?.response?.data?.debug) {
//         // Use debug message if available
//         message = error.response.data.debug;
//       } else if (error?.response?.data?.errors?.[0]?.message) {
//         message = error.response.data.errors[0].message;
//       } else if (error?.response?.data?.message) {
//         message = error.response.data.message;
//       } else if (error?.message) {
//         message = error.message;
//       } else if (error.code === 'ERR_NETWORK') {
//         message = 'Network error. Please check your internet connection.';
//       } else if (error.name === 'AxiosError' && !error.response) {
//         message = 'Unable to connect to server. Please try again later.';
//       }
      
//       const errorMessage = message.toLowerCase();
//       if (errorMessage.includes('phone') && 
//           (errorMessage.includes('duplicate') || 
//            errorMessage.includes('already exists') ||
//            errorMessage.includes('taken') ||
//            errorMessage.includes('already registered'))) {
//         setErrors(prev => ({ ...prev, phone: 'This phone number is already exist.' }));
//       } else if (message.includes('A user with phone number') && message.includes('already exists')) {
//         // Handle the specific error format from the server
//         const phoneMatch = message.match(/A user with phone number ([\d\s\-+]+) already exists/);
//         if (phoneMatch) {
//           setErrors(prev => ({ ...prev, phone: `A user with phone number ${phoneMatch[1]} already exists` }));
//         } else {
//           setErrors(prev => ({ ...prev, phone: message }));
//         }
//       } else {
//         setErrors(prev => ({ ...prev, phone: '' }));
//       }
      
//       // Handle duplicate email errors
//       if (errorMessage.includes('email') && 
//           (errorMessage.includes('duplicate') || 
//            errorMessage.includes('already exists') ||
//            errorMessage.includes('taken') ||
//            errorMessage.includes('already registered'))) {
//         setErrors(prev => ({ ...prev, email: 'This email address is already registered.' }));
//       } else if (message.includes('A user with email') && message.includes('already exists')) {
//         // Handle the specific error format from the server
//         const emailMatch = message.match(/A user with email ([^\s@]+@[^\s@]+\.[^\s@]+) already exists/);
//         if (emailMatch) {
//           setErrors(prev => ({ ...prev, email: `A user with email ${emailMatch[1]} already exists` }));
//         } else {
//           setErrors(prev => ({ ...prev, email: message }));
//         }
//       } else {
//         setErrors(prev => ({ ...prev, email: '' }));
//       }
      
//       // Set the error message and show the modal instead of toast
//       setErrorMessage(message);
//       setShowErrorModal(true);
//     },
//   });

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormValues(prev => ({ ...prev, [name]: value }));
//     if (errors[name as keyof FormValues]) {
//       setErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };

//   const handleIndustrySelect = (industryId: string) => {
//     setFormValues(prev => ({ ...prev, industry: industryId }));
//     setShowIndustriesDropdown(false);
//     setIndustrySearch('');
//     if (errors.industry) {
//       setErrors(prev => ({ ...prev, industry: '' }));
//     }
//   };

//   const validate = (): boolean => {
//     const newErrors: Partial<FormValues> = {};
    
//     if (!formValues.name.trim()) newErrors.name = 'Full name is required';
//     if (!formValues.email.trim()) newErrors.email = 'Email is required';
//     else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) newErrors.email = 'Invalid email address';
//     else if (errors.email && (errors.email.includes('already registered') || errors.email.includes('already exists'))) newErrors.email = errors.email;
//     if (!formValues.phone.trim()) newErrors.phone = 'Phone number is required';
//     else if (!/^(\+?234|0)?[789][01]\d{8}$/.test(formValues.phone.replace(/\s/g, ''))) newErrors.phone = 'Please enter a valid Nigerian phone number';
//     else if (errors.phone && errors.phone.includes('already registered')) newErrors.phone = errors.phone;
//     if (!formValues.password) newErrors.password = 'Password is required';
//     else if (formValues.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
//     if (!formValues.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
//     else if (formValues.password !== formValues.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
//     if (!formValues.organizationName.trim()) newErrors.organizationName = 'Organization name is required';
//     if (!formValues.country) newErrors.country = 'Country is required';
//     if (!formValues.industry.trim()) newErrors.industry = 'Industry is required';
//     if (!formValues.category.trim()) newErrors.category = 'Category is required';
    
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!validate()) return;
//     submitMutate({ 
//       name: formValues.name, 
//       email: formValues.email, 
//       phone: formValues.phone, 
//       password: formValues.password,
//       organizationName: formValues.organizationName,
//       country: formValues.country,
//       industry: formValues.industry,
//       category: formValues.category
//     });
//   };

//   const handleGoogleSignUp = () => {
//     toast({
//       title: 'Google Sign Up',
//       description: 'This feature will be implemented soon'
//     });
//   };

//   // Carousel state
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
//   // Define carousel images with text overlays for specific slides
//   const carouselImages: CarouselImage[] = [
//     { 
//       src: "/Frame 335677.png", 
//       alt: "Data Capturing Illustration"
//     },
//     { 
//       src: "/assets/view-measurement.png", 
//       alt: "View Measurement",
//       title: "VIEW MEASUREMENT",
//       titlePosition: "top",
//       backgroundColor: "#ccbddb"
//     },
//     { 
//       src: "/assets/Group (2).png", 
//       alt: "Take Image",
//       title: "TAKE IMAGE",
//       titlePosition: "top",
//       backgroundColor: "#ccbddb"
//     }
//   ];

//   // Fetch industries from API
//   useEffect(() => {
//     const fetchIndustries = async () => {
//       try {
//         setLoadingIndustries(true);
//         const response = await client.get(`${BASE_URL}/api/auth/industries`);
//         if (response.data && response.data.success) {
//           // Handle response format: { success: true, data: { industries: [...] } }
//           const industriesData = response.data.data?.industries || response.data.data || [];
//           setIndustries(industriesData);
//         }
//       } catch (error) {
//         console.error('Error fetching industries:', error);
//         toast({
//           title: 'Error',
//           description: 'Failed to load industries. Please try again.',
//           variant: 'destructive'
//         });
//       } finally {
//         setLoadingIndustries(false);
//       }
//     };

//     fetchIndustries();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []); // Empty dependency array - only fetch on mount

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (showIndustriesDropdown && !(event.target as Element).closest('.input-container')) {
//         setShowIndustriesDropdown(false);
//         setIndustrySearch('');
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, [showIndustriesDropdown]);

//   // Auto-rotate carousel
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentImageIndex((prevIndex) => 
//         prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
//       );
//     }, 5000); // Change image every 5 seconds

//     return () => clearInterval(interval);
//   }, [carouselImages.length]);

//   // List of all countries
//   const countries = [
//     'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 
//     'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 
//     'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 
//     'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 
//     'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 
//     'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 
//     'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 
//     'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 
//     'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 
//     'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 
//     'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 
//     'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 
//     'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 
//     'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 
//     'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 
//     'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 
//     'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 
//     'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 
//     'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 
//     'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 
//     'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 
//     'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 
//     'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 
//     'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 
//     'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 
//     'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 
//     'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 
//     'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 
//     'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 
//     'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 
//     'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 
//     'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
//   ];

//   return (
//     <div className="min-h-screen bg-white">
//       <style jsx>{`
//         @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
//         .monument-extended { font-family: 'Monument Extended', sans-serif; }
//         .manrope { font-family: 'Manrope', sans-serif; }
        
//         /* Common styles */
//         .input-container {
//           position: relative;
//           width: 100%;
//           background: white;
//           margin-bottom: 16px;
//         }
        
//         .input-field {
//           width: 100%;
//           border: 1px solid #6E6E6E4D;
//           border-radius: 12px;
//           background: white;
//           font-family: 'Manrope', sans-serif;
//           color: #6E6E6E;
//           outline: none;
//           -webkit-appearance: none;
//           -moz-appearance: none;
//           appearance: none;
//           transition: all 0.3s ease;
//         }
        
//         .input-field:focus {
//           border-color: #5D2A8B;
//         }
        
//         .input-field.has-value {
//           padding-top: 25px;
//           padding-bottom: 9px;
//         }
        
//         .input-label {
//           position: absolute;
//           top: -10px;
//           left: 20px;
//           font-family: 'Manrope', sans-serif;
//           font-weight: 400;
//           font-size: 14px;
//           color: #6E6E6E; /* Changed to match input text color */
//           background: white;
//           padding: 0 5px;
//           pointer-events: none;
//           transition: all 0.3s ease;
//         }
        
//         .input-container.error .input-field {
//           border-color: #ef4444;
//         }
        
//         .password-toggle {
//           position: absolute;
//           right: 15px;
//           top: 50%;
//           transform: translateY(-50%);
//           cursor: pointer;
//           color: #6E6E6E;
//         }
        
//         .error-message {
//           font-family: 'Manrope', sans-serif;
//           font-size: 12px;
//           color: #EF4444;
//           margin-top: 4px;
//           margin-left: 4px;
//         }
        
//         .submit-button {
//           width: 100%;
//           background: #5D2A8B;
//           border-radius: 12px;
//           color: white;
//           font-family: 'Manrope', sans-serif;
//           font-weight: 600;
//           border: none;
//           cursor: pointer;
//           transition: opacity 0.3s;
//         }
        
//         .submit-button:disabled {
//           opacity: 0.7;
//           cursor: not-allowed;
//         }
        
//         .footer-text {
//           font-family: 'Manrope', sans-serif;
//           color: #6E6E6E;
//           text-align: center;
//         }
        
//         .footer-link {
//           font-weight: 500;
//           color: #5D2A8B;
//         }
        
//         /* Mobile-first responsive layout */
//         .desktop-layout {
//           display: none;
//         }
        
//         .mobile-layout {
//           display: flex;
//           flex-direction: column;
//           min-height: 100vh;
//           padding: 24px;
//           max-width: 400px;
//           margin: 0 auto;
//         }
        
//         /* Mobile specific */
//         .mobile-input-container {
//           height: 50px;
//           margin-bottom: 22px; /* Increased to accommodate error */
//         }
        
//         .mobile-input-container.error {
//           margin-bottom: 30px; /* Extra space when error is shown */
//         }
        
//         .mobile-input-field {
//           height: 50px;
//           padding: 14px 16px;
//           font-size: 16px;
//         }
        
//         .mobile-password-toggle {
//           right: 12px;
//         }
        
//         .mobile-password-toggle svg {
//           width: 18px;
//           height: 18px;
//         }
        
//         .mobile-input-field.has-value {
//           padding-top: 20px;
//           padding-bottom: 6px;
//         }
        
//         .mobile-input-label {
//           font-size: 12px;
//           left: 16px;
//         }
        
//         /* Mobile error message - FIXED */
//         .mobile-input-container .error-message {
//           position: absolute;
//           bottom: -22px;
//           left: 4px;
//           font-size: 11px;
//           background-color: white;
//           padding: 2px 6px;
//           z-index: 10;
//           white-space: nowrap;
//           border-radius: 4px;
//           box-shadow: 0 1px 3px rgba(0,0,0,0.1);
//         }
        
//         .mobile-submit-button {
//           height: 48px;
//           font-size: 16px;
//           margin: 24px 0 16px 0; /* Adjusted margin */
//           border-radius: 8px;
//         }
        
//         .mobile-footer-text {
//           font-size: 14px;
//         }
        
//         @media (min-width: 1024px) {
//           .desktop-layout {
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             min-height: 100vh;
//             background: white;
//             padding: 44px 45px;
//           }
          
//           .mobile-layout {
//             display: none;
//           }
//         }
        
//         /* Desktop container */
//         .desktop-container {
//           width: 100%;
//           max-width: 1439px;
//           display: flex;
//           gap: 76px;
//         }
        
//         .desktop-left-image {
//           flex: 0 0 700px;
//           height: 1025px;
//           min-height: 800px;
//           border-radius: 40px;
//           overflow: hidden;
//         }
        
//         .desktop-form-container {
//           flex: 0 0 609px;
//           height: 1025px;
//           min-height: 800px;
//           background: #FBFAFC;
//           border-radius: 40px;
//           position: relative;
//         }
        
//         /* Desktop specific styles */
//         .desktop-input-container {
//           height: 75px;
//           margin-bottom: 30px; /* Increased to accommodate error */
//         }
        
//         .desktop-input-container.error {
//           margin-bottom: 42px; /* Extra space when error is shown */
//         }
        
//         .desktop-input-field {
//           height: 75px;
//           padding: 17px 30px;
//           font-size: 20px;
//           border-radius: 12px;
//         }
        
//         .desktop-input-field.has-value {
//           padding-top: 25px;
//           padding-bottom: 9px;
//         }
        
//         .desktop-input-label {
//           font-size: 14px;
//           left: 30px;
//         }
        
//         .desktop-password-toggle {
//           right: 15px;
//         }
        
//         .desktop-password-toggle svg {
//           width: 20px;
//           height: 20px;
//         }
        
//         /* Desktop error message - FIXED */
//         .desktop-input-container .error-message {
//           position: absolute;
//           bottom: -26px;
//           left: 4px;
//           font-size: 13px;
//           background-color: white;
//           padding: 3px 8px;
//           z-index: 10;
//           white-space: nowrap;
//           border-radius: 4px;
//           box-shadow: 0 1px 3px rgba(0,0,0,0.1);
//         }
        
//         .desktop-submit-button {
//           height: 60px;
//           font-size: 16px;
//           margin: 32px 0 24px 0; /* Adjusted margin */
//           border-radius: 12px;
//         }
        
//         .desktop-footer-text {
//           font-size: 18px;
//           font-weight: 300;
//         }
        
//         /* Google button */
//         .google-button {
//           width: 100%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           gap: 12px;
//           border: 1px solid #6E6E6E4D;
//           border-radius: 12px;
//           background: white;
//           cursor: pointer;
//           transition: background-color 0.3s;
//         }
        
//         .google-button:hover {
//           background-color: #f9fafb;
//         }
        
//         .google-button-text {
//           font-family: 'Manrope', sans-serif;
//           font-weight: 500;
//           color: #374151;
//         }
        
//         /* Divider */
//         .divider {
//           display: flex;
//           align-items: center;
//           margin: 24px 0;
//         }
        
//         .divider-line {
//           flex: 1;
//           height: 1px;
//           background-color: #E5E7EB;
//         }
        
//         .divider-text {
//           padding: 0 16px;
//           font-family: 'Manrope', sans-serif;
//           color: #6B7280;
//         }
        
//         /* Carousel styles */
//         .carousel-container {
//           position: relative;
//           width: 100%;
//           height: 100%;
//           min-height: 800px;
//         }
        
//         .carousel-image-wrapper {
//           position: absolute;
//           inset: 0;
//           width: 100%;
//           height: 100%;
//           min-height: 800px;
//           transition: opacity 0.5s ease-in-out;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           justify-content: center;
//         }
        
//         .carousel-image {
//           width: 100%;
//           height: 100%;
//           min-height: 800px;
//           object-fit: cover;
//         }
        
//         /* Text overlay styles */
//         .carousel-text-overlay {
//           position: absolute;
//           width: 180px;
//           height: 17px;
//           top: 37px;
//           left: 50%;
//           transform: translateX(-50%);
//           font-family: 'Monument Extended', sans-serif;
//           font-weight: 400;
//           font-style: normal;
//           font-size: 14px;
//           line-height: 100%;
//           letter-spacing: 0%;
//           text-align: center;
//           color: white;
//           z-index: 5;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           white-space: nowrap;
//         }
        
//         .carousel-indicators {
//           position: absolute;
//           bottom: 20px;
//           left: 50%;
//           transform: translateX(-50%);
//           display: flex;
//           gap: 10px;
//           z-index: 10;
//         }
        
//         .carousel-indicator {
//           width: 12px;
//           height: 12px;
//           border-radius: 50%;
//           background-color: rgba(255, 255, 255, 0.5);
//           cursor: pointer;
//           transition: background-color 0.3s ease;
//         }
        
//         .carousel-indicator.active {
//           background-color: white;
//         }
        
//         /* Country select specific */
//         .input-field[type="select"] {
//           background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='%236E6E6E' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat;
//           background-position: right 20px center;
//           background-size: 20px;
//           padding-right: 50px;
//         }
        
//         .mobile-input-field[type="select"] {
//           background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236E6E6E' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat;
//           background-position: right 16px center;
//           background-size: 16px;
//           padding-right: 40px;
//         }
        
//         /* Desktop form positioning */
//         .desktop-form-content {
//           position: absolute;
//           top: 50px;
//           left: 50px;
//           right: 50px;
//         }
        
//         /* Make desktop form scrollable */
//         .desktop-form-scroll {
//           max-height: calc(1025px - 200px);
//           overflow-y: auto;
//           padding-right: 10px;
//         }
        
//         .desktop-form-scroll::-webkit-scrollbar {
//           width: 6px;
//         }
        
//         .desktop-form-scroll::-webkit-scrollbar-track {
//           background: #f1f1f1;
//           border-radius: 10px;
//         }
        
//         .desktop-form-scroll::-webkit-scrollbar-thumb {
//           background: #c1c1c1;
//           border-radius: 10px;
//         }
//       `}</style>

//       {/* Error Modal */}
//       {/* {showErrorModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-lg max-w-md w-full p-6">
//             <div className="flex justify-between items-start mb-4">
//               <h3 className="text-lg font-semibold text-gray-900">Registration Error</h3>
//               <button 
//                 onClick={() => setShowErrorModal(false)}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>
//             <div className="mb-4">
//               <p className="text-gray-700">{errorMessage}</p>
//             </div>
//             <div className="flex justify-end">
//               <button
//                 onClick={() => setShowErrorModal(false)}
//                 className="px-4 py-2 bg-[#5D2A8B] text-white rounded-md hover:bg-[#4a206d]"
//               >
//                 OK
//               </button>
//             </div>
//           </div>
//         </div>
//       )} */}

//       {/* Mobile Layout */}
//       <div className="mobile-layout">
//         {/* Logo */}
//         <div className="mb-6">
//           <Image 
//             width={40} 
//             height={35} 
//             src="/Group 1.png" 
//             alt="Company Logo" 
//             className="object-contain" 
//           />
//         </div>

//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="monument-extended text-2xl font-normal text-[#1A1A1A] mb-3">
//             Organization Sign Up
//           </h1>
//           <p className="manrope text-sm font-light text-[#9CA3AF]">
//             Create an organization account to manage the platform
//           </p>
//         </div>

//         {/* Form */}
//         <div className="flex-1">
//           {/* Full Name Input */}
//           <div className={`input-container mobile-input-container ${errors.name ? 'error' : ''}`}>
//             <input
//               type="text"
//               name="name"
//               value={formValues.name}
//               onChange={handleChange}
//               placeholder="Demola Alo"
//               className={`input-field mobile-input-field ${formValues.name ? 'has-value' : ''}`}
//             />
//             {formValues.name && (
//               <label className="input-label mobile-input-label">Full Name</label>
//             )}
//             {errors.name && <p className="error-message">{errors.name}</p>}
//           </div>

//           {/* Email Input */}
//           <div className={`input-container mobile-input-container ${errors.email ? 'error' : ''}`}>
//             <input
//               type="email"
//               name="email"
//               value={formValues.email}
//               onChange={handleChange}
//               placeholder="you@example.com"
//               className={`input-field mobile-input-field ${formValues.email ? 'has-value' : ''}`}
//             />
//             {formValues.email && (
//               <label className="input-label mobile-input-label">Email</label>
//             )}
//             {errors.email && <p className="error-message">{errors.email}</p>}
//           </div>

//           {/* Phone Input */}
//           <div className={`input-container mobile-input-container ${errors.phone ? 'error' : ''}`}>
//             <input
//               type="tel"
//               name="phone"
//               value={formValues.phone}
//               onChange={handleChange}
//               placeholder="09012345678"
//               className={`input-field mobile-input-field ${formValues.phone ? 'has-value' : ''}`}
//             />
//             {formValues.phone && (
//               <label className="input-label mobile-input-label">Phone Number</label>
//             )}
//             {errors.phone && <p className="error-message">{errors.phone}</p>}
//           </div>

//           {/* Organization Name Input */}
//           <div className={`input-container mobile-input-container ${errors.organizationName ? 'error' : ''}`}>
//             <input
//               type="text"
//               name="organizationName"
//               value={formValues.organizationName}
//               onChange={handleChange}
//               placeholder="Your Organization"
//               className={`input-field mobile-input-field ${formValues.organizationName ? 'has-value' : ''}`}
//             />
//             {formValues.organizationName && (
//               <label className="input-label mobile-input-label">Organization Name</label>
//             )}
//             {errors.organizationName && <p className="error-message">{errors.organizationName}</p>}
//           </div>

//           {/* Country Input */}
//           <div className={`input-container mobile-input-container ${errors.country ? 'error' : ''}`}>
//             <select
//               name="country"
//               value={formValues.country}
//               onChange={handleChange}
//               className={`input-field mobile-input-field ${formValues.country ? 'has-value' : ''}`}
//               style={{ 
//                 background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236E6E6E' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat right 16px center/16px, white`
//               }}
//             >
//               <option value="" disabled>Select your country</option>
//               {countries.map((country) => (
//                 <option key={country} value={country}>
//                   {country}
//                 </option>
//               ))}
//             </select>
//             {formValues.country && (
//               <label className="input-label mobile-input-label">Country</label>
//             )}
//             {errors.country && <p className="error-message">{errors.country}</p>}
//           </div>

//           {/* Industry Input - Dropdown */}
//           <div className={`input-container mobile-input-container ${errors.industry ? 'error' : ''}`} style={{ position: 'relative' }}>
//             <div
//               onClick={() => setShowIndustriesDropdown(!showIndustriesDropdown)}
//               className={`input-field mobile-input-field ${formValues.industry ? 'has-value' : ''}`}
//               style={{ 
//                 cursor: 'pointer',
//                 background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236E6E6E' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat right 16px center/16px, white`,
//                 paddingRight: '40px'
//               }}
//             >
//               {formValues.industry ? (() => {
//                 const selected = industries.find(ind => ind.id === formValues.industry);
//                 return selected ? selected.name : 'Select industry';
//               })() : 'Select industry'}
//             </div>
//             {formValues.industry && (
//               <label className="input-label mobile-input-label">Industry</label>
//             )}
//             {errors.industry && <p className="error-message">{errors.industry}</p>}
            
//             {/* Dropdown */}
//             {showIndustriesDropdown && (
//               <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto" style={{ top: '100%' }}>
//                 <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
//                   <input
//                     type="text"
//                     placeholder="Search industries..."
//                     value={industrySearch}
//                     onChange={(e) => setIndustrySearch(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5D2A8B] focus:border-transparent text-sm"
//                     onClick={(e) => e.stopPropagation()}
//                   />
//                 </div>
//                 <div className="max-h-48 overflow-y-auto">
//                   {loadingIndustries ? (
//                     <div className="p-3 text-sm text-gray-500 text-center">Loading industries...</div>
//                   ) : (
//                     industries
//                       .filter(industry => 
//                         industry.name.toLowerCase().includes(industrySearch.toLowerCase())
//                       )
//                       .map(industry => (
//                         <label
//                           key={industry.id}
//                           className="flex items-center px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors"
//                         >
//                           <input
//                             type="radio"
//                             name="industry"
//                             value={industry.id}
//                             checked={formValues.industry === industry.id}
//                             onChange={() => handleIndustrySelect(industry.id)}
//                             className="w-4 h-4 text-[#5D2A8B] focus:ring-[#5D2A8B]"
//                           />
//                           <span className="ml-3 text-sm text-gray-700 flex-1">
//                             {industry.name}
//                           </span>
//                         </label>
//                       ))
//                   )}
//                   {!loadingIndustries && industries.filter(i => i.name.toLowerCase().includes(industrySearch.toLowerCase())).length === 0 && (
//                     <div className="p-3 text-sm text-gray-500 text-center">No industries found</div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Category Input */}
//           <div className={`input-container mobile-input-container ${errors.category ? 'error' : ''}`}>
//             <input
//               type="text"
//               name="category"
//               value={formValues.category}
//               onChange={handleChange}
//               placeholder="e.g., Software Development, Medical Services"
//               className={`input-field mobile-input-field ${formValues.category ? 'has-value' : ''}`}
//             />
//             {formValues.category && (
//               <label className="input-label mobile-input-label">Category</label>
//             )}
//             {errors.category && <p className="error-message">{errors.category}</p>}
//           </div>

//           {/* Password Input */}
//           <div className={`input-container mobile-input-container ${errors.password ? 'error' : ''}`}>
//             <input
//               type={showPassword ? 'text' : 'password'}
//               name="password"
//               value={formValues.password}
//               onChange={handleChange}
//               placeholder="••••••••"
//               className={`input-field mobile-input-field ${formValues.password ? 'has-value' : ''}`}
//               style={{ paddingRight: "45px" }}
//             />
//             {formValues.password && (
//               <label className="input-label mobile-input-label">Password</label>
//             )}
//             <button 
//               type="button" 
//               onClick={() => setShowPassword(!showPassword)}
//               className="password-toggle mobile-password-toggle"
//             >
//               {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//             </button>
//             {errors.password && <p className="error-message">{errors.password}</p>}
//           </div>

//           {/* Confirm Password Input */}
//           <div className={`input-container mobile-input-container ${errors.confirmPassword ? 'error' : ''}`}>
//             <input
//               type={showConfirmPassword ? 'text' : 'password'}
//               name="confirmPassword"
//               value={formValues.confirmPassword}
//               onChange={handleChange}
//               placeholder="••••••••"
//               className={`input-field mobile-input-field ${formValues.confirmPassword ? 'has-value' : ''}`}
//               style={{ paddingRight: "45px" }}
//             />
//             {formValues.confirmPassword && (
//               <label className="input-label mobile-input-label">Confirm Password</label>
//             )}
//             <button 
//               type="button" 
//               onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//               className="password-toggle mobile-password-toggle"
//             >
//               {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//             </button>
//             {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
//           </div>

//           {/* Sign Up Button */}
//           <button 
//             type="button"
//             onClick={handleSubmit}
//             disabled={isPending}
//             className="submit-button mobile-submit-button"
//             onTouchStart={() => {}} // Fixes potential iOS Safari click delay
//           >
//             {isPending ? 'Signing up...' : 'Sign Up as Organization'}
//           </button>
//         </div>

//         {/* Footer - Removed border */}
//         <div className="mt-8">
//           <p className="footer-text mobile-footer-text">
//             Already have an account?{" "}
//             <Link
//               href="/auth/login"
//               className="footer-link"
//             >
//               Login
//             </Link>
//           </p>
//         </div>
//       </div>

//       {/* Desktop Layout */}
//       <div className="desktop-layout">
//         <div className="desktop-container">
//           {/* Left Image Section - Carousel */}
//           <div className="desktop-left-image">
//             <div className="carousel-container">
//               {carouselImages.map((image, index) => (
//                 <div
//                   key={index}
//                   className={`carousel-image-wrapper ${
//                     index === currentImageIndex ? 'opacity-100' : 'opacity-0'
//                   }`}
//                   style={{
//                     backgroundColor: image.backgroundColor || 'transparent'
//                   }}
//                 >
//                   <Image 
//                     src={image.src}
//                     alt={image.alt}
//                     width={700}
//                     height={1025}
//                     priority={index === 0}
//                     className="carousel-image"
//                   />
//                   {image.title && (
//                     <div className={`carousel-text-overlay ${image.titlePosition || 'bottom'}`}>
//                       {image.title}
//                     </div>
//                   )}
//                 </div>
//               ))}
              
//               {/* Carousel Indicators */}
//               <div className="carousel-indicators">
//                 {carouselImages.map((_, index) => (
//                   <button
//                     key={index}
//                     onClick={() => setCurrentImageIndex(index)}
//                     className={`carousel-indicator ${
//                       index === currentImageIndex ? 'active' : ''
//                     }`}
//                     aria-label={`Go to image ${index + 1}`}
//                   />
//                 ))}
//               </div>
//             </div>
//           </div>
              
//           {/* Right Form Section */}
//           <div className="desktop-form-container">
//             <div className="desktop-form-content">
//               {/* Logo */}
//               <div className="mb-12">
//                 <Image 
//                   width={55} 
//                   height={48} 
//                   src="/Group 1.png" 
//                   alt="Company Logo" 
//                   className="object-contain" 
//                 />
//               </div>

//               {/* Header */}
//               <div className="mb-12">
//                 <h1 className="monument-extended text-[30px] font-normal text-[#1A1A1A] mb-4">
//                   Organization Sign Up
//                 </h1>
//                 <p className="manrope text-[18px] font-light text-[#6E6E6EB2]">
//                   Create an organization account to manage the platform
//                 </p>
//               </div>

//               {/* Google Sign Up Button */}
//               <button 
//                 type="button" 
//                 onClick={handleGoogleSignUp}
//                 className="google-button h-[60px] mb-8"
//               >
//                 <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
//                   <path d="M19.8 10.2273C19.8 9.52045 19.7364 8.83636 19.6182 8.18182H10.2V12.05H15.5891C15.3545 13.3 14.6182 14.3591 13.5182 15.0682V17.5773H16.8091C18.7091 15.8364 19.8 13.2727 19.8 10.2273Z" fill="#4285F4"/>
//                   <path d="M10.2 20C12.9 20 15.1636 19.1045 16.8091 17.5773L13.5182 15.0682C12.5909 15.6682 11.4182 16.0227 10.2 16.0227C7.59545 16.0227 5.39091 14.2636 4.57273 11.9H1.16364V14.4909C2.79545 17.7591 6.26364 20 10.2 20Z" fill="#34A853"/>
//                   <path d="M4.57273 11.9C4.37273 11.3 4.25909 10.6591 4.25909 10C4.25909 9.34091 4.37273 8.7 4.57273 8.1V5.50909H1.16364C0.477273 6.85909 0.0909091 8.38636 0.0909091 10C0.0909091 11.6136 0.477273 13.1409 1.16364 14.4909L4.57273 11.9Z" fill="#FBBC04"/>
//                   <path d="M10.2 3.97727C11.5318 3.97727 12.7136 4.43182 13.6409 5.30909L16.5682 2.38182C15.1591 1.08182 12.8955 0.227273 10.2 0.227273C6.26364 0.227273 2.79545 2.46818 1.16364 5.50909L4.57273 8.1C5.39091 5.73636 7.59545 3.97727 10.2 3.97727Z" fill="#EA4335"/>
//                 </svg>
//                 <span className="google-button-text text-[15px]">
//                   Sign up with Google
//                 </span>
//               </button>

//               {/* Divider */}
//               <div className="divider mb-8">
//                 <div className="divider-line" />
//                 <span className="divider-text text-sm">or</span>
//                 <div className="divider-line" />
//               </div>

//               {/* Form Inputs - Scrollable Area */}
//               <div className="desktop-form-scroll">
//                 {/* Full Name */}
//                 <div className={`input-container desktop-input-container ${errors.name ? 'error' : ''}`}>
//                   <input
//                     type="text"
//                     name="name"
//                     value={formValues.name}
//                     onChange={handleChange}
//                     placeholder="Demola Alo"
//                     className={`input-field desktop-input-field ${formValues.name ? 'has-value' : ''}`}
//                   />
//                   {formValues.name && (
//                     <label className="input-label desktop-input-label">Full Name</label>
//                   )}
//                   {errors.name && <p className="error-message">{errors.name}</p>}
//                 </div>

//                 {/* Email */}
//                 <div className={`input-container desktop-input-container ${errors.email ? 'error' : ''}`}>
//                   <input
//                     type="email"
//                     name="email"
//                     value={formValues.email}
//                     onChange={handleChange}
//                     placeholder="you@example.com"
//                     className={`input-field desktop-input-field ${formValues.email ? 'has-value' : ''}`}
//                   />
//                   {formValues.email && (
//                     <label className="input-label desktop-input-label">Email</label>
//                   )}
//                   {errors.email && <p className="error-message">{errors.email}</p>}
//                 </div>

//                 {/* Phone */}
//                 <div className={`input-container desktop-input-container ${errors.phone ? 'error' : ''}`}>
//                   <input
//                     type="tel"
//                     name="phone"
//                     value={formValues.phone}
//                     onChange={handleChange}
//                     placeholder="09012345678"
//                     className={`input-field desktop-input-field ${formValues.phone ? 'has-value' : ''}`}
//                   />
//                   {formValues.phone && (
//                     <label className="input-label desktop-input-label">Phone Number</label>
//                   )}
//                   {errors.phone && <p className="error-message">{errors.phone}</p>}
//                 </div>
                

//                 {/* Organization Name */}
//                 <div className={`input-container desktop-input-container ${errors.organizationName ? 'error' : ''}`}>
//                   <input
//                     type="text"
//                     name="organizationName"
//                     value={formValues.organizationName}
//                     onChange={handleChange}
//                     placeholder="Your Organization"
//                     className={`input-field desktop-input-field ${formValues.organizationName ? 'has-value' : ''}`}
//                   />
//                   {formValues.organizationName && (
//                     <label className="input-label desktop-input-label">Organization Name</label>
//                   )}
//                   {errors.organizationName && <p className="error-message">{errors.organizationName}</p>}
//                 </div>

//                 {/* Country */}
//                 <div className={`input-container desktop-input-container ${errors.country ? 'error' : ''}`}>
//                   <select
//                     name="country"
//                     value={formValues.country}
//                     onChange={handleChange}
//                     className={`input-field desktop-input-field ${formValues.country ? 'has-value' : ''}`}
//                     style={{ 
//                       background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='%236E6E6E' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat right 30px center/20px, white`
//                     }}
//                   >
//                     <option value="" disabled>Select your country</option>
//                     {countries.map((country) => (
//                       <option key={country} value={country}>
//                         {country}
//                       </option>
//                     ))}
//                   </select>
//                   {formValues.country && (
//                     <label className="input-label desktop-input-label">Country</label>
//                   )}
//                   {errors.country && <p className="error-message">{errors.country}</p>}
//                 </div>

//                 {/* Industry - Dropdown */}
//                 <div className={`input-container desktop-input-container ${errors.industry ? 'error' : ''}`} style={{ position: 'relative' }}>
//                   <div
//                     onClick={() => setShowIndustriesDropdown(!showIndustriesDropdown)}
//                     className={`input-field desktop-input-field ${formValues.industry ? 'has-value' : ''}`}
//                     style={{ 
//                       cursor: 'pointer',
//                       background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='%236E6E6E' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat right 30px center/20px, white`,
//                       paddingRight: '60px'
//                     }}
//                   >
//                     {formValues.industry ? (() => {
//                       const selected = industries.find(ind => ind.id === formValues.industry);
//                       return selected ? selected.name : 'Select industry';
//                     })() : 'Select industry'}
//                   </div>
//                   {formValues.industry && (
//                     <label className="input-label desktop-input-label">Industry</label>
//                   )}
//                   {errors.industry && <p className="error-message">{errors.industry}</p>}
                  
//                   {/* Dropdown */}
//                   {showIndustriesDropdown && (
//                     <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto" style={{ top: '100%' }}>
//                       <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
//                         <input
//                           type="text"
//                           placeholder="Search industries..."
//                           value={industrySearch}
//                           onChange={(e) => setIndustrySearch(e.target.value)}
//                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5D2A8B] focus:border-transparent"
//                           onClick={(e) => e.stopPropagation()}
//                         />
//                       </div>
//                       <div className="max-h-48 overflow-y-auto">
//                         {loadingIndustries ? (
//                           <div className="p-3 text-sm text-gray-500 text-center">Loading industries...</div>
//                         ) : (
//                           industries
//                             .filter(industry => 
//                               industry.name.toLowerCase().includes(industrySearch.toLowerCase())
//                             )
//                             .map(industry => (
//                               <label
//                                 key={industry.id}
//                                 className="flex items-center px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors"
//                               >
//                                 <input
//                                   type="radio"
//                                   name="industry"
//                                   value={industry.id}
//                                   checked={formValues.industry === industry.id}
//                                   onChange={() => handleIndustrySelect(industry.id)}
//                                   className="w-4 h-4 text-[#5D2A8B] focus:ring-[#5D2A8B]"
//                                 />
//                                 <span className="ml-3 text-sm text-gray-700 flex-1">
//                                   {industry.name}
//                                 </span>
//                               </label>
//                             ))
//                         )}
//                         {!loadingIndustries && industries.filter(i => i.name.toLowerCase().includes(industrySearch.toLowerCase())).length === 0 && (
//                           <div className="p-3 text-sm text-gray-500 text-center">No industries found</div>
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 {/* Category */}
//                 <div className={`input-container desktop-input-container ${errors.category ? 'error' : ''}`}>
//                   <input
//                     type="text"
//                     name="category"
//                     value={formValues.category}
//                     onChange={handleChange}
//                     placeholder="e.g., Software Development, Medical Services"
//                     className={`input-field desktop-input-field ${formValues.category ? 'has-value' : ''}`}
//                   />
//                   {formValues.category && (
//                     <label className="input-label desktop-input-label">Category</label>
//                   )}
//                   {errors.category && <p className="error-message">{errors.category}</p>}
//                 </div>

//                 {/* Password */}
//                 <div className={`input-container desktop-input-container ${errors.password ? 'error' : ''}`}>
//                   <input
//                     type={showPassword ? 'text' : 'password'}
//                     name="password"
//                     value={formValues.password}
//                     onChange={handleChange}
//                     placeholder="••••••••"
//                     className={`input-field desktop-input-field ${formValues.password ? 'has-value' : ''}`}
//                     style={{ paddingRight: '50px' }}
//                   />
//                   {formValues.password && (
//                     <label className="input-label desktop-input-label">Password</label>
//                   )}
//                   <button 
//                     type="button" 
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="password-toggle desktop-password-toggle"
//                   >
//                     {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                   </button>
//                   {errors.password && <p className="error-message">{errors.password}</p>}
//                 </div>

//                 {/* Confirm Password */}
//                 <div className={`input-container desktop-input-container ${errors.confirmPassword ? 'error' : ''}`}>
//                   <input
//                     type={showConfirmPassword ? 'text' : 'password'}
//                     name="confirmPassword"
//                     value={formValues.confirmPassword}
//                     onChange={handleChange}
//                     placeholder="••••••••"
//                     className={`input-field desktop-input-field ${formValues.confirmPassword ? 'has-value' : ''}`}
//                     style={{ paddingRight: '50px' }}
//                   />
//                   {formValues.confirmPassword && (
//                     <label className="input-label desktop-input-label">Confirm Password</label>
//                   )}
//                   <button 
//                     type="button" 
//                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                     className="password-toggle desktop-password-toggle"
//                   >
//                     {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                   </button>
//                   {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
//                 </div>

//                 {/* Submit Button */}
//                 <button 
//                   type="button"
//                   onClick={handleSubmit}
//                   disabled={isPending}
//                   className="submit-button desktop-submit-button"
//                   onTouchStart={() => {}} // Fixes potential iOS Safari click delay
//                 >
//                   {isPending ? 'Signing up...' : 'Sign Up as Organization'}
//                 </button>
//               </div>

//               {/* Footer - Removed border */}
//               <div className="mt-8">
//                 <p className="footer-text desktop-footer-text">
//                   Already have an account?{" "}
//                   <Link
//                     href="/auth/login"
//                     className="footer-link"
//                   >
//                     Login
//                   </Link>
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/api/hooks/useAuth';
import { toast } from '@/app/components/hooks/use-toast';
import Link from "next/link";
import { BASE_URL } from '@/config/api';

interface FormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  organizationName: string;
  country: string;
  industry: string;
  // category: string;
}

interface Industry {
  id: string;
  name: string;
  description?: string;
}


interface CarouselImage {
  src: string;
  alt: string;
  title?: string;
  titlePosition?: 'top' | 'bottom';
  backgroundColor?: string;
}

type ApiError = {
  response?: {
    status?: number;
    statusText?: string;
    data?: {
      errors?: Array<{ message: string }>;
      message?: string;
      debug?: string;
    };
  };
  message?: string;
  code?: string;
  name?: string;
};

export default function OrganizationSignupPage() {
  const router = useRouter();
  const { client } = useAuth();

  const [formValues, setFormValues] = useState<FormValues>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    country: '',
    industry: '',
    // category: '',
  });
  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(false);
  const [showIndustriesDropdown, setShowIndustriesDropdown] = useState(false);
  const [industrySearch, setIndustrySearch] = useState('');
  
  // Country dropdown states
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const { mutate: submitMutate, isPending } = useMutation({
    mutationFn: async (values: { name: string; email: string; phone: string; password: string; organizationName: string; country: string; industry: string; }) => {
      // Use the full name as provided
      const firstName = '';
      const lastName = '';
      
      // Normalize phone number
      let normalizedPhone = values.phone.replace(/\s/g, '').replace(/[()-]/g, '');
      
      if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '+234' + normalizedPhone.substring(1);
      }
      
      if (!normalizedPhone.startsWith('+') && normalizedPhone.length === 10) {
        normalizedPhone = '+234' + normalizedPhone;
      }
      
      // Find the selected industry to get its name
      const selectedIndustry = industries.find(ind => ind.id === values.industry);
      
      const payload = {
        fullName: values.name,
        email: values.email.toLowerCase().trim(),
        password: values.password,
        phoneNumber: normalizedPhone,
        organizationName: values.organizationName,
        country: values.country,
        industryId: values.industry,
        industryName: selectedIndustry?.name || '',
        // categoryId: values.category,
        role: "ORGANIZATION"
      };
      
      console.log('🚀 Sending ORGANIZATION registration to backend:', payload);

      const { data } = await client.post(`${BASE_URL}/api/auth/register`, payload);
      return data;
    },
    onSuccess: (response) => {
      // Always redirect to email verification after registration
      toast({ 
        title: 'ORGANIZATION REGISTRATION SUCCESSFUL!',
        description: 'Please check your email for the verification code'
      });
      router.push(`/auth/verify-email?email=${encodeURIComponent(formValues.email)}`);
    },
    onError: (error: ApiError) => {
      let message = 'Registration failed';
      
      if (error?.response?.data?.debug) {
        // Use debug message if available
        message = error.response.data.debug;
      } else if (error?.response?.data?.errors?.[0]?.message) {
        message = error.response.data.errors[0].message;
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      } else if (error.code === 'ERR_NETWORK') {
        message = 'Network error. Please check your internet connection.';
      } else if (error.name === 'AxiosError' && !error.response) {
        message = 'Unable to connect to server. Please try again later.';
      }
      
      const errorMessage = message.toLowerCase();
      if (errorMessage.includes('phone') && 
          (errorMessage.includes('duplicate') || 
           errorMessage.includes('already exists') ||
           errorMessage.includes('taken') ||
           errorMessage.includes('already registered'))) {
        setErrors(prev => ({ ...prev, phone: 'This phone number is already exist.' }));
      } else if (message.includes('A user with phone number') && message.includes('already exists')) {
        // Handle the specific error format from the server
        const phoneMatch = message.match(/A user with phone number ([\d\s\-+]+) already exists/);
        if (phoneMatch) {
          setErrors(prev => ({ ...prev, phone: `A user with phone number ${phoneMatch[1]} already exists` }));
        } else {
          setErrors(prev => ({ ...prev, phone: message }));
        }
      } else {
        setErrors(prev => ({ ...prev, phone: '' }));
      }
      
      // Handle duplicate email errors
      if (errorMessage.includes('email') && 
          (errorMessage.includes('duplicate') || 
           errorMessage.includes('already exists') ||
           errorMessage.includes('taken') ||
           errorMessage.includes('already registered'))) {
        setErrors(prev => ({ ...prev, email: 'This email address is already registered.' }));
      } else if (message.includes('A user with email') && message.includes('already exists')) {
        // Handle the specific error format from the server
        const emailMatch = message.match(/A user with email ([^\s@]+@[^\s@]+\.[^\s@]+) already exists/);
        if (emailMatch) {
          setErrors(prev => ({ ...prev, email: `A user with email ${emailMatch[1]} already exists` }));
        } else {
          setErrors(prev => ({ ...prev, email: message }));
        }
      } else {
        setErrors(prev => ({ ...prev, email: '' }));
      }
      
      // Set the error message and show the modal instead of toast
      setErrorMessage(message);
      setShowErrorModal(true);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormValues]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleIndustrySelect = (industryId: string) => {
    setFormValues(prev => ({ ...prev, industry: industryId }));
    setShowIndustriesDropdown(false);
    setIndustrySearch('');
    if (errors.industry) {
      setErrors(prev => ({ ...prev, industry: '' }));
    }
  };
  
  const handleCountrySelect = (country: string) => {
    setFormValues(prev => ({ ...prev, country }));
    setShowCountryDropdown(false);
    setCountrySearch('');
    if (errors.country) {
      setErrors(prev => ({ ...prev, country: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormValues> = {};
    
    if (!formValues.name.trim()) newErrors.name = 'Full name is required';
    if (!formValues.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) newErrors.email = 'Invalid email address';
    else if (errors.email && (errors.email.includes('already registered') || errors.email.includes('already exists'))) newErrors.email = errors.email;
    if (!formValues.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^(\+?234|0)?[789][01]\d{8}$/.test(formValues.phone.replace(/\s/g, ''))) newErrors.phone = 'Please enter a valid Nigerian phone number';
    else if (errors.phone && errors.phone.includes('already registered')) newErrors.phone = errors.phone;
    if (!formValues.password) newErrors.password = 'Password is required';
    else if (formValues.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!formValues.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formValues.password !== formValues.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formValues.organizationName.trim()) newErrors.organizationName = 'Organization name is required';
    if (!formValues.country) newErrors.country = 'Country is required';
    if (!formValues.industry.trim()) newErrors.industry = 'Industry is required';
    // if (!formValues.category.trim()) newErrors.category = 'Category is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    submitMutate({ 
      name: formValues.name, 
      email: formValues.email, 
      phone: formValues.phone, 
      password: formValues.password,
      organizationName: formValues.organizationName,
      country: formValues.country,
      industry: formValues.industry,
      // category: formValues.category
    });
  };

  const handleGoogleSignUp = () => {
    toast({
      title: 'Google Sign Up',
      description: 'This feature will be implemented soon'
    });
  };

  // Carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Define carousel images with text overlays for specific slides
  const carouselImages: CarouselImage[] = [
    { 
      src: "/Frame 335677.png", 
      alt: "Data Capturing Illustration"
    },
    { 
      src: "/assets/view-measurement.png", 
      alt: "View Measurement",
      title: "VIEW MEASUREMENT",
      titlePosition: "top",
      backgroundColor: "#ccbddb"
    },
    { 
      src: "/assets/Group (2).png", 
      alt: "Take Image",
      title: "TAKE IMAGE",
      titlePosition: "top",
      backgroundColor: "#ccbddb"
    }
  ];

  // Fetch industries from API
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        setLoadingIndustries(true);
        const response = await client.get(`${BASE_URL}/api/auth/industries`);
        if (response.data && response.data.success) {
          // Handle response format: { success: true, data: { industries: [...] } }
          const industriesData = response.data.data?.industries || response.data.data || [];
          setIndustries(industriesData);
        }
      } catch (error) {
        console.error('Error fetching industries:', error);
        toast({
          title: 'Error',
          description: 'Failed to load industries. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoadingIndustries(false);
      }
    };

    fetchIndustries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only fetch on mount

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showIndustriesDropdown && !(event.target as Element).closest('.industry-dropdown-container')) {
        setShowIndustriesDropdown(false);
        setIndustrySearch('');
      }
      if (showCountryDropdown && !(event.target as Element).closest('.country-dropdown-container')) {
        setShowCountryDropdown(false);
        setCountrySearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showIndustriesDropdown, showCountryDropdown]);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // List of all countries
  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 
    'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 
    'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 
    'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 
    'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 
    'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 
    'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 
    'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 
    'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 
    'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 
    'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 
    'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 
    'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 
    'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 
    'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 
    'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 
    'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 
    'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 
    'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 
    'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 
    'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 
    'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 
    'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 
    'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 
    'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 
    'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 
    'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 
    'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 
    'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 
    'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 
    'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
  ];

  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .monument-extended { font-family: 'Monument Extended', sans-serif; }
        .manrope { font-family: 'Manrope', sans-serif; }
        
        /* Common styles */
        .input-container {
          position: relative;
          width: 100%;
          background: white;
          margin-bottom: 16px;
        }
        
        .input-field {
          width: 100%;
          border: 1px solid #6E6E6E4D;
          border-radius: 12px;
          background: white;
          font-family: 'Manrope', sans-serif;
          color: #6E6E6E;
          outline: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          transition: all 0.3s ease;
        }
        
        .input-field:focus {
          border-color: #5D2A8B;
        }
        
        .input-field.has-value {
          padding-top: 25px;
          padding-bottom: 9px;
        }
        
        .input-label {
          position: absolute;
          top: -10px;
          left: 20px;
          font-family: 'Manrope', sans-serif;
          font-weight: 400;
          font-size: 14px;
          color: #6E6E6E; /* Changed to match input text color */
          background: white;
          padding: 0 5px;
          pointer-events: none;
          transition: all 0.3s ease;
        }
        
        .input-container.error .input-field {
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
        
        .error-message {
          font-family: 'Manrope', sans-serif;
          font-size: 12px;
          color: #EF4444;
          margin-top: 4px;
          margin-left: 4px;
        }
        
        .submit-button {
          width: 100%;
          background: #5D2A8B;
          border-radius: 12px;
          color: white;
          font-family: 'Manrope', sans-serif;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: opacity 0.3s;
        }
        
        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .footer-text {
          font-family: 'Manrope', sans-serif;
          color: #6E6E6E;
          text-align: center;
        }
        
        .footer-link {
          font-weight: 500;
          color: #5D2A8B;
        }
        
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
        
        /* Mobile specific */
        .mobile-input-container {
          height: 50px;
          margin-bottom: 22px; /* Increased to accommodate error */
        }
        
        .mobile-input-container.error {
          margin-bottom: 30px; /* Extra space when error is shown */
        }
        
        .mobile-input-field {
          height: 50px;
          padding: 14px 16px;
          font-size: 16px;
        }
        
        .mobile-password-toggle {
          right: 12px;
        }
        
        .mobile-password-toggle svg {
          width: 18px;
          height: 18px;
        }
        
        .mobile-input-field.has-value {
          padding-top: 20px;
          padding-bottom: 6px;
        }
        
        .mobile-input-label {
          font-size: 12px;
          left: 16px;
        }
        
        /* Mobile error message - FIXED */
        .mobile-input-container .error-message {
          position: absolute;
          bottom: -22px;
          left: 4px;
          font-size: 11px;
          background-color: white;
          padding: 2px 6px;
          z-index: 10;
          white-space: nowrap;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .mobile-submit-button {
          height: 48px;
          font-size: 16px;
          margin: 24px 0 16px 0; /* Adjusted margin */
          border-radius: 8px;
        }
        
        .mobile-footer-text {
          font-size: 14px;
        }
        
        @media (min-width: 1024px) {
          .desktop-layout {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: white;
            padding: 44px 45px;
          }
          
          .mobile-layout {
            display: none;
          }
        }
        
        /* Desktop container */
        .desktop-container {
          width: 100%;
          max-width: 1439px;
          display: flex;
          gap: 76px;
        }
        
        .desktop-left-image {
          flex: 0 0 700px;
          height: 1025px;
          min-height: 800px;
          border-radius: 40px;
          overflow: hidden;
        }
        
        .desktop-form-container {
          flex: 0 0 609px;
          height: 1025px;
          min-height: 800px;
          background: #FBFAFC;
          border-radius: 40px;
          position: relative;
        }
        
        /* Desktop specific styles */
        .desktop-input-container {
          height: 75px;
          margin-bottom: 30px; /* Increased to accommodate error */
        }
        
        .desktop-input-container.error {
          margin-bottom: 42px; /* Extra space when error is shown */
        }
        
        .desktop-input-field {
          height: 75px;
          padding: 17px 30px;
          font-size: 20px;
          border-radius: 12px;
        }
        
        .desktop-input-field.has-value {
          padding-top: 25px;
          padding-bottom: 9px;
        }
        
        .desktop-input-label {
          font-size: 14px;
          left: 30px;
        }
        
        .desktop-password-toggle {
          right: 15px;
        }
        
        .desktop-password-toggle svg {
          width: 20px;
          height: 20px;
        }
        
        /* Desktop error message - FIXED */
        .desktop-input-container .error-message {
          position: absolute;
          bottom: -26px;
          left: 4px;
          font-size: 13px;
          background-color: white;
          padding: 3px 8px;
          z-index: 10;
          white-space: nowrap;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .desktop-submit-button {
          height: 60px;
          font-size: 16px;
          margin: 32px 0 24px 0; /* Adjusted margin */
          border-radius: 12px;
        }
        
        .desktop-footer-text {
          font-size: 18px;
          font-weight: 300;
        }
        
        /* Google button */
        .google-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border: 1px solid #6E6E6E4D;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .google-button:hover {
          background-color: #f9fafb;
        }
        
        .google-button-text {
          font-family: 'Manrope', sans-serif;
          font-weight: 500;
          color: #374151;
        }
        
        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          margin: 24px 0;
        }
        
        .divider-line {
          flex: 1;
          height: 1px;
          background-color: #E5E7EB;
        }
        
        .divider-text {
          padding: 0 16px;
          font-family: 'Manrope', sans-serif;
          color: #6B7280;
        }
        
        /* Carousel styles */
        .carousel-container {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 800px;
        }
        
        .carousel-image-wrapper {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          min-height: 800px;
          transition: opacity 0.5s ease-in-out;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .carousel-image {
          width: 100%;
          height: 100%;
          min-height: 800px;
          object-fit: cover;
        }
        
        /* Text overlay styles */
        .carousel-text-overlay {
          position: absolute;
          width: 180px;
          height: 17px;
          top: 37px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Monument Extended', sans-serif;
          font-weight: 400;
          font-style: normal;
          font-size: 14px;
          line-height: 100%;
          letter-spacing: 0%;
          text-align: center;
          color: white;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
        }
        
        .carousel-indicators {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          z-index: 10;
        }
        
        .carousel-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        
        .carousel-indicator.active {
          background-color: white;
        }
        
        /* Custom dropdown base styles */
        .dropdown-trigger {
          cursor: pointer;
          user-select: none;
        }
        
        .dropdown-menu {
          position: absolute;
          z-index: 50;
          width: 100%;
          background-color: white;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          max-height: 300px;
          overflow-y: auto;
          margin-top: 4px;
        }
        
        .dropdown-search {
          padding: 12px;
          border-bottom: 1px solid #E5E7EB;
          position: sticky;
          top: 0;
          background-color: white;
        }
        
        .dropdown-search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Manrope', sans-serif;
        }
        
        .dropdown-search-input:focus {
          outline: none;
          border-color: #5D2A8B;
          ring: 2px solid #5D2A8B;
        }
        
        .dropdown-items {
          max-height: 240px;
          overflow-y: auto;
        }
        
        .dropdown-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          transition: background-color 0.2s;
          font-family: 'Manrope', sans-serif;
          font-size: 14px;
          color: #374151;
        }
        
        .dropdown-item:hover {
          background-color: #F3F4F6;
        }
        
        .dropdown-radio {
          width: 16px;
          height: 16px;
          margin-right: 12px;
          accent-color: #5D2A8B;
        }
        
        .empty-message {
          padding: 12px;
          text-align: center;
          color: #6B7280;
          font-size: 14px;
          font-family: 'Manrope', sans-serif;
        }
        
        /* Desktop dropdown adjustments */
        .desktop-dropdown-menu {
          top: 100%;
        }
        
        .desktop-dropdown-search-input {
          font-size: 16px;
          padding: 10px 14px;
        }
        
        .desktop-dropdown-item {
          padding: 14px 20px;
          font-size: 16px;
        }
        
        /* Mobile dropdown adjustments */
        .mobile-dropdown-menu {
          top: calc(100% - 5px);
        }
        
        .mobile-dropdown-search-input {
          font-size: 14px;
          padding: 8px 12px;
        }
        
        .mobile-dropdown-item {
          padding: 10px 16px;
          font-size: 14px;
        }
      `}</style>

      {/* Mobile Layout */}
      <div className="mobile-layout">
        {/* Logo */}
        <div className="mb-6">
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
          <h1 className="monument-extended text-2xl font-normal text-[#1A1A1A] mb-3">
            Organization Sign Up
          </h1>
          <p className="manrope text-sm font-light text-[#9CA3AF]">
            Create an organization account to manage the platform
          </p>
        </div>

        {/* Form */}
        <div className="flex-1">
          {/* Full Name Input */}
          <div className={`input-container mobile-input-container ${errors.name ? 'error' : ''}`}>
            <input
              type="text"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              placeholder="Demola Alo"
              className={`input-field mobile-input-field ${formValues.name ? 'has-value' : ''}`}
            />
            {formValues.name && (
              <label className="input-label mobile-input-label">Full Name</label>
            )}
            {errors.name && <p className="error-message">{errors.name}</p>}
          </div>

          {/* Email Input */}
          <div className={`input-container mobile-input-container ${errors.email ? 'error' : ''}`}>
            <input
              type="email"
              name="email"
              value={formValues.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`input-field mobile-input-field ${formValues.email ? 'has-value' : ''}`}
            />
            {formValues.email && (
              <label className="input-label mobile-input-label">Email</label>
            )}
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          {/* Phone Input */}
          <div className={`input-container mobile-input-container ${errors.phone ? 'error' : ''}`}>
            <input
              type="tel"
              name="phone"
              value={formValues.phone}
              onChange={handleChange}
              placeholder="09012345678"
              className={`input-field mobile-input-field ${formValues.phone ? 'has-value' : ''}`}
            />
            {formValues.phone && (
              <label className="input-label mobile-input-label">Phone Number</label>
            )}
            {errors.phone && <p className="error-message">{errors.phone}</p>}
          </div>

          {/* Organization Name Input */}
          <div className={`input-container mobile-input-container ${errors.organizationName ? 'error' : ''}`}>
            <input
              type="text"
              name="organizationName"
              value={formValues.organizationName}
              onChange={handleChange}
              placeholder="Your Organization"
              className={`input-field mobile-input-field ${formValues.organizationName ? 'has-value' : ''}`}
            />
            {formValues.organizationName && (
              <label className="input-label mobile-input-label">Organization Name</label>
            )}
            {errors.organizationName && <p className="error-message">{errors.organizationName}</p>}
          </div>

          {/* Country Input - Custom Dropdown with Search */}
          <div className={`input-container mobile-input-container ${errors.country ? 'error' : ''} country-dropdown-container`}>
            <div
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className={`input-field mobile-input-field dropdown-trigger ${formValues.country ? 'has-value' : ''}`}
              style={{ 
                cursor: 'pointer',
                background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236E6E6E' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat right 16px center/16px, white`,
                paddingRight: '40px'
              }}
            >
              {formValues.country || 'Select your country'}
            </div>
            {formValues.country && (
              <label className="input-label mobile-input-label">Country</label>
            )}
            {errors.country && <p className="error-message">{errors.country}</p>}
            
            {/* Country Dropdown */}
            {showCountryDropdown && (
              <div className="dropdown-menu mobile-dropdown-menu">
                <div className="dropdown-search">
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="dropdown-search-input mobile-dropdown-search-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="dropdown-items">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                      <div
                        key={country}
                        className="dropdown-item mobile-dropdown-item"
                        onClick={() => handleCountrySelect(country)}
                      >
                        <input
                          type="radio"
                          name="country"
                          value={country}
                          checked={formValues.country === country}
                          onChange={() => {}}
                          className="dropdown-radio"
                        />
                        <span>{country}</span>
                      </div>
                    ))
                  ) : (
                    <div className="empty-message">No countries found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Industry Input - Dropdown */}
          <div className={`input-container mobile-input-container ${errors.industry ? 'error' : ''} industry-dropdown-container`}>
            <div
              onClick={() => setShowIndustriesDropdown(!showIndustriesDropdown)}
              className={`input-field mobile-input-field dropdown-trigger ${formValues.industry ? 'has-value' : ''}`}
              style={{ 
                cursor: 'pointer',
                background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236E6E6E' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat right 16px center/16px, white`,
                paddingRight: '40px'
              }}
            >
              {formValues.industry ? (() => {
                const selected = industries.find(ind => ind.id === formValues.industry);
                return selected ? selected.name : 'Select industry';
              })() : 'Select industry'}
            </div>
            {formValues.industry && (
              <label className="input-label mobile-input-label">Industry</label>
            )}
            {errors.industry && <p className="error-message">{errors.industry}</p>}
            
            {/* Industry Dropdown */}
            {showIndustriesDropdown && (
              <div className="dropdown-menu mobile-dropdown-menu">
                <div className="dropdown-search">
                  <input
                    type="text"
                    placeholder="Search industries..."
                    value={industrySearch}
                    onChange={(e) => setIndustrySearch(e.target.value)}
                    className="dropdown-search-input mobile-dropdown-search-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="dropdown-items">
                  {loadingIndustries ? (
                    <div className="empty-message">Loading industries...</div>
                  ) : (
                    industries
                      .filter(industry => 
                        industry.name.toLowerCase().includes(industrySearch.toLowerCase())
                      )
                      .map(industry => (
                        <div
                          key={industry.id}
                          className="dropdown-item mobile-dropdown-item"
                          onClick={() => handleIndustrySelect(industry.id)}
                        >
                          <input
                            type="radio"
                            name="industry"
                            value={industry.id}
                            checked={formValues.industry === industry.id}
                            onChange={() => {}}
                            className="dropdown-radio"
                          />
                          <span>{industry.name}</span>
                        </div>
                      ))
                  )}
                  {!loadingIndustries && industries.filter(i => i.name.toLowerCase().includes(industrySearch.toLowerCase())).length === 0 && (
                    <div className="empty-message">No industries found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Category Input */}
          {/* <div className={`input-container mobile-input-container ${errors.category ? 'error' : ''}`}>
            <input
              type="text"
              name="category"
              value={formValues.category}
              onChange={handleChange}
              placeholder="e.g., Software Development, Medical Services"
              className={`input-field mobile-input-field ${formValues.category ? 'has-value' : ''}`}
            />
            {formValues.category && (
              <label className="input-label mobile-input-label">Category</label>
            )}
            {errors.category && <p className="error-message">{errors.category}</p>}
          </div> */}

          {/* Password Input */}
          <div className={`input-container mobile-input-container ${errors.password ? 'error' : ''}`}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formValues.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`input-field mobile-input-field ${formValues.password ? 'has-value' : ''}`}
              style={{ paddingRight: "45px" }}
            />
            {formValues.password && (
              <label className="input-label mobile-input-label">Password</label>
            )}
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle mobile-password-toggle"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.password && <p className="error-message">{errors.password}</p>}
          </div>

          {/* Confirm Password Input */}
          <div className={`input-container mobile-input-container ${errors.confirmPassword ? 'error' : ''}`}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formValues.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className={`input-field mobile-input-field ${formValues.confirmPassword ? 'has-value' : ''}`}
              style={{ paddingRight: "45px" }}
            />
            {formValues.confirmPassword && (
              <label className="input-label mobile-input-label">Confirm Password</label>
            )}
            <button 
              type="button" 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="password-toggle mobile-password-toggle"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
          </div>

          {/* Sign Up Button */}
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="submit-button mobile-submit-button"
            onTouchStart={() => {}}
          >
            {isPending ? 'Signing up...' : 'Sign Up as Organization'}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8">
          <p className="footer-text mobile-footer-text">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="footer-link"
            >
              Login
            </Link>
          </p>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="desktop-layout">
        <div className="desktop-container">
          {/* Left Image Section - Carousel */}
          <div className="desktop-left-image">
            <div className="carousel-container">
              {carouselImages.map((image, index) => (
                <div
                  key={index}
                  className={`carousel-image-wrapper ${
                    index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    backgroundColor: image.backgroundColor || 'transparent'
                  }}
                >
                  <Image 
                    src={image.src}
                    alt={image.alt}
                    width={700}
                    height={1025}
                    priority={index === 0}
                    className="carousel-image"
                  />
                  {image.title && (
                    <div className={`carousel-text-overlay ${image.titlePosition || 'bottom'}`}>
                      {image.title}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Carousel Indicators */}
              <div className="carousel-indicators">
                {carouselImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`carousel-indicator ${
                      index === currentImageIndex ? 'active' : ''
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
              
          {/* Right Form Section */}
          <div className="desktop-form-container">
            <div className="desktop-form-content">
              {/* Logo */}
              <div className="mb-12">
                <Image 
                  width={130} 
                  height={100} 
                  src="/assets/vetra.png" 
                  alt="Company Logo" 
                  className="object-contain" 
                />
              </div>

              {/* Header */}
              <div className="mb-12">
                <h1 className="monument-extended text-[30px] font-normal text-[#1A1A1A] mb-4">
                  Organization Sign Up
                </h1>
                <p className="manrope text-[18px] font-light text-[#6E6E6EB2]">
                  Create an organization account to manage the platform
                </p>
              </div>

              {/* Google Sign Up Button */}
              <button 
                type="button" 
                onClick={handleGoogleSignUp}
                className="google-button h-[60px] mb-8"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.8 10.2273C19.8 9.52045 19.7364 8.83636 19.6182 8.18182H10.2V12.05H15.5891C15.3545 13.3 14.6182 14.3591 13.5182 15.0682V17.5773H16.8091C18.7091 15.8364 19.8 13.2727 19.8 10.2273Z" fill="#4285F4"/>
                  <path d="M10.2 20C12.9 20 15.1636 19.1045 16.8091 17.5773L13.5182 15.0682C12.5909 15.6682 11.4182 16.0227 10.2 16.0227C7.59545 16.0227 5.39091 14.2636 4.57273 11.9H1.16364V14.4909C2.79545 17.7591 6.26364 20 10.2 20Z" fill="#34A853"/>
                  <path d="M4.57273 11.9C4.37273 11.3 4.25909 10.6591 4.25909 10C4.25909 9.34091 4.37273 8.7 4.57273 8.1V5.50909H1.16364C0.477273 6.85909 0.0909091 8.38636 0.0909091 10C0.0909091 11.6136 0.477273 13.1409 1.16364 14.4909L4.57273 11.9Z" fill="#FBBC04"/>
                  <path d="M10.2 3.97727C11.5318 3.97727 12.7136 4.43182 13.6409 5.30909L16.5682 2.38182C15.1591 1.08182 12.8955 0.227273 10.2 0.227273C6.26364 0.227273 2.79545 2.46818 1.16364 5.50909L4.57273 8.1C5.39091 5.73636 7.59545 3.97727 10.2 3.97727Z" fill="#EA4335"/>
                </svg>
                <span className="google-button-text text-[15px]">
                  Sign up with Google
                </span>
              </button>

              {/* Divider */}
              <div className="divider mb-8">
                <div className="divider-line" />
                <span className="divider-text text-sm">or</span>
                <div className="divider-line" />
              </div>

              {/* Form Inputs - Scrollable Area */}
              <div className="desktop-form-scroll">
                {/* Full Name */}
                <div className={`input-container desktop-input-container ${errors.name ? 'error' : ''}`}>
                  <input
                    type="text"
                    name="name"
                    value={formValues.name}
                    onChange={handleChange}
                    placeholder="Demola Alo"
                    className={`input-field desktop-input-field ${formValues.name ? 'has-value' : ''}`}
                  />
                  {formValues.name && (
                    <label className="input-label desktop-input-label">Full Name</label>
                  )}
                  {errors.name && <p className="error-message">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className={`input-container desktop-input-container ${errors.email ? 'error' : ''}`}>
                  <input
                    type="email"
                    name="email"
                    value={formValues.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={`input-field desktop-input-field ${formValues.email ? 'has-value' : ''}`}
                  />
                  {formValues.email && (
                    <label className="input-label desktop-input-label">Email</label>
                  )}
                  {errors.email && <p className="error-message">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div className={`input-container desktop-input-container ${errors.phone ? 'error' : ''}`}>
                  <input
                    type="tel"
                    name="phone"
                    value={formValues.phone}
                    onChange={handleChange}
                    placeholder="09012345678"
                    className={`input-field desktop-input-field ${formValues.phone ? 'has-value' : ''}`}
                  />
                  {formValues.phone && (
                    <label className="input-label desktop-input-label">Phone Number</label>
                  )}
                  {errors.phone && <p className="error-message">{errors.phone}</p>}
                </div>

                {/* Organization Name */}
                <div className={`input-container desktop-input-container ${errors.organizationName ? 'error' : ''}`}>
                  <input
                    type="text"
                    name="organizationName"
                    value={formValues.organizationName}
                    onChange={handleChange}
                    placeholder="Your Organization"
                    className={`input-field desktop-input-field ${formValues.organizationName ? 'has-value' : ''}`}
                  />
                  {formValues.organizationName && (
                    <label className="input-label desktop-input-label">Organization Name</label>
                  )}
                  {errors.organizationName && <p className="error-message">{errors.organizationName}</p>}
                </div>

                {/* Country Input - Custom Dropdown with Search (Desktop) */}
                <div className={`input-container desktop-input-container ${errors.country ? 'error' : ''} country-dropdown-container`}>
                  <div
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className={`input-field desktop-input-field dropdown-trigger ${formValues.country ? 'has-value' : ''}`}
                    style={{ 
                      cursor: 'pointer',
                      background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='%236E6E6E' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat right 30px center/20px, white`,
                      paddingRight: '60px'
                    }}
                  >
                    {formValues.country || 'Select your country'}
                  </div>
                  {formValues.country && (
                    <label className="input-label desktop-input-label">Country</label>
                  )}
                  {errors.country && <p className="error-message">{errors.country}</p>}
                  
                  {/* Country Dropdown */}
                  {showCountryDropdown && (
                    <div className="dropdown-menu desktop-dropdown-menu">
                      <div className="dropdown-search">
                        <input
                          type="text"
                          placeholder="Search countries..."
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="dropdown-search-input desktop-dropdown-search-input"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="dropdown-items">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((country) => (
                            <div
                              key={country}
                              className="dropdown-item desktop-dropdown-item"
                              onClick={() => handleCountrySelect(country)}
                            >
                              <input
                                type="radio"
                                name="country"
                                value={country}
                                checked={formValues.country === country}
                                onChange={() => {}}
                                className="dropdown-radio"
                              />
                              <span>{country}</span>
                            </div>
                          ))
                        ) : (
                          <div className="empty-message">No countries found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Industry - Dropdown (Desktop) */}
                <div className={`input-container desktop-input-container ${errors.industry ? 'error' : ''} industry-dropdown-container`}>
                  <div
                    onClick={() => setShowIndustriesDropdown(!showIndustriesDropdown)}
                    className={`input-field desktop-input-field dropdown-trigger ${formValues.industry ? 'has-value' : ''}`}
                    style={{ 
                      cursor: 'pointer',
                      background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='%236E6E6E' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat right 30px center/20px, white`,
                      paddingRight: '60px'
                    }}
                  >
                    {formValues.industry ? (() => {
                      const selected = industries.find(ind => ind.id === formValues.industry);
                      return selected ? selected.name : 'Select industry';
                    })() : 'Select industry'}
                  </div>
                  {formValues.industry && (
                    <label className="input-label desktop-input-label">Industry</label>
                  )}
                  {errors.industry && <p className="error-message">{errors.industry}</p>}
                  
                  {/* Industry Dropdown */}
                  {showIndustriesDropdown && (
                    <div className="dropdown-menu desktop-dropdown-menu">
                      <div className="dropdown-search">
                        <input
                          type="text"
                          placeholder="Search industries..."
                          value={industrySearch}
                          onChange={(e) => setIndustrySearch(e.target.value)}
                          className="dropdown-search-input desktop-dropdown-search-input"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="dropdown-items">
                        {loadingIndustries ? (
                          <div className="empty-message">Loading industries...</div>
                        ) : (
                          industries
                            .filter(industry => 
                              industry.name.toLowerCase().includes(industrySearch.toLowerCase())
                            )
                            .map(industry => (
                              <div
                                key={industry.id}
                                className="dropdown-item desktop-dropdown-item"
                                onClick={() => handleIndustrySelect(industry.id)}
                              >
                                <input
                                  type="radio"
                                  name="industry"
                                  value={industry.id}
                                  checked={formValues.industry === industry.id}
                                  onChange={() => {}}
                                  className="dropdown-radio"
                                />
                                <span>{industry.name}</span>
                              </div>
                            ))
                        )}
                        {!loadingIndustries && industries.filter(i => i.name.toLowerCase().includes(industrySearch.toLowerCase())).length === 0 && (
                          <div className="empty-message">No industries found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Category */}
                {/* <div className={`input-container desktop-input-container ${errors.category ? 'error' : ''}`}>
                  <input
                    type="text"
                    name="category"
                    value={formValues.category}
                    onChange={handleChange}
                    placeholder="e.g., Software Development, Medical Services"
                    className={`input-field desktop-input-field ${formValues.category ? 'has-value' : ''}`}
                  />
                  {formValues.category && (
                    <label className="input-label desktop-input-label">Category</label>
                  )}
                  {errors.category && <p className="error-message">{errors.category}</p>}
                </div> */}

                {/* Password */}
                <div className={`input-container desktop-input-container ${errors.password ? 'error' : ''}`}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formValues.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`input-field desktop-input-field ${formValues.password ? 'has-value' : ''}`}
                    style={{ paddingRight: '50px' }}
                  />
                  {formValues.password && (
                    <label className="input-label desktop-input-label">Password</label>
                  )}
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle desktop-password-toggle"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {errors.password && <p className="error-message">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div className={`input-container desktop-input-container ${errors.confirmPassword ? 'error' : ''}`}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formValues.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`input-field desktop-input-field ${formValues.confirmPassword ? 'has-value' : ''}`}
                    style={{ paddingRight: '50px' }}
                  />
                  {formValues.confirmPassword && (
                    <label className="input-label desktop-input-label">Confirm Password</label>
                  )}
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle desktop-password-toggle"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
                </div>

                {/* Submit Button */}
                <button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="submit-button desktop-submit-button"
                  onTouchStart={() => {}}
                >
                  {isPending ? 'Signing up...' : 'Sign Up as Organization'}
                </button>
              </div>

              {/* Footer */}
              <div className="mt-8">
                <p className="footer-text desktop-footer-text">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="footer-link"
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
}