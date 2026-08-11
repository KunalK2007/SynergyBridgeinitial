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

export const skillRequirementSchema = z.object({
  skillId: z.string().min(1, "Skill ID is required"),
  name: z.string().min(1, "Skill name is required"),
  category: z.string(),
  requirementType: z.nativeEnum(RequirementType),
  importance: z.nativeEnum(SkillImportance),
  minimumLevel: z.nativeEnum(SkillLevel),
});

export const constraintSchema = z.object({
  type: z.nativeEnum(ConstraintType),
  description: z.string().min(1, "Description is required"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export const problemSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title is too long"),
  shortDescription: z.string().min(10, "Short description is required").max(300),
  problemStatement: z.string().min(20, "Problem statement needs more detail"),
  whyItMatters: z.string().min(20, "Please explain why this matters"),
  expectedOutcome: z.string().min(20, "Please provide the expected outcome"),
  successCriteria: z.array(z.string().min(5, "Criterion too short")),
  
  domain: z.string().min(1, "Domain is required"),
  subDomain: z.string().optional(),
  problemType: z.nativeEnum(ProblemType),
  difficulty: z.nativeEnum(DifficultyLevel),
  
  skills: z.array(skillRequirementSchema),
  tags: z.array(z.string()),
  
  sdgs: z.array(z.number().min(1).max(17)),
  targetBeneficiaries: z.array(z.string()),
  geographicScope: z.nativeEnum(GeographicScope),
  region: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  
  constraints: z.array(constraintSchema),
  teamPreference: z.nativeEnum(TeamPreference),
  minTeamSize: z.number().min(1).optional(),
  maxTeamSize: z.number().max(20).optional(),
  estimatedDurationWeeks: z.number().min(1).optional(),
  deadline: z.number().optional(), // timestamp
  
  funding: z.object({
    fundingEnabled: z.boolean(),
    fundingAmount: z.number().optional(),
    fundingCurrency: z.string().optional(),
    fundingDescription: z.string().optional(),
  }).optional(),
}).refine(data => {
  if (data.minTeamSize && data.maxTeamSize) {
    return data.minTeamSize <= data.maxTeamSize;
  }
  return true;
}, {
  message: "Minimum team size cannot be greater than maximum team size",
  path: ["maxTeamSize"]
});

export type ProblemFormValues = z.infer<typeof problemSchema>;
