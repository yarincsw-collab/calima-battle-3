import Link from "next/link";
import { BattlesLogo } from "@/components/Logo";
import { RegistrationForm } from "@/components/RegistrationForm";

export const metadata = {
  title: "הרשמה — Calima Battles 3",
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-grunge-gradient noise pb-20">
      <div className="px-5 pt-10 sm:pt-16">
        <div className="max-w-2xl mx-auto text-center">
          <Link href="/" className="inline-block hover:opacity-90 transition">
            <BattlesLogo />
          </Link>
          <p className="mt-4 text-white/65 text-sm sm:text-base">
            הרשמה לתחרות. ההשלמה לוקחת ~5 דקות.
          </p>
        </div>
      </div>

      <div className="mt-10 px-5">
        <RegistrationForm />
      </div>
    </main>
  );
}
