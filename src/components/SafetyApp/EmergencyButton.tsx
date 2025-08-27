import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Heart, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface EmergencyButtonProps {
  onEmergencyActivate: () => void;
}

const EmergencyButton = ({ onEmergencyActivate }: EmergencyButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = useState(3);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPressed && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            handleEmergencyActivate();
            setIsPressed(false);
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPressed, countdown]);

  const handleMouseDown = () => {
    setIsPressed(true);
    setCountdown(3);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    setCountdown(3);
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleEmergencyActivate = () => {
    setIsPressed(false);
    setCountdown(3);
    onEmergencyActivate();

    toast({
      title: "🚨 Emergency Alert Activated",
      description: "Your emergency contacts have been notified and location tracking is active",
    });
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="relative">
        {/* Outer protective rings */}
        <div className={`absolute inset-[-40px] rounded-full ${isPressed ? 'animate-sos-ripple' : ''}`}>
          <div className="w-full h-full rounded-full border-2 border-emergency/20 bg-emergency/5"></div>
        </div>
        <div className={`absolute inset-[-20px] rounded-full ${isPressed ? 'animate-sos-ripple' : ''} animation-delay-300`}>
          <div className="w-full h-full rounded-full border-3 border-emergency/30 bg-emergency/10"></div>
        </div>
        
        {/* Main SOS Button - Enhanced for Women's Safety */}
        <Button
          className={`
            w-40 h-40 rounded-full bg-gradient-emergency shadow-2xl
            border-4 border-white/30 backdrop-blur-sm
            flex flex-col items-center justify-center
            transition-all duration-500 hover:scale-105
            ${isPressed ? 'sos-pulse animate-sos-glow scale-110 shadow-emergency' : 'hover:shadow-xl hover:shadow-emergency/50'}
            active:scale-95 relative overflow-hidden
          `}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 bg-white/10 rounded-full opacity-50"></div>
          
          {/* Icons */}
          <div className="relative z-10 flex flex-col items-center">
            {isPressed ? (
              <Heart className="w-14 h-14 mb-2 text-white animate-pulse" />
            ) : (
              <Shield className="w-14 h-14 mb-2 text-white" />
            )}
            <span className="text-xl font-bold text-white tracking-wider">SOS</span>
          </div>
        </Button>
      </div>
      
      {/* Enhanced Instructions */}
      <div className="text-center space-y-3 max-w-sm">
        {isPressed ? (
          <div className="space-y-3 animate-slide-in-up">
            <div className="text-4xl font-bold text-emergency animate-pulse">
              {countdown}
            </div>
            <p className="text-base font-medium text-emergency">
              Activating Emergency Response...
            </p>
            <p className="text-sm text-muted-foreground">
              Release to cancel • Help is on the way
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-emergency flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Emergency SOS
            </h3>
            <p className="text-base text-foreground font-medium">
              Hold for 3 seconds to activate
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Instantly alerts your emergency contacts with location, starts recording, and notifies authorities
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyButton;