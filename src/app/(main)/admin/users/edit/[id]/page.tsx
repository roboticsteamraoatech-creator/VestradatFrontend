// "use client";

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { ArrowLeft, User, Mail, Phone, Building2, MapPin, Calendar, CheckSquare, Key, Users } from 'lucide-react';
// import { AdminUserService, UpdateUserPayload, AdminUser } from '@/services/AdminUserService';
// import { RoleService, Role } from '@/services/RoleService';
// import { toast } from '@/app/components/hooks/use-toast';

// const EditUserForm = () => {
//   const router = useRouter();
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     emailAddress: '',
//     phoneNumber: '',
//     userID: '', // This will be used as password if provided
//     existingUsersID: '',
//     organisationsCustomUsersID: ''
//   });
//   const [loading, setLoading] = useState(false);
//   const [userId, setUserId] = useState('');
//   const [userLoading, setUserLoading] = useState(true);
//   const [permissions, setPermissions] = useState<any[]>([]);
//   const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
//   const [permissionsLoading, setPermissionsLoading] = useState(false);
//   const [roles, setRoles] = useState<Role[]>([]);
//   const [selectedRole, setSelectedRole] = useState<string>('');
//   const [rolesLoading, setRolesLoading] = useState(false);

//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         // Extract user ID from URL
//         const urlParts = window.location.pathname.split('/');
//         const id = urlParts[urlParts.length - 1];
//         setUserId(id);
        
//         const adminUserService = new AdminUserService();
        
//         // Fetch user data
//         const userData = await adminUserService.getAdminUserById(id);
        
//         // Map the API response to the form fields
//         setFormData({
//           firstName: userData.firstName || '',
//           lastName: userData.lastName || '',
//           emailAddress: userData.email || '',
//           phoneNumber: userData.phoneNumber || '',
//           userID: '', // Password field - not returned from API for security
//           existingUsersID: '',
//           organisationsCustomUsersID: userData.customUserId || ''
//         });
        
//         // Fetch permissions and user permissions
//         const permissionsResponse = await adminUserService.getAvailablePermissions();
//         setPermissions(permissionsResponse.data.permissions || []);
        
//         // Get user's current permissions
//         try {
//           const userPermissions = await adminUserService.getUserPermissions(id);
//           // Check if userPermissions.data has the permissions array directly or nested
//           let userPermissionKeys: string[] = [];
//           if (userPermissions.data.permissions) {
//             // If permissions is an array of objects with key property
//             if (Array.isArray(userPermissions.data.permissions) && userPermissions.data.permissions.length > 0) {
//               if (typeof userPermissions.data.permissions[0] === 'object' && userPermissions.data.permissions[0].key) {
//                 userPermissionKeys = userPermissions.data.permissions.map((p: any) => p.key);
//               } else {
//                 // If permissions is an array of strings
//                 userPermissionKeys = userPermissions.data.permissions;
//               }
//             }
//           }
//           setSelectedPermissions(userPermissionKeys);
//         } catch (error) {
//           console.error('Error fetching user permissions:', error);
//           // Continue without permissions if there's an error
//         }
        
//         // Fetch roles
//         try {
//           const roleService = new RoleService();
//           const rolesResponse = await roleService.getRoles();
//           setRoles(rolesResponse.data.roles || []);
          
//           // After roles are loaded, try to match the user's role
//           // Get user role from the user data
//           if (userData.role) {
//             // Find the role ID that matches the user's role name
//             const userRole = rolesResponse.data.roles.find(role => role.name === userData.role);
//             if (userRole) {
//               setSelectedRole(userRole.id);
//             }
//           }
//         } catch (roleError) {
//           console.error('Error fetching roles:', roleError);
//           // Continue without roles if there's an error
//         }
        
//         setUserLoading(false);
//       } catch (error) {
//         console.error('Error fetching user data:', error);
//         toast({ 
//           title: 'Error', 
//           description: 'Failed to load user data',
//           variant: 'destructive'
//         });
//         setUserLoading(false);
//       }
//     };
    
