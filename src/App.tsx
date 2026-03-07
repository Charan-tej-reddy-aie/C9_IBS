import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import PPIPredictor from './sections/PPIPredictor';

gsap.registerPlugin(ScrollTrigger);

function App() {
  useEffect(() => {
    // Set document language
    document.documentElement.lang = 'en';

    // Refresh ScrollTrigger after all content is loaded
    const handleLoad = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener('load', handleLoad);

    // Also refresh after a short delay to ensure images are loaded
    const refreshTimeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 500);

    return () => {
      window.removeEventListener('load', handleLoad);
      clearTimeout(refreshTimeout);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0f1115]">
      {/* PPI Predictor - Main Application */}
      <PPIPredictor />
    </div>
  );
}

export default App;
