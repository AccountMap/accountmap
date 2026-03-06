import React, { useState } from "react";
import NavButton from "./NavButton";
import SeriousIcons from "../SeriousIcons";

/** Circular spinner for loading state */
const SpinnerIcon = ({ className = "" }) => (
  <span className={`inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ${className}`} aria-hidden />
);

const AnalyzeButton = ({ onResult }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    onResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analyze`);
      const data = await response.text();
      if (!response.ok && data.includes("Someone used Gemini API keys already")) {
        onResult(data);
        return;
      }
      if (!response.ok) {
        onResult(data || `Error: ${response.status}`);
        return;
      }
      onResult(data);
    } catch (err) {
      onResult(`Error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <NavButton
      onClick={handleAnalyze}
      disabled={isAnalyzing}
      icon={isAnalyzing ? SpinnerIcon : SeriousIcons.Sparkle}
      label="AI Analyze"
      subtext="Run pattern analysis on your map."
      colorClass={isAnalyzing ? "bg-blue-600/10" : "bg-white/5"}
      iconColor="text-blue-400"
    />
  );
};

export default AnalyzeButton;