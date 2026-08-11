import { describe, it, expect, vi, beforeEach } from "vitest";
import { canAccessProject, canModifyProject } from "@/lib/server/auth-helpers";
import { UserRole } from "@/types/auth";
import { adminDb } from "@/lib/firebase/admin";

const mockGet = vi.fn();

vi.mock("@/lib/firebase/admin", () => {
  return {
    adminDb: {
      collection: () => ({
        doc: () => ({
          get: mockGet
        })
      })
    },
    adminAuth: {
      verifyIdToken: vi.fn()
    }
  };
});

describe("Security Boundaries", () => {
  const mockProject = {
    id: "proj_1",
    title: "Secure Project",
    studentIds: ["student_1"],
    mentorId: "mentor_1",
    coordinatorId: "coord_1",
  };

  beforeEach(() => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => mockProject
    });
  });

  it("should allow ADMIN to access any project", async () => {
    const hasAccess = await canAccessProject("admin_uid", UserRole.ADMIN, "proj_1");
    expect(hasAccess).toBe(true);
  });

  it("should allow assigned STUDENT to access project", async () => {
    const hasAccess = await canAccessProject("student_1", UserRole.STUDENT, "proj_1");
    expect(hasAccess).toBe(true);
  });

  it("should deny unassigned STUDENT access to project", async () => {
    const hasAccess = await canAccessProject("student_x", UserRole.STUDENT, "proj_1");
    expect(hasAccess).toBe(false);
  });

  it("should allow assigned MENTOR to modify project", async () => {
    const canModify = await canModifyProject("mentor_1", UserRole.MENTOR, "proj_1");
    expect(canModify).toBe(true);
  });

  it("should deny unassigned MENTOR modifying project", async () => {
    const canModify = await canModifyProject("mentor_x", UserRole.MENTOR, "proj_1");
    expect(canModify).toBe(false);
  });
});
