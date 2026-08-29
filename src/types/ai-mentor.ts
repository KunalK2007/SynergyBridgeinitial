export interface MentorConversation {
  id: string;
  projectId: string | null; // null if it's a general conversation not tied to a specific project yet
  studentId: string;
  title: string;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: number;
  updatedAt: number;
}

export interface MentorMessage {
  id: string;
  conversationId: string;
  projectId: string | null;
  studentId: string;
  role: "STUDENT" | "AI";
  content: string;
  contextVersion: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface MentorRecommendation {
  id: string;
  projectId: string;
  studentId: string;
  type: "SKILL_GAP" | "TASK_BLOCKER" | "HEALTH_RISK" | "MILESTONE_PLANNING" | "GENERAL";
  title: string;
  description: string;
  relatedSkillId?: string;
  relatedTaskId?: string;
  relatedMilestoneId?: string;
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  status: "ACTIVE" | "COMPLETED" | "DISMISSED";
  createdAt: number;
}

export interface LearningPath {
  id: string;
  studentId: string;
  projectId?: string;
  targetSkillId: string;
  currentLevel: string;
  targetLevel: string;
  reason: string;
  recommendedResources: string[];
  estimatedEffort: string;
  priority: number; // 1 = highest
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}
