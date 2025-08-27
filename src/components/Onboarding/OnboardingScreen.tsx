import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Users, MapPin, Camera, Clock, Heart } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Shield,
      title: "Welcome to Raksha Bandhan",
      subtitle: "Your personal safety companion",
      description: "Designed specifically for women's safety with instant emergency response features.",
      gradient: "bg-gradient-hero"
    },
    {
      icon: Heart,
      title: "Emergency SOS",
      subtitle: "One tap for instant help",
      description: "Long press the SOS button to instantly alert your emergency contacts with your location.",
      gradient: "bg-gradient-emergency"
    },
    {
      icon: Users,
      title: "Trusted Contacts",
      subtitle: "Your safety network",
      description: "Add family and friends who will be notified immediately during emergencies.",
      gradient: "bg-gradient-trust"
    },
    {
      icon: MapPin,
      title: "Live Location Tracking",
      subtitle: "Always stay connected",
      description: "Share your real-time location with trusted contacts when you're traveling alone.",
      gradient: "bg-gradient-safe"
    },
    {
      icon: Camera,
      title: "Smart Recording",
      subtitle: "Evidence collection",
      description: "Automatic audio and image capture during SOS to ensure your safety and security.",
      gradient: "bg-gradient-protection"
    },
    {
      icon: Clock,
      title: "Safety Timer",
      subtitle: "Check-in reminders",
      description: "Set timers for your journeys. We'll check on you and alert contacts if needed.",
      gradient: "bg-gradient-confidence"
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];
  const IconComponent = step.icon;

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl bg-surface-elevated/80 backdrop-blur-xl">
          <CardContent className="p-8 text-center space-y-8">
            {/* Progress Indicator */}
            <div className="flex justify-center space-x-2 mb-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep 
                      ? 'w-8 bg-primary' 
                      : index < currentStep 
                        ? 'w-2 bg-primary/60' 
                        : 'w-2 bg-border'
                  }`}
                />
              ))}
            </div>

            {/* Icon */}
            <div className={`w-24 h-24 mx-auto rounded-3xl ${step.gradient} flex items-center justify-center shadow-lg animate-float`}>
              <IconComponent className="w-12 h-12 text-white" />
            </div>

            {/* Content */}
            <div className="space-y-4 animate-slide-in-up">
              <h1 className="text-2xl font-bold text-foreground">
                {step.title}
              </h1>
              <h2 className="text-lg font-medium text-primary">
                {step.subtitle}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {currentStep === 0 ? '' : 'Previous'}
              </Button>

              <Button
                onClick={nextStep}
                className="px-8 py-3 bg-gradient-primary hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </div>

            {/* Skip Option */}
            {currentStep < steps.length - 1 && (
              <Button
                variant="link"
                onClick={onComplete}
                className="text-muted-foreground hover:text-foreground"
              >
                Skip Tutorial
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingScreen;