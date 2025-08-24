import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  History as HistoryIcon, 
  ArrowLeft, 
  MapPin, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import BottomNavigation from '@/components/ui/BottomNavigation';

interface EmergencySession {
  id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  location_lat: number | null;
  location_lng: number | null;
  notes: string | null;
  created_at: string;
}

const History = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<EmergencySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  useEffect(() => {
    if (user) {
      fetchEmergencyHistory();
    }
  }, [user]);

  const fetchEmergencyHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('emergency_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching emergency history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const formatDuration = (startTime: string, endTime?: string | null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000 / 60); // minutes
    
    if (duration < 60) {
      return `${duration} min`;
    } else {
      const hours = Math.floor(duration / 60);
      const mins = duration % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'destructive';
      case 'resolved':
        return 'secondary';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <AlertTriangle className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    return session.status.toLowerCase() === filter;
  });

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
                <HistoryIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Emergency History</h1>
                <p className="text-sm text-muted-foreground">Your SOS activity timeline</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Filter Buttons */}
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({sessions.length})
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Active ({sessions.filter(s => s.status === 'active').length})
          </Button>
          <Button
            variant={filter === 'resolved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('resolved')}
          >
            Resolved ({sessions.filter(s => s.status === 'resolved').length})
          </Button>
        </div>

        {/* History Timeline */}
        {filteredSessions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Emergency History
              </h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'all' 
                  ? "You haven't triggered any emergency alerts yet"
                  : `No ${filter} emergency sessions found`
                }
              </p>
              <Button 
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-trust hover:opacity-90"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              const { date, time } = formatDate(session.created_at);
              const duration = formatDuration(session.started_at, session.ended_at);
              
              return (
                <Card key={session.id} className="shadow-elegant">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(session.status)}
                        <div>
                          <h3 className="font-semibold text-foreground">
                            Emergency Session
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {date} at {time}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">{duration}</span>
                      </div>
                      
                      {session.location_lat && session.location_lng && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Location:</span>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-primary"
                            onClick={() => navigate('/map', { 
                              state: { 
                                lat: session.location_lat, 
                                lng: session.location_lng 
                              } 
                            })}
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            View on Map
                          </Button>
                        </div>
                      )}

                      {session.ended_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Ended:</span>
                          <span className="font-medium">
                            {formatDate(session.ended_at).time}
                          </span>
                        </div>
                      )}

                      {session.notes && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            <strong>Notes:</strong> {session.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 mt-4">
                      {session.location_lat && session.location_lng && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/map', { 
                            state: { 
                              lat: session.location_lat, 
                              lng: session.location_lng 
                            } 
                          })}
                          className="flex-1"
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          View Location
                        </Button>
                      )}
                      
                      {session.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            // Mark as resolved
                            const { error } = await supabase
                              .from('emergency_sessions')
                              .update({ 
                                status: 'resolved', 
                                ended_at: new Date().toISOString() 
                              })
                              .eq('id', session.id);
                            
                            if (!error) {
                              fetchEmergencyHistory();
                            }
                          }}
                          className="flex-1"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default History;