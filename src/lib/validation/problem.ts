import { z } from 'zod';
import { 
  ProblemType, 
  DifficultyLevel, 
  GeographicScope, 
  TeamPreference,
  RequirementType,
  SkillImportance,
  SkillLevel,
  ConstraintType
} from '@/types/problem';

const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((val) => {
    if (val === "" || val === null || val === undefined || (typeof val === "number" && Number.isNaN(val))) {
      return undefined;
    }
    const num = Number(val);
    return Number.isNaN(num) ? undefined : num;
  }, schema.optional());

export const skillRequirementSchema = z.object({
  skillId: z.string().min(1, "Skill ID is required"),
  name: z.string().min(1, "Skill name is required"),
  category: z.string().default("General"),
  requirementType: z.nativeEnum(RequirementType).default(RequirementType.REQUIRED),
  importance: z.nativeEnum(SkillImportance).default(SkillImportance.REQUIRED),
  minimumLevel: z.nativeEnum(SkillLevel).default(SkillLevel.INTERMEDIATE),
});

export const constraintSchema = z.object({
  type: z.nativeEnum(ConstraintType),
  description: z.string().min(1, "Description is required"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

export const problemSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title is too long"),
  shortDescription: z.string().min(10, "Short description must be at least 10 characters").max(300),
  problemStatement: z.string().min(20, "Problem statement must be at least 20 characters"),
  whyItMatters: z.string().min(20, "Please explain why this matters in at least 20 characters"),
  expectedOutcome: z.string().min(20, "Expected outcome must be at least 20 characters"),
  successCriteria: z.array(z.string().min(3, "Criterion too short")).default([]),
  
  domain: z.string().min(1, "Domain is required"),
  subDomain: z.string().optional(),
  problemType: z.nativeEnum(ProblemType, { message: "Please select a problem type" }),
  difficulty: z.nativeEnum(DifficultyLevel, { message: "Please select a difficulty level" }),
  
  skills: z.array(skillRequirementSchema).default([]),
  tags: z.array(z.string()).default([]),
  
  sdgs: z.array(z.number().min(1).max(17)).default([]),
  targetBeneficiaries: z.array(z.string()).default([]),
  geographicScope: z.nativeEnum(GeographicScope, { message: "Please select a geographic scope" }),
  region: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  
  constraints: z.array(constraintSchema).default([]),
  teamPreference: z.nativeEnum(TeamPreference, { message: "Please select team preference" }).default(TeamPreference.ANY),
  minTeamSize: optionalNumber(z.number().min(1)),
  maxTeamSize: optionalNumber(z.number().max(20)),
  estimatedDurationWeeks: optionalNumber(z.number().min(1)),
  deadline: optionalNumber(z.number()), // timestamp
  
  funding: z.object({
    fundingEnabled: z.boolean().default(false),
    fundingAmount: optionalNumber(z.number().min(0)),
    fundingCurrency: z.string().default("INR"),
    fundingDescription: z.string().optional(),
  }).optional().default({ fundingEnabled: false, fundingCurrency: "INR" }),
}).refine(data => {
  if (data.minTeamSize && data.maxTeamSize) {
    return data.minTeamSize <= data.maxTeamSize;
  }
  return true;
}, {
  message: "Minimum team size cannot be greater than maximum team size",
  path: ["maxTeamSize"]
});

export const draftProblemSchema = z.object({
  title: z.string().optional().default(""),
  shortDescription: z.string().optional().default(""),
  problemStatement: z.string().optional().default(""),
  whyItMatters: z.string().optional().default(""),
  expectedOutcome: z.string().optional().default(""),
  successCriteria: z.array(z.string()).optional().default([]),
  domain: z.string().optional().default(""),
  subDomain: z.string().optional(),
  problemType: z.string().optional(),
  difficulty: z.string().optional(),
  skills: z.array(z.any()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  sdgs: z.array(z.number()).optional().default([]),
  targetBeneficiaries: z.array(z.string()).optional().default([]),
  geographicScope: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  constraints: z.array(z.any()).optional().default([]),
  teamPreference: z.string().optional(),
  minTeamSize: optionalNumber(z.number()),
  maxTeamSize: optionalNumber(z.number()),
  estimatedDurationWeeks: optionalNumber(z.number()),
  funding: z.any().optional(),
});

export type ProblemFormValues = z.infer<typeof problemSchema>;
