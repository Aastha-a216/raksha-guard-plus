import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Users, 
  History, 
  Settings, 
  Phone, 
  MapPin, 
  Timer,
  ChevronRight,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import EmergencyButton from '@/components/SafetyApp/EmergencyButton';
import SafetyTimer from '@/components/SafetyApp/SafetyTimer';
import SafetyTipsCarousel from '@/components/SafetyApp/SafetyTipsCarousel';
import BottomNavigation from '@/components/ui/BottomNavigation';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const [lastSosActivity, setLastSosActivity] = useState<any>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch last SOS activity
      const { data: lastSos } = await supabase
        .from('emergency_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setLastSosActivity(lastSos);

      // Get emergency contacts from profile
      if (userProfile?.emergency_contacts) {
        setEmergencyContacts(userProfile.emergency_contacts);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyActivate = async () => {
    try {
      // Get current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          // Create emergency session
          const { data: session, error } = await supabase
            .from('emergency_sessions')
            .insert({
              user_id: user?.id,
              location_lat: latitude,
              location_lng: longitude,
              accuracy,
              emergency_contacts: userProfile?.emergency_contacts || [],
              status: 'active'
            })
            .select()
            .single();

          if (error) throw error;

          // Start location tracking
          startLocationTracking(session.id);

          // Trigger media capture
          startMediaCapture(session.id);
        });
      }
    } catch (error) {
      console.error('Error activating emergency:', error);
    }
  };

  const startLocationTracking = (sessionId: string) => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, accuracy, speed, heading } = position.coords;
          
          await supabase
            .from('location_tracking')
            .insert({
              emergency_session_id: sessionId,
              latitude,
              longitude,
              accuracy,
              speed,
              heading
            });
        },
        (error) => console.error('Location tracking error:', error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );

      // Store watchId for cleanup
      sessionStorage.setItem('locationWatchId', watchId.toString());
    }
  };

  const startMediaCapture = async (sessionId: string) => {
    try {
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });

      // Create MediaRecorder for audio
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const fileName = `emergency-audio-${Date.now()}.webm`;
        
        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('suraksha')
          .upload(`recordings/${fileName}`, blob);

        if (!uploadError) {
          // Save recording metadata
          await supabase
            .from('emergency_recordings')
            .insert({
              emergency_session_id: sessionId,
              user_id: user?.id,
              file_name: fileName,
              file_path: `recordings/${fileName}`,
              recording_type: 'audio',
              file_size: blob.size,
              duration_seconds: 30, // Approximate
              mime_type: blob.type
            });
        }
      };

      // Start recording
      mediaRecorder.start();

      // Stop recording after 30 seconds
      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
      }, 30000);

    } catch (error) {
      console.error('Error starting media capture:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-trust rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Welcome back, {userProfile?.name || 'User'}
                </h1>
                <p className="text-sm text-muted-foreground">Stay safe today</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/settings')}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Emergency Button Section */}
        <Card className="shadow-elegant">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Emergency Alert</h2>
              <p className="text-muted-foreground">
                Press and hold for 3 seconds to activate emergency alert
              </p>
              <EmergencyButton onEmergencyActivate={handleEmergencyActivate} />
            </div>
          </CardContent>
        </Card>

        {/* Safety Timer */}
        <SafetyTimer />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => navigate('/emergency-contacts')}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-safe rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Contacts</h3>
                  <p className="text-sm text-muted-foreground">
                    {emergencyContacts.length} emergency contacts
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => navigate('/history')}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-trust rounded-lg flex items-center justify-center">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">History</h3>
                  <p className="text-sm text-muted-foreground">
                    Activity logs
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Last SOS Activity */}
        {lastSosActivity && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <span>Last Emergency Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={lastSosActivity.status === 'active' ? 'destructive' : 'secondary'}>
                    {lastSosActivity.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="text-sm">
                    {new Date(lastSosActivity.created_at).toLocaleDateString()}
                  </span>
                </div>
                {lastSosActivity.location_lat && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Location</span>
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={() => navigate('/map')}
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      View on Map
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Safety Tips */}
        <SafetyTipsCarousel />
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Dashboard;