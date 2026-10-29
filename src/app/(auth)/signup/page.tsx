import { redirect } from "next/navigation";

/** Alias IA: /signup → /register */
export default function SignupAliasPage() {
  redirect("/register");
}
