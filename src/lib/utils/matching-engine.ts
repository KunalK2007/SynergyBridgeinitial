import { StudentProfile, StudentSkill } from "@/types/profile";
import { Problem, RequirementType, SkillLevel } from "@/types/problem";
import { SKILL_TAXONOMY } from "@/lib/constants/taxonomy";
import { calculateStudentProfileCompleteness } from "./profile-helpers";

export interface SkillGap {
  skillId: string;
  skillName: string;
  requiredLevel: SkillLevel;
  studentLevel: SkillLevel | null;
  type: "MISSING" | "WEAK";
}

export interface MatchedSkill {
  skillId: string;
  skillName: string;
  requiredLevel: SkillLevel;
  studentLevel: SkillLevel;
}

export interface ProblemFitResult {
  score: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  requiredSkillsScore: number;
  preferredSkillsScore: number;
  domainScore: number;
  interestScore: number;
  strengths: string[];
  gaps: SkillGap[];
  matchedSkills: MatchedSkill[];
  missingSkills: SkillGap[];
  weakSkills: SkillGap[];
  explanation: string[];
}

const LEVEL_VALUES: Record<SkillLevel, number> = {
  [SkillLevel.BEGINNER]: 1,
  [SkillLevel.INTERMEDIATE]: 2,
  [SkillLevel.ADVANCED]: 3,
  [SkillLevel.EXPERT]: 4,
};

const BASE_WEIGHTS = {
  REQUIRED_CAPABILITIES: 60,
  PREFERRED_CAPABILITIES: 20,
  DOMAIN_ALIGNMENT: 10,
  INTEREST_ALIGNMENT: 10,
};

function getSkillCategory(skillId: string): string | null {
  for (const [category, skills] of Object.entries(SKILL_TAXONOMY)) {
    if (skills.some((s) => s.id === skillId)) {
      return category;
    }
  }
  return null;
}

