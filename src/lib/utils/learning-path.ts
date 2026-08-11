import { StudentSkill } from "@/types/profile";
import { Problem, SkillRequirement, RequirementType } from "@/types/problem";
import { Task } from "@/types/task";
import { Milestone } from "@/types/milestone";
import { LearningPath } from "@/types/ai-mentor";
import { v4 as uuidv4 } from "uuid";

const PROFICIENCY_RANKS: Record<string, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4
};

function getProficiencyRank(level: string): number {
  return PROFICIENCY_RANKS[level?.toUpperCase()] || 0;
}

function extractSkillId(skill: string | StudentSkill): string {
  if (typeof skill === "string") return skill;
  return skill.skillId;
}

function extractSkillLevel(skill: string | StudentSkill): string {
  if (typeof skill === "string") return "NONE";
  return skill.level || "NONE";
}

export function generateLearningPath(
  studentId: string,
  projectId: string | null,
  studentSkillsInput: (string | StudentSkill)[],
  problemSkills: SkillRequirement[],
  tasks: Task[],
  milestones: Milestone[]
): LearningPath[] {
  const learningPaths: LearningPath[] = [];
  const processedSkills = new Set<string>();
  
  const problemReqs = problemSkills.filter(s => s.requirementType === RequirementType.REQUIRED);
  const problemPrefs = problemSkills.filter(s => s.requirementType === RequirementType.PREFERRED);

  const addPath = (skillId: string, targetLevel: string, reason: string, priority: number) => {
    if (processedSkills.has(skillId)) return;
    
    const existingSkill = studentSkillsInput.find(s => extractSkillId(s) === skillId);
    
    learningPaths.push({
      id: uuidv4(),
      studentId,
      projectId: projectId || undefined,
      targetSkillId: skillId,
      currentLevel: existingSkill ? extractSkillLevel(existingSkill) : "NONE",
      targetLevel,
      reason,
      recommendedResources: [`Review documentation for ${skillId}`],
      estimatedEffort: "4-8 hours",
      priority,
      status: "NOT_STARTED"
    });

    processedSkills.add(skillId);
  };

  problemReqs.forEach(req => {
    const studentSkill = studentSkillsInput.find(s => extractSkillId(s) === req.skillId);
    if (!studentSkill) {
      addPath(req.skillId, req.minimumLevel, `Missing required skill for this problem.`, 1);
    }
  });

  problemReqs.forEach(req => {
    const studentSkill = studentSkillsInput.find(s => extractSkillId(s) === req.skillId);
    if (studentSkill && getProficiencyRank(extractSkillLevel(studentSkill)) < getProficiencyRank(req.minimumLevel)) {
      addPath(req.skillId, req.minimumLevel, `Current proficiency is below the required level.`, 2);
    }
  });

  tasks.filter(t => t.status === "TODO" || t.status === "IN_PROGRESS").forEach(task => {
    const taskKeywords = (task.title + " " + (task.description || "")).toLowerCase();
    
    problemReqs.forEach(req => {
      if (taskKeywords.includes(req.skillId.toLowerCase())) {
        const studentSkill = studentSkillsInput.find(s => extractSkillId(s) === req.skillId);
        if (!studentSkill || getProficiencyRank(extractSkillLevel(studentSkill)) < getProficiencyRank(req.minimumLevel)) {
          addPath(req.skillId, req.minimumLevel, `Required for current task: ${task.title}`, 3);
        }
      }
    });
  });

  milestones.filter(m => m.status !== "COMPLETED").forEach(ms => {
    const msKeywords = (ms.title + " " + (ms.description || "")).toLowerCase();
    problemReqs.forEach(req => {
      if (msKeywords.includes(req.skillId.toLowerCase())) {
         const studentSkill = studentSkillsInput.find(s => extractSkillId(s) === req.skillId);
         if (!studentSkill || getProficiencyRank(extractSkillLevel(studentSkill)) < getProficiencyRank(req.minimumLevel)) {
            addPath(req.skillId, req.minimumLevel, `Required for upcoming milestone: ${ms.title}`, 4);
         }
      }
    });
  });

  problemPrefs.forEach(pref => {
    const studentSkill = studentSkillsInput.find(s => extractSkillId(s) === pref.skillId);
    if (!studentSkill) {
      addPath(pref.skillId, pref.minimumLevel || "BEGINNER", `Missing preferred skill for this problem.`, 5);
    }
  });

  problemPrefs.forEach(pref => {
    const studentSkill = studentSkillsInput.find(s => extractSkillId(s) === pref.skillId);
    if (studentSkill && getProficiencyRank(extractSkillLevel(studentSkill)) === 1) {
      addPath(pref.skillId, "INTERMEDIATE", `Improve preferred skill for better project outcomes.`, 6);
    }
  });

  return learningPaths.sort((a, b) => a.priority - b.priority);
}
