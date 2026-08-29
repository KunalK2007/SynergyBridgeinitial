import { describe, it, expect } from "vitest";
import { 
  calculateRate, 
  calculateAverage,
  applyPrivacySuppression,
  calculateApplicationAcceptanceRate,
  calculateProjectCompletionRate
} from "../lib/utils/analytics";

describe("Deterministic Analytics Utilities", () => {
  
  describe("calculateRate", () => {
    it("should calculate correct percentage", () => {
      const res = calculateRate(5, 10);
      expect(res.available).toBe(true);
      expect(res.value).toBe(50);
    });

    it("should handle zero denominator", () => {
      const res = calculateRate(0, 0);
      expect(res.available).toBe(false);
      expect(res.value).toBeNull();
      expect(res.reason).toBe("NO_DATA");
    });
    
    it("should handle full rate", () => {
      const res = calculateRate(10, 10);
      expect(res.value).toBe(100);
    });
  });

  describe("calculateAverage", () => {
    it("should calculate average correctly", () => {
      const res = calculateAverage([10, 20, 30]);
      expect(res.value).toBe(20);
    });

    it("should handle empty array", () => {
      const res = calculateAverage([]);
      expect(res.available).toBe(false);
      expect(res.value).toBeNull();
      expect(res.reason).toBe("NO_DATA");
    });
  });

  describe("applyPrivacySuppression", () => {
    it("should suppress when cohort is too small", () => {
      const metric = calculateRate(5, 10);
      const res = applyPrivacySuppression(metric, 4, 5); // cohort size 4 < 5
      expect(res.available).toBe(false);
      expect(res.value).toBeNull();
      expect(res.reason).toBe("INSUFFICIENT_COHORT");
    });

    it("should not suppress when cohort is sufficient", () => {
      const metric = calculateRate(5, 10);
      const res = applyPrivacySuppression(metric, 5, 5);
      expect(res.available).toBe(true);
      expect(res.value).toBe(50);
    });
    
    it("should not suppress for cohort > 5", () => {
      const metric = calculateRate(5, 10);
      const res = applyPrivacySuppression(metric, 10, 5);
      expect(res.available).toBe(true);
      expect(res.value).toBe(50);
    });
  });

  describe("Specific Helpers", () => {
    it("application acceptance 0/0", () => {
      expect(calculateApplicationAcceptanceRate(0, 0).value).toBeNull();
    });
    it("application acceptance 0/10", () => {
      expect(calculateApplicationAcceptanceRate(0, 10).value).toBe(0);
    });
    it("project completion partial", () => {
      expect(calculateProjectCompletionRate(2, 5).value).toBe(40);
    });
  });
});
