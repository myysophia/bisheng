import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings,
  SkipBack,
  SkipForward,
  MessageCircle,
  Send,
  X
} from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { cn } from '~/utils';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  duration: number; // 总时长（秒）
  initialPosition?: number; // 初始播放位置（秒）
  onProgressUpdate?: (progress: number, position: number) => void;
  onComplete?: () => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function VideoPlayer({
  videoUrl,
  title,
  duration,
  initialPosition = 0,
  onProgressUpdate,
  onComplete
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // 数字人互动相关状态
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: '你好！我是你的数字人导师小智。在学习过程中有任何问题都可以随时问我哦！',
      timestamp: new Date().toISOString()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // 控制条自动隐藏
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && showControls) {
      timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, showControls]);

  // 初始化视频位置
  useEffect(() => {
    if (videoRef.current && initialPosition > 0) {
      videoRef.current.currentTime = initialPosition;
    }
  }, [initialPosition]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);
      
      const progress = (current / duration) * 100;
      onProgressUpdate?.(progress, current);
      
      // 检查是否完成
      if (current >= duration * 0.95) { // 95%算作完成
        onComplete?.();
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: newMessage,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    // 模拟AI回复
    setTimeout(() => {
      const responses = [
        '这是一个很好的问题！让我来为你详细解释一下...',
        '根据视频内容，我建议你可以这样理解...',
        '这个概念确实比较复杂，我们可以通过一个例子来说明...',
        '你的理解很正确！继续保持这样的学习态度。',
        '让我为你总结一下这部分的重点内容...'
      ];
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toISOString()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="video-player-container relative bg-black rounded-lg overflow-hidden">
      {/* 主视频区域 */}
      <div 
        className="relative aspect-video bg-black"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => !isPlaying || setShowControls(true)}
        onMouseMove={() => setShowControls(true)}
      >
        {/* 视频元素 */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedData={() => setIsLoading(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            onComplete?.();
          }}
        >
          <source src={videoUrl} type="video/mp4" />
          您的浏览器不支持视频播放。
        </video>

        {/* 加载状态 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        {/* 播放/暂停按钮（中央） */}
        {!isPlaying && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={handlePlayPause}
              variant="ghost"
              className="w-20 h-20 rounded-full bg-black/50 hover:bg-black/70 text-white"
            >
              <Play className="w-10 h-10 ml-1" />
            </Button>
          </div>
        )}

        {/* 控制条 */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}>
          {/* 进度条 */}
          <div 
            ref={progressRef}
            className="w-full h-2 bg-white/20 rounded-full cursor-pointer mb-4"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-blue-main rounded-full transition-all duration-100"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={handlePlayPause}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>

              <Button
                onClick={() => skip(-10)}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="w-5 h-5" />
              </Button>

              <Button
                onClick={() => skip(10)}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="w-5 h-5" />
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleMute}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-white/20 rounded-full appearance-none slider"
                />
              </div>

              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowChat(!showChat)}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <Settings className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <Maximize className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 数字人互动聊天面板 */}
      {showChat && (
        <Card className="absolute top-4 right-4 w-80 h-96 flex flex-col bg-white shadow-2xl">
          {/* 聊天头部 */}
          <div className="flex items-center justify-between p-4 border-b border-border-light">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-main to-brand-purple rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">智</span>
              </div>
              <div>
                <h4 className="font-semibold text-text-primary">数字人导师</h4>
                <p className="text-xs text-text-secondary">在线答疑</p>
              </div>
            </div>
            <Button
              onClick={() => setShowChat(false)}
              variant="ghost"
              size="icon"
              className="w-6 h-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* 聊天消息 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.type === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] p-3 rounded-lg text-sm",
                    message.type === 'user'
                      ? "bg-blue-main text-white"
                      : "bg-surface-secondary text-text-primary"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-surface-secondary text-text-primary p-3 rounded-lg text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 输入框 */}
          <div className="p-4 border-t border-border-light">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="有问题随时问我..."
                className="flex-1 px-3 py-2 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-main"
              />
              <Button
                onClick={handleSendMessage}
                variant="submit"
                size="icon"
                disabled={!newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

