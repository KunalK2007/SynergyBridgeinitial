import { describe, it, expect } from 'vitest';
import { calculateProblemQuality } from '../lib/utils/problem-quality';
import { Problem, RequirementType, SkillImportance, SkillLevel, ConstraintType } from '../types/problem';

describe('Problem Quality Calculator', () => {
  it('should return 0 for an empty problem', () => {
    const emptyProblem: Partial<Problem> = {};
    const result = calculateProblemQuality(emptyProblem);
    expect(result.score).toBe(0);
    expect(result.missingAreas.length).toBe(10); // 10 criteria check
  });

  it('should return 100 for a perfectly complete problem', () => {
    const fullProblem: Partial<Problem> = {
      title: "This is a descriptive title",
      problemStatement: "A".repeat(50),
      whyItMatters: "A".repeat(20),
      expectedOutcome: "A".repeat(20),
      skills: [{ skillId: "python", name: "Python", category: "Programming", requirementType: RequirementType.REQUIRED, importance: SkillImportance.REQUIRED, minimumLevel: SkillLevel.INTERMEDIATE }],
      constraints: [{ type: ConstraintType.OTHER, description: "Budget constraint", severity: "HIGH" }],
      targetBeneficiaries: ["Farmers"],
      sdgs: [1, 2],
      estimatedDurationWeeks: 12,
      successCriteria: ["Measurable criteria"]
    };

    const result = calculateProblemQuality(fullProblem);
    expect(result.score).toBe(100);
    expect(result.missingAreas.length).toBe(0);
  });

  it('should appropriately subtract points for missing criteria', () => {
    const partialProblem: Partial<Problem> = {
      title: "Title is ok",
      problemStatement: "Too short", // under 50 chars -> 0
      // missing whyItMatters -> 0
      expectedOutcome: "A".repeat(20), // 15
      // missing required skills -> 0
      // missing constraints -> 0
      targetBeneficiaries: ["Farmers"], // 10
      // missing sdgs -> 0
      // missing timeline -> 0
      // missing success criteria -> 0
    };
    // 10 (title) + 0 + 0 + 15 (outcome) + 10 (beneficiaries) = 35
    const result = calculateProblemQuality(partialProblem);
    expect(result.score).toBe(35);
    expect(result.missingAreas).toContain("problemStatement");
    expect(result.missingAreas).toContain("whyItMatters");
    expect(result.missingAreas).toContain("requiredSkills");
  });
});
