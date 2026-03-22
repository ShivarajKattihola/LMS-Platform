import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Subject, Section, Video, VideoProgress, SubjectTree, Enrollment } from "../types";

export const lmsService = {
  async getSubjects(): Promise<Subject[]> {
    try {
      const q = query(collection(db, "subjects"), where("isPublished", "==", true));
      const snapshot = await getDocs(q);
      const subjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
      return subjects.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "subjects");
      return [];
    }
  },

  async getSubject(id: string): Promise<Subject | null> {
    try {
      const docRef = doc(db, "subjects", id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Subject) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `subjects/${id}`);
      return null;
    }
  },

  async getSubjectTree(subjectId: string, userId: string): Promise<SubjectTree | null> {
    try {
      const subject = await this.getSubject(subjectId);
      if (!subject) return null;

      // Get sections
      const sectionsQ = query(collection(db, "sections"), where("subjectId", "==", subjectId));
      const sectionsSnap = await getDocs(sectionsQ);
      const sections = sectionsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Section))
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

      // Get videos
      const videosQ = query(collection(db, "videos"), where("subjectId", "==", subjectId));
      const videosSnap = await getDocs(videosQ);
      const videos = videosSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Video))
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

      // Get progress
      const progressQ = query(collection(db, "video_progress"), where("userId", "==", userId), where("subjectId", "==", subjectId));
      const progressSnap = await getDocs(progressQ);
      const progressMap = new Map(progressSnap.docs.map(doc => [doc.data().videoId, doc.data() as VideoProgress]));

      // Build tree
      const treeSections = sections.map(section => {
        const sectionVideos = videos.filter(v => v.sectionId === section.id);
        return {
          ...section,
          videos: sectionVideos.map((video, index) => {
            const progress = progressMap.get(video.id);
            const isCompleted = progress?.isCompleted || false;
            
            // Locking logic: first video is unlocked, others require previous to be completed
            let locked = false;
            if (index > 0) {
              const prevVideo = sectionVideos[index - 1];
              const prevProgress = progressMap.get(prevVideo.id);
              locked = !(prevProgress?.isCompleted);
            } else if (sections.indexOf(section) > 0) {
              // Check last video of previous section
              const prevSection = sections[sections.indexOf(section) - 1];
              const prevSectionVideos = videos.filter(v => v.sectionId === prevSection.id);
              const lastVideoOfPrevSection = prevSectionVideos[prevSectionVideos.length - 1];
              const prevProgress = progressMap.get(lastVideoOfPrevSection.id);
              locked = !(prevProgress?.isCompleted);
            }

            return { ...video, isCompleted, locked };
          })
        };
      });

      return { id: subject.id, title: subject.title, sections: treeSections };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `subject_tree/${subjectId}`);
      return null;
    }
  },

  async getVideo(id: string): Promise<Video | null> {
    try {
      const docRef = doc(db, "videos", id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Video) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `videos/${id}`);
      return null;
    }
  },

  async updateProgress(userId: string, videoId: string, subjectId: string, lastPositionSeconds: number, isCompleted: boolean = false) {
    try {
      const progressId = `${userId}_${videoId}`;
      const docRef = doc(db, "video_progress", progressId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          lastPositionSeconds,
          isCompleted: isCompleted || docSnap.data().isCompleted,
          updatedAt: Date.now()
        });
      } else {
        await setDoc(docRef, {
          userId,
          videoId,
          subjectId,
          lastPositionSeconds,
          isCompleted,
          updatedAt: Date.now()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `video_progress/${userId}_${videoId}`);
    }
  },

  async getVideoProgress(userId: string, videoId: string): Promise<VideoProgress | null> {
    try {
      const progressId = `${userId}_${videoId}`;
      const docRef = doc(db, "video_progress", progressId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as VideoProgress) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `video_progress/${userId}_${videoId}`);
      return null;
    }
  },

  async getSearchHistory(userId: string): Promise<string[]> {
    try {
      const docRef = doc(db, "search_history", userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data().queries as string[]) : [];
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `search_history/${userId}`);
      return [];
    }
  },

  async updateSearchHistory(userId: string, queries: string[]) {
    try {
      const docRef = doc(db, "search_history", userId);
      await setDoc(docRef, {
        userId,
        queries,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `search_history/${userId}`);
    }
  },

  async enroll(userId: string, subjectId: string) {
    try {
      const enrollmentId = `${userId}_${subjectId}`;
      const docRef = doc(db, "enrollments", enrollmentId);
      await setDoc(docRef, {
        userId,
        subjectId,
        enrolledAt: Date.now(),
        status: "active"
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `enrollments/${userId}_${subjectId}`);
    }
  },

  async getEnrollment(userId: string, subjectId: string): Promise<Enrollment | null> {
    try {
      const enrollmentId = `${userId}_${subjectId}`;
      const docRef = doc(db, "enrollments", enrollmentId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Enrollment) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `enrollments/${userId}_${subjectId}`);
      return null;
    }
  },

  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    try {
      const q = query(collection(db, "enrollments"), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enrollment));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `enrollments/${userId}`);
      return [];
    }
  },

  async updateEnrollmentStatus(userId: string, subjectId: string, status: "active" | "completed") {
    try {
      const enrollmentId = `${userId}_${subjectId}`;
      const docRef = doc(db, "enrollments", enrollmentId);
      await updateDoc(docRef, { status, updatedAt: Date.now() });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `enrollments/${userId}_${subjectId}`);
    }
  }
};
