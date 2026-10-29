import { describe, expect, it } from "vitest";
import { skipOrNeed, endSemNeeded, sgpaNeeded, attendanceStats } from "./calc";

describe("attendance rules", () => {
  it("skippable = floor(A*100/T) - H when safe", () => {
    expect(skipOrNeed(40, 50, 75).skip).toBe(3);
  });
  it("needed in a row = ceil((T*H - 100A)/(100-T)) when short", () => {
    expect(skipOrNeed(30, 45, 75).need).toBe(15);
  });
  it("cancelled classes are not counted and opening balance is included", () => {
    const s = { id: "a", name: "X", code: "", openAttended: 8, openHeld: 10 };
    const st = attendanceStats(s, [
      { id: "1", subjectId: "a", date: "2026-01-01", status: "present" },
      { id: "2", subjectId: "a", date: "2026-01-02", status: "cancelled" },
      { id: "3", subjectId: "a", date: "2026-01-03", status: "absent" },
    ]);
    expect(st.attended).toBe(9);
    expect(st.held).toBe(12);
  });
});

describe("academics", () => {
  it("end-sem needed with 40/60 weights", () => {
    // 30/40 internal = 30 of 40 weight; need 50 total → 20 of 60 → 33.3 of 100
    expect(endSemNeeded(30, 40, 100, 40, 60, 50)).toBeCloseTo(33.33, 1);
  });
  it("SGPA needed for target CGPA", () => {
    expect(sgpaNeeded(8, 40, 8.5, 20)).toBeCloseTo(9.5, 5);
  });
});
