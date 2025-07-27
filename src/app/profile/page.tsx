"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Skeleton from "../../components/ui/Skeleton";
import AvatarUpload from "../../components/ui/AvatarUpload";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile } from "@/utils/auth/profile";
import { getUserStatsAction } from "./actions";
import { generateAvatar } from "@/utils/avatar";
import {
  uploadAvatar,
  getAvatarUrl,
  deleteAvatar,
} from "@/utils/avatar-upload";
import {
  updateProfile,
  validateProfileData,
} from "@/utils/auth/profile-update";
import {
  updatePreferencesWithoutTheme,
  validatePreferencesWithoutTheme,
  type UserPreferences,
} from "@/utils/auth/preferences-update";
import Notification from "@/components/ui/Notification";

// User profile type
interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string | null;
  preferences?: {
    theme?: string;
    notifications?: boolean;
    language?: string;
  };
  created_at?: string;
  updated_at?: string;
}

interface UserStats {
  total_courses: number;
  completed_courses: number;
  total_stages: number;
  completed_stages: number;
  total_quizzes: number;
  completed_quizzes: number;
  average_score: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isAvatarCropperOpen, setIsAvatarCropperOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info" | "warning";
    title: string;
    message: string;
    isVisible: boolean;
  }>({
    type: "info",
    title: "",
    message: "",
    isVisible: false,
  });

  // Load profile and stats
  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        Promise.all([
          getUserProfile(user.id),
          getUserStatsAction(),
          getAvatarUrl(user.id),
        ])
          .then(([profileData, statsData, avatarData]) => {
            setProfile(profileData.profile);
            if (statsData.success && statsData.stats) {
              setStats(statsData.stats);
            }
            setAvatarUrl(avatarData);
            setIsLoading(false);
          })
          .catch(() => {
            setIsLoading(false);
          });
      });

      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Update formData and preferencesData when profile loads
  useEffect(() => {
    if (profile != null) {
      setFormData({
        fullName: profile.full_name ?? "",
        email: profile.email ?? "",
        notifications: profile.preferences?.notifications ?? true,
        language: profile.preferences?.language ?? "en",
      });

      setPreferencesData({
        language:
          (profile.preferences?.language as "en" | "es" | "fr" | "de") ?? "en",
        notifications: profile.preferences?.notifications ?? true,
      });
    }
  }, [profile]);

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    notifications: true,
    language: "en" as string,
  });
  const [preferencesData, setPreferencesData] = useState<
    Omit<UserPreferences, "theme">
  >({
    language: "en",
    notifications: true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePreferencesChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setPreferencesData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAvatarChange = async (file: File | null) => {
    if (!user?.id) return;

    if (file) {
      setIsUploadingAvatar(true);
      try {
        const result = await uploadAvatar(file, user.id);
        if (result.success && result.url) {
          setAvatarUrl(result.url);
          setProfile((prev) =>
            prev ? { ...prev, avatar_url: result.url } : null,
          );
          setNotification({
            type: "success",
            title: "Avatar Updated",
            message: "Your avatar has been uploaded successfully",
            isVisible: true,
          });
          setTimeout(() => {
            refreshAvatarUrl();
          }, 1000);
        } else {
          setNotification({
            type: "error",
            title: "Upload Failed",
            message: result.error || "Failed to upload avatar",
            isVisible: true,
          });
        }
      } catch (error) {
        console.error("Avatar upload error:", error);
        setNotification({
          type: "error",
          title: "Upload Error",
          message: "Failed to upload avatar. Please try again.",
          isVisible: true,
        });
      } finally {
        setIsUploadingAvatar(false);
      }
    } else {
      setIsUploadingAvatar(true);
      try {
        const success = await deleteAvatar(user.id);
        if (success) {
          setAvatarUrl(null);
          setProfile((prev) => (prev ? { ...prev, avatar_url: null } : null));
          setNotification({
            type: "success",
            title: "Avatar Removed",
            message: "Your avatar has been removed successfully",
            isVisible: true,
          });
          setTimeout(() => {
            refreshAvatarUrl();
          }, 1000);
        } else {
          setNotification({
            type: "error",
            title: "Removal Failed",
            message: "Failed to remove avatar. Please try again.",
            isVisible: true,
          });
        }
      } catch (error) {
        console.error("Avatar removal error:", error);
        setNotification({
          type: "error",
          title: "Removal Error",
          message: "Failed to remove avatar. Please try again.",
          isVisible: true,
        });
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const refreshAvatarUrl = useCallback(async () => {
    if (user?.id) {
      const newUrl = await getAvatarUrl(user.id);
      setAvatarUrl(newUrl);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      refreshAvatarUrl();
    }
  }, [user?.id, refreshAvatarUrl]);

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  };

  const handleSavePreferences = async () => {
    if (!user?.id) return;

    try {
      const validation = validatePreferencesWithoutTheme(preferencesData);

      if (!validation.isValid) {
        setNotification({
          type: "error",
          title: "Validation Error",
          message: validation.error || "Please check your preferences",
          isVisible: true,
        });
        return;
      }

      setIsSavingPreferences(true);

      const result = await updatePreferencesWithoutTheme(
        user.id,
        preferencesData,
      );

      if (result.success) {
        setNotification({
          type: "success",
          title: "Preferences Updated",
          message:
            result.message || "Your preferences have been updated successfully",
          isVisible: true,
        });

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                preferences: preferencesData,
              }
            : null,
        );

        setIsEditingPreferences(false);
      } else {
        setNotification({
          type: "error",
          title: "Update Failed",
          message: result.error || "Failed to update preferences",
          isVisible: true,
        });
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      setNotification({
        type: "error",
        title: "Error",
        message: "An unexpected error occurred while saving your preferences",
        isVisible: true,
      });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleSave = async () => {
    const validation = validateProfileData({
      fullName: formData.fullName,
      email: formData.email,
    });

    if (!validation.isValid) {
      setNotification({
        type: "error",
        title: "Validation Error",
        message: validation.error || "Please check your input",
        isVisible: true,
      });
      return;
    }

    setIsSavingProfile(true);

    // Fire and forget - don't wait for response
    updateProfile({
      fullName: formData.fullName,
      email: formData.email,
    })
      .then((result) => {
        if (result.success) {
          setNotification({
            type: "success",
            title: "Profile Updated",
            message:
              result.message || "Your profile has been updated successfully",
            isVisible: true,
          });
        } else {
          setNotification({
            type: "error",
            title: "Update Failed",
            message: result.error || "Failed to update profile",
            isVisible: true,
          });
        }
      })
      .catch(() => {
        setNotification({
          type: "error",
          title: "Error",
          message: "An unexpected error occurred while saving your profile",
          isVisible: true,
        });
      });

    // Update UI immediately
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            full_name: formData.fullName,
            email: formData.email,
          }
        : null,
    );

    // Reset editing state immediately
    setIsEditing(false);

    // Show success notification immediately
    const emailChanged = formData.email !== profile?.email;
    setNotification({
      type: emailChanged ? "info" : "success",
      title: emailChanged ? "Email Update" : "Profile Updated",
      message: emailChanged
        ? "Please check both of your emails for confirmation."
        : "Your profile has been updated successfully",
      isVisible: true,
    });

    // Reset saving state immediately
    setIsSavingProfile(false);
  };

  const getLanguageName = (code: string) => {
    const languages: { [key: string]: string } = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
    };
    return languages[code] || code;
  };

  const handleCancel = () => {
    setFormData({
      fullName: profile?.full_name ?? "",
      email: profile?.email ?? "",
      notifications: profile?.preferences?.notifications ?? true,
      language: profile?.preferences?.language ?? "en",
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Notification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={closeNotification}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Header */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Your Profile
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Manage your account, track your progress, and customize your
            learning experience
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Personal Information
                </h2>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit Profile
                  </Button>
                )}
              </div>

              {!isEditing ? (
                <div className="flex items-center space-x-6">
                  {isLoading || profile == null ? (
                    <Skeleton className="w-24 h-24 rounded-full" />
                  ) : (
                    <>
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={`${profile?.full_name || "User"} avatar`}
                          width={96}
                          height={96}
                          className="w-24 h-24 rounded-full shadow-lg"
                        />
                      ) : (
                        <div
                          className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg"
                          style={{
                            backgroundColor: generateAvatar(profile?.full_name)
                              .bgColor,
                          }}
                        >
                          {generateAvatar(profile?.full_name).letter}
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {profile?.full_name || "User"}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-lg">
                          {profile?.email}
                        </p>
                        <div className="flex items-center mt-3 text-sm text-gray-500 dark:text-gray-400">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Member since{" "}
                          {profile?.created_at
                            ? new Date(profile.created_at).toLocaleDateString()
                            : "Recently"}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <AvatarUpload
                    currentAvatarUrl={avatarUrl}
                    userName={profile?.full_name}
                    onAvatarChange={handleAvatarChange}
                    size="lg"
                    disabled={isUploadingAvatar}
                    onCropperOpenChange={setIsAvatarCropperOpen}
                  />

                  {isUploadingAvatar && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Uploading avatar...
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Full Name"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      disabled={isSavingProfile}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isSavingProfile ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                    {!isAvatarCropperOpen && (
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSavingProfile}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Preferences Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Preferences
                </h2>
                {!isEditingPreferences && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingPreferences(true)}
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Edit Preferences
                  </Button>
                )}
              </div>

              {!isEditingPreferences ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {isLoading || profile == null ? (
                    <>
                      <div>
                        <Skeleton className="w-20 h-4 mb-2" />
                        <Skeleton className="w-32 h-6" />
                      </div>
                      <div>
                        <Skeleton className="w-32 h-4 mb-2" />
                        <Skeleton className="w-24 h-6" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Language
                        </label>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {getLanguageName(preferencesData.language)}
                        </p>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email Notifications
                        </label>
                        <div className="flex items-center">
                          <div
                            className={`w-3 h-3 rounded-full mr-3 ${preferencesData.notifications ? "bg-green-500" : "bg-gray-400"}`}
                          ></div>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {preferencesData.notifications
                              ? "Enabled"
                              : "Disabled"}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Language
                      </label>
                      <select
                        name="language"
                        value={preferencesData.language}
                        onChange={handlePreferencesChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="notifications"
                          checked={preferencesData.notifications}
                          onChange={handlePreferencesChange}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded transition-colors"
                        />
                        <label className="ml-3 text-lg text-gray-700 dark:text-gray-300">
                          Enable email notifications
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <Button
                      variant="primary"
                      onClick={handleSavePreferences}
                      disabled={isSavingPreferences}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isSavingPreferences ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        "Save Preferences"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingPreferences(false)}
                      disabled={isSavingPreferences}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Stats Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                Learning Stats
              </h2>

              <div className="space-y-6">
                {isLoading || profile == null ? (
                  <>
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl">
                      <Skeleton className="w-20 h-8 mx-auto mb-3" />
                      <Skeleton className="w-32 h-5 mx-auto" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <Skeleton className="w-16 h-6 mx-auto mb-2" />
                        <Skeleton className="w-20 h-4 mx-auto" />
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                        <Skeleton className="w-16 h-6 mx-auto mb-2" />
                        <Skeleton className="w-20 h-4 mx-auto" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                        {stats?.average_score || 0}%
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                        Average Score
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                          {stats?.completed_courses || 0}
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300 font-medium">
                          Completed
                        </div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                          {stats?.total_courses || 0}
                        </div>
                        <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                          Total Courses
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Stages
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {stats?.completed_stages || 0}/
                          {stats?.total_stages || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Quizzes
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {stats?.completed_quizzes || 0}/
                          {stats?.total_quizzes || 0}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Quick Actions
              </h2>

              <div className="space-y-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => alert("Demo: Export learning data")}
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export Data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => alert("Demo: Download certificates")}
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Certificates
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => alert("Demo: View learning history")}
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Learning History
                </Button>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Account
              </h2>

              <div className="space-y-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => router.push("/update-password")}
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  Change Password
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                  onClick={() => alert("Demo: Delete account")}
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
