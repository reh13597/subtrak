"use client";

import { useEffect, useState } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // This effect runs only once on initial mount of the component
    // (i.e., on initial page load or hard refresh).
    // After a very short delay to ensure the DOM is ready for a transition,
    // we trigger the fade-in.
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, 50); 

    return () => clearTimeout(timeout);
  }, []); // Empty dependency array ensures this runs only once

  return (
    <div
      // Remove key={pathname} to prevent component re-mounting and re-animating on route changes.
      className={`transition-all duration-800 cubic-bezier(0.4, 0, 0.2, 1) ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      }`}
    >
      {children}
    </div>
  );
}
