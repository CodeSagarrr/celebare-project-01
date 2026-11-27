"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return <button className="button secondary" type="button" onClick={() => signOut({ redirectTo: "/login" })}>Log out</button>;
}
