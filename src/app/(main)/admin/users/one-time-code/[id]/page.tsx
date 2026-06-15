"use client";

import React, { useState } from "react";
import { X, Plus, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/app/components/hooks/use-toast";
import { OneTimeCodeService } from "@/services/OneTimeCodeService";

const OneTimeCodePage = () => {
  const router = useRouter();
  const [users, setUsers] = useState([
    { usersId: "", emailAddress: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const addMoreUsers = () => {
    setUsers([...users, { usersId: "", emailAddress: "" }]);
  };

  const removeUser = (index: number) => {
    if (users.length > 1) {
      const newUsers = [...users];
      newUsers.splice(index, 1);
      setUsers(newUsers);
    }
  };

  const handleUserChange = (index: number, field: string, value: string) => {
    const newUsers = [...users];
    newUsers[index] = {
      ...newUsers[index],
      [field]: value
    };
    setUsers(newUsers);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Collect email addresses for one-time code generation
      const emailAddresses = users
        .map(user => user.emailAddress)
        .filter(email => email.trim() !== "");
      
      if (emailAddresses.length === 0) {
        toast({
          title: "Error",
          description: "Please enter at least one email address",
          variant: "destructive"
        });
        return;
      }
      
      // Generate one-time codes for each email using the service
      const oneTimeCodeService = new OneTimeCodeService();
      const promises = emailAddresses.map(email => 
        oneTimeCodeService.generateOneTimeCode({
          userEmail: email,
          expirationHours: 24 // Default to 24 hours
        })
      );
      
      const results = await Promise.all(promises);
      
      // Check if all requests were successful
      const allSuccessful = results.every(result => result.success);
      
      if (allSuccessful) {
        toast({
          title: "Success",
          description: `One-time codes generated successfully for ${emailAddresses.length} user(s)`,
          variant: "default"
        });
        router.push('/admin/users');
      } else {
        const errorMessage = results.find(result => !result.success)?.data?.message || "Failed to generate one-time codes";
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error generating one-time codes:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate one-time codes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Manrope', sans-serif" }}>
      {/* Added pt-24 to push content down from the top */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center text-[#5D2A8B] hover:text-purple-700 transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          
          {/* Form container with internal scroll */}
          <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">One-time Code</h1>
            <p className="text-gray-500 text-sm mb-6">Generate one-time codes for user verification</p>

            <div className="space-y-6">
              {users.map((user, index) => (
                <div key={index} className="space-y-4 p-5 border border-gray-200 rounded-lg bg-gray-50 relative group">
                  {/* Remove button - only show if there's more than one user */}
                  {users.length > 1 && (
                    <button
                      onClick={() => removeUser(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200 z-10 shadow-md"
                      title="Remove user"
                    >
                      <X size={16} />
                    </button>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 bg-[#5D2A8B] text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      User {index + 1}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add User&apos;s ID
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#5D2A8B] focus:border-transparent transition-all duration-200"
                      placeholder="User's ID"
                      value={user.usersId}
                      onChange={(e) => handleUserChange(index, "usersId", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add user&apos;s email address *
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#5D2A8B] focus:border-transparent transition-all duration-200"
                      placeholder="Email Address"
                      type="email"
                      value={user.emailAddress}
                      onChange={(e) => handleUserChange(index, "emailAddress", e.target.value)}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Add more users button */}
            <button
              onClick={addMoreUsers}
              className="w-[40%] border-2 border-dashed border-[#5D2A8B] border-opacity-40 text-[#5D2A8B] py-4 rounded-lg  hover:bg-opacity-5 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
            >
              <Plus size={20} />
              Add more users
            </button>

            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-[#5D2A8B] rounded focus:ring-[#5D2A8B]"
                id="customIdCheckbox"
              />
              <label htmlFor="customIdCheckbox" className="text-sm text-gray-600 cursor-pointer">
                Not user&apos;s organisation&apos;s custom user&apos;s ID code
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#5D2A8B] focus:border-transparent transition-all duration-200" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input 
                  type="time" 
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#5D2A8B] focus:border-transparent transition-all duration-200" 
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button 
                onClick={() => router.back()}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                className="flex-1 bg-[#5D2A8B] text-white py-3 rounded-lg hover:bg-[#4a2170] transition-colors duration-200 font-medium flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OneTimeCodePage;