/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { calculateProblemFit } from '../lib/utils/matching-engine';
import { StudentProfile } from '../types/profile';
import { UserRole } from '@/types/auth';
import { Problem, ProblemStatus, VerificationStatus, ProblemType, DifficultyLevel, GeographicScope, TeamPreference, RequirementType, SkillImportance, SkillLevel } from '../types/problem';

// Helper to construct a base problem
const baseProblem: Problem = {
  id: "p1",
  title: "Test Problem",
  shortDescription: "desc",
  problemStatement: "statement",
  whyItMatters: "matters",
  expectedOutcome: "outcome",
  successCriteria: [],
  domain: "Artificial Intelligence",
  problemType: ProblemType.INDUSTRY,
  difficulty: DifficultyLevel.INTERMEDIATE,
  skills: [],
  tags: [],
  sdgs: [1],
  targetBeneficiaries: [],
  geographicScope: GeographicScope.LOCAL,
  constraints: [],
  teamPreference: TeamPreference.INDIVIDUAL,
  status: ProblemStatus.PUBLISHED,
  visibility: "PUBLIC",
  posterId: "poster1",
  posterRole: "INDUSTRY" as unknown as UserRole,
  verificationStatus: VerificationStatus.VERIFIED,
  createdAt: 0,
  updatedAt: 0,
};

const baseStudent: StudentProfile = {
  userId: "student1",
  skills: [],
  interests: [],
  preferredDomains: [],
  shareResumeWithApplicants: false,
};

