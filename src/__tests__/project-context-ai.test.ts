import { describe, it, expect } from "vitest";
import { buildProjectContext } from "@/lib/utils/project-context";
import { Project } from "@/types/project";
import { Problem } from "@/types/problem";
import { StudentProfile } from "@/types/profile";

describe("Project Context for AI", () => {
  const mockProject: Project = {
    id: "proj-1",
    problemId: "prob-1",
    applicationId: "app-1",
    studentIds: ["s1", "s2"],
    mentorId: "m1",
    coordinatorId: "c1",
    title: "AI Assistant",
    status: "IN_PROGRESS",
    progress: 50,
    startDate: Date.now(),
    targetCompletionDate: Date.now() + 100000,
    // createdAt: "",
    updatedAt: Date.now()
  } as unknown as Project;

  const mockProblem: Problem = {
    id: "prob-1",
    title: "AI Assistant",
    // description: "",
    posterId: "poster-1",
    domain: "AI",
    requiredSkills: [],
    status: "PUBLISHED",
    verificationStatus: "VERIFIED",
    // createdAt: "",
    updatedAt: Date.now()
  } as unknown as Problem;

  const mockStudents: StudentProfile[] = [
    {
      userId: "s1",
      institutionId: "uni-1",
      department: "CS",
      skills: [],
      interests: [],
      // learningGoals: [],
      // completedProblems: 0,
      // createdAt: "",
      updatedAt: Date.now()
    } as unknown as StudentProfile
  ];

  it("removes PII from student profiles", () => {
    // Inject some fake PII that shouldn't be in the profile model, or verify standard fields are kept while others are stripped
    const context = buildProjectContext(
      mockProject,
      mockProblem,
      null,
      mockStudents,
      [],
      [],
      [],
      50,
      "ON_TRACK"
    );

    expect(context.team.members[0]).toHaveProperty("userId", "s1");
    // Ensure we don't accidentally leak other keys not in the mapping
    expect(context.team.members[0]).not.toHaveProperty("interests"); // 'interests' isn't explicitly mapped in buildProjectContext
  });
});
