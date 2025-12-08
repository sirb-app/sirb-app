import { describe, expect, it } from "vitest";

import { cn, stripTitlePrefix } from "./utils";

describe("cn", () => {
  it("merges class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional class names", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    expect(cn("foo", true && "bar", "baz")).toBe("foo bar baz");
  });

  it("handles undefined and null values", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
    expect(cn("foo", null, "bar")).toBe("foo bar");
  });

  it("merges tailwind classes correctly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles array inputs", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles object inputs", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
  });
});

describe("stripTitlePrefix", () => {
  it("removes المحتوى prefix with colon", () => {
    expect(stripTitlePrefix("المحتوى 1: Introduction")).toBe("Introduction");
    expect(stripTitlePrefix("المحتوى 10: Advanced Topic")).toBe(
      "Advanced Topic"
    );
  });

  it("removes المحتوى prefix with dash", () => {
    expect(stripTitlePrefix("المحتوى 1 - Introduction")).toBe("Introduction");
    expect(stripTitlePrefix("المحتوى 5 - Topic")).toBe("Topic");
  });

  it("removes الفصل prefix with colon", () => {
    expect(stripTitlePrefix("الفصل 1: Chapter One")).toBe("Chapter One");
    expect(stripTitlePrefix("الفصل 12: Final Chapter")).toBe("Final Chapter");
  });

  it("removes الفصل prefix with dash", () => {
    expect(stripTitlePrefix("الفصل 1 - Chapter One")).toBe("Chapter One");
    expect(stripTitlePrefix("الفصل 3 - Middle")).toBe("Middle");
  });

  it("handles titles without prefix", () => {
    expect(stripTitlePrefix("Regular Title")).toBe("Regular Title");
    expect(stripTitlePrefix("Introduction")).toBe("Introduction");
  });

  it("handles empty string", () => {
    expect(stripTitlePrefix("")).toBe("");
  });

  it("trims whitespace from result", () => {
    expect(stripTitlePrefix("المحتوى 1:   Spaced Title  ")).toBe(
      "Spaced Title"
    );
  });

  it("handles prefix without content after", () => {
    expect(stripTitlePrefix("المحتوى 1:")).toBe("");
    expect(stripTitlePrefix("الفصل 1:")).toBe("");
  });
});
