import { ModeToggle } from "@/components/ui/mode-toggle";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24">
      <div className="absolute right-4 top-4 z-20 sm:right-8 sm:top-8">
        <ModeToggle />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.08),_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.12),_transparent_55%)]" />

      <section className="mx-auto flex w-full max-w-lg flex-col items-center text-center">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-border/60 bg-card/80 p-2 shadow-sm backdrop-blur-sm">
          <Image
            src="/image.png"
            alt="King Kebab"
            width={96}
            height={96}
            priority
            className="h-full w-full rounded-2xl object-cover object-top"
          />
        </div>

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
