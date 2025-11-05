import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  BookOpen, 
  Clock,
  FileText,
  Download,
  Share2
} from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import VideoPlayer from '../components/VideoPlayer';
import { useEducation } from '../context/EducationContext';
import { mockLearningProgress } from '../data/mockData';
import { cn } from '~/utils';
import useEducationAPI from '~/hooks/Education/useEducationAPI';

export default function ChapterLearning() {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>();
  const navigate = useNavigate();
  const { currentCourse, updateProgress } = useEducation();
  
  const [course, setCourse] = useState(currentCourse);
  const [currentChapter, setCurrentChapter] = useState<any>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { 
    fetchCourseDetail, 
    fetchVideoInfo, 
    updateVideoProgress, 
    completeChapter 
  } = useEducationAPI();

  useEffect(() => {
    const loadData = async () => {
      if (!course && courseId) {
        setIsLoading(true);
        try {
          const courseData = await fetchCourseDetail(courseId);
          setCourse(courseData);
        } catch (error) {
          console.error('加载课程失败:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [courseId, course, fetchCourseDetail]);

  useEffect(() => {
    const loadChapterData = async () => {
      if (course && chapterId) {
        const chapter = (course.chapters || []).find(c => c.id === chapterId);
        if (chapter) {
          setCurrentChapter(chapter);
          
          // 加载视频信息
          try {
            const videoData = await fetchVideoInfo(chapterId);
            setVideoInfo(videoData);
          } catch (error) {
            console.error('加载视频信息失败:', error);
          }
          
          // 检查是否已完成
          const progressKey = `${courseId}-${chapterId}`;
          const progress = mockLearningProgress[progressKey];
          setIsCompleted(progress?.completed || false);
        }
      }
    };

    loadChapterData();
  }, [course, chapterId, courseId, fetchVideoInfo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-main"></div>
      </div>
    );
  }

  if (!course || !currentChapter) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-text-secondary mb-4">章节未找到</div>
          <Button onClick={() => navigate('/education')} variant="outline">
            返回课程中心
          </Button>
        </div>
      </div>
    );
  }

  const chapters = course.chapters || [];
  const currentChapterIndex = chapters.findIndex(c => c.id === chapterId);
  const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;

  const handleProgressUpdate = async (progress: number, position: number) => {
    try {
      await updateVideoProgress(chapterId!, {
        position,
        completed: progress >= 100,
      });
      
      updateProgress(courseId!, chapterId!, {
        progress,
        lastPosition: position,
        studyTime: position,
      });
    } catch (error) {
      console.error('更新进度失败:', error);
    }
  };

  const handleChapterComplete = async () => {
    try {
      await completeChapter(chapterId!);
      setIsCompleted(true);
      updateProgress(courseId!, chapterId!, {
        progress: 100,
        completed: true,
        lastPosition: currentChapter.duration * 60, // 转换为秒
        studyTime: currentChapter.duration * 60,
      });
    } catch (error) {
      console.error('标记章节完成失败:', error);
    }
  };

  const navigateToChapter = (targetChapterId: string) => {
    navigate(`/education/courses/${courseId}/chapters/${targetChapterId}`);
  };

  const handleBackToCourse = () => {
    navigate(`/education/courses/${courseId}`);
  };

  return (
    <div className="chapter-learning h-full flex flex-col">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-border-light px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBackToCourse}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回课程
            </Button>
            <div className="h-6 w-px bg-border-light" />
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                {currentChapter.title}
              </h1>
              <p className="text-sm text-text-secondary">
                {course.title} · 第 {currentChapterIndex + 1} 章
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isCompleted && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">已完成</span>
              </div>
            )}
            
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              分享
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowNotes(!showNotes)}
            >
              <FileText className="w-4 h-4 mr-2" />
              笔记
            </Button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：视频播放器 */}
        <div className="flex-1 flex flex-col bg-black">
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-5xl">
              <VideoPlayer
                videoUrl={videoInfo?.video_url || currentChapter.videoUrl || '/assets/videos/sample.mp4'}
                title={currentChapter.title}
                duration={videoInfo?.duration || currentChapter.duration * 60} // 转换为秒
                initialPosition={videoInfo?.last_position || 0}
                onProgressUpdate={handleProgressUpdate}
                onComplete={handleChapterComplete}
              />
            </div>
          </div>

          {/* 章节导航 */}
          <div className="bg-surface-primary border-t border-border-light p-4">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                {prevChapter && (
                  <Button
                    variant="outline"
                    onClick={() => navigateToChapter(prevChapter.id)}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    上一章：{prevChapter.title}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4">
                {!isCompleted && (
                  <Button
                    variant="submit"
                    onClick={handleChapterComplete}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    标记为已完成
                  </Button>
                )}

                {nextChapter && (
                  <Button
                    variant={isCompleted ? "submit" : "outline"}
                    onClick={() => navigateToChapter(nextChapter.id)}
                    className="flex items-center gap-2"
                  >
                    下一章：{nextChapter.title}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}

                {!nextChapter && isCompleted && (
                  <Button
                    variant="submit"
                    onClick={handleBackToCourse}
                    className="flex items-center gap-2"
                  >
                    完成课程
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：课程内容和笔记 */}
        <div className={cn(
          "bg-white border-l border-border-light transition-all duration-300",
          showNotes ? "w-96" : "w-80"
        )}>
          <div className="h-full flex flex-col">
            {/* 标签页 */}
            <div className="border-b border-border-light">
              <nav className="flex">
                <button
                  onClick={() => setShowNotes(false)}
                  className={cn(
                    "flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors",
                    !showNotes
                      ? "border-blue-main text-blue-main bg-blue-50"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  )}
                >
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  课程内容
                </button>
                <button
                  onClick={() => setShowNotes(true)}
                  className={cn(
                    "flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors",
                    showNotes
                      ? "border-blue-main text-blue-main bg-blue-50"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  )}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  学习笔记
                </button>
              </nav>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto">
              {!showNotes ? (
                // 课程内容
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-text-primary mb-2">
                      {currentChapter.title}
                    </h2>
                    <p className="text-text-secondary mb-4">
                      {currentChapter.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {currentChapter.duration} 分钟
                      </span>
                      <span>第 {currentChapterIndex + 1} / {(course.chapters || []).length} 章</span>
                    </div>
                  </div>

                  {/* 章节内容 */}
                  {currentChapter.content && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-text-primary mb-4">
                        章节要点
                      </h3>
                      <div className="prose prose-sm max-w-none text-text-secondary">
                        <div dangerouslySetInnerHTML={{ __html: currentChapter.content.replace(/\n/g, '<br>') }} />
                      </div>
                    </Card>
                  )}

                  {/* 章节列表 */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">
                      课程章节
                    </h3>
                    <div className="space-y-2">
                      {(course.chapters || []).map((chapter, index) => {
                        const progressKey = `${courseId}-${chapter.id}`;
                        const progress = mockLearningProgress[progressKey];
                        const isCurrent = chapter.id === chapterId;
                        
                        return (
                          <div
                            key={chapter.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                              isCurrent 
                                ? "bg-blue-50 border border-blue-200" 
                                : "hover:bg-surface-secondary"
                            )}
                            onClick={() => navigateToChapter(chapter.id)}
                          >
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                              progress?.completed 
                                ? "bg-green-500 text-white" 
                                : isCurrent
                                ? "bg-blue-main text-white"
                                : "bg-surface-secondary text-text-secondary"
                            )}>
                              {progress?.completed ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                index + 1
                              )}
                            </div>
                            <div className="flex-1">
                              <div className={cn(
                                "font-medium text-sm",
                                isCurrent ? "text-blue-main" : "text-text-primary"
                              )}>
                                {chapter.title}
                              </div>
                              <div className="text-xs text-text-secondary">
                                {chapter.duration} 分钟
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                // 学习笔记
                <div className="p-6 h-full flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      学习笔记
                    </h3>
                    <p className="text-sm text-text-secondary">
                      记录你的学习心得和重要知识点
                    </p>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="在这里记录你的学习笔记..."
                      className="flex-1 p-4 border border-border-light rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-main text-sm"
                    />
                    
                    <div className="mt-4 flex gap-2">
                      <Button variant="submit" size="sm" className="flex-1">
                        保存笔记
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

