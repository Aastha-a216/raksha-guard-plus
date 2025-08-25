import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  History, 
  Settings, 
  MapPin, 
  ChevronRight,
  AlertTriangle,
  Camera,
  Mic
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import EmergencyButton from '@/components/SafetyApp/EmergencyButton';
import SafetyTimer from '@/components/SafetyApp/SafetyTimer';
import SafetyTipsCarousel from '@/components/SafetyApp/SafetyTipsCarousel';
import BottomNavigation from '@/components/ui/BottomNavigation';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
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
      // Auto-capture both audio and image for comprehensive emergency recording
      await Promise.all([
        captureAudio(sessionId),
        captureImage(sessionId)
      ]);
    } catch (error) {
      console.error('Error starting media capture:', error);
    }
  };

  const captureAudio = async (sessionId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
          .upload(`recordings/${fileName}`, blob, {
            cacheControl: '3600',
            upsert: false
          });

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
              duration_seconds: 30,
              mime_type: blob.type
            });
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
      }, 30000);

    } catch (error) {
      console.error('Error capturing audio:', error);
    }
  };

  const captureImage = async (sessionId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const fileName = `emergency-image-${Date.now()}.jpg`;
            
            const { error: uploadError } = await supabase.storage
              .from('suraksha')
              .upload(`recordings/${fileName}`, blob, {
                cacheControl: '3600',
                upsert: false
              });

            if (!uploadError) {
              await supabase
                .from('emergency_recordings')
                .insert({
                  emergency_session_id: sessionId,
                  user_id: user?.id,
                  file_name: fileName,
                  file_path: `recordings/${fileName}`,
                  recording_type: 'image',
                  file_size: blob.size,
                  mime_type: blob.type
                });
            }
          }
          stream.getTracks().forEach(track => track.stop());
        }, 'image/jpeg', 0.8);
      });

    } catch (error) {
      console.error('Error capturing image:', error);
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
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header with Premium Design */}
        <div className="flex items-center justify-between p-6 bg-card rounded-2xl shadow-lg border border-border/50">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Welcome back, {userProfile?.name || 'User'}
            </h1>
            <p className="text-muted-foreground text-lg">Stay safe and connected 🛡️</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="hover:bg-primary/10 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>

        {/* Emergency Alert Section - Enhanced */}
        <Card className="border-emergency/20 bg-gradient-to-br from-emergency/5 via-emergency/10 to-emergency/5 shadow-emergency/20 shadow-xl">
          <CardContent className="p-8">
            <div className="text-center space-y-8">
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-emergency flex items-center justify-center gap-2">
                  <Shield className="h-8 w-8" />
                  Emergency Alert
                </h2>
                <p className="text-muted-foreground text-lg">
                  Hold the SOS button for 3 seconds to activate emergency protocols
                </p>
              </div>
              
              <EmergencyButton onEmergencyActivate={handleEmergencyActivate} />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex flex-col items-center space-y-2 p-4 bg-safe/10 rounded-xl border border-safe/20">
                  <div className="w-3 h-3 bg-safe rounded-full animate-pulse"></div>
                  <span className="font-medium text-safe">Location Tracking</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Continuous GPS monitoring
                  </span>
                </div>
                <div className="flex flex-col items-center space-y-2 p-4 bg-trust/10 rounded-xl border border-trust/20">
                  <div className="w-3 h-3 bg-trust rounded-full animate-pulse"></div>
                  <span className="font-medium text-trust">Contact Alerts</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Instant emergency notifications
                  </span>
                </div>
                <div className="flex flex-col items-center space-y-2 p-4 bg-warning/10 rounded-xl border border-warning/20">
                  <div className="w-3 h-3 bg-warning rounded-full animate-pulse"></div>
                  <span className="font-medium text-warning">Media Capture</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Audio & image recording
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety Timer */}
        <SafetyTimer />

        {/* Quick Actions - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 bg-gradient-to-br from-trust/5 to-trust/10 border-trust/20" onClick={() => navigate('/emergency-contacts')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-trust/20 rounded-xl group-hover:bg-trust/30 transition-colors">
                  <Users className="h-7 w-7 text-trust" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Contacts</h3>
                  <p className="text-sm text-muted-foreground">
                    {userProfile?.emergency_contacts?.length || 0} contacts added
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 bg-gradient-to-br from-safe/5 to-safe/10 border-safe/20" onClick={() => navigate('/history')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-safe/20 rounded-xl group-hover:bg-safe/30 transition-colors">
                  <History className="h-7 w-7 text-safe" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">History</h3>
                  <p className="text-sm text-muted-foreground">
                    View safety activity log
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20" onClick={() => navigate('/map-view')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-accent/20 rounded-xl group-hover:bg-accent/30 transition-colors">
                  <MapPin className="h-7 w-7 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Live Map</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time location view
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Last SOS Activity */}
        {lastSosActivity && (
          <Card className="border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-warning">
                <AlertTriangle className="w-6 h-6" />
                <span>Last Emergency Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <Badge variant={lastSosActivity.status === 'active' ? 'destructive' : 'secondary'} className="px-3 py-1">
                    {lastSosActivity.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Date</span>
                  <span className="text-sm font-medium">
                    {new Date(lastSosActivity.created_at).toLocaleDateString()}
                  </span>
                </div>
                {lastSosActivity.location_lat && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Location</span>
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={() => navigate('/map-view')}
                      className="p-0 h-auto text-primary hover:text-primary/80"
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
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Dashboard;