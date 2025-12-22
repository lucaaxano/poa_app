'use client';

import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  position?: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export function useUpdateProfile() {
  const { company, setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => authApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      // Update the user in the auth store, keeping the existing company
      setUser(updatedUser, company);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: ChangePasswordData) =>
      authApi.changePassword(currentPassword, newPassword),
  });
}
