import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  ArrowLeft, 
  Navigation, 
  Crosshair,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import BottomNavigation from '@/components/ui/BottomNavigation';

const MapView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationHistory, setLocationHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If location is passed from history, show that location
    if (location.state?.lat && location.state?.lng) {
      setSelectedLocation({
        lat: location.state.lat,
        lng: location.state.lng
      });
    }

    // Get current location
    getCurrentLocation();
    
    // Fetch location history
    if (user) {
      fetchLocationHistory();
    }
  }, [location.state, user]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          if (!selectedLocation) {
            setSelectedLocation({ lat: latitude, lng: longitude });
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setLoading(false);
    }
  };

  const fetchLocationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('location_tracking')
        .select(`
          *,
          emergency_sessions (
            id,
            status,
            created_at
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLocationHistory(data || []);
    } catch (error) {
      console.error('Error fetching location history:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
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
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-trust rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Location Tracking</h1>
                <p className="text-sm text-muted-foreground">View your location history</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Current Location Card */}
        {currentLocation && (
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crosshair className="w-5 h-5 text-safe" />
                <span>Current Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Latitude:</strong> {currentLocation.lat.toFixed(6)}
                </p>
                <p className="text-sm">
                  <strong>Longitude:</strong> {currentLocation.lng.toFixed(6)}
                </p>
                <div className="flex space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLocation(currentLocation)}
                    className="flex-1"
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    Center Map
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`;
                      window.open(url, '_blank');
                    }}
                    className="flex-1"
                  >
                    Open in Maps
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map Placeholder */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Map View</CardTitle>
            <CardDescription>
              {selectedLocation 
                ? `Showing location: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`
                : 'No location selected'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  Interactive map would be displayed here
                </p>
                <p className="text-sm text-muted-foreground">
                  This would show your current location and emergency tracking history
                </p>
                {selectedLocation && (
                  <div className="mt-4 p-3 bg-background rounded border">
                    <p className="text-sm">
                      <strong>Selected Coordinates:</strong><br />
                      {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location History */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Location History</span>
            </CardTitle>
            <CardDescription>
              Recent location tracking from emergency sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {locationHistory.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No location history available</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {locationHistory.map((location, index) => (
                  <div
                    key={location.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => setSelectedLocation({
                      lat: location.latitude,
                      lng: location.longitude
                    })}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm font-medium">
                          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(location.timestamp)}
                      </p>
                      {location.accuracy && (
                        <p className="text-xs text-muted-foreground">
                          Accuracy: ±{Math.round(location.accuracy)}m
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {currentLocation && (
                        <span className="text-xs text-muted-foreground">
                          {calculateDistance(
                            currentLocation.lat,
                            currentLocation.lng,
                            location.latitude,
                            location.longitude
                          ).toFixed(1)}km away
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        Emergency
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Services Info */}
        <Card className="bg-safe/5 border-safe/20">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-medium">Location Privacy</h4>
                <p className="text-sm text-muted-foreground">
                  Your location data is only tracked during emergency alerts and is stored securely. 
                  You can view and manage your location history here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default MapView;