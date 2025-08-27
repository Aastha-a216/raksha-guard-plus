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
        {/* Header with Elegant Design */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-10 rounded-3xl"></div>
          <div className="relative flex items-center justify-between p-8 bg-surface-elevated/80 backdrop-blur-xl rounded-3xl shadow-xl border border-border/30">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gradient-hero">
                Welcome back, {userProfile?.name || 'Sister'}
              </h1>
              <p className="text-muted-foreground text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                You're protected and connected
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
              className="hover:bg-primary/10 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <Settings className="h-6 w-6 text-primary" />
            </Button>
          </div>
        </div>

        {/* Emergency Center - Redesigned for Trust */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-emergency opacity-5 rounded-3xl"></div>
          <Card className="relative border-emergency/30 bg-surface-elevated/90 backdrop-blur-xl shadow-2xl shadow-emergency/10">
            <CardContent className="p-10">
              <div className="text-center space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-emergency rounded-full animate-pulse"></div>
                    <h2 className="text-3xl font-bold text-emergency">Emergency Response Center</h2>
                    <div className="w-2 h-2 bg-emergency rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                    Your safety is our priority. One press connects you instantly to your trusted network with location tracking and evidence collection.
                  </p>
                </div>
                
                <EmergencyButton onEmergencyActivate={handleEmergencyActivate} />
                
                {/* Safety Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="group p-6 bg-safe/10 hover:bg-safe/20 rounded-2xl border border-safe/20 hover:border-safe/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-12 h-12 bg-safe/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MapPin className="w-6 h-6 text-safe" />
                      </div>
                      <span className="font-semibold text-safe text-lg">Live Location</span>
                      <span className="text-sm text-muted-foreground text-center leading-relaxed">
                        Real-time GPS tracking shared with your emergency contacts
                      </span>
                    </div>
                  </div>
                  
                  <div className="group p-6 bg-trust/10 hover:bg-trust/20 rounded-2xl border border-trust/20 hover:border-trust/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-12 h-12 bg-trust/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6 text-trust" />
                      </div>
                      <span className="font-semibold text-trust text-lg">Instant Alerts</span>
                      <span className="text-sm text-muted-foreground text-center leading-relaxed">
                        Immediate notifications to all your trusted contacts
                      </span>
                    </div>
                  </div>
                  
                  <div className="group p-6 bg-protection/10 hover:bg-protection/20 rounded-2xl border border-protection/20 hover:border-protection/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-12 h-12 bg-protection/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6 text-protection" />
                      </div>
                      <span className="font-semibold text-protection text-lg">Smart Recording</span>
                      <span className="text-sm text-muted-foreground text-center leading-relaxed">
                        Automatic audio and visual evidence collection
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Safety Timer */}
        <SafetyTimer />

        {/* Quick Actions - Enhanced with Modern Design */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-foreground">Safety Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="group hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 bg-gradient-to-br from-trust/5 via-trust/10 to-trust/15 border-trust/30 hover:border-trust/50 animate-float" 
                  onClick={() => navigate('/emergency-contacts')}
                  style={{ animationDelay: '0s' }}>
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-6 bg-trust/20 rounded-3xl group-hover:bg-trust/30 group-hover:scale-110 transition-all duration-300 shadow-lg">
                    <Users className="h-8 w-8 text-trust" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-trust">Trusted Contacts</h3>
                    <p className="text-sm text-muted-foreground">
                      {userProfile?.emergency_contacts?.length || 0} contacts ready to help
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <ChevronRight className="w-4 h-4 text-trust/60 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 bg-gradient-to-br from-safe/5 via-safe/10 to-safe/15 border-safe/30 hover:border-safe/50 animate-float" 
                  onClick={() => navigate('/history')}
                  style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-6 bg-safe/20 rounded-3xl group-hover:bg-safe/30 group-hover:scale-110 transition-all duration-300 shadow-lg">
                    <History className="h-8 w-8 text-safe" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-safe">Safety History</h3>
                    <p className="text-sm text-muted-foreground">
                      Track your safety activities
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <ChevronRight className="w-4 h-4 text-safe/60 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 bg-gradient-to-br from-protection/5 via-protection/10 to-protection/15 border-protection/30 hover:border-protection/50 animate-float" 
                  onClick={() => navigate('/map-view')}
                  style={{ animationDelay: '0.4s' }}>
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-6 bg-protection/20 rounded-3xl group-hover:bg-protection/30 group-hover:scale-110 transition-all duration-300 shadow-lg">
                    <MapPin className="h-8 w-8 text-protection" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-protection">Live Location</h3>
                    <p className="text-sm text-muted-foreground">
                      Real-time tracking & sharing
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <ChevronRight className="w-4 h-4 text-protection/60 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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