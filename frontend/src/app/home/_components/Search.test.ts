import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { httpGet } = vi.hoisted(() => ({
  httpGet: vi.fn(),
}));

vi.mock("@/_lib/server/query-api", () => ({ httpGet }));

import Search from "./Search";

describe("Search", () => {
  beforeEach(() => {
    httpGet.mockReset();
  });

  it("renders Nothing found for a genuinely empty API page", async () => {
    httpGet.mockResolvedValue(jsonResponse({ hasMore: false, items: [] }));

    const markup = renderToStaticMarkup(await Search({
      searchParams: Promise.resolve({ status: "all", workFrom: "", workTo: "" }),
      resourceName: "work",
    }));

    expect(httpGet).toHaveBeenCalledWith(
      "work/page?status=all&workFrom=&workTo=&offset=0&limit=30",
    );
    expect(markup).toContain("Nothing found");
  });

  it("renders an intervention returned by the API", async () => {
    httpGet.mockResolvedValue(jsonResponse({
      hasMore: false,
      items: [{ id: "work-42", workNr: "42" }],
    }));

    const markup = renderToStaticMarkup(await Search({
      searchParams: Promise.resolve({ status: "all" }),
      resourceName: "work",
      columns: [{
        dataField: "workNr",
        headerText: "Work",
        dataFormatter: (item) => React.createElement("span", null, `Work ${item.workNr}`),
      }],
    }));

    expect(markup).toContain("Work 42");
    expect(markup).toContain("/home/work/edit/work-42");
    expect(markup).not.toContain("offset=-30");
    expect(markup).not.toContain("Nothing found");
  });

  it("normalizes invalid pagination instead of sending NaN", async () => {
    httpGet.mockResolvedValue(jsonResponse({ hasMore: false, items: [] }));

    await Search({
      searchParams: Promise.resolve({ offset: "", limit: "0" }),
      resourceName: "work",
    });

    expect(httpGet).toHaveBeenCalledWith("work/page?offset=0&limit=30");
  });
});

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}
