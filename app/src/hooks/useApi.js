import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

// Hook de datos asíncronos con estados de carga/error y refetch al recuperar
// el foco (silencioso, para no parpadear al volver de otra pantalla).
export default function useApi(fn) {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const recargar = useCallback((opts) => {
    const silencioso = !!(opts && opts.silencioso);
    let vivo = true;
    if (!silencioso) {
      setState((s) => ({ data: null, loading: true, error: null }));
    }
    Promise.resolve()
      .then(() => fnRef.current())
      .then((data) => {
        if (vivo) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (vivo) setState({ data: null, loading: false, error });
      });
    return () => {
      vivo = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      recargar({ silencioso: true });
    }, [recargar])
  );

  return { ...state, recargar };
}
