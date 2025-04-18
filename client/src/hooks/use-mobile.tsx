import { useState, useEffect } from 'react';

export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Initial check
    checkIfMobile();
    
    // Add event listener for resize events
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up event listener
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  function checkIfMobile() {
    setIsMobile(window.innerWidth < 768);
  }

  return isMobile;
}
