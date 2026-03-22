import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { lmsService } from "../services/lmsService";
import { Subject, Section, Video, SubjectTree, Enrollment } from "../types";
import { auth } from "../firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { Play, Lock, CheckCircle2, ChevronRight, Clock, BookOpen, GraduationCap, Award, PlusCircle } from "lucide-react";
import { motion } from "motion/react";
import CertificateGenerator from "../components/CertificateGenerator";
import LetterAvatar from "../components/LetterAvatar";

export default function SubjectPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [tree, setTree] = useState<SubjectTree | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!subjectId) return;
      const sub = await lmsService.getSubject(subjectId);
      setSubject(sub);
      
      if (user) {
        const [t, e] = await Promise.all([
          lmsService.getSubjectTree(subjectId, user.uid),
          lmsService.getEnrollment(user.uid, subjectId)
        ]);
        setTree(t);
        setEnrollment(e);
      }
      setLoading(false);
    };
    fetchData();
  }, [subjectId, user]);

  const handleEnroll = async () => {
    if (!user || !subjectId) return;
    setEnrolling(true);
    try {
      await lmsService.enroll(user.uid, subjectId);
      const e = await lmsService.getEnrollment(user.uid, subjectId);
      setEnrollment(e);
    } catch (error) {
      console.error("Enrollment failed", error);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-neutral-900">Course not found</h2>
        <Link to="/" className="mt-4 inline-block text-neutral-600 hover:text-neutral-900 transition-colors">
          Return to home
        </Link>
      </div>
    );
  }

  const firstVideoId = tree?.sections[0]?.videos[0]?.id;
  const allVideos = tree?.sections.flatMap(s => s.videos) || [];
  const completedVideos = allVideos.filter(v => v.isCompleted).length;
  const isCompleted = allVideos.length > 0 && completedVideos === allVideos.length;

  const totalDurationSeconds = allVideos.reduce((acc, video) => {
    // If durationSeconds is missing, we use 600s (10 mins) as an average
    return acc + (video.durationSeconds || 600);
  }, 0);

  const formatDuration = (seconds: number) => {
    if (allVideos.length === 0) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `~${hours}h ${minutes}m`;
    }
    return `~${minutes}m`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="space-y-6">
        <div className="flex items-center space-x-2 text-sm font-medium text-neutral-500 uppercase tracking-wider">
          <Link to="/" className="hover:text-neutral-900 transition-colors">Courses</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-neutral-900">{subject.title}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 flex flex-wrap items-center gap-4"
            >
              <span>{subject.title}</span>
              {enrollment?.status === "completed" && (
                <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Completed</span>
                </span>
              )}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-neutral-600 leading-relaxed"
            >
              {subject.description}
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col space-y-4"
            >
              <div className="flex items-center space-x-6 text-sm font-medium text-neutral-500">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{allVideos.length} Lessons</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(totalDurationSeconds)}</span>
                </div>
              </div>

              {enrollment && allVideos.length > 0 && (
                <div className="space-y-2 max-w-xs">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-neutral-400">
                    <span>Course Progress</span>
                    <span className="text-neutral-900">{Math.round((completedVideos / allVideos.length) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(completedVideos / allVideos.length) * 100}%` }}
                      className={`h-full ${isCompleted ? "bg-emerald-500" : "bg-neutral-900"}`}
                    />
                  </div>
                </div>
              )}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              {user ? (
                enrollment ? (
                  isCompleted ? (
                    <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-4">
                      <div className="flex items-center space-x-3 text-emerald-700">
                        <Award className="w-8 h-8" />
                        <h3 className="text-xl font-bold tracking-tight">Congratulations!</h3>
                      </div>
                      <p className="text-emerald-600 font-medium">You have successfully completed this course. Download your certificate below.</p>
                      <CertificateGenerator 
                        userName={user.displayName || "Learner"} 
                        courseTitle={subject.title} 
                        completionDate={new Date().toLocaleDateString()} 
                      />
                    </div>
                  ) : firstVideoId ? (
                    <Link 
                      to={`/subjects/${subject.id}/video/${firstVideoId}`}
                      className="inline-flex items-center space-x-2 bg-neutral-900 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>{completedVideos > 0 ? "Continue Learning" : "Start Learning"}</span>
                    </Link>
                  ) : (
                    <div className="p-4 bg-neutral-100 rounded-xl text-neutral-600 font-medium">
                      No lessons available yet.
                    </div>
                  )
                ) : (
                  <button 
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="inline-flex items-center space-x-2 bg-neutral-900 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200 disabled:opacity-50"
                  >
                    {enrolling ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <PlusCircle className="w-5 h-5" />
                    )}
                    <span>Enroll Now</span>
                  </button>
                )
              ) : (
                <div className="p-6 bg-neutral-100 rounded-2xl border border-neutral-200 space-y-4">
                  <p className="text-neutral-600 font-medium">Sign in to enroll and track your progress.</p>
                  <button 
                    onClick={() => navigate("/")}
                    className="w-full bg-neutral-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-neutral-800 transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-neutral-200 border border-neutral-200"
          >
            {subject.thumbnailUrl ? (
              <img 
                src={subject.thumbnailUrl} 
                alt={subject.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <LetterAvatar 
                text={subject.title} 
                className="w-full h-full text-8xl"
              />
            )}
          </motion.div>
        </div>
      </header>

      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-neutral-900 flex items-center space-x-2">
          <GraduationCap className="w-6 h-6" />
          <span>Curriculum</span>
        </h2>
        
        <div className="space-y-12">
          {tree?.sections.map((section, sIdx) => (
            <div key={section.id} className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-bold">
                  {sIdx + 1}
                </div>
                <h3 className="text-xl font-bold text-neutral-900">{section.title}</h3>
              </div>
              
              <div className="grid gap-3 pl-12">
                {section.videos.map((video, vIdx) => (
                  <div 
                    key={video.id}
                    className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
                      video.locked || !enrollment
                        ? "bg-neutral-50 border-neutral-100 opacity-60" 
                        : "bg-white border-neutral-200 hover:border-neutral-900 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {video.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (video.locked || !enrollment) ? (
                        <Lock className="w-5 h-5 text-neutral-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-neutral-300 group-hover:border-neutral-900 transition-colors" />
                      )}
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium text-neutral-400">Lesson {vIdx + 1}</span>
                        <h4 className="font-bold text-neutral-900">{video.title}</h4>
                      </div>
                    </div>
                    
                    {!video.locked && user && enrollment && (
                      <Link 
                        to={`/subjects/${subject.id}/video/${video.id}`}
                        className="p-2 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-900 hover:text-white transition-all"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {!tree && !loading && user && (
             <div className="text-center py-12 bg-neutral-50 rounded-3xl border border-dashed border-neutral-300">
                <p className="text-neutral-500 font-medium italic">No curriculum data found for this course.</p>
             </div>
          )}
        </div>
      </section>
    </div>
  );
}
