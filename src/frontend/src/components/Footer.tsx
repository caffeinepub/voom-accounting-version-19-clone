import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        © 2025. Built with{" "}
        <Heart className="inline h-4 w-4 fill-red-500 text-red-500" /> using{" "}
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
  );
}
