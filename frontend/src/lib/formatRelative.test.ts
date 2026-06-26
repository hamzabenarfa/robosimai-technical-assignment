import { describe, it, expect } from "vitest";
import { formatRelative } from "@/lib/formatRelative";

describe("formatRelative", () => {
  it("returns 'just now' for the current time", () => {
    expect(formatRelative(new Date().toISOString())).toBe("just now");
  });

  it("formats minutes", () => {
    const t = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatRelative(t)).toBe("5m ago");
  });

  it("formats hours", () => {
    const t = new Date(Date.now() - 3 * 3_600_000).toISOString();
    expect(formatRelative(t)).toBe("3h ago");
  });
});
