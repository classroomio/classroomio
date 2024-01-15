// src/hooks/use-mounted.ts
import { useEffect, useState } from "react";
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
export {
  useMounted
};
