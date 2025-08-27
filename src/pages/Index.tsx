import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from './Dashboard';
import AuthPage from './AuthPage';
import OnboardingScreen from '@/components/Onboarding/OnboardingScreen';

const Index = () => {
  const { user, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (user && !hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user && showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return user ? <Dashboard /> : <AuthPage />;
};

export default Index;
