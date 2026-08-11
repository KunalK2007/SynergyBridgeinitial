import { describe, it, expect } from 'vitest';
import { 
  normalizeStudentProfile, 
  calculateStudentProfileCompleteness, 
  isStudentProfileMatchReady 
} from '../lib/utils/profile-helpers';
import { SkillLevel } from '../types/problem';
import { StudentProfile } from '../types/profile';

describe('Profile Helpers', () => {
  
  describe('normalizeStudentProfile', () => {
    it('should map legacy string array skills to taxonomy if they match', () => {
      const legacyData = {
        userId: "123",
        skills: ["Python", "react", "Some Random Skill"]
      };

      const profile = normalizeStudentProfile(legacyData);
      
      // 'python' and 'react' should be recognized in SKILL_TAXONOMY
      expect(profile.skills.length).toBe(2);
      expect(profile.skills[0]).toEqual({ skillId: "python", needsConfirmation: true });
      expect(profile.skills[1]).toEqual({ skillId: "react", needsConfirmation: true });
      
      // 'Some Random Skill' should be thrown into legacy
      expect(profile.legacySkills).toContain("Some Random Skill");
    });

    it('should deduplicate taxonomy skills', () => {
      const data = {
        userId: "123",
        skills: ["python", "Python", { skillId: "python", level: SkillLevel.ADVANCED }]
      };
      
      const profile = normalizeStudentProfile(data);
      expect(profile.skills.length).toBe(1);
    });
  });

  describe('calculateStudentProfileCompleteness', () => {
    it('should return 0 for an empty profile', () => {
      const profile: Partial<StudentProfile> = {};
      expect(calculateStudentProfileCompleteness(profile)).toBe(0);
    });

    it('should return 100 for a fully complete profile', () => {
      const fullProfile: Partial<StudentProfile> = {
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

      expect(calculateStudentProfileCompleteness(fullProfile)).toBe(100);
    });
    
    it('should calculate partial scores correctly', () => {
      const partialProfile: Partial<StudentProfile> = {
        institutionId: "inst_1",
        department: "CS",
        year: 3,
        skills: [
          { skillId: "s1" }, // No level, needs confirmation
          { skillId: "s2", level: SkillLevel.BEGINNER }
        ]
      };
      
      // Academic (20) + Minimum skills (0, length is 2) + Proficiency (0, one is missing) + Interests (0) + Domains (0)
      expect(calculateStudentProfileCompleteness(partialProfile)).toBe(20);
    });
  });

  describe('isStudentProfileMatchReady', () => {
    it('should return false if no skills', () => {
      const profile: Partial<StudentProfile> = { preferredDomains: ["Healthcare"] };
      expect(isStudentProfileMatchReady(profile)).toBe(false);
    });

    it('should return false if missing proficiency', () => {
      const profile: Partial<StudentProfile> = {
        skills: [{ skillId: "s1" }], // Missing level
        preferredDomains: ["Healthcare"]
      };
      expect(isStudentProfileMatchReady(profile)).toBe(false);
    });

    it('should return false if missing domain', () => {
      const profile: Partial<StudentProfile> = {
        skills: [{ skillId: "s1", level: SkillLevel.ADVANCED }]
      };
      expect(isStudentProfileMatchReady(profile)).toBe(false);
    });

    it('should return true for a valid match-ready profile', () => {
      const profile: Partial<StudentProfile> = {
        skills: [{ skillId: "s1", level: SkillLevel.ADVANCED }],
        preferredDomains: ["Healthcare"]
      };
      expect(isStudentProfileMatchReady(profile)).toBe(true);
    });
  });
});
