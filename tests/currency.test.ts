import { beforeEach, describe, expect, it, vi } from "vitest";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("getDolarQuote", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("returns the primary quote with its market timestamp", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        rates: { BRL: 4.989911 },
        time_last_update_unix: 1_791_849_451,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getDolarQuote } = await import("../api/utils/currency");
    const quote = await getDolarQuote();

    expect(quote).toMatchObject({
      status: "available",
      rate: 4.989911,
      source: "exchange-rate-api",
      sourceLabel: "ExchangeRate-API",
      marketUpdatedAt: "2026-10-12T23:57:31.000Z",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("uses AwesomeAPI when the primary source fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(
        jsonResponse({
          USDBRL: { bid: "5.12", timestamp: "1791849451" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { getDolarQuote } = await import("../api/utils/currency");
    const quote = await getDolarQuote();

    expect(quote).toMatchObject({
      status: "available",
      rate: 5.12,
      source: "awesome-api",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns an explicit unavailable state instead of a fake current rate", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse({}, 503));
    vi.stubGlobal("fetch", fetchMock);

    const { getDolarQuote } = await import("../api/utils/currency");
    const quote = await getDolarQuote();

    expect(quote).toMatchObject({
      status: "unavailable",
      rate: null,
      source: null,
      marketUpdatedAt: null,
    });
  });
});
