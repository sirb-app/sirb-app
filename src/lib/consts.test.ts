import { describe, expect, it } from "vitest";

import { USER_VALIDATION } from "./consts";

describe("USER_VALIDATION", () => {
  it("has minimum name length defined", () => {
    expect(USER_VALIDATION.MIN_NAME_LENGTH).toBeDefined();
    expect(typeof USER_VALIDATION.MIN_NAME_LENGTH).toBe("number");
  });

  it("has maximum name length defined", () => {
    expect(USER_VALIDATION.MAX_NAME_LENGTH).toBeDefined();
    expect(typeof USER_VALIDATION.MAX_NAME_LENGTH).toBe("number");
  });

  it("minimum name length is positive", () => {
    expect(USER_VALIDATION.MIN_NAME_LENGTH).toBeGreaterThan(0);
  });

  it("maximum name length is greater than minimum", () => {
    expect(USER_VALIDATION.MAX_NAME_LENGTH).toBeGreaterThan(
      USER_VALIDATION.MIN_NAME_LENGTH
    );
  });

  it("maximum name length is reasonable", () => {
    expect(USER_VALIDATION.MAX_NAME_LENGTH).toBeLessThanOrEqual(100);
  });

  it("minimum name length allows short names", () => {
    expect(USER_VALIDATION.MIN_NAME_LENGTH).toBeLessThanOrEqual(3);
  });
});
