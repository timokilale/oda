import { useEffect } from "react";

export default function usePageTitle(title) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} — ODA` : "ODA";

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
