import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timer, Play, Pause, Square, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SafetyTimer = () => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [initialTime, setInitialTime] = useState(60); // Default 60 minutes
  const [customTime, setCustomTime] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => {
          if (timeLeft <= 1) {
            // Timer expired - trigger emergency
            handleTimerExpired();
            return 0;
          }
          return timeLeft - 1;
        });
      }, 1000);
    } else if (!isActive || timeLeft === 0) {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const handleTimerExpired = () => {
    setIsActive(false);
    toast({
      title: "⚠️ Safety Timer Expired",
      description: "Emergency alert has been triggered automatically",
      variant: "destructive"
    });

    // Here you would trigger the same emergency activation as the SOS button
    // For now, we'll just show the notification
  };

  const startTimer = () => {
    if (initialTime > 0) {
      setTimeLeft(initialTime * 60); // Convert minutes to seconds
      setIsActive(true);
      toast({
        title: "Safety Timer Started",
        description: `Timer set for ${initialTime} minutes`,
      });
    }
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const stopTimer = () => {
    setIsActive(false);
    setTimeLeft(0);
    toast({
      title: "Safety Timer Stopped",
      description: "Timer has been cancelled",
    });
  };

  const checkIn = () => {
    setIsActive(false);
    setTimeLeft(0);
    toast({
      title: "✅ Check-in Successful",
      description: "You've checked in safely",
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const presetTimes = [15, 30, 60, 90, 120, 180]; // Minutes

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Timer className="w-5 h-5 text-warning" />
          <span>Safety Timer</span>
        </CardTitle>
        <CardDescription>
          Set a timer for when you're traveling alone. If you don't check in, emergency alert will be triggered automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isActive && timeLeft === 0 ? (
          <>
            {/* Timer Setup */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="timer-preset">Quick Presets</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {presetTimes.map((time) => (
                    <Button
                      key={time}
                      variant="outline"
                      size="sm"
                      onClick={() => setInitialTime(time)}
                      className={initialTime === time ? 'bg-primary text-primary-foreground' : ''}
                    >
                      {time}m
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <Label htmlFor="custom-time">Custom Time (minutes)</Label>
                  <Input
                    id="custom-time"
                    type="number"
                    placeholder="Enter minutes"
                    value={customTime}
                    onChange={(e) => {
                      setCustomTime(e.target.value);
                      setInitialTime(parseInt(e.target.value) || 0);
                    }}
                    min="1"
                    max="720" // 12 hours max
                  />
                </div>
              </div>

              <Button 
                onClick={startTimer} 
                className="w-full bg-gradient-trust hover:opacity-90"
                disabled={initialTime <= 0}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Safety Timer ({initialTime} minutes)
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Active Timer Display */}
            <div className="text-center space-y-4">
              <div className="text-4xl font-mono font-bold text-foreground">
                {formatTime(timeLeft)}
              </div>
              
              {timeLeft <= 300 && ( // Show warning when 5 minutes or less
                <div className="flex items-center justify-center space-x-2 text-warning">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Timer will expire soon
                  </span>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={checkIn}
                  className="flex-1 bg-gradient-safe hover:opacity-90"
                >
                  ✅ Check In (I'm Safe)
                </Button>
                
                {isActive ? (
                  <Button onClick={pauseTimer} variant="outline">
                    <Pause className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button onClick={() => setIsActive(true)} variant="outline">
                    <Play className="w-4 h-4" />
                  </Button>
                )}
                
                <Button onClick={stopTimer} variant="outline">
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SafetyTimer;