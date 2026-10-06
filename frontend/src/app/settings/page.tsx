"use client";
import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  updateProfileThunk,
  updateAvatarThunk,
  changePasswordThunk,
} from "@/store/slices/authSlice";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "@/lib/validation/auth.schema";
import { Settings, User, Key, Loader2 } from "lucide-react";
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);

  // Profile state
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>(
    {},
  );

  // Password state
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Which of the three forms is currently submitting — Redux only has one
  // shared `loading` flag for the whole auth slice, so we track locally
  // which action this component itself triggered, and gate each form's
  // spinner/disabled state on "this form's action AND slice loading".
  const [activeAction, setActiveAction] = useState<
    "profile" | "avatar" | "password" | null
  >(null);

  const isProfileSubmitting = loading && activeAction === "profile";
  const isAvatarSubmitting = loading && activeAction === "avatar";
  const isPasswordSubmitting = loading && activeAction === "password";
  const isAnySubmitting = loading && activeAction !== null;

  // Revoke the object URL when the component unmounts or the preview
  // changes, so we don't leak blob URLs in browser memory.
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Only JPG, PNG, or WEBP images are allowed");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setAvatarError("Image must be smaller than 5MB");
      e.target.value = "";
      return;
    }

    setAvatarError(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnySubmitting) return;
    setProfileErrors({});

    const result = updateProfileSchema.safeParse(profileData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) errors[issue.path[0] as string] = issue.message;
      });
      setProfileErrors(errors);
      return;
    }

    setActiveAction("profile");
    try {
      const res = await dispatch(updateProfileThunk(profileData));
      if (updateProfileThunk.rejected.match(res)) {
        setProfileErrors({
          form: String(res.payload ?? "Failed to update profile"),
        });
      }
    } finally {
      setActiveAction(null);
    }
  };

  const handleAvatarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarFile || isAnySubmitting) return;

    const formData = new FormData();
    formData.append("avatar", avatarFile);

    setActiveAction("avatar");
    try {
      const res = await dispatch(updateAvatarThunk(formData));
      if (updateAvatarThunk.fulfilled.match(res)) {
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarFile(null);
        setAvatarPreview(null);
        setAvatarError(null);
      } else if (updateAvatarThunk.rejected.match(res)) {
        setAvatarError(String(res.payload ?? "Failed to upload avatar"));
      }
    } finally {
      setActiveAction(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnySubmitting) return;
    setPasswordErrors({});

    const result = changePasswordSchema.safeParse(passwordData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) errors[issue.path[0] as string] = issue.message;
      });
      setPasswordErrors(errors);
      return;
    }

    setActiveAction("password");
    try {
      const res = await dispatch(changePasswordThunk(passwordData));
      if (changePasswordThunk.fulfilled.match(res)) {
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      } else if (changePasswordThunk.rejected.match(res)) {
        setPasswordErrors({
          form: String(res.payload ?? "Failed to change password"),
        });
      }
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-400" />
          Settings
        </h1>
        <p className="text-xs text-slate-400">
          Manage user profile details and update credentials
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile & Password Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Avatar & Profile Details Card */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <User className="w-4 h-4 text-emerald-400" />
              Account Profile
            </h2>

            {/* Avatar Section */}
            <form
              onSubmit={handleAvatarSubmit}
              className="flex items-center space-x-6"
            >
              <div className="relative group cursor-pointer">
                <img
                  src={
                    avatarPreview ||
                    user?.avatar ||
                    "https://via.placeholder.com/150"
                  }
                  alt={user?.fullName}
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-emerald-500/40"
                />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isAnySubmitting}
                  onChange={handleAvatarFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Change Profile Photo
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5 mb-2">
                  JPG, PNG or WEBP (Max 5MB)
                </p>
                {avatarError && (
                  <p className="text-[11px] text-rose-400 mb-2">
                    {avatarError}
                  </p>
                )}
                {avatarFile && (
                  <button
                    type="submit"
                    disabled={isAnySubmitting}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition-all"
                  >
                    {isAvatarSubmitting && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    {isAvatarSubmitting ? "Uploading..." : "Upload Avatar"}
                  </button>
                )}
              </div>
            </form>

            {/* Profile Fields Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {profileErrors.form && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  {profileErrors.form}
                </p>
              )}

              <fieldset
                disabled={isAnySubmitting}
                className="contents disabled:opacity-70"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          fullName: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                    {profileErrors.fullName && (
                      <p className="text-[11px] text-rose-400 mt-1">
                        {profileErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                    {profileErrors.email && (
                      <p className="text-[11px] text-rose-400 mt-1 font-medium">
                        {profileErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAnySubmitting}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  {isProfileSubmitting && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {isProfileSubmitting ? "Saving..." : "Save Profile Changes"}
                </button>
              </fieldset>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Key className="w-4 h-4 text-emerald-400" />
              Security & Password Change
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordErrors.form && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  {passwordErrors.form}
                </p>
              )}

              <fieldset
                disabled={isAnySubmitting}
                className="contents disabled:opacity-70"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Current Password *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordData.oldPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        oldPassword: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                  {passwordErrors.oldPassword && (
                    <p className="text-[11px] text-rose-400 mt-1 font-medium">
                      {passwordErrors.oldPassword}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      New Password *
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-[11px] text-rose-400 mt-1 font-medium">
                        {passwordErrors.newPassword}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordData.confirmNewPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmNewPassword: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                    {passwordErrors.confirmNewPassword && (
                      <p className="text-[11px] text-rose-400 mt-1 font-medium">
                        {passwordErrors.confirmNewPassword}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAnySubmitting}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20"
                >
                  {isPasswordSubmitting && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {isPasswordSubmitting ? "Updating..." : "Update Password"}
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
