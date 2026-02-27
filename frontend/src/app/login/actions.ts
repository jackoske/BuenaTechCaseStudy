"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(_: unknown, formData: FormData) {
  const password = formData.get("password") as string;

  if (password && (password === process.env.AUTH_PASSWORD || !process.env.AUTH_PASSWORD)) {
    const cookieStore = await cookies();
    cookieStore.set("buena_auth", process.env.AUTH_SECRET!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    redirect("/properties");
  }

  return { error: "Incorrect password." };
}