describe('matching-engine calculateProblemFit', () => {

  it('handles exact required skill match (100% satisfaction)', () => {
    const student = {
      ...baseStudent,
      skills: [{ skillId: "python", level: SkillLevel.INTERMEDIATE }]
    };
    const problem = {
      ...baseProblem,
      skills: [{
        skillId: "python", name: "Python", category: "Programming",
        requirementType: RequirementType.REQUIRED, importance: SkillImportance.REQUIRED,
        minimumLevel: SkillLevel.INTERMEDIATE
      }]
    };
    
    const result = calculateProblemFit(student, problem);
    // Problem has only 1 required skill, no preferred, no domain (since student has no preferred domain, it's excluded), no interests.
    // So 60 weight active. Satisfaction is 100%. Normalize -> 100% total score.
    expect(result.requiredSkillsScore).toBe(100);
    expect(result.score).toBe(100);
    expect(result.missingSkills.length).toBe(0);
    expect(result.weakSkills.length).toBe(0);
  });

  it('handles missing required skill (0% satisfaction)', () => {
    const student = { ...baseStudent };
    const problem = {
      ...baseProblem,
      skills: [{
        skillId: "python", name: "Python", category: "Programming",
        requirementType: RequirementType.REQUIRED, importance: SkillImportance.REQUIRED,
        minimumLevel: SkillLevel.INTERMEDIATE
      }]
    };
    
    const result = calculateProblemFit(student, problem);
    expect(result.requiredSkillsScore).toBe(0);
    expect(result.score).toBe(0);
    expect(result.missingSkills.length).toBe(1);
    expect(result.missingSkills[0].skillId).toBe("python");
    expect(result.gaps.length).toBe(1);
  });

  it('handles 1-level-below requirement (50% satisfaction)', () => {
    const student = {
      ...baseStudent,
      skills: [{ skillId: "python", level: SkillLevel.BEGINNER }]
    };
    const problem = {
      ...baseProblem,
      skills: [{
        skillId: "python", name: "Python", category: "Programming",
        requirementType: RequirementType.REQUIRED, importance: SkillImportance.REQUIRED,
        minimumLevel: SkillLevel.INTERMEDIATE
      }]
    };
    
    const result = calculateProblemFit(student, problem);
    expect(result.requiredSkillsScore).toBe(50);
    expect(result.score).toBe(50);
    expect(result.weakSkills.length).toBe(1);
    expect(result.weakSkills[0].type).toBe("WEAK");
  });

  it('handles 2-level-below requirement (25% satisfaction)', () => {
    const student = {
      ...baseStudent,
      skills: [{ skillId: "python", level: SkillLevel.BEGINNER }]
    };
    const problem = {
      ...baseProblem,
      skills: [{
        skillId: "python", name: "Python", category: "Programming",
        requirementType: RequirementType.REQUIRED, importance: SkillImportance.REQUIRED,
        minimumLevel: SkillLevel.ADVANCED
      }]
    };
    
    const result = calculateProblemFit(student, problem);
    expect(result.requiredSkillsScore).toBe(25);
    expect(result.score).toBe(25);
  });

  it('handles 3-level-below requirement (0% satisfaction)', () => {
    const student = {
      ...baseStudent,
      skills: [{ skillId: "python", level: SkillLevel.BEGINNER }]
    };
    const problem = {
      ...baseProblem,
      skills: [{
        skillId: "python", name: "Python", category: "Programming",
        requirementType: RequirementType.REQUIRED, importance: SkillImportance.REQUIRED,
        minimumLevel: SkillLevel.EXPERT
      }]
    };
    
    const result = calculateProblemFit(student, problem);
    expect(result.requiredSkillsScore).toBe(0);
    expect(result.score).toBe(0);
  });

  it('handles exceeds minimum (100% satisfaction and strength generated)', () => {
    const student = {
      ...baseStudent,
      skills: [{ skillId: "python", level: SkillLevel.ADVANCED }]
    };
    const problem = {
      ...baseProblem,
      skills: [{
        skillId: "python", name: "Python", category: "Programming",
        requirementType: RequirementType.REQUIRED, importance: SkillImportance.REQUIRED,
        minimumLevel: SkillLevel.INTERMEDIATE
      }]
    };
    
    const result = calculateProblemFit(student, problem);
    expect(result.requiredSkillsScore).toBe(100);
    expect(result.score).toBe(100);
    expect(result.strengths.some(s => s.includes("Exceeds"))).toBe(true);
  });

  it('tests dynamic normalization with all dimensions missing', () => {
    const student = { ...baseStudent };
    const problem = { ...baseProblem };
    
    const result = calculateProblemFit(student, problem);
    // No required skills, no preferred skills, no domain on student, no interests on student.
    // Active weight = 0, score = 0
    expect(result.score).toBe(0);
  });

  it('tests domain match', () => {
    const student = {
      ...baseStudent,
      preferredDomains: ["Artificial Intelligence"]
    };
    const problem = { ...baseProblem }; // Has domain: Artificial Intelligence
    
    const result = calculateProblemFit(student, problem);
    // Only Domain Alignment is active (weight 10). Score should be 10/10 * 100 = 100%
    expect(result.domainScore).toBe(100);
    expect(result.score).toBe(100);
  });

  it('tests domain mismatch', () => {
    const student = {
      ...baseStudent,
      preferredDomains: ["Cybersecurity"]
    };
    const problem = { ...baseProblem }; // Has domain: Artificial Intelligence
    
    const result = calculateProblemFit(student, problem);
    expect(result.domainScore).toBe(0);
    expect(result.score).toBe(0);
  });

  it('tests interest category overlap', () => {
    const student = {
      ...baseStudent,
      interests: ["Programming", "Design"]
    };
    const problem = {
      ...baseProblem,
      skills: [{
        skillId: "python", name: "Python", category: "Programming",
        requirementType: RequirementType.PREFERRED, importance: SkillImportance.IMPORTANT,
        minimumLevel: SkillLevel.BEGINNER
      }]
    };
    // Active weights: Preferred Skills (20) + Interest (10)
    // No python skill -> Preferred score = 0
    // Interest matches "Programming" -> Interest score = 100
    // Total earned: 0 + 10 = 10. Total active: 30. Score: 10/30 = 33%
    const result = calculateProblemFit(student, problem);
    expect(result.interestScore).toBe(100);
    expect(result.preferredSkillsScore).toBe(0);
    expect(Math.round(result.score)).toBe(33);
  });
  
  it('determines missing vs weak gap classification accurately', () => {
    const student = {
      ...baseStudent,
      skills: [{ skillId: "react", level: SkillLevel.BEGINNER }]
    };
    const problem = {
      ...baseProblem,
      skills: [
        {
          skillId: "python", name: "Python", category: "Programming",
          requirementType: RequirementType.REQUIRED, importance: SkillImportance.REQUIRED,
          minimumLevel: SkillLevel.INTERMEDIATE
        },
        {
          skillId: "react", name: "React", category: "Development",
          requirementType: RequirementType.REQUIRED, importance: SkillImportance.REQUIRED,
          minimumLevel: SkillLevel.INTERMEDIATE
        }
      ]
    };
    
    const result = calculateProblemFit(student, problem);
    expect(result.missingSkills.length).toBe(1);
    expect(result.missingSkills[0].skillId).toBe("python");
    
    expect(result.weakSkills.length).toBe(1);
    expect(result.weakSkills[0].skillId).toBe("react");
    
    expect(result.gaps.length).toBe(2);
  });

  it('determines confidence based on completeness', () => {
    // Empty profile
    const studentEmpty = { ...baseStudent };
    expect(calculateProblemFit(studentEmpty, baseProblem).confidence).toBe("LOW");

    // Full profile
    const studentFull = {
      ...baseStudent,
      institutionId: "inst_1",
      department: "CS",
      year: 3,
      skills: [
        { skillId: "s1", level: SkillLevel.ADVANCED },
        { skillId: "s2", level: SkillLevel.BEGINNER },
        { skillId: "s3", level: SkillLevel.INTERMEDIATE }
      ],
      interests: ["AI", "Web"],
      preferredDomains: ["Healthcare"]
    };
    expect(calculateProblemFit(studentFull, baseProblem).confidence).toBe("HIGH");
  });
});