export function calculateProblemFit(student: StudentProfile, problem: Problem): ProblemFitResult {
  const result: ProblemFitResult = {
    score: 0,
    confidence: "LOW",
    requiredSkillsScore: 0,
    preferredSkillsScore: 0,
    domainScore: 0,
    interestScore: 0,
    strengths: [],
    gaps: [],
    matchedSkills: [],
    missingSkills: [],
    weakSkills: [],
    explanation: [],
  };

  const studentSkillsMap = new Map<string, SkillLevel>();
  (student.skills as StudentSkill[]).forEach((s) => {
    if (s.level && !s.needsConfirmation) {
      studentSkillsMap.set(s.skillId, s.level);
    }
  });

  const problemSkills = problem.skills || [];
  const requiredSkills = problemSkills.filter((s) => s.requirementType === RequirementType.REQUIRED);
  const preferredSkills = problemSkills.filter((s) => s.requirementType === RequirementType.PREFERRED);

  let activeWeights = 0;
  let earnedScore = 0;

  // 1. Required Skills
  if (requiredSkills.length > 0) {
    activeWeights += BASE_WEIGHTS.REQUIRED_CAPABILITIES;
    let totalSatisfaction = 0;

    requiredSkills.forEach((req) => {
      const studentLevel = studentSkillsMap.get(req.skillId);
      if (!studentLevel) {
        // MISSING
        result.missingSkills.push({
          skillId: req.skillId,
          skillName: req.name,
          requiredLevel: req.minimumLevel,
          studentLevel: null,
          type: "MISSING",
        });
      } else {
        const studentVal = LEVEL_VALUES[studentLevel];
        const reqVal = LEVEL_VALUES[req.minimumLevel];

        if (studentVal >= reqVal) {
          // MEETS or EXCEEDS
          totalSatisfaction += 100;
          result.matchedSkills.push({
            skillId: req.skillId,
            skillName: req.name,
            requiredLevel: req.minimumLevel,
            studentLevel: studentLevel,
          });

          if (studentVal > reqVal) {
            result.strengths.push(`Exceeds required proficiency in ${req.name}`);
          } else {
            result.strengths.push(`Meets required proficiency in ${req.name}`);
          }
        } else {
          // BELOW MINIMUM (WEAK)
          const diff = reqVal - studentVal;
          if (diff === 1) totalSatisfaction += 50;
          else if (diff === 2) totalSatisfaction += 25;
          else totalSatisfaction += 0;

          result.weakSkills.push({
            skillId: req.skillId,
            skillName: req.name,
            requiredLevel: req.minimumLevel,
            studentLevel: studentLevel,
            type: "WEAK",
          });
        }
      }
    });

    result.requiredSkillsScore = totalSatisfaction / requiredSkills.length;
    earnedScore += (result.requiredSkillsScore / 100) * BASE_WEIGHTS.REQUIRED_CAPABILITIES;
    result.explanation.push(
      `Required capabilities: ${Math.round(result.requiredSkillsScore)}% satisfaction (${result.matchedSkills.length}/${requiredSkills.length} matched)`
    );
  }

  // 2. Preferred Skills
  if (preferredSkills.length > 0) {
    activeWeights += BASE_WEIGHTS.PREFERRED_CAPABILITIES;
    let totalSatisfaction = 0;
    let preferredMatchedCount = 0;

    preferredSkills.forEach((req) => {
      const studentLevel = studentSkillsMap.get(req.skillId);
      if (!studentLevel) {
        // MISSING
        result.missingSkills.push({
          skillId: req.skillId,
          skillName: req.name,
          requiredLevel: req.minimumLevel,
          studentLevel: null,
          type: "MISSING",
        });
      } else {
        const studentVal = LEVEL_VALUES[studentLevel];
        const reqVal = LEVEL_VALUES[req.minimumLevel];

        if (studentVal >= reqVal) {
          totalSatisfaction += 100;
          preferredMatchedCount++;
          result.matchedSkills.push({
            skillId: req.skillId,
            skillName: req.name,
            requiredLevel: req.minimumLevel,
            studentLevel: studentLevel,
          });

          if (studentVal > reqVal) {
            result.strengths.push(`Exceeds preferred proficiency in ${req.name}`);
          } else {
            result.strengths.push(`Meets preferred proficiency in ${req.name}`);
          }
        } else {
          const diff = reqVal - studentVal;
          if (diff === 1) totalSatisfaction += 50;
          else if (diff === 2) totalSatisfaction += 25;
          else totalSatisfaction += 0;

          result.weakSkills.push({
            skillId: req.skillId,
            skillName: req.name,
            requiredLevel: req.minimumLevel,
            studentLevel: studentLevel,
            type: "WEAK",
          });
        }
      }
    });

    result.preferredSkillsScore = totalSatisfaction / preferredSkills.length;
    earnedScore += (result.preferredSkillsScore / 100) * BASE_WEIGHTS.PREFERRED_CAPABILITIES;
    
    result.explanation.push(
      `Preferred capabilities: ${Math.round(result.preferredSkillsScore)}% satisfaction (${preferredMatchedCount}/${preferredSkills.length} matched)`
    );
  }

  // 3. Domain Alignment
  if (problem.domain) {
    if (student.preferredDomains && student.preferredDomains.length > 0) {
      activeWeights += BASE_WEIGHTS.DOMAIN_ALIGNMENT;
      if (student.preferredDomains.includes(problem.domain)) {
        result.domainScore = 100;
        earnedScore += BASE_WEIGHTS.DOMAIN_ALIGNMENT;
        result.strengths.push(`Strong domain alignment with ${problem.domain}`);
        result.explanation.push(`Domain alignment: 100% (Matches preferred domain ${problem.domain})`);
      } else {
        result.domainScore = 0;
        result.explanation.push(`Domain alignment: 0% (Problem domain is ${problem.domain})`);
      }
    } else {
      // Excluded due to student not providing preferences (unavailable)
      // Do not add to activeWeights
    }
  }

  // 4. Interest Alignment
  const problemCategories = new Set<string>();
  problemSkills.forEach((s) => {
    const category = getSkillCategory(s.skillId);
    if (category) problemCategories.add(category);
  });

  if (problemCategories.size > 0) {
    if (student.interests && student.interests.length > 0) {
      activeWeights += BASE_WEIGHTS.INTEREST_ALIGNMENT;
      
      let matchCount = 0;
      problemCategories.forEach((cat) => {
        if (student.interests.includes(cat)) {
          matchCount++;
        }
      });

      result.interestScore = (matchCount / problemCategories.size) * 100;
      earnedScore += (result.interestScore / 100) * BASE_WEIGHTS.INTEREST_ALIGNMENT;
      result.explanation.push(`Interest alignment: ${Math.round(result.interestScore)}% (${matchCount}/${problemCategories.size} related categories matched)`);
      
      if (result.interestScore > 0) {
        result.strengths.push(`Aligned interests in relevant technology areas`);
      }
    } else {
      // Excluded due to student not providing interests (unavailable)
    }
  }

  // Calculate final normalized score
  if (activeWeights === 0) {
    result.score = 0; // Edge case: No data available to match
  } else {
    result.score = Math.round((earnedScore / activeWeights) * 100);
  }

  // Deduplicate strengths and limit to top ones
  result.strengths = Array.from(new Set(result.strengths));

  // Gaps aggregate
  result.gaps = [...result.missingSkills, ...result.weakSkills];

  // Confidence Calculation
  const completeness = calculateStudentProfileCompleteness(student);
  if (completeness >= 80) result.confidence = "HIGH";
  else if (completeness >= 40) result.confidence = "MEDIUM";
  else result.confidence = "LOW";

  return result;
}
