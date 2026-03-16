import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/voom-logo.dim_200x200.png"
              alt="Voom Logo"
              className="h-10 w-10"
            />
            <h1 className="text-2xl font-bold tracking-tight">
              Voom Accounting
            </h1>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <img
                src="/assets/generated/voom-logo.dim_200x200.png"
                alt="Voom Logo"
                className="h-24 w-24 rounded-2xl shadow-lg"
              />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              Welcome to Voom Accounting
            </h2>
            <p className="mt-3 text-muted-foreground">
              Professional transport service accounting and profit & loss
              tracking
            </p>
          </div>

          <div className="rounded-xl border bg-card p-8 shadow-lg">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Get Started</h3>
                <p className="text-sm text-muted-foreground">
                  Sign in securely to manage your transport business finances
                </p>
              </div>

              <Button
                onClick={login}
                disabled={isLoggingIn}
                className="w-full"
                size="lg"
              >
                {isLoggingIn ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </>
                )}
              </Button>

              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Key Features:
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-primary">✓</span>
                    <span>
                      Track income from transport trips with detailed
                      information
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-primary">✓</span>
                    <span>Manage expenses across multiple categories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-primary">✓</span>
                    <span>
                      View comprehensive P&L reports by day, week, month, and
                      year
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © 2025. Built with love using{" "}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
