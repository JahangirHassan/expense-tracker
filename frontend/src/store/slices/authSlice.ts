import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { api } from "@/lib/axios";
import { IUser, ApiResponse } from "@/types";
import {
  LoginFormData,
  ChangePasswordFormData,
  UpdateProfileFormData,
} from "@/lib/validation/auth.schema";

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  successMessage: null,
};

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || fallback;
  }
  return fallback;
};

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<IUser>>("/users/current-user");
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(extractErrorMessage(err, "Failed to fetch user"));
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { auth: AuthState };
      if (!state.auth.isAuthenticated) {
        return true;
      }
      return false;
    },
  },
);

export const loginUserThunk = createAsyncThunk(
  "auth/login",
  async (credentials: LoginFormData, { rejectWithValue }) => {
    try {
      const payload: Record<string, string> = {
        password: credentials.password,
      };
      if (credentials.identifier.includes("@")) {
        payload.email = credentials.identifier;
      } else {
        payload.userName = credentials.identifier;
      }

      const response = await api.post<ApiResponse<{ user: IUser }>>(
        "/users/login",
        payload,
      );

      return { user: response.data.data.user };
    } catch (err: unknown) {
      return rejectWithValue(extractErrorMessage(err, "Login failed"));
    }
  },
);

export const registerUserThunk = createAsyncThunk(
  "auth/register",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      // Don't set Content-Type manually — axios auto-generates the
      // multipart boundary for FormData bodies. Setting it here strips
      // that boundary and breaks multer parsing on the backend.
      const response = await api.post<ApiResponse<IUser>>(
        "/users/register",
        formData,
      );
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(extractErrorMessage(err, "Registration failed"));
    }
  },
);

export const logoutUserThunk = createAsyncThunk("auth/logout", async () => {
  try {
    await api.post("/users/logout");
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Logout API call failed, proceeding with local cleanup:",
        err,
      );
    }
  }
});

export const updateProfileThunk = createAsyncThunk(
  "auth/updateProfile",
  async (data: UpdateProfileFormData, { rejectWithValue }) => {
    try {
      const response = await api.patch<ApiResponse<IUser>>(
        "/users/update-user-datails",
        data,
      );
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(extractErrorMessage(err, "Profile update failed"));
    }
  },
);

export const updateAvatarThunk = createAsyncThunk(
  "auth/updateAvatar",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await api.patch<ApiResponse<IUser>>(
        "/users/update-avatar",
        formData,
      );
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(extractErrorMessage(err, "Avatar update failed"));
    }
  },
);

export const changePasswordThunk = createAsyncThunk(
  "auth/changePassword",
  async (data: ChangePasswordFormData, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<object>>(
        "/users/change-password",
        { oldPassword: data.oldPassword, newPassword: data.newPassword },
      );
      return response.data.message;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Password change failed"),
      );
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    clearAuthSuccess: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
      })

      .addCase(loginUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        //state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.successMessage = "Logged in successfully!";
      })
      .addCase(loginUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(registerUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUserThunk.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = "Account created! Please log in.";
      })
      .addCase(registerUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(logoutUserThunk.fulfilled, (state) => {
        state.user = null;
        // state.accessToken = null;
        state.isAuthenticated = false;
        state.loading = false;
      })

      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.successMessage = "Profile updated successfully!";
      })
      .addCase(updateProfileThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      .addCase(updateAvatarThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.successMessage = "Avatar updated successfully!";
      })

      .addCase(changePasswordThunk.fulfilled, (state, action) => {
        state.successMessage = action.payload;
      })
      .addCase(changePasswordThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearAuthError, clearAuthSuccess } = authSlice.actions; //, setAuthFromToken }
export default authSlice.reducer;
