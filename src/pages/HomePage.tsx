import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { lmsService } from "../services/lmsService";
import { Subject, Enrollment } from "../types";
import { BookOpen, Clock, ChevronRight, Play, Search, X, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import LetterAvatar from "../components/LetterAvatar";
import { auth } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";

const MOCK_SUBJECTS: Subject[] = [
  {
    id: "java-basics",
    title: "Java Fundamentals",
    slug: "java-basics",
    description: "Master the basics of Java programming from scratch. Learn variables, loops, and OOP concepts.",
    thumbnailUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
    isPublished: true,
    createdAt: Date.now()
  },
  {
    id: "python-ml",
    title: "Python for Machine Learning",
    slug: "python-ml",
    description: "Dive into data science and ML using Python. Explore libraries like NumPy, Pandas, and Scikit-learn.",
    thumbnailUrl: "https://images.unsplash.com/photo-1527474305487-b87b222841cc?auto=format&fit=crop&w=800&q=80",
    isPublished: true,
    createdAt: Date.now()
  },
  {
    id: "fullstack-dev",
    title: "Full Stack Development (Main Course)",
    slug: "fullstack-dev",
    description: "Comprehensive guide to building full-stack applications using modern technologies.",
    thumbnailUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
    isPublished: true,
    createdAt: Date.now()
  },
  {
    id: "software-testing",
    title: "Software Testing Tutorial",
    slug: "software-testing",
    description: "Learn manual and automated testing techniques to ensure software quality.",
    thumbnailUrl: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?auto=format&fit=crop&w=800&q=80",
    isPublished: true,
    createdAt: Date.now()
  },
  {
    id: "programming-fundamentals",
    title: "Programming Fundamentals",
    slug: "programming-fundamentals",
    description: "The core concepts of computer science and programming logic for beginners.",
    thumbnailUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80",
    isPublished: true,
    createdAt: Date.now()
  },
  {
    id: "sql-mastery",
    title: "SQL (Structured Query Language)",
    slug: "sql-mastery",
    description: "Master database management and querying with SQL from beginner to advanced.",
    thumbnailUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=80",
    isPublished: true,
    createdAt: Date.now()
  }
];

export default function HomePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const [subjectsData, historyData] = await Promise.all([
        lmsService.getSubjects(),
        user ? lmsService.getSearchHistory(user.uid) : Promise.resolve([])
      ]);

      setSubjects(subjectsData.length > 0 ? subjectsData : MOCK_SUBJECTS);
      
      if (user) {
        const enrolls = await lmsService.getUserEnrollments(user.uid);
        setEnrollments(enrolls);
        if (historyData.length > 0) {
          setRecentSearches(historyData);
          localStorage.setItem("recent_searches", JSON.stringify(historyData));
        }
      } else {
        const saved = localStorage.getItem("recent_searches");
        if (saved) {
          try {
            setRecentSearches(JSON.parse(saved));
          } catch (e) {
            console.error("Failed to parse recent searches", e);
          }
        }
      }
      setLoading(false);
    };
    loadData();
  }, [user]);

  const saveSearch = async (query: string) => {
    if (!query.trim()) return;
    const updated = [
      query.trim(),
      ...recentSearches.filter((s) => s.toLowerCase() !== query.trim().toLowerCase()),
    ].slice(0, 5);
    
    setRecentSearches(updated);
    localStorage.setItem("recent_searches", JSON.stringify(updated));
    
    if (user) {
      await lmsService.updateSearchHistory(user.uid, updated);
    }
  };

  const clearHistory = async () => {
    setRecentSearches([]);
    localStorage.removeItem("recent_searches");
    if (user) {
      await lmsService.updateSearchHistory(user.uid, []);
    }
  };

  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const query = searchQuery.toLowerCase();
    return subjects.filter(
      (s) => 
        s.title.toLowerCase().includes(query) || 
        s.description.toLowerCase().includes(query)
    );
  }, [subjects, searchQuery]);

  const isEnrolled = (subjectId: string) => {
    return enrollments.some(e => e.subjectId === subjectId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="space-y-8">
        <div className="max-w-2xl space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900"
          >
            Expand your knowledge with our structured courses.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-neutral-600 leading-relaxed"
          >
            Learn from curated YouTube content organized into easy-to-follow sections and lessons. Track your progress and pick up where you left off.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative max-w-xl group"
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search for courses by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                saveSearch(searchQuery);
              }
            }}
            className="block w-full pl-11 pr-12 py-4 bg-white border border-neutral-200 rounded-2xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </motion.div>

        {recentSearches.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap items-center gap-2 text-sm"
          >
            <span className="text-neutral-400 font-medium">Recent:</span>
            {recentSearches.map((term) => (
              <button
                key={term}
                onClick={() => setSearchQuery(term)}
                className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-full transition-colors"
              >
                {term}
              </button>
            ))}
            <button
              onClick={clearHistory}
              className="ml-2 text-xs text-neutral-400 hover:text-neutral-900 underline underline-offset-2"
            >
              Clear
            </button>
          </motion.div>
        )}
      </header>

      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">
            {searchQuery ? `Search Results (${filteredSubjects.length})` : "Available Courses"}
          </h2>
        </div>

        {filteredSubjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredSubjects.map((subject, index) => (
                <motion.div
                  key={subject.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="group bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-xl hover:shadow-neutral-200/50 transition-all duration-300"
                >
                  <Link 
                    to={`/subjects/${subject.id}`}
                    onClick={() => saveSearch(searchQuery)}
                  >
                    <div className="aspect-video relative overflow-hidden">
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
                          className="w-full h-full text-6xl"
                        />
                      )}
                      
                      {isEnrolled(subject.id) && (
                        <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
                          <CheckCircle className="w-3 h-3" />
                          <span>Enrolled</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                          <Play className="w-6 h-6 text-neutral-900 fill-current" />
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-neutral-900 group-hover:text-neutral-700 transition-colors">
                          {subject.title}
                        </h3>
                        <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed">
                          {subject.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                        <div className="flex items-center space-x-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          <BookOpen className="w-4 h-4" />
                          <span>Course</span>
                        </div>
                        <div className="flex items-center text-sm font-semibold text-neutral-900 group-hover:translate-x-1 transition-transform">
                          <span>{isEnrolled(subject.id) ? "Continue" : "View Details"}</span>
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-neutral-50 rounded-3xl border border-dashed border-neutral-300"
          >
            <div className="max-w-xs mx-auto space-y-4">
              <div className="p-4 bg-white rounded-full w-fit mx-auto shadow-sm">
                <Search className="w-8 h-8 text-neutral-300" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-neutral-900">No courses found</p>
                <p className="text-neutral-500">We couldn't find any courses matching "{searchQuery}". Try a different search term.</p>
              </div>
              <button 
                onClick={() => setSearchQuery("")}
                className="text-sm font-bold text-neutral-900 hover:underline"
              >
                Clear search
              </button>
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}

