import { z } from "zod";
import { SkillLevel } from "@/types/problem";

export const studentSkillSchema = z.object({
  skillId: z.string().min(1, "Skill ID is required"),
  level: z.nativeEnum(SkillLevel),
});

export const studentProfileSchema = z.object({
  institutionId: z.string().optional(),
  department: z.string().optional(),
  course: z.string().optional(),
  year: z.coerce.number().min(1).max(10).optional(),
  semester: z.coerce.number().min(1).max(20).optional(),
  skills: z.array(studentSkillSchema).max(30, "You can select up to 30 skills"),
  interests: z.array(z.string()).max(20, "You can select up to 20 interests"),
  preferredDomains: z.array(z.string()).max(5, "You can select up to 5 preferred domains"),
  resumeUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  shareResumeWithApplicants: z.boolean().default(false),
});

export type StudentProfileFormValues = z.infer<typeof studentProfileSchema>;
