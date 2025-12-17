import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

import { UserRole } from "@/generated/prisma";
import { hashPassword, verifyPassword } from "@/lib/argon2";
import { sendEmail } from "@/lib/email/email-service";
import {
  authPasswordResetTemplate,
  authVerificationTemplate,
} from "@/lib/email/templates";
import { ac, roles } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  trustedOrigins: [process.env.BETTER_AUTH_URL!],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: String(process.env.GOOGLE_CLIENT_ID),
      clientSecret: String(process.env.GOOGLE_CLIENT_SECRET),
    },
    github: {
      clientId: String(process.env.GITHUB_CLIENT_ID),
      clientSecret: String(process.env.GITHUB_CLIENT_SECRET),
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8, // this is the default but I just wanted to be explicit
    autoSignIn: false,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const html = authPasswordResetTemplate({ resetUrl: url });
      await sendEmail(user.email, "استعادة كلمة المرور - سرب", html);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const link = new URL(url);
      link.searchParams.set("callbackURL", "/profile");

      const html = authVerificationTemplate({ verificationUrl: String(link) });
      await sendEmail(user.email, "تأكيد البريد الإلكتروني - سرب", html);
    },
  },
  // hooks: {
  // here we can add hooks to the auth process
  // }
  // databaseHooks: {
  // here we can add hooks to the database, for example we can check the user email and right before creating the user
  // we can determine if his role should be an ADMIN or not.
  // },
  user: {
    additionalFields: {
      role: {
        type: ["USER", "ADMIN"] as Array<UserRole>,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
  plugins: [
    nextCookies(),
    admin({
      defaultRole: UserRole.USER,
      adminRoles: [UserRole.ADMIN],
      ac,
      roles,
    }),
  ],
});

export type ErrorCode = keyof typeof auth.$ERROR_CODES | "UNKNOWN";
