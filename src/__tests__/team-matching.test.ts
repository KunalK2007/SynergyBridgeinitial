/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { calculateTeamProblemFit } from '../lib/utils/team-matching';
import { StudentProfile } from '../types/profile';
import { UserRole } from "@/types/auth";
import { Problem, ProblemStatus, VerificationStatus, ProblemType, DifficultyLevel, GeographicScope, TeamPreference, RequirementType, SkillImportance, SkillLevel } from '../types/problem';

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

const baseStudent = (id: string): StudentProfile => ({
  userId: id,
  skills: [],
  interests: [],
  preferredDomains: [],
  shareResumeWithApplicants: false,
});

describe('team-matching', () => {

  it('combines max skills from multiple members', () => {
    const s1 = baseStudent("s1");
    s1.skills = [{ skillId: "python", level: SkillLevel.BEGINNER }];
    
    const s2 = baseStudent("s2");
    s2.skills = [{ skillId: "python", level: SkillLevel.ADVANCED }, { skillId: "react", level: SkillLevel.INTERMEDIATE }];

    const problem = {
      ...baseProblem,
      skills: [
        {
          skillId: "python", name: "Python", category: "Programming",
          requirementType: RequirementType.REQUIRED, importance: SkillImportance.REQUIRED,
          minimumLevel: SkillLevel.ADVANCED
        },
        {
          skillId: "react", name: "React", category: "Programming",
          requirementType: RequirementType.REQUIRED, importance: SkillImportance.REQUIRED,
          minimumLevel: SkillLevel.INTERMEDIATE
        }
      ]
    };

    const result = calculateTeamProblemFit([s1, s2], problem);
    
    expect(result.score).toBe(100);
    expect(result.missingSkills.length).toBe(0);
    expect(result.weakSkills.length).toBe(0);
    
    // Member contributions
    expect(result.memberContributions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ studentId: "s2", skillId: "python", level: SkillLevel.ADVANCED }),
        expect.objectContaining({ studentId: "s2", skillId: "react", level: SkillLevel.INTERMEDIATE })
      ])
    );
  });

  it('combines domains and interests', () => {
    const s1 = baseStudent("s1");
    s1.preferredDomains = ["Cybersecurity"];
    s1.interests = ["Security"];

    const s2 = baseStudent("s2");
    s2.preferredDomains = ["Artificial Intelligence"];
    s2.interests = ["Development"];

    const problem = {
      ...baseProblem, // domain: AI
      skills: [
        {
          skillId: "react", name: "React", category: "Development",
          requirementType: RequirementType.PREFERRED, importance: SkillImportance.IMPORTANT,
          minimumLevel: SkillLevel.BEGINNER
        }
      ]
    };

    const result = calculateTeamProblemFit([s1, s2], problem);
    expect(result.domainScore).toBe(100);
    expect(result.interestScore).toBe(100);
    expect(Math.round(result.score)).toBe(50); // Because they don't have React, they lose preferred, wait:
    // If they don't have react, preferred score is 0. 
    // active weights: preferred (20), domain (10), interest (10). total 40.
    // earned: domain (10) + interest (10) = 20. score = 50%.
    expect(Math.round(result.score)).toBe(50);
  });

  it('handles empty team', () => {
    const problem = { ...baseProblem };
    const result = calculateTeamProblemFit([], problem);
    expect(result.score).toBe(0);
  });
});