//     fetchUserData();
//   }, []);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handlePermissionChange = (permissionKey: string) => {
//     setSelectedPermissions(prev =>
//       prev.includes(permissionKey)
//         ? prev.filter((p: string) => p !== permissionKey)
//         : [...prev, permissionKey]
//     );
//   };

//   const generatePassword = () => {
//     // Generate a random password with letters, numbers, and special characters
//     const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
//     let password = "";
//     for (let i = 0; i < 12; i++) {
//       password += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//     // Ensure the password has at least one uppercase, lowercase, number, and special character
//     const hasUpper = /[A-Z]/.test(password);
//     const hasLower = /[a-z]/.test(password);
//     const hasNumber = /[0-9]/.test(password);
//     const hasSpecial = /[!@#$%^&*()]/.test(password);
    
//     if (!hasUpper) {
//       password = password.slice(0, -1) + "A";
//     }
//     if (!hasLower) {
//       password = password.slice(0, -1) + "a";
//     }
//     if (!hasNumber) {
//       password = password.slice(0, -1) + "1";
//     }
//     if (!hasSpecial) {
//       password = password.slice(0, -1) + "!";
//     }
    
//     setFormData(prev => ({
//       ...prev,
//       userID: password
//     }));
//   };

//   const generateCustomUserId = async () => {
//     setLoading(true);
//     try {
//       const adminUserService = new AdminUserService();
//       // This function is now just for UI consistency, as custom ID is auto-generated after user creation
//       toast({
//         title: 'Note',
//         description: 'Custom User ID will be auto-generated after user creation',
//         variant: 'default'
//       });
//     } catch (error: any) {
//       console.error('Error generating custom user ID:', error);
//       toast({
//         title: 'Error',
//         description: error.message || 'Failed to generate custom user ID',
//         variant: 'destructive'
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
    
//     try {
//       const adminUserService = new AdminUserService();
      
//       // Prepare the payload for the API
//       const payload: UpdateUserPayload = {
//         firstName: formData.firstName,
//         lastName: formData.lastName,
//         email: formData.emailAddress,
//         phoneNumber: formData.phoneNumber || undefined
//       };
      
//       // Call the API to update the user
//       await adminUserService.updateAdminUser(userId, payload);
      
//       // Update user permissions if they were modified
//       if (selectedPermissions.length > 0) {
//         try {
//           await adminUserService.assignUserPermissions(userId, { permissions: selectedPermissions });
//         } catch (permissionError) {
//           console.error('Error assigning permissions:', permissionError);
//           toast({
//             title: 'Warning',
//             description: 'User updated successfully, but failed to assign permissions',
//             variant: 'destructive'
//           });
//         }
//       }
      
//       // Update user role
//       // If a role is selected, assign it to the user
//       if (selectedRole) {
//         try {
//           const roleService = new RoleService();
//           // First, try to unassign any existing role (if we knew the previous role)
//           // For now, we'll just assign the new role
//           await roleService.assignRoleToUsers(selectedRole, { userIds: [userId] });
//         } catch (roleError) {
//           console.error('Error assigning role:', roleError);
//           toast({
//             title: 'Warning',
//             description: 'User updated successfully, but failed to assign role',
//             variant: 'destructive'
//           });
//         }
//       }
//       // Note: Removing a role might require a different API call depending on backend implementation
//       // If no role is selected (empty string), no role assignment is made
      
//       // Update password if provided
//       if (formData.userID) {
//         try {
//           await adminUserService.updateAdminUserPassword(userId, { password: formData.userID });
//         } catch (passwordError) {
//           console.error('Error updating password:', passwordError);
//           toast({
//             title: 'Warning',
//             description: 'User updated successfully, but failed to update password',
//             variant: 'destructive'
//           });
//         }
//       }
      
//       toast({ 
//         title: 'Success', 
//         description: 'User updated successfully',
//         variant: 'default'
//       });
      
//       router.push('/admin/users');
//     } catch (error: any) {
//       console.error('Error updating user:', error);
//       toast({ 
//         title: 'Error', 
//         description: error.message || 'Failed to update user',
//         variant: 'destructive'
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (userLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D2A8B]"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <style jsx>{`
//         @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
//         * { font-family: 'Manrope', sans-serif; }
//       `}</style>

