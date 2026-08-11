/* eslint-disable @typescript-eslint/no-explicit-any */
import { StudentProfile, StudentSkill, ApplicationCandidateProfile } from "@/types/profile";
import { User } from "@/types/auth";
import { SKILL_TAXONOMY } from "@/lib/constants/taxonomy";

// Build a fast lookup map for legacy skill migration (lowercase name -> id)
const skillNameMap = new Map<string, string>();
Object.values(SKILL_TAXONOMY).flat().forEach(skill => {
  skillNameMap.set(skill.name.toLowerCase(), skill.id);
});

/**
 * Deterministically normalizes a potentially legacy student profile.
 * Migrates `skills: string[]` to `StudentSkill[]`.
 * Marks unmapped skills as legacy and unconfirmed skills with `needsConfirmation: true`.
 */
export function normalizeStudentProfile(data: any): StudentProfile {
  const profile: StudentProfile = {
    userId: data?.userId || "",
    institutionId: data?.institutionId,
    department: data?.department,
    course: data?.course,
    year: data?.year,
    semester: data?.semester,
    skills: [],
    legacySkills: [],
    interests: data?.interests || [],
    preferredDomains: data?.preferredDomains || [],
    resumeUrl: data?.resumeUrl,
    shareResumeWithApplicants: data?.shareResumeWithApplicants || false,
  };

  if (Array.isArray(data?.skills)) {
    data.skills.forEach((skill: any) => {
      if (typeof skill === "string") {
        // Legacy string skill
        const normalizedStr = skill.trim().toLowerCase();
        const matchedId = skillNameMap.get(normalizedStr);
        if (matchedId) {
          // Exact or case-insensitive match found in taxonomy
          profile.skills.push({
            skillId: matchedId,
            needsConfirmation: true, // Requires user to assign a proficiency level
          });
        } else {
          // Unmapped legacy skill
          profile.legacySkills!.push(skill);
        }
      } else if (skill && typeof skill === "object" && typeof skill.skillId === "string") {
        // Already structured skill
        profile.skills.push(skill as StudentSkill);
      }
    });
  }

  // Deduplicate skills by ID
  const seenIds = new Set<string>();
  profile.skills = (profile.skills as StudentSkill[]).filter(s => {
    if (seenIds.has(s.skillId)) return false;
    seenIds.add(s.skillId);
    return true;
  });

  if (Array.isArray(data?.legacySkills)) {
    profile.legacySkills = Array.from(new Set([...profile.legacySkills!, ...data.legacySkills]));
  }

  return profile;
}

/**
 * Calculates profile completeness out of 100%.
 * Criteria:
 * - Academic info (institution, department, year): 20%
 * - At least 3 skills: 20%
 * - All skills have proficiency: 20%
 * - At least 1 interest: 20%
 * - At least 1 preferred domain: 20%
 */
export function calculateStudentProfileCompleteness(profile: Partial<StudentProfile>): number {
  let score = 0;

  // 1. Academic Info (20%)
  if (profile.institutionId && profile.department && profile.year) {
    score += 20;
  }

  // 2. Minimum skills (20%)
  const skills = (profile.skills || []) as StudentSkill[];
  if (skills.length >= 3) {
    score += 20;
  }

  // 3. Proficiency provided for all (20%)
  if (skills.length > 0 && skills.every(s => s.level !== undefined && !s.needsConfirmation)) {
    score += 20;
  }

  // 4. Interests (20%)
  if (Array.isArray(profile.interests) && profile.interests.length > 0) {
    score += 20;
  }

  // 5. Preferred Domains (20%)
  if (Array.isArray(profile.preferredDomains) && profile.preferredDomains.length > 0) {
    score += 20;
  }

  return score;
}

/**
 * Returns true only if the student has sufficient data for the SynergyBridge matching engine.
 */
export function isStudentProfileMatchReady(profile: Partial<StudentProfile>): boolean {
  const skills = (profile.skills || []) as StudentSkill[];
  
  if (skills.length < 1) return false;
  
  // Must have proficiency for all skills
  if (skills.some(s => s.level === undefined || s.needsConfirmation)) return false;

  // Must have at least one domain
  if (!Array.isArray(profile.preferredDomains) || profile.preferredDomains.length === 0) return false;

  return true;
}

/**
 * Generates an application-facing projection that safely strips private information.
 */
export function createCandidateProjection(
  userProfile: User,
  studentProfile: StudentProfile
): ApplicationCandidateProfile {
  return {
    studentId: studentProfile.userId,
    displayName: userProfile.displayName,
    institutionId: studentProfile.institutionId,
    department: studentProfile.department,
    course: studentProfile.course,
    year: studentProfile.year,
    skills: (studentProfile.skills || []) as StudentSkill[],
    interests: studentProfile.interests || [],
    preferredDomains: studentProfile.preferredDomains || [],
    resumeUrl: studentProfile.shareResumeWithApplicants ? studentProfile.resumeUrl : undefined,
  };
}
