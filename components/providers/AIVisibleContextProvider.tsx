"use client";

import {
  useCallback,
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { routing } from "@/i18n/routing";
import { useRawPathname } from "@/lib/hooks/navigationHooks";
import {
  mergeVisibleContextInputs,
  normalizeVisibleContextRoute,
  type AIVisibleContext,
  type AIVisibleContextInput,
  type AIVisibleContextSegmentMap,
} from "@/features/ai/utils/visibleContext";

type AIVisibleContextStoreValue = {
  visibleContext: AIVisibleContext;
  setVisibleContextInput: Dispatch<SetStateAction<AIVisibleContextInput>>;
  registerVisibleContextSegment: (
    id: string,
    input: AIVisibleContextInput | null
  ) => void;
};

type AIVisibleContextState = Record<string, AIVisibleContextSegmentMap>;

const AIVisibleContextStore = createContext<AIVisibleContextStoreValue | null>(
  null
);
const PAGE_SEGMENT_ID = "__page__";

function getVisibleContextInputSignature(
  value: unknown,
  visited: WeakSet<object> = new WeakSet()
): string {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  if (typeof value !== "object") {
    return JSON.stringify(value);
  }

  // Detect promises - don't enumerate them
  if (
    value instanceof Promise ||
    (typeof value === "object" &&
      value !== null &&
      "then" in value &&
      typeof (value as PromiseLike<unknown>).then === "function")
  ) {
    return "[Promise]";
  }

  // Detect circular references
  if (visited.has(value)) {
    return "[Circular]";
  }

  visited.add(value);

  if (Array.isArray(value)) {
    return `[${value.map((item) => getVisibleContextInputSignature(item, visited)).join(",")}]`;
  }

  return `{${Object.entries(value)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([key, entryValue]) =>
        `${JSON.stringify(key)}:${getVisibleContextInputSignature(entryValue, visited)}`
    )
    .join(",")}}`;
}

function areVisibleContextInputsEqual(
  left: AIVisibleContextInput | undefined,
  right: AIVisibleContextInput | undefined
) {
  return (
    getVisibleContextInputSignature(left ?? null) ===
    getVisibleContextInputSignature(right ?? null)
  );
}

export function AIVisibleContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = useRawPathname();
  const route = useMemo(
    () => normalizeVisibleContextRoute(pathname, routing.locales),
    [pathname]
  );
  const [visibleContextState, setVisibleContextState] =
    useState<AIVisibleContextState>({});
  const visibleContextStateRef = useRef<AIVisibleContextState>({});

  useEffect(() => {
    visibleContextStateRef.current = visibleContextState;
  }, [visibleContextState]);

  const registerVisibleContextSegment = useCallback(
    (id: string, input: AIVisibleContextInput | null) => {
      const current = visibleContextStateRef.current;
      const baseSegments = current[route] ?? {};

      if (input === null) {
        if (!(id in baseSegments)) {
          return;
        }

        const nextSegments = { ...baseSegments };
        delete nextSegments[id];

        const nextState =
          Object.keys(nextSegments).length === 0
            ? Object.fromEntries(
                Object.entries(current).filter(
                  ([stateRoute]) => stateRoute !== route
                )
              )
            : {
                ...current,
                [route]: nextSegments,
              };

        visibleContextStateRef.current = nextState;
        setVisibleContextState(nextState);
        return;
      }

      if (areVisibleContextInputsEqual(baseSegments[id], input)) {
        return;
      }

      const nextState = {
        ...current,
        [route]: {
          ...baseSegments,
          [id]: input,
        },
      };

      visibleContextStateRef.current = nextState;
      setVisibleContextState(nextState);
    },
    [route]
  );

  const setVisibleContextInput = useCallback<
    Dispatch<SetStateAction<AIVisibleContextInput>>
  >(
    (value) => {
      const current = visibleContextStateRef.current;
      const baseSegments = current[route] ?? {};
      const nextPageInput =
        typeof value === "function"
          ? value(baseSegments[PAGE_SEGMENT_ID] ?? {})
          : value;

      if (
        areVisibleContextInputsEqual(
          baseSegments[PAGE_SEGMENT_ID],
          nextPageInput
        )
      ) {
        return;
      }

      const nextState = {
        ...current,
        [route]: {
          ...baseSegments,
          [PAGE_SEGMENT_ID]: nextPageInput,
        }
      };

      visibleContextStateRef.current = nextState;
      setVisibleContextState(nextState);
    },
    [route]
  );

  const visibleContext = useMemo(
    () => {
      const segments = Object.values(visibleContextState[route] ?? {});

      return mergeVisibleContextInputs(segments, route);
    },
    [route, visibleContextState]
  );

  const value = useMemo(
    () => ({
      visibleContext,
      setVisibleContextInput,
      registerVisibleContextSegment,
    }),
    [registerVisibleContextSegment, visibleContext, setVisibleContextInput]
  );

  return (
    <AIVisibleContextStore.Provider value={value}>
      {children}
    </AIVisibleContextStore.Provider>
  );
}

export function useAIVisibleContext() {
  const context = useContext(AIVisibleContextStore);

  if (!context) {
    throw new Error(
      "useAIVisibleContext must be used within AIVisibleContextProvider."
    );
  }

  return context.visibleContext;
}

export function useSetAIVisibleContext() {
  const context = useContext(AIVisibleContextStore);

  if (!context) {
    throw new Error(
      "useSetAIVisibleContext must be used within AIVisibleContextProvider."
    );
  }

  return context.setVisibleContextInput;
}

export function useRegisterAIVisibleContext(
  id: string,
  input: AIVisibleContextInput | null
) {
  const context = useContext(AIVisibleContextStore);

  if (!context) {
    throw new Error(
      "useRegisterAIVisibleContext must be used within AIVisibleContextProvider."
    );
  }

  const { registerVisibleContextSegment } = context;

  useEffect(() => {
    registerVisibleContextSegment(id, input);
  }, [id, input, registerVisibleContextSegment]);

  useEffect(() => {
    return () => {
      registerVisibleContextSegment(id, null);
    };
  }, [id, registerVisibleContextSegment]);
}
