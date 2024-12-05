import React, { useEffect } from "react";

interface LoadCSSProps {
  href: string; // URL of the CSS file
}

const LoadCSSFile: React.FC<LoadCSSProps> = ({ href }) => {
  useEffect(() => {
    // Create a <link> element
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = href;

    // Add the <link> element to the end of the <head> tag
    document.head.appendChild(link);

    // Cleanup: Remove the link when the component is unmounted
    return () => {
      document.head.removeChild(link);
    };
  }, [href]);

  return null; // This component does not render anything visible
};

export default LoadCSSFile;