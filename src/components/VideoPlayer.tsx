import { useState, useEffect, useRef } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import { Play, Pause, RotateCcw, CheckCircle2, ChevronRight, ChevronLeft, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VideoPlayerProps {
  youtubeId: string;
  startPositionSeconds: number;
  onProgress: (currentTime: number) => void;
  onCompleted: () => void;
}

export default function VideoPlayer({ 
  youtubeId, 
  startPositionSeconds, 
  onProgress, 
  onCompleted 
}: VideoPlayerProps) {
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setError(null); // Reset error when videoId changes
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [youtubeId]);

  const onReady: YouTubeProps['onReady'] = (event) => {
    setPlayer(event.target);
    setDuration(event.target.getDuration());
    if (startPositionSeconds > 0) {
      event.target.seekTo(startPositionSeconds, true);
    }
  };

  const onError: YouTubeProps['onError'] = (event) => {
    console.error("YouTube Player Error:", event.data);
    let message = "This video is unavailable.";
    if (event.data === 101 || event.data === 150) {
      message = "The video owner has disabled playback on other websites. Please try another lesson.";
    } else if (event.data === 100) {
      message = "The video has been removed or marked as private.";
    }
    setError(message);
  };

  const onStateChange: YouTubeProps['onStateChange'] = (event) => {
    // 1: Playing, 2: Paused, 0: Ended
    if (event.data === 1) {
      setIsPlaying(true);
      progressInterval.current = setInterval(() => {
        const time = event.target.getCurrentTime();
        setCurrentTime(time);
        onProgress(time);
      }, 5000); // Update every 5 seconds
    } else {
      setIsPlaying(false);
      if (progressInterval.current) clearInterval(progressInterval.current);
      
      if (event.data === 0) {
        onCompleted();
      }
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      player?.pauseVideo();
    } else {
      player?.playVideo();
    }
  };

  const seek = (seconds: number) => {
    player?.seekTo(currentTime + seconds, true);
  };

  return (
    <div className="space-y-6">
      <div className="aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl shadow-neutral-200 border border-neutral-200 relative group">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 text-white p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-neutral-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight">Video Unavailable</h3>
              <p className="text-neutral-400 max-w-sm mx-auto">{error}</p>
              <p className="text-xs text-neutral-500">Video ID: {youtubeId}</p>
            </div>
            <a 
              href={`https://www.youtube.com/watch?v=${youtubeId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-sm font-bold text-white hover:underline"
            >
              <span>Watch on YouTube</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <YouTube
            videoId={youtubeId}
            opts={{
              height: '100%',
              width: '100%',
              playerVars: {
                autoplay: 0,
                controls: 1,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                start: startPositionSeconds
              },
            }}
            onReady={onReady}
            onError={onError}
            onStateChange={onStateChange}
            className="w-full h-full"
          />
        )}
      </div>

      <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => seek(-10)}
            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button 
            onClick={togglePlay}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200"
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
          </button>
          <button 
            onClick={() => seek(10)}
            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
          >
            <RotateCcw className="w-5 h-5 scale-x-[-1]" />
          </button>
        </div>

        <div className="flex-1 max-w-md mx-12">
          <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-neutral-900"
              initial={{ width: 0 }}
              animate={{ width: `${(currentTime / duration) * 100}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s]
    .map(v => v < 10 ? "0" + v : v)
    .filter((v, i) => v !== "00" || i > 0)
    .join(":");
}
