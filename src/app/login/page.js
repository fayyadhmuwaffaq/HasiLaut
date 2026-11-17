import { redirect } from "next/navigation";
import { getCurrentUser, getDefaultHomeForUser } from "@/lib/auth-guards";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Masuk",
  description: "Masuk ke akun HasiLaut sebagai Pembeli, Mitra Nelayan, atau Admin.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }) {
  const user = await getCurrentUser();
  if (user) {
    redirect(getDefaultHomeForUser(user));
  }

  const resolvedParams = await searchParams;
  const registered = resolvedParams?.registered === "1";
  const deleted = resolvedParams?.deleted === "1";
  const callbackUrl =
    typeof resolvedParams?.callbackUrl === "string"
      ? resolvedParams.callbackUrl
      : "";
  const initialError =
    typeof resolvedParams?.error === "string" ? resolvedParams.error : "";

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <LoginForm
        registered={registered}
        deleted={deleted}
        callbackUrl={callbackUrl}
        initialError={initialError}
      />
    </section>
  );
}
