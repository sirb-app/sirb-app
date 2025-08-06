import type { auth } from "@/lib/auth";
import { ac, roles } from "@/lib/permissions";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  plugins: [inferAdditionalFields<typeof auth>(), adminClient({ ac, roles })],
});

export const {
  signUp,
  signOut,
  signIn,
  useSession,
  admin,
  sendVerificationEmail,
  forgetPassword,
  resetPassword,
  updateUser,
  changePassword,
} = authClient;
