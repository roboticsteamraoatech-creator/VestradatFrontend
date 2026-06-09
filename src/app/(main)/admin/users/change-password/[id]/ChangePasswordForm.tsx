"use client";

import React, { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/app/components/hooks/use-toast";
import { AdminUserService } from "@/services/AdminUserService";

interface ChangePasswordFormProps {
  userId: string;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ userId }) => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    console.log('userId:', userId); // Debug log
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID is missing",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const adminUserService = new AdminUserService();
      const response = await adminUserService.updateAdminUserPassword(userId, {
        password: password
      });
      
      if (response.success) {
        const generatedPassword = response.data?.generatedPassword;
        toast({
          title: "Success",
          description: generatedPassword
            ? `Password updated successfully. New password: ${generatedPassword}`
            : (response.data?.message || (response as any).message || "Password updated successfully"),
          variant: "default"
        });
        router.push('/admin/users');
      } else {
        throw new Error(response.data?.message || (response as any).message || "Failed to update password");
      }
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div className="ml-0 md:ml-[350px] pt-24 p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center text-[#5D2A8B] hover:text-purple-700 transition-colors duration-200 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Users
          </button>
          
          {/* Form container */}
          <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#5D2A8B] rounded-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Change Password</h1>
                <p className="text-gray-500 text-sm">Update user password securely</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#5D2A8B] focus:border-transparent transition-all duration-200 pr-12"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#5D2A8B] focus:border-transparent transition-all duration-200 pr-12"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-[#5D2A8B] text-white py-3 rounded-lg hover:bg-[#4a2170] transition-colors duration-200 font-medium flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordForm;