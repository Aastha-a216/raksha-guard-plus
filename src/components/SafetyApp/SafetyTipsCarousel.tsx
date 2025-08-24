import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';

const SafetyTipsCarousel = () => {
  const [currentTip, setCurrentTip] = useState(0);

  const safetyTips = [
    {
      title: "Share Your Location",
      content: "Always let someone know where you're going and when you expect to arrive.",
      icon: "📍"
    },
    {
      title: "Trust Your Instincts",
      content: "If something feels wrong, it probably is. Don't hesitate to leave or ask for help.",
      icon: "🧠"
    },
    {
      title: "Stay Alert",
      content: "Avoid distractions like headphones or phones when walking alone, especially at night.",
      icon: "👁️"
    },
    {
      title: "Emergency Contacts",
      content: "Keep your emergency contacts updated and make sure they know how to reach you.",
      icon: "📞"
    },
    {
      title: "Well-Lit Areas",
      content: "Stick to well-lit, populated areas when possible, especially during nighttime.",
      icon: "💡"
    },
    {
      title: "Backup Plans",
      content: "Always have a backup plan and alternative routes to your destination.",
      icon: "🗺️"
    },
    {
      title: "Regular Check-ins",
      content: "Use the safety timer feature to automatically alert contacts if you don't check in.",
      icon: "⏰"
    },
    {
      title: "Safe Transportation",
      content: "Use trusted transportation services and verify vehicle details before getting in.",
      icon: "🚗"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % safetyTips.length);
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(interval);
  }, [safetyTips.length]);

  const nextTip = () => {
    setCurrentTip((prev) => (prev + 1) % safetyTips.length);
  };

  const prevTip = () => {
    setCurrentTip((prev) => (prev - 1 + safetyTips.length) % safetyTips.length);
  };

  const tip = safetyTips[currentTip];

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-warning" />
          <span>Safety Tips</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="text-center space-y-4 min-h-[120px] flex flex-col justify-center">
            <div className="text-4xl">{tip.icon}</div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{tip.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{tip.content}</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevTip}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Dots Indicator */}
            <div className="flex space-x-2">
              {safetyTips.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTip(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentTip 
                      ? 'bg-primary' 
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={nextTip}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SafetyTipsCarousel;