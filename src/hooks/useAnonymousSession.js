// hooks/useAnonymousSession.js
import { useState, useEffect } from "react";

export const useAnonymousSession = () => {
  const [anonymousId, setAnonymousId] = useState(null);

  useEffect(() => {
    // Get or create anonymous ID from localStorage
    const getOrCreateAnonymousId = () => {
      let id = localStorage.getItem("anonymousSurveyId");

      if (!id) {
        // Create a new anonymous ID
        id =
          "anon_" +
          Math.random().toString(36).substring(2, 12) +
          "_" +
          Date.now().toString(36);
        localStorage.setItem("anonymousSurveyId", id);
      }

      setAnonymousId(id);
      return id;
    };

    getOrCreateAnonymousId();
  }, []);

  return anonymousId;
};
