"use client";

import React, { useEffect, useRef } from "react";
import { useDispatch, Provider } from "react-redux";
import { store, AppDispatch } from "@/store";
import { fetchCurrentUser, logoutUserThunk } from "@/store/slices/authSlice";
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    dispatch(fetchCurrentUser());

    const handleLogoutEvent = () => {
      dispatch(logoutUserThunk());
    };

    window.addEventListener("auth:logout", handleLogoutEvent);
    return () => {
      window.removeEventListener("auth:logout", handleLogoutEvent);
    };
  }, [dispatch]);

  return <>{children}</>;
}

export function ProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
