"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { registerUserThunk } from "@/store/slices/authSlice";
import { registerSchema } from "@/lib/validation/auth.schema";
import {
  User,
  Mail,
  Lock,
  UploadCloud,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    fullName: "",
    password: "",
    confirmPassword: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [showPassword, setShowPassword] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors((prev) => ({
          ...prev,
          avatar: "Avatar image must be smaller than 5MB",
        }));
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setValidationErrors((prev) => ({ ...prev, avatar: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Zod validation check
    const parseResult = registerSchema.safeParse({
      ...formData,
      avatar: avatarFile,
    });

    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      parseResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    // Build FormData for upload
    const uploadData = new FormData();
    uploadData.append("userName", formData.userName);
    uploadData.append("email", formData.email);
    uploadData.append("fullName", formData.fullName);
    uploadData.append("password", formData.password);
    if (avatarFile) {
      uploadData.append("avatar", avatarFile);
    }

    const res = await dispatch(registerUserThunk(uploadData));
    if (registerUserThunk.fulfilled.match(res)) {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-lg glass-card rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold text-xl shadow-lg shadow-emerald-500/20 mb-2">
            $
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Create Account</h1>
          <p className="text-xs text-slate-400 mt-1">
            Start tracking expenses, income & budgets with AI insights
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <label className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              Profile Avatar *
            </label>
            <div className="relative group cursor-pointer">
              <div className="w-20 h-20 rounded-full bg-slate-950 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center overflow-hidden hover:border-emerald-500 transition-colors">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-500">
                    <UploadCloud className="w-6 h-6 mb-1" />
                    <span className="text-[10px]">Upload</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleAvatarChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            {validationErrors.avatar && (
              <p className="text-xs text-rose-400 mt-1">
                {validationErrors.avatar}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Jahangir Hassan"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className={`w-full bg-slate-950/80 border ${
                    validationErrors.fullName
                      ? "border-rose-500"
                      : "border-slate-800"
                  } focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 outline-none`}
                />
              </div>
              {validationErrors.fullName && (
                <p className="text-[11px] text-rose-400 mt-0.5">
                  {validationErrors.fullName}
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Username
              </label>
              <div className="relative">
                <span className="text-slate-500 absolute left-3 top-2 text-xs font-mono">
                  @
                </span>
                <input
                  type="text"
                  placeholder="jahangir123"
                  value={formData.userName}
                  onChange={(e) =>
                    setFormData({ ...formData, userName: e.target.value })
                  }
                  className={`w-full bg-slate-950/80 border ${
                    validationErrors.userName
                      ? "border-rose-500"
                      : "border-slate-800"
                  } focus:border-emerald-500 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 outline-none`}
                />
              </div>
              {validationErrors.userName && (
                <p className="text-[11px] text-rose-400 mt-0.5">
                  {validationErrors.userName}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="jahangir@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`w-full bg-slate-950/80 border ${
                  validationErrors.email
                    ? "border-rose-500"
                    : "border-slate-800"
                } focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 outline-none`}
              />
            </div>
            {validationErrors.email && (
              <p className="text-[11px] text-rose-400 mt-0.5">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={`w-full bg-slate-950/80 border ${
                    validationErrors.password
                      ? "border-rose-500"
                      : "border-slate-800"
                  } focus:border-emerald-500 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 outline-none`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-500"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-[11px] text-rose-400 mt-0.5">
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className={`w-full bg-slate-950/80 border ${
                    validationErrors.confirmPassword
                      ? "border-rose-500"
                      : "border-slate-800"
                  } focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 outline-none`}
                />
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-[11px] text-rose-400 mt-0.5">
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Register</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400">
            Already registered?{" "}
            <Link
              href="/login"
              className="text-emerald-400 hover:underline font-semibold"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
