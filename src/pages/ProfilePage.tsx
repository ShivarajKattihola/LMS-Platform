import { useState, useEffect } from "react";
import { lmsService } from "../services/lmsService";
import { Subject, VideoProgress } from "../types";
import { User as FirebaseUser } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, getDocs, setDoc, doc, query, where } from "firebase/firestore";
import { GraduationCap, BookOpen, CheckCircle2, Clock, Database, ChevronRight, Award } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import CertificateGenerator from "../components/CertificateGenerator";

export default function ProfilePage({ user }: { user: FirebaseUser }) {
  const [enrolledSubjects, setEnrolledSubjects] = useState<(Subject & { progress: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const fetchProgress = async () => {
      const enrollments = await lmsService.getUserEnrollments(user.uid);
      const progressData: (Subject & { progress: number })[] = [];

      for (const enrollment of enrollments) {
        const subject = await lmsService.getSubject(enrollment.subjectId);
        if (subject) {
          const tree = await lmsService.getSubjectTree(subject.id, user.uid);
          if (tree) {
            const allVideos = tree.sections.flatMap(s => s.videos);
            const completedVideos = allVideos.filter(v => v.isCompleted).length;
            const progress = allVideos.length > 0 ? Math.round((completedVideos / allVideos.length) * 100) : 0;
            
            progressData.push({ ...subject, progress });
          }
        }
      }

      setEnrolledSubjects(progressData);
      setLoading(false);
    };
    fetchProgress();
  }, [user.uid]);

  const seedData = async () => {
    setSeeding(true);
    try {
      // Seed Subjects
      const subjects = [
        { id: "java-basics", title: "Java Fundamentals", slug: "java-basics", description: "Master the basics of Java programming from scratch. Learn variables, loops, and OOP concepts.", thumbnailUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80", isPublished: true, createdAt: Date.now() },
        { id: "python-ml", title: "Python for Machine Learning", slug: "python-ml", description: "Dive into data science and ML using Python. Explore libraries like NumPy, Pandas, and Scikit-learn.", thumbnailUrl: "https://images.unsplash.com/photo-1527474305487-b87b222841cc?auto=format&fit=crop&w=800&q=80", isPublished: true, createdAt: Date.now() },
        { id: "fullstack-dev", title: "Full Stack Development (Main Course)", slug: "fullstack-dev", description: "Comprehensive guide to building full-stack applications using modern technologies.", thumbnailUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80", isPublished: true, createdAt: Date.now() },
        { id: "software-testing", title: "Software Testing Tutorial", slug: "software-testing", description: "Learn manual and automated testing techniques to ensure software quality.", thumbnailUrl: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?auto=format&fit=crop&w=800&q=80", isPublished: true, createdAt: Date.now() },
        { id: "programming-fundamentals", title: "Programming Fundamentals", slug: "programming-fundamentals", description: "The core concepts of computer science and programming logic for beginners.", thumbnailUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80", isPublished: true, createdAt: Date.now() },
        { id: "sql-mastery", title: "SQL (Structured Query Language)", slug: "sql-mastery", description: "Master database management and querying with SQL from beginner to advanced.", thumbnailUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=80", isPublished: true, createdAt: Date.now() }
      ];

      for (const s of subjects) {
        await setDoc(doc(db, "subjects", s.id), s);
      }

      // Seed Sections for Java
      const javaSections = [
        { id: "java-sec-1", subjectId: "java-basics", title: "Introduction", orderIndex: 1 },
        { id: "java-sec-2", subjectId: "java-basics", title: "Core Concepts", orderIndex: 2 }
      ];

      for (const s of javaSections) {
        await setDoc(doc(db, "sections", s.id), s);
      }

      // Seed Videos for Java
      const javaVideos = [
        { id: "java-vid-1", sectionId: "java-sec-1", subjectId: "java-basics", title: "What is Java?", description: "An overview of Java and its history.", youtubeId: "bm0OyhwFDuY", orderIndex: 1 },
        { id: "java-vid-2", sectionId: "java-sec-1", subjectId: "java-basics", title: "Setting up Environment", description: "Install JDK and IntelliJ IDEA.", youtubeId: "WRISYpKhIsc", orderIndex: 2 },
        { id: "java-vid-3", sectionId: "java-sec-2", subjectId: "java-basics", title: "Variables & Data Types", description: "Understanding how to store data in Java.", youtubeId: "L9Az79_7V8A", orderIndex: 3 },
        { id: "java-vid-4", sectionId: "java-sec-2", subjectId: "java-basics", title: "Java Full Course for Beginners", description: "A complete Java tutorial for absolute beginners.", youtubeId: "eIrMbAQSU34", orderIndex: 4 }
      ];

      for (const v of javaVideos) {
        await setDoc(doc(db, "videos", v.id), v);
      }

      // Seed Sections for Python
      const pythonSections = [
        { id: "python-sec-1", subjectId: "python-ml", title: "Machine Learning Basics", orderIndex: 1 }
      ];

      for (const s of pythonSections) {
        await setDoc(doc(db, "sections", s.id), s);
      }

      // Seed Videos for Python
      const pythonVideos = [
        { id: "python-vid-1", sectionId: "python-sec-1", subjectId: "python-ml", title: "Python for Machine Learning - Full Course", description: "A comprehensive guide to Python for ML.", youtubeId: "K5KVEU3aaeQ", orderIndex: 1 }
      ];

      for (const v of pythonVideos) {
        await setDoc(doc(db, "videos", v.id), v);
      }

      // Seed for Full Stack
      await setDoc(doc(db, "sections", "fs-sec-1"), { id: "fs-sec-1", subjectId: "fullstack-dev", title: "Full Stack Overview", orderIndex: 1 });
      await setDoc(doc(db, "videos", "fs-vid-1"), { id: "fs-vid-1", sectionId: "fs-sec-1", subjectId: "fullstack-dev", title: "Full Stack Web Development Course", description: "Learn the MERN stack and more.", youtubeId: "nu_pCVPKzTk", orderIndex: 1 });

      // Seed for Software Testing
      await setDoc(doc(db, "sections", "st-sec-1"), { id: "st-sec-1", subjectId: "software-testing", title: "Testing Fundamentals", orderIndex: 1 });
      await setDoc(doc(db, "videos", "st-vid-1"), { id: "st-vid-1", sectionId: "st-sec-1", subjectId: "software-testing", title: "Software Testing Tutorial", description: "Manual and Automation testing guide.", youtubeId: "sO8eGL6SFsA", orderIndex: 1 });

      // Clear progress for this video to ensure it starts fresh
      const progressId = `${auth.currentUser?.uid}_st-vid-1`;
      await setDoc(doc(db, "video_progress", progressId), {
        userId: auth.currentUser?.uid,
        videoId: "st-vid-1",
        subjectId: "software-testing",
        lastPositionSeconds: 0,
        isCompleted: false,
        updatedAt: Date.now()
      });

      // Seed for Programming Fundamentals
      await setDoc(doc(db, "sections", "pf-sec-1"), { id: "pf-sec-1", subjectId: "programming-fundamentals", title: "Computer Science 101", orderIndex: 1 });
      await setDoc(doc(db, "videos", "pf-vid-1"), { id: "pf-vid-1", sectionId: "pf-sec-1", subjectId: "programming-fundamentals", title: "Introduction to Programming", description: "Core concepts for every developer.", youtubeId: "zOjov-2OZ0E", orderIndex: 1 });

      // Seed for SQL
      await setDoc(doc(db, "sections", "sql-sec-1"), { id: "sql-sec-1", subjectId: "sql-mastery", title: "SQL Basics", orderIndex: 1 });
      await setDoc(doc(db, "videos", "sql-vid-1"), { id: "sql-vid-1", sectionId: "sql-sec-1", subjectId: "sql-mastery", title: "SQL Tutorial for Beginners", description: "Learn SQL in one video.", youtubeId: "HXV3zeQKqGY", orderIndex: 1 });

      alert("Database updated with the requested Software Testing video (ID: sO8eGL6SFsA)! Please refresh the page.");
    } catch (error) {
      console.error("Seeding error:", error);
      alert("Failed to seed data. Check console.");
    }
    setSeeding(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {user.photoURL && (
            <img src={user.photoURL} alt={user.displayName || ""} className="w-24 h-24 rounded-full border-4 border-white shadow-xl" referrerPolicy="no-referrer" />
          )}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">{user.displayName}</h1>
            <p className="text-neutral-500 font-medium">{user.email}</p>
          </div>
        </div>
        
        {/* Admin Seeding Tool */}
        {user.email === "hkshivu02@gmail.com" && (
          <button 
            onClick={seedData}
            disabled={seeding}
            className="flex items-center space-x-2 bg-neutral-100 text-neutral-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-neutral-900 hover:text-white transition-all disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            <span>{seeding ? "Seeding..." : "Seed Initial Data"}</span>
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-neutral-200 shadow-sm space-y-2">
          <div className="p-3 bg-neutral-100 rounded-2xl w-fit">
            <BookOpen className="w-6 h-6 text-neutral-900" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Enrolled</p>
            <p className="text-3xl font-bold text-neutral-900">{enrolledSubjects.length}</p>
          </div>
        </div>
        <div className="p-6 bg-white rounded-3xl border border-neutral-200 shadow-sm space-y-2">
          <div className="p-3 bg-emerald-100 rounded-2xl w-fit">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Completed</p>
            <p className="text-3xl font-bold text-neutral-900">
              {enrolledSubjects.filter(s => s.progress === 100).length}
            </p>
          </div>
        </div>
        <div className="p-6 bg-white rounded-3xl border border-neutral-200 shadow-sm space-y-2">
          <div className="p-3 bg-blue-100 rounded-2xl w-fit">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Hours Learned</p>
            <p className="text-3xl font-bold text-neutral-900">12.5</p>
          </div>
        </div>
      </div>

      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-neutral-900 flex items-center space-x-2">
          <GraduationCap className="w-6 h-6" />
          <span>My Learning Progress</span>
        </h2>
        
        {enrolledSubjects.length > 0 ? (
          <div className="grid gap-6">
            {enrolledSubjects.map((subject) => (
              <motion.div 
                key={subject.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center space-x-6">
                    <img 
                      src={subject.thumbnailUrl || `https://picsum.photos/seed/${subject.id}/800/450`} 
                      alt={subject.title} 
                      className="w-24 h-16 rounded-xl object-cover border border-neutral-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-neutral-900">{subject.title}</h3>
                      <div className="flex items-center space-x-4">
                        <div className="w-48 h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${subject.progress === 100 ? "bg-emerald-500" : "bg-neutral-900"}`} 
                            style={{ width: `${subject.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-neutral-900">{subject.progress}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {subject.progress === 100 && (
                      <CertificateGenerator 
                        userName={user.displayName || "Learner"} 
                        courseTitle={subject.title} 
                        completionDate={new Date().toLocaleDateString()} 
                      />
                    )}
                    <Link 
                      to={`/subjects/${subject.id}`}
                      className="p-3 rounded-xl bg-neutral-100 text-neutral-600 hover:bg-neutral-900 hover:text-white transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-neutral-50 rounded-3xl border border-dashed border-neutral-300">
            <p className="text-neutral-500 font-medium">You haven't started any courses yet.</p>
            <Link to="/" className="mt-4 inline-block text-neutral-900 font-bold hover:underline">
              Browse Courses
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
