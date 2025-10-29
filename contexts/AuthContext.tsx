"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, onAuthStateChange } from "@/lib/supabase";
import { UserRoleService } from "@/lib/user-role-service";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  isAdmin: boolean;
  isTeacher: boolean;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ data: any; error: any }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  // Function to fetch user role (simplified)
  const fetchUserRole = async (userId: string) => {
    try {
      console.log("AuthContext: Fetching role for user:", userId);
      const role = await UserRoleService.getUserRole(userId);
      console.log("AuthContext: Received role:", role);

      setUserRole(role);
      setIsAdmin(role === "admin");
      setIsTeacher(role === "teacher");

      // Cache the role
      if (role) {
        localStorage.setItem(`user_role_${userId}`, role);
        console.log("AuthContext: Cached role:", role);
      } else {
        localStorage.removeItem(`user_role_${userId}`);
        console.log("AuthContext: No role found, cleared cache");
      }
    } catch (error) {
      console.error("AuthContext: Error fetching user role:", error);
      setUserRole(null);
      setIsAdmin(false);
      setIsTeacher(false);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      // Check localStorage for cached role first
      if (session?.user) {
        const cachedRole = localStorage.getItem(`user_role_${session.user.id}`);
        if (cachedRole) {
          setUserRole(cachedRole);
          setIsAdmin(cachedRole === "admin");
          setIsTeacher(cachedRole === "teacher");
        } else {
          await fetchUserRole(session.user.id);
        }
      }

      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Check localStorage for cached role first
      if (session?.user) {
        const cachedRole = localStorage.getItem(`user_role_${session.user.id}`);
        if (cachedRole) {
          setUserRole(cachedRole);
          setIsAdmin(cachedRole === "admin");
          setIsTeacher(cachedRole === "teacher");
        } else {
          await fetchUserRole(session.user.id);
        }
      } else {
        setUserRole(null);
        setIsAdmin(false);
        setIsTeacher(false);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    // Clear cached role on logout
    if (user) {
      localStorage.removeItem(`user_role_${user.id}`);
    }
    setUserRole(null);
    setIsAdmin(false);
    setIsTeacher(false);

    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const refreshUserRole = async () => {
    if (user) {
      // Clear cache and refresh
      localStorage.removeItem(`user_role_${user.id}`);
      await fetchUserRole(user.id);
    }
  };

  const value = {
    user,
    session,
    loading,
    userRole,
    isAdmin,
    isTeacher,
    signUp,
    signIn,
    signOut,
    refreshUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
