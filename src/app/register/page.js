import { redirect } from "next/navigation";
import { getCurrentUser, getDefaultHomeForUser } from "@/lib/auth-guards";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Daftar Akun",
  description: "Daftar sebagai Pembeli atau Mitra Nelayan di HasiLaut.",
};

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(getDefaultHomeForUser(user));
  }

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <RegisterForm />
    </section>
  );
}
