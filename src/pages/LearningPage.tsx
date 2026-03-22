import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { lmsService } from "../services/lmsService";
import { Subject, Section, Video, SubjectTree, VideoProgress } from "../types";
import { User as FirebaseUser } from "firebase/auth";
import { Play, Lock, CheckCircle2, ChevronRight, ChevronLeft, BookOpen, GraduationCap, Menu, X, ArrowRightCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import VideoPlayer from "../components/VideoPlayer";

export default function LearningPage({ user }: { user: FirebaseUser }) {
  const { subjectId, videoId } = useParams<{ subjectId: string; videoId: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [tree, setTree] = useState<SubjectTree | null>(null);
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const activeVideoRef = useRef<HTMLAnchorElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeVideoRef.current) {
      activeVideoRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [videoId, tree]);

  useEffect(() => {
    const fetchData = async () => {
      if (!subjectId || !videoId) return;
      setLoading(true);
      
      const [sub, vid, t, p, e] = await Promise.all([
        lmsService.getSubject(subjectId),
        lmsService.getVideo(videoId),
        lmsService.getSubjectTree(subjectId, user.uid),
        lmsService.getVideoProgress(user.uid, videoId),
        lmsService.getEnrollment(user.uid, subjectId)
      ]);

      if (!e) {
        navigate(`/subjects/${subjectId}`);
        return;
      }

      setSubject(sub);
      setVideo(vid);
      setTree(t);
      setProgress(p);
      setLoading(false);
    };
    fetchData();
  }, [subjectId, videoId, user.uid, navigate]);

  const handleProgress = (currentTime: number) => {
    if (!subjectId || !videoId) return;
    lmsService.updateProgress(user.uid, videoId, subjectId, currentTime, false);
  };

  const handleCompleted = async () => {
    if (!subjectId || !videoId) return;
    await lmsService.updateProgress(user.uid, videoId, subjectId, 0, true);
    
    // Refresh tree to update sidebar and check overall progress
    const t = await lmsService.getSubjectTree(subjectId, user.uid);
    setTree(t);

    // Check if course is completed
    if (t) {
      const allVideos = t.sections.flatMap(s => s.videos);
      const completedVideos = allVideos.filter(v => v.isCompleted).length;
      if (allVideos.length > 0 && completedVideos === allVideos.length) {
        await lmsService.updateEnrollmentStatus(user.uid, subjectId, "completed");
      }

      // Find next video
      const currentIndex = allVideos.findIndex(v => v.id === videoId);
      if (currentIndex < allVideos.length - 1) {
        const nextVideo = allVideos[currentIndex + 1];
        if (!nextVideo.locked) {
          navigate(`/subjects/${subjectId}/video/${nextVideo.id}`);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  if (!subject || !video) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-neutral-900">Video not found</h2>
        <Link to="/" className="mt-4 inline-block text-neutral-600 hover:text-neutral-900 transition-colors">
          Return to home
        </Link>
      </div>
    );
  }

  const currentVideoInTree = tree?.sections.flatMap(s => s.videos).find(v => v.id === videoId);
  
  const allVideosInTree = tree?.sections.flatMap(s => s.videos) || [];
  const nextUpVideo = allVideosInTree.find(v => !v.isCompleted && !v.locked && v.id !== videoId);

  if (currentVideoInTree?.locked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="p-6 bg-neutral-100 rounded-full">
          <Lock className="w-12 h-12 text-neutral-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-neutral-900">This lesson is locked</h2>
          <p className="text-neutral-600">Please complete the previous lessons to unlock this content.</p>
        </div>
        <Link 
          to={`/subjects/${subjectId}`}
          className="bg-neutral-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-200"
        >
          Return to Curriculum
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 relative">
      <div className="flex-1 space-y-8">
        <header className="space-y-4">
          <div className="flex items-center space-x-2 text-sm font-medium text-neutral-500 uppercase tracking-wider">
            <Link to={`/subjects/${subjectId}`} className="hover:text-neutral-900 transition-colors">{subject.title}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-neutral-900 truncate max-w-[200px]">{video.title}</span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">{video.title}</h1>
        </header>

        <VideoPlayer 
          youtubeId={video.youtubeId}
          startPositionSeconds={progress?.lastPositionSeconds || 0}
          onProgress={handleProgress}
          onCompleted={handleCompleted}
        />

        <div className="p-8 bg-white rounded-3xl border border-neutral-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-neutral-900 flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>About this lesson</span>
          </h2>
          <p className="text-neutral-600 leading-relaxed whitespace-pre-wrap">
            {video.description}
          </p>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`lg:w-80 space-y-6 ${sidebarOpen ? "block" : "hidden lg:block"}`}>
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden sticky top-24">
          <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="font-bold text-neutral-900 flex items-center space-x-2">
              <GraduationCap className="w-5 h-5" />
              <span>Course Content</span>
            </h3>
          </div>
          
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-4 space-y-6">
            {tree?.sections.map((section, sIdx) => (
              <div key={section.id} className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest px-2">
                  Section {sIdx + 1}: {section.title}
                </h4>
                <div className="space-y-1">
                  {section.videos.map((v) => {
                    const isActive = v.id === videoId;
                    const isNextUp = v.id === nextUpVideo?.id;

                    return (
                      <Link
                        key={v.id}
                        ref={isActive ? activeVideoRef : null}
                        to={v.locked ? "#" : `/subjects/${subjectId}/video/${v.id}`}
                        className={`group flex items-center justify-between p-3 rounded-xl transition-all relative ${
                          isActive 
                            ? "bg-neutral-900 text-white shadow-lg shadow-neutral-200" 
                            : isNextUp
                              ? "bg-neutral-50 border border-neutral-200 text-neutral-900 hover:border-neutral-900"
                              : v.locked 
                                ? "opacity-40 cursor-not-allowed" 
                                : "hover:bg-neutral-50 text-neutral-600"
                        }`}
                        onClick={(e) => v.locked && e.preventDefault()}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          {v.isCompleted ? (
                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-emerald-500"}`} />
                          ) : v.locked ? (
                            <Lock className="w-4 h-4 shrink-0" />
                          ) : (
                            <Play className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : isNextUp ? "text-neutral-900" : "text-neutral-400"}`} />
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">{v.title}</span>
                            {isActive && (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Now Playing</span>
                            )}
                            {isNextUp && (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Next Up</span>
                            )}
                          </div>
                        </div>
                        {isNextUp && (
                          <ArrowRightCircle className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
