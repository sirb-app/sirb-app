import { useEffect, useState } from "react";

type UserLike = {
  id: string;
} | null;

export function useModerationAccess(user: UserLike) {
  const [hasModerationAccess, setHasModerationAccess] = useState(false);

  useEffect(() => {
    if (!user) {
      setHasModerationAccess(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    fetch("/api/check-moderation-access", { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setHasModerationAccess(Boolean(data?.hasAccess));
        }
      })
      .catch(error => {
        if (error.name === "AbortError") return;
        if (isMounted) {
          setHasModerationAccess(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [user]);

  return hasModerationAccess;
}
