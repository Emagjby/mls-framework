import { createClient } from "@/utils/supabase/client";

export interface AuthResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

/**
 * Client-side login function
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    console.log("🔍 Client-side login called");

    const supabase = createClient();
    console.log("✅ Supabase client created");

    console.log("📧 Login data:", {
      email,
      password: password ? "[HIDDEN]" : "undefined",
    });

    const { data: loginData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("📋 Login response:", {
      user: loginData.user
        ? { id: loginData.user.id, email: loginData.user.email }
        : null,
      session: loginData.session ? "Session created" : "No session",
      error: error ? { message: error.message, status: error.status } : null,
    });

    if (error) {
      console.error("❌ Login error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log("✅ Login successful");
    return {
      success: true,
      redirectTo: "/",
    };
  } catch (error) {
    console.error("❌ Unexpected login error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Client-side signup function
 */
export async function signupUser(
  email: string,
  password: string,
  fullName: string,
): Promise<AuthResult> {
  try {
    console.log("🔍 Client-side signup called");

    const supabase = createClient();
    console.log("✅ Supabase client created");

    console.log("📧 Registration data:", {
      email,
      password: password ? "[HIDDEN]" : "undefined",
      fullName,
    });

    const { data: signupData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    console.log("📋 Signup response:", {
      user: signupData.user
        ? { id: signupData.user.id, email: signupData.user.email }
        : null,
      session: signupData.session ? "Session created" : "No session",
      error: error ? { message: error.message, status: error.status } : null,
    });

    if (error) {
      console.error("❌ Signup error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log("✅ Signup successful");
    return {
      success: true,
      redirectTo: "/check-email",
    };
  } catch (error) {
    console.error("❌ Unexpected signup error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Client-side logout function
 */
export async function logoutUser(): Promise<AuthResult> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("❌ Logout error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log("✅ Logout successful");
    return {
      success: true,
      redirectTo: "/login",
    };
  } catch (error) {
    console.error("❌ Unexpected logout error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
