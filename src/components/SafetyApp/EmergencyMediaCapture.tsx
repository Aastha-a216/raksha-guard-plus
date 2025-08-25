import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Mic, Square, Play, Pause, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmergencyMediaCaptureProps {
  sessionId: string;
  userId: string;
  onMediaCaptured?: (mediaData: any) => void;
  isActive: boolean;
}

const EmergencyMediaCapture = ({ 
  sessionId, 
  userId, 
  onMediaCaptured, 
  isActive 
}: EmergencyMediaCaptureProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'audio' | 'video'>('audio');
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isActive) {
      // Auto-start audio recording when emergency is activated
      startRecording('audio');
    }
    
    return () => {
      stopRecording();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  const startRecording = async (type: 'audio' | 'video') => {
    try {
      const constraints = type === 'video' 
        ? { video: true, audio: true }
        : { audio: true };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setRecordingType(type);

      if (type === 'video' && videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { 
          type: type === 'video' ? 'video/webm' : 'audio/webm' 
        });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        saveRecording(blob, type);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Auto-stop after 30 seconds for emergency recording
      if (isActive) {
        setTimeout(() => {
          stopRecording();
        }, 30000);
      }

      toast({
        title: `${type === 'video' ? 'Video' : 'Audio'} Recording Started`,
        description: "Emergency recording is now active",
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not access camera/microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const saveRecording = async (blob: Blob, type: 'audio' | 'video') => {
    try {
      const fileName = `emergency-${type}-${Date.now()}.webm`;
      const filePath = `recordings/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('suraksha')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('suraksha')
        .getPublicUrl(filePath);

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('emergency_recordings')
        .insert({
          emergency_session_id: sessionId,
          user_id: userId,
          file_name: fileName,
          file_path: filePath,
          recording_type: type,
          file_size: blob.size,
          duration_seconds: recordingTime,
          mime_type: blob.type
        });

      if (dbError) {
        throw dbError;
      }

      const mediaData = {
        id: fileName,
        type,
        url: urlData.publicUrl,
        fileName,
        timestamp: new Date().toISOString(),
        duration: recordingTime,
        size: blob.size
      };

      onMediaCaptured?.(mediaData);

      toast({
        title: "Recording Saved",
        description: `${type === 'video' ? 'Video' : 'Audio'} recording has been saved securely`,
      });

    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: "Save Error",
        description: "Failed to save recording",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-emergency/20 bg-gradient-to-br from-emergency/5 to-emergency/10">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-emergency">
              Emergency Recording
            </h3>
            {isRecording && (
              <div className="flex items-center space-x-2 text-emergency">
                <div className="w-3 h-3 bg-emergency rounded-full animate-pulse"></div>
                <span className="font-mono text-sm">{formatTime(recordingTime)}</span>
              </div>
            )}
          </div>

          {/* Video Preview */}
          {recordingType === 'video' && stream && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full rounded-lg bg-black"
                style={{ aspectRatio: '16/9' }}
              />
              {isRecording && (
                <div className="absolute top-4 left-4 bg-emergency text-emergency-foreground px-3 py-1 rounded-full text-sm font-medium">
                  REC
                </div>
              )}
            </div>
          )}

          {/* Audio Visualization */}
          {recordingType === 'audio' && isRecording && (
            <div className="flex items-center justify-center space-x-2 py-8">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-emergency rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 40 + 20}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          )}

          {/* Playback */}
          {recordedUrl && !isRecording && (
            <div className="space-y-3">
              {recordingType === 'video' ? (
                <video
                  src={recordedUrl}
                  controls
                  className="w-full rounded-lg"
                />
              ) : (
                <audio
                  src={recordedUrl}
                  controls
                  className="w-full"
                />
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex space-x-3">
            {!isRecording ? (
              <>
                <Button
                  onClick={() => startRecording('audio')}
                  className="flex-1 bg-gradient-emergency hover:opacity-90"
                  disabled={isActive} // Disabled if auto-recording is active
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Record Audio
                </Button>
                <Button
                  onClick={() => startRecording('video')}
                  className="flex-1 bg-gradient-emergency hover:opacity-90"
                  disabled={isActive} // Disabled if auto-recording is active
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Record Video
                </Button>
              </>
            ) : (
              <Button
                onClick={stopRecording}
                className="flex-1 bg-destructive hover:bg-destructive/90"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Recording
              </Button>
            )}
          </div>

          {isActive && (
            <div className="text-center text-sm text-muted-foreground">
              Emergency auto-recording is active. Audio will be captured automatically.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmergencyMediaCapture;