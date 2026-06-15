"use client";

import React, { useState } from "react";
import { ArrowLeft, Lock, Eye, EyeOff, RefreshCw, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/app/components/hooks/use-toast";
import { AdminUserService } from "@/services/AdminUserService";

interface ChangePasswordFormProps {
  userId: string;
}

const generateRandomPassword = () => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;
  // Guarantee at least one of each category
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const base = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  for (let i = 0; i < 8; i++) base.push(pick(all));
  return base.sort(() => Math.random() - 0.5).join('');
};

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ userId }) => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const pw = generateRandomPassword();
    setPassword(pw);
    setShowPassword(true); // show it so the admin can see what was generated
  };

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters long", variant: "destructive" });
      return;
    }

    if (!userId) {
      toast({ title: "Error", description: "User ID is missing", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const adminUserService = new AdminUserService();
      const response = await adminUserService.updateAdminUserPassword(userId, { password });

      if (response.success) {
        toast({
          title: "Success",
          description: response.data?.generatedPassword
            ? `Password updated. New password: ${response.data.generatedPassword}`
            : (response.data?.message || (response as any).message || "Password updated successfully"),
          variant: "default",
        });
        router.push('/admin/users');
      } else {
        throw new Error(response.data?.message || (response as any).message || "Failed to update password");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update password", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-[#5D2A8B] hover:text-purple-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Users
        </button>

        <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#5D2A8B] rounded-lg">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Change Password</h1>
              <p className="text-gray-500 text-sm">Enter a password manually or generate a random one</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  New Password <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5D2A8B] hover:text-purple-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Generate Password
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#5D2A8B] focus:border-transparent transition-all pr-24"
                  placeholder="Enter or generate a password"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3">
                  {password && (
                    <button
                      type="button"
                      onClick={handleCopy}
                      title="Copy password"
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isLoading}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-[#5D2A8B] text-white py-3 rounded-lg hover:bg-[#4a2170] transition-colors font-medium flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                    Updating…
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
  );
};

export default ChangePasswordForm;
