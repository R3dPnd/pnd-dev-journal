import { useEffect, useState } from "react";

// Custom hook to check if a media query matches
export const useToggle = (value: boolean): boolean => {
    const [toggleValue, setToggleValue] = useState(value);
  
    useEffect(() => {
      

    });
    
    return toggleValue;
  };