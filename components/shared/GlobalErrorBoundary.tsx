"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";

interface State {
  hasError: boolean;
}

export class GlobalErrorBoundary extends Component<{ children: ReactNode }, State> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[GlobalErrorBoundary] caught:", error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Something went wrong
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            An unexpected error occurred. Try refreshing the page — if the problem
            persists, please contact support.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false })}
              className="rounded-xl bg-brand-green-700 px-5 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:bg-brand-green-800"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Go home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
