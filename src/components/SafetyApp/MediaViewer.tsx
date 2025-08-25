import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, Volume2, VolumeX, Camera, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MediaItem {
  id: string;
  type: 'audio' | 'video' | 'image';
  url: string;
  fileName: string;
  timestamp: string;
  duration?: number;
  size?: number;
}

interface MediaViewerProps {
  mediaItems: MediaItem[];
  showPreview?: boolean;
  className?: string;
}

const MediaViewer = ({ mediaItems, showPreview = false, className = "" }: MediaViewerProps) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const handlePlayPause = () => {
    const mediaElement = selectedMedia?.type === 'audio' ? audioRef.current : videoRef.current;
    if (mediaElement) {
      if (isPlaying) {
        mediaElement.pause();
      } else {
        mediaElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    const mediaElement = selectedMedia?.type === 'audio' ? audioRef.current : videoRef.current;
    if (mediaElement) {
      mediaElement.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleDownload = async (item: MediaItem) => {
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Complete",
        description: `${item.fileName} has been downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the media file.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'audio': return <Mic className="h-5 w-5" />;
      case 'video': return <Camera className="h-5 w-5" />;
      case 'image': return <Camera className="h-5 w-5" />;
      default: return <Camera className="h-5 w-5" />;
    }
  };

  if (mediaItems.length === 0) {
    return (
      <Card className={`${className} border-dashed border-2 border-muted`}>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Camera className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No media captured yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Emergency recordings will appear here after SOS activation
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Media Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaItems.map((item) => (
          <Card 
            key={item.id} 
            className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            onClick={() => setSelectedMedia(item)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {getMediaIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{item.type.toUpperCase()}</span>
                <span>
                  {item.duration && formatDuration(item.duration)}
                  {item.size && formatFileSize(item.size)}
                </span>
              </div>

              <div className="flex space-x-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMedia(item);
                  }}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Play
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(item);
                  }}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Media Player Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedMedia.fileName}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMedia(null)}
                >
                  ✕
                </Button>
              </div>

              {/* Media Player */}
              <div className="bg-muted rounded-lg p-4 mb-4">
                {selectedMedia.type === 'audio' && (
                  <div className="space-y-4">
                    <audio
                      ref={audioRef}
                      src={selectedMedia.url}
                      className="w-full"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                      controls
                    />
                    <div className="flex items-center justify-center space-x-4">
                      <Button onClick={handlePlayPause} size="lg">
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>
                      <Button onClick={handleMuteToggle} variant="outline">
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {selectedMedia.type === 'video' && (
                  <video
                    ref={videoRef}
                    src={selectedMedia.url}
                    className="w-full rounded-lg"
                    controls
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />
                )}

                {selectedMedia.type === 'image' && (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.fileName}
                    className="w-full rounded-lg"
                  />
                )}
              </div>

              {/* Media Info */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Recorded:</span>
                  <span>{new Date(selectedMedia.timestamp).toLocaleString()}</span>
                </div>
                {selectedMedia.duration && (
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{formatDuration(selectedMedia.duration)}</span>
                  </div>
                )}
                {selectedMedia.size && (
                  <div className="flex justify-between">
                    <span>File Size:</span>
                    <span>{formatFileSize(selectedMedia.size)}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 mt-6">
                <Button
                  onClick={() => handleDownload(selectedMedia)}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedMedia(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MediaViewer;