import { StudentProfile, StudentSkill } from "@/types/profile";
import { Problem, RequirementType, SkillLevel } from "@/types/problem";
import { calculateProblemFit, ProblemFitResult, SkillGap, MatchedSkill } from "./matching-engine";
import { SKILL_TAXONOMY } from "@/lib/constants/taxonomy";

export interface MemberContribution {
  studentId: string;
  skillId: string;
  level: SkillLevel;
}

export interface TeamProblemFitResult extends ProblemFitResult {
  memberContributions: MemberContribution[];
}

const LEVEL_VALUES: Record<SkillLevel, number> = {
  [SkillLevel.BEGINNER]: 1,
  [SkillLevel.INTERMEDIATE]: 2,
  [SkillLevel.ADVANCED]: 3,
  [SkillLevel.EXPERT]: 4,
};

export function calculateTeamProblemFit(
  members: StudentProfile[],
  problem: Problem
): TeamProblemFitResult {
  
  // 1. Create a synthetic "Super Profile" representing the best of the team
  const combinedSkillsMap = new Map<string, { level: SkillLevel; contributors: string[] }>();
  const combinedDomains = new Set<string>();
  const combinedInterests = new Set<string>();
  
  members.forEach(member => {
    // Collect domains & interests
    if (member.preferredDomains) {
      member.preferredDomains.forEach(d => combinedDomains.add(d));
    }
    if (member.interests) {
      member.interests.forEach(i => combinedInterests.add(i));
    }
    
    // Collect best skills
    const skills = (member.skills as StudentSkill[]) || [];
    skills.forEach(skill => {
      if (!skill.level || skill.needsConfirmation) return;
      
      const existing = combinedSkillsMap.get(skill.skillId);
      if (!existing) {
        combinedSkillsMap.set(skill.skillId, { level: skill.level, contributors: [member.userId] });
      } else {
        const existingVal = LEVEL_VALUES[existing.level];
        const newVal = LEVEL_VALUES[skill.level];
        if (newVal > existingVal) {
          // Replace with higher level contributor
          combinedSkillsMap.set(skill.skillId, { level: skill.level, contributors: [member.userId] });
        } else if (newVal === existingVal) {
          // Add contributor to tie
          existing.contributors.push(member.userId);
        }
      }
    });
  });
  
  const syntheticSkills: StudentSkill[] = Array.from(combinedSkillsMap.entries()).map(([skillId, data]) => ({
    skillId,
    level: data.level
  }));
  
  const syntheticProfile: StudentProfile = {
    userId: "team_synthetic",
    skills: syntheticSkills,
    preferredDomains: Array.from(combinedDomains),
    interests: Array.from(combinedInterests),
    shareResumeWithApplicants: false,
    // Add artificial completeness so team confidence is HIGH if they have data
    institutionId: "inst",
    department: "dept",
  };
  
  // 2. Calculate fit using the core deterministic engine
  const baseResult = calculateProblemFit(syntheticProfile, problem);
  
  // 3. Map member contributions for required and preferred skills
  const memberContributions: MemberContribution[] = [];
  
  baseResult.matchedSkills.forEach(match => {
    const data = combinedSkillsMap.get(match.skillId);
    if (data) {
      data.contributors.forEach(contributor => {
        memberContributions.push({
          studentId: contributor,
          skillId: match.skillId,
          level: data.level
        });
      });
    }
  });

  baseResult.weakSkills.forEach(weak => {
    const data = combinedSkillsMap.get(weak.skillId);
    if (data) {
      data.contributors.forEach(contributor => {
        memberContributions.push({
          studentId: contributor,
          skillId: weak.skillId,
          level: data.level
        });
      });
    }
  });
  
  return {
    ...baseResult,
    memberContributions
  };
}
