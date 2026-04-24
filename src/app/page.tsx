import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.08),_transparent_60%)]" />

      <section className="mx-auto flex w-full max-w-lg flex-col items-center text-center">
        <Image
          src="/image.png"
          alt="King Kebab"
          width={96}
          height={96}
          priority
          className="mb-8 h-20 w-20 rounded-2xl object-contain shadow-card"
        />

        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Time Management,
          <br />
          <span className="text-primary">simplified.</span>
        </h1>

        <p className="mt-5 max-w-md text-balance text-base text-muted-foreground sm:text-lg">
          Track shifts, manage overtime and keep the whole King Kebab team in
          sync — with a clean, focused interface.
        </p>

        <div className="mt-10 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="w-full rounded-full px-8 sm:w-auto"
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full rounded-full px-8 sm:w-auto"
          >
            <Link href="/register">Create account</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
