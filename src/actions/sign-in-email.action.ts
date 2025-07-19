"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function signInEmailAction(formData: FormData) {
  const email = String(formData.get("email"));
  if (!email) return { error: "Please enter your email" };

  const password = String(formData.get("password"));
  if (!password) return { error: "Please enter your password" };

  try {
    await auth.api.signInEmail({
      headers: await headers(),
      body: {
        email,
        password,
      },
    });

    return { error: null };
  } catch (err) {
    if (err instanceof Error) {
      return { error: "Oops! Something went wrong while logging in" };
    }

    return { error: "Internal Server Error" };
  }
}
