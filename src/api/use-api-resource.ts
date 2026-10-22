"use client";

import { useCallback, useEffect, useState } from "react";

export type ApiResourceState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

export function useApiResource<T>(load: () => Promise<T>) {
  const [state, setState] = useState<ApiResourceState<T>>({
    status: "loading",
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void load().then(
      (data) => {
        if (!cancelled) setState({ status: "success", data });
      },
      (error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            error:
              error instanceof Error
                ? error
                : new Error("An unexpected API error occurred."),
          });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [attempt, load]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }, []);

  return { state, retry };
}
