export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'instructor' | 'admin';
}

export interface Subject {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  createdAt: number;
}

export interface Section {
  id: string;
  subjectId: string;
  title: string;
  orderIndex: number;
}

export interface Video {
  id: string;
  sectionId: string;
  subjectId: string;
  title: string;
  description: string;
  youtubeId: string;
  orderIndex: number;
  durationSeconds?: number;
}

export interface VideoProgress {
  userId: string;
  videoId: string;
  subjectId: string;
  lastPositionSeconds: number;
  isCompleted: boolean;
  updatedAt: number;
}

export interface Enrollment {
  id: string;
  userId: string;
  subjectId: string;
  enrolledAt: number;
  status: 'active' | 'completed';
}

export interface SubjectTree {
  id: string;
  title: string;
  sections: (Section & {
    videos: (Video & {
      isCompleted: boolean;
      locked: boolean;
    })[];
  })[];
}
