import { useCallback, useEffect, useRef, useState } from "react";

const initialState = { data: null, loading: true, error: null };

export default function useDataFetching(fetchFn, deps = []) {
  const [state, setState] = useState(initialState);
  const mountedRef = useRef(true);
  const abortRef = useRef(null);

  const execute = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const data = await fetchFn({ signal: controller.signal });
      if (mountedRef.current && !controller.signal.aborted) {
        setState({ data, loading: false, error: null });
      }
    } catch (err) {
      if (err.name === "AbortError" || !mountedRef.current) return;
      setState({ data: null, loading: false, error: err.message });
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    execute();
  }, [execute]);

  useEffect(() => {
    mountedRef.current = true;
    execute();
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [execute]);

  return { ...state, refresh };
}