//       <div className="ml-0 md:ml-[350px] pt-24 md:pt-32 p-4 md:p-8">
//         {/* Header */}
//         <div className="mb-8">
//           <button
//             onClick={() => router.back()}
//             className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
//           >
//             <ArrowLeft className="w-5 h-5" />
//             <span>Back</span>
//           </button>
//           <h1 className="text-3xl font-bold text-gray-900">Update user information</h1>
//         </div>

//         {/* Form */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Basic Information Section */}
//             <div>
//               <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                 <User className="w-5 h-5" />
//                 Basic Information
//               </h2>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     First Name <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="text"
//                     name="firstName"
//                     value={formData.firstName}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
//                     placeholder="Enter first name"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Last Name <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="text"
//                     name="lastName"
//                     value={formData.lastName}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
//                     placeholder="Enter last name"
//                     required
//                   />
//                 </div>

                
//               </div>
//             </div>

//             {/* Contact Information */}
//             <div>
//               <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                 <Mail className="w-5 h-5" />
//                 Contact Information
//               </h2>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Email Address <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="email"
//                     name="emailAddress"
//                     value={formData.emailAddress}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
//                     placeholder="user@example.com"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Phone Number <span className="text-gray-500">(Optional)</span>
//                   </label>
//                   <input
//                     type="tel"
//                     name="phoneNumber"
//                     value={formData.phoneNumber}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
//                     placeholder="+1234567890"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Role Assignment */}
//             <div>
//               <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                 <Users className="w-5 h-5" />
//                 Assign Role
//               </h2>
//               <div className="border border-gray-200 rounded-lg overflow-hidden">
//                 {rolesLoading ? (
//                   <div className="text-center py-8 text-gray-600">Loading roles...</div>
//                 ) : roles.length === 0 ? (
//                   <div className="text-center py-8 text-gray-600">No roles available</div>
//                 ) : (
//                   <div className="overflow-x-auto">
//                     <table className="min-w-full divide-y divide-gray-200">
//                       <thead className="bg-gray-50">
//                         <tr>
//                           <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
//                             Select
//                           </th>
//                           <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Name
//                           </th>
//                           <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Description
//                           </th>
//                           <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Permissions
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody className="bg-white divide-y divide-gray-200">
//                         {roles.map((role) => (
//                           <tr 
//                             key={role.id}
//                             className={`cursor-pointer ${selectedRole === role.id ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
//                             onClick={() => setSelectedRole(selectedRole === role.id ? '' : role.id)}
//                           >
//                             <td className="px-6 py-4 whitespace-nowrap">
//                               <input
//                                 type="radio"
//                                 checked={selectedRole === role.id}
//                                 onChange={() => setSelectedRole(selectedRole === role.id ? '' : role.id)}
//                                 className="h-4 w-4 text-[#5D2A8B] rounded-full focus:ring-[#5D2A8B] border-gray-300"
//                               />
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                               {role.name}
//                             </td>
//                             <td className="px-6 py-4 text-sm text-gray-600">
//                               {role.description}
//                             </td>
//                             <td className="px-6 py-4 text-sm text-gray-500">
//                               {role.permissions.join(', ')}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* User IDs Section */}
//             <div>
//               <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                 <Key className="w-5 h-5" />
//                 User Identification
//               </h2>
//               <div className="space-y-4  border border-[#5D2A8B] rounded-lg p-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Password <span className="text-gray-500">(Optional - Leave blank to keep current password)</span>
//                   </label>
//                   <div className="flex gap-2">
//                     <input
//                       type="text"
//                       name="userID"
//                       value={formData.userID}
//                       onChange={handleChange}
//                       className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
//                       placeholder="Enter new password or leave blank to keep current"
//                     />
//                     <button
//                       type="button"
//                       onClick={generatePassword}
//                       className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium whitespace-nowrap"
//                     >
//                       Generate
//                     </button>
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Existing User's ID <span className="text-gray-500">(Optional)</span>
//                   </label>
//                   <input
//                     type="text"
//                     name="existingUsersID"
//                     value={formData.existingUsersID}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
//                     placeholder="Enter existing user's ID if applicable"
//                   />
//                 </div>

                
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="flex gap-4 pt-6 border-t border-gray-200">
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className={`flex-1 md:flex-none px-8 py-3 bg-[#5D2A8B] text-white rounded-lg hover:bg-[#5D2A8B] transition-colors duration-200 font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
//               >
//                 {loading ? 'Updating...' : 'Update User'}
//               </button>
//               <button
//                 type="button"
//                 onClick={() => router.back()}
//                 className="flex-1 md:flex-none px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
//               >
//                 Cancel
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EditUserForm;


"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Building2, MapPin, Calendar, CheckSquare, Key, Users, ChevronDown } from 'lucide-react';
import { AdminUserService, UpdateUserPayload, AdminUser } from '@/services/AdminUserService';
import { RoleService, Role } from '@/services/RoleService';
import { toast } from '@/app/components/hooks/use-toast';

const EditUserForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    emailAddress: '',
    phoneNumber: '',
    userID: '', // This will be used as password if provided
    existingUsersID: '',
    organisationsCustomUsersID: ''
  });
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [userLoading, setUserLoading] = useState(true);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Extract user ID from URL
        const urlParts = window.location.pathname.split('/');
        const id = urlParts[urlParts.length - 1];
        setUserId(id);
        
        const adminUserService = new AdminUserService();
        
        // Fetch user data
        const userData = await adminUserService.getAdminUserById(id);
        
        // Map the API response to the form fields
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          emailAddress: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          userID: '', // Password field - not returned from API for security
          existingUsersID: '',
          organisationsCustomUsersID: userData.customUserId || ''
        });
        
        // Fetch permissions and user permissions
        const permissionsResponse = await adminUserService.getAvailablePermissions();
        setPermissions(permissionsResponse.data.permissions || []);
        
        // Get user's current permissions
        try {
          const userPermissions = await adminUserService.getUserPermissions(id);
          // Check if userPermissions.data has the permissions array directly or nested
          let userPermissionKeys: string[] = [];
          if (userPermissions.data.permissions) {
            // If permissions is an array of objects with key property
            if (Array.isArray(userPermissions.data.permissions) && userPermissions.data.permissions.length > 0) {
              if (typeof userPermissions.data.permissions[0] === 'object' && userPermissions.data.permissions[0].key) {
                userPermissionKeys = userPermissions.data.permissions.map((p: any) => p.key);
              } else {
                // If permissions is an array of strings
                userPermissionKeys = userPermissions.data.permissions;
              }
            }
          }
          setSelectedPermissions(userPermissionKeys);
        } catch (error) {
          console.error('Error fetching user permissions:', error);
          // Continue without permissions if there's an error
        }
        
        // Fetch roles
        try {
          const roleService = new RoleService();
          const rolesResponse = await roleService.getRoles();
          setRoles(rolesResponse.data.roles || []);
          
          // After roles are loaded, try to match the user's role
          // Get user role from the user data
          if (userData.role) {
            // Find the role ID that matches the user's role name
            const userRole = rolesResponse.data.roles.find(role => role.name === userData.role);
            if (userRole) {
              setSelectedRole(userRole.id);
            }
          }
        } catch (roleError) {
          console.error('Error fetching roles:', roleError);
          // Continue without roles if there's an error
        }
        
        setUserLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({ 
          title: 'Error', 
          description: 'Failed to load user data',
          variant: 'destructive'
        });
        setUserLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionChange = (permissionKey: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionKey)
        ? prev.filter((p: string) => p !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const generatePassword = () => {
    // Generate a random password with letters, numbers, and special characters
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure the password has at least one uppercase, lowercase, number, and special character
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()]/.test(password);
    
    if (!hasUpper) {
      password = password.slice(0, -1) + "A";
    }
    if (!hasLower) {
      password = password.slice(0, -1) + "a";
    }
    if (!hasNumber) {
      password = password.slice(0, -1) + "1";
    }
    if (!hasSpecial) {
      password = password.slice(0, -1) + "!";
    }
    
    setFormData(prev => ({
      ...prev,
      userID: password
    }));
  };

  const generateCustomUserId = async () => {
    setLoading(true);
    try {
      const adminUserService = new AdminUserService();
      // This function is now just for UI consistency, as custom ID is auto-generated after user creation
      toast({
        title: 'Note',
        description: 'Custom User ID will be auto-generated after user creation',
        variant: 'default'
      });
    } catch (error: any) {
      console.error('Error generating custom user ID:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate custom user ID',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const adminUserService = new AdminUserService();
      
      // Prepare the payload for the API
      const payload: UpdateUserPayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.emailAddress,
        phoneNumber: formData.phoneNumber || undefined
      };
      
      // Call the API to update the user
      await adminUserService.updateAdminUser(userId, payload);
      
      // Update user permissions if they were modified
      if (selectedPermissions.length > 0) {
        try {
          await adminUserService.assignUserPermissions(userId, { permissions: selectedPermissions });
        } catch (permissionError) {
          console.error('Error assigning permissions:', permissionError);
          toast({
            title: 'Warning',
            description: 'User updated successfully, but failed to assign permissions',
            variant: 'destructive'
          });
        }
      }
      
      // Update user role
      // If a role is selected, assign it to the user
      if (selectedRole) {
        try {
          const roleService = new RoleService();
          // First, try to unassign any existing role (if we knew the previous role)
          // For now, we'll just assign the new role
          await roleService.assignRoleToUsers(selectedRole, { userIds: [userId] });
        } catch (roleError) {
          console.error('Error assigning role:', roleError);
          toast({
            title: 'Warning',
            description: 'User updated successfully, but failed to assign role',
            variant: 'destructive'
          });
        }
      }
      // Note: Removing a role might require a different API call depending on backend implementation
      // If no role is selected (empty string), no role assignment is made
      
      // Update password if provided
      if (formData.userID) {
        try {
          await adminUserService.updateAdminUserPassword(userId, { password: formData.userID });
        } catch (passwordError) {
          console.error('Error updating password:', passwordError);
          toast({
            title: 'Warning',
            description: 'User updated successfully, but failed to update password',
            variant: 'destructive'
          });
        }
      }
      
      toast({ 
        title: 'Success', 
        description: 'User updated successfully',
        variant: 'default'
      });
      
      router.push('/admin/users');
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update user',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D2A8B]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Manrope', sans-serif; }
      `}</style>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Update user information</h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter last name"
                    required
                  />
                </div>

                
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="emailAddress"
                    value={formData.emailAddress}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="+1234567890"
                  />
                </div>
              </div>
            </div>

            {/* Role Assignment - Updated to Dropdown */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Assign Role
              </h2>
              <div className="w-full md:w-1/2">
                <div className="relative">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white"
                    disabled={rolesLoading}
                  >
                    <option value="">Select a role </option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                
                {/* Show role description if selected */}
                {selectedRole && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-2">Role Details</h3>
                    {(() => {
                      const selectedRoleData = roles.find(r => r.id === selectedRole);
                      return selectedRoleData ? (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Description:</span> {selectedRoleData.description}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Permissions:</span> {selectedRoleData.permissions.join(', ')}
                          </p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
              
              {rolesLoading && (
                <div className="text-gray-500 text-sm mt-2">Loading roles...</div>
              )}
              
              {!rolesLoading && roles.length === 0 && (
                <div className="text-gray-500 text-sm mt-2">No roles available</div>
              )}
            </div>

            {/* User IDs Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Key className="w-5 h-5" />
                User Identification
              </h2>
              <div className="space-y-4 border border-[#5D2A8B] rounded-lg p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-gray-500">(Optional - Leave blank to keep current password)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="userID"
                      value={formData.userID}
                      onChange={handleChange}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
                      placeholder="Enter new password or leave blank to keep current"
                    />
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium whitespace-nowrap"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Existing User's ID <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="existingUsersID"
                    value={formData.existingUsersID}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
                    placeholder="Enter existing user's ID if applicable"
                  />
                </div>

                
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 md:flex-none px-8 py-3 bg-[#5D2A8B] text-white rounded-lg hover:bg-[#5D2A8B] transition-colors duration-200 font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Updating...' : 'Update User'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 md:flex-none px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserForm;