import { afterEach, describe, expect, test } from "vitest";
import {
  isEmail,
  isLocale,
  isOpaqueToken,
  isRole,
  isUuid,
  normalizeEmail,
  requestSource,
  safeErrorCode,
  siteUrl,
} from "../lib/workspace-invites/invite-service";

const originalSiteUrl = process.env.SITE_URL;

afterEach(() => {
  process.env.SITE_URL = originalSiteUrl;
});

describe("workspace invite input security", () => {
  test("accepts only 64-character lowercase hexadecimal opaque tokens", () => {
    expect(isOpaqueToken("a".repeat(64))).toBe(true);
    expect(isOpaqueToken("A".repeat(64))).toBe(false);
    expect(isOpaqueToken("a".repeat(63))).toBe(false);
  });

  test("validates UUIDs, locales, roles and normalized e-mail", () => {
    expect(isUuid("123e4567-e89b-42d3-a456-426614174000")).toBe(true);
    expect(isUuid("workspace-1")).toBe(false);
    expect(isLocale("pt-BR")).toBe(true);
    expect(isLocale("pt")).toBe(false);
    expect(isRole("administrador")).toBe(true);
    expect(isRole("super_administrador")).toBe(false);
    expect(normalizeEmail(" Person@Example.COM ")).toBe("person@example.com");
    expect(isEmail("person@example.com")).toBe(true);
    expect(isEmail("not-an-email")).toBe(false);
  });

  test("uses the first trusted forwarding address and never returns arbitrary error text", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.10, 10.0.0.1" });
    expect(requestSource(headers)).toBe("203.0.113.10");
    expect(safeErrorCode(new Error("secret database detail"))).toBe("internal_error");
    expect(safeErrorCode({ code: "provider_rate_limited!!!" })).toBe("provider_rate_limited");
  });

  test("rejects non-HTTPS production site URLs", () => {
    process.env.SITE_URL = "http://finance.example.com";
    expect(() => siteUrl()).toThrow("invalid_config:SITE_URL");
    process.env.SITE_URL = "https://finance.example.com/";
    expect(siteUrl().toString()).toBe("https://finance.example.com/");
  });
});
