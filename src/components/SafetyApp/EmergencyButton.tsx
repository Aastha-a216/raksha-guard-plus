import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmergencyButtonProps {
  onEmergencyActivate: () => void;
}

const EmergencyButton = ({ onEmergencyActivate }: EmergencyButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleMouseDown = () => {
    setIsPressed(true);
    setProgress(0);
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          handleEmergencyActivate();
          return 100;
        }
        return prev + (100 / 30); // 3 seconds = 30 intervals of 100ms
      });
    }, 100);

    const holdTimeout = setTimeout(() => {
      clearInterval(timer);
    }, 3000);

    setHoldTimer(holdTimeout);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    setProgress(0);
    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }
  };

  const handleEmergencyActivate = () => {
    setIsPressed(false);
    setProgress(0);
    onEmergencyActivate();

    toast({
      title: "🚨 Emergency Alert Activated",
      description: "Your emergency contacts have been notified and location tracking is active",
    });

    // Visual feedback
    setTimeout(() => setIsPressed(false), 2000);
  };

  return (
    <div className="relative flex flex-col items-center space-y-4">
      <div className="relative">
        <Button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className={`
            relative h-32 w-32 rounded-full bg-gradient-emergency text-emergency-foreground
            shadow-emergency transition-all duration-300 hover:scale-105
            ${isPressed ? 'sos-pulse scale-110' : 'animate-sos-glow'}
            border-4 border-emergency-glow/30
          `}
        >
          <div className="flex flex-col items-center space-y-1">
            <Shield className="h-10 w-10" />
            <span className="text-lg font-bold">SOS</span>
          </div>
        </Button>

        {/* Progress Ring */}
        {isPressed && (
          <div className="absolute inset-0 rounded-full">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="46"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="46"
                stroke="white"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 46}`}
                strokeDashoffset={`${2 * Math.PI * 46 * (1 - progress / 100)}`}
                className="transition-all duration-100 ease-out"
              />
            </svg>
          </div>
        )}

        {/* Ripple effect rings */}
        <div className="absolute inset-0 rounded-full border-2 border-emergency/30 animate-sos-ripple pointer-events-none" />
        <div className="absolute inset-0 rounded-full border-2 border-emergency/20 animate-sos-ripple pointer-events-none" style={{ animationDelay: '0.5s' }} />
      </div>
      
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">
          Hold for Emergency
        </p>
        <p className="text-xs text-muted-foreground">
          Activates location tracking & alerts contacts
        </p>
      </div>
    </div>
  );
};

export default EmergencyButton;