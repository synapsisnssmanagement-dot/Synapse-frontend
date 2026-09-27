"use client";

import { useCallback, useEffect, useState } from "react";

// Loads async data and exposes the four states every section must design for:
// loading, error, empty (success with nothing in it) and success.
export default function useResource(fetcher, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ status: enabled ? "loading" : "idle", data: null, error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    Promise.resolve()
      .then(() => fetcher())
      .then(
        (data) => {
          if (!cancelled) setState({ status: "success", data, error: null });
        },
        (error) => {
          if (!cancelled) setState((prev) => ({ status: "error", data: prev.data, error }));
        }
      );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callers pass the values the fetcher closes over
  }, [...deps, version, enabled]);

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, status: "loading", error: null }));
    setVersion((v) => v + 1);
  }, []);

  const mutate = useCallback((updater) => {
    setState((prev) => ({ ...prev, data: typeof updater === "function" ? updater(prev.data) : updater }));
  }, []);

  return {
    data: state.data,
    error: state.error,
    status: state.status,
    loading: state.status === "loading",
    reload,
    mutate,
  };
}
