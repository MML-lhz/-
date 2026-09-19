import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowContent(true), 100);

    const duration = 1500;
    const steps = 60;
    const interval = duration / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min((currentStep / steps) * 100, 100);
      setProgress(newProgress);
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          onComplete();
        }, 300);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-indigo-700">
      <div className={`transform transition-all duration-500 ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <div className="relative">
          <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
            <span className="text-4xl font-bold text-primary-600">校</span>
          </div>
          <div className="absolute -inset-1 bg-white/20 rounded-2xl blur-xl -z-10 animate-pulse"></div>
        </div>
      </div>

      <div className={`mt-8 text-center transform transition-all duration-500 delay-200 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="text-3xl font-bold text-white tracking-wide">校园服务</h1>
        <p className="text-white/80 text-sm mt-2 tracking-wider">CAMPUS SERVICE</p>
      </div>

      <div className={`mt-12 w-48 transform transition-all duration-500 delay-300 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-white/60 text-xs text-center mt-2">{Math.round(progress)}%</p>
      </div>

      <div className={`absolute bottom-12 text-center transform transition-all duration-500 delay-400 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-white/40 text-xs">Version 1.0.0</p>
      </div>
    </div>
  );
}