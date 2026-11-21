import { describe, expect, it } from "vitest";
import { extractUrls, formatSharedLinksMarkdown, stripUrlsForSpeech } from "./flo-voice";

describe("flo-voice URL helpers", () => {
  it("extracts intact Google Maps URLs and strips trailing punctuation", () => {
    const reply =
      "Sure, here it is: https://www.google.com/maps/search/?api=1&query=Hanvi%27s+Kondapur+Dental+Hospital+Kondapur+Hyderabad+500084.";
    expect(extractUrls(reply)).toEqual([
      "https://www.google.com/maps/search/?api=1&query=Hanvi%27s+Kondapur+Dental+Hospital+Kondapur+Hyderabad+500084",
    ]);
  });

  it("strips raw URLs for natural speech and formats clickable Google Maps markdown links", () => {
    const url = "https://www.google.com/maps/search/?api=1&query=17.460123,78.361234";
    expect(stripUrlsForSpeech(`Here is the location: ${url}`)).toBe("Here is the location:");
    expect(formatSharedLinksMarkdown([url])).toBe(`[Open in Google Maps](${url})`);
  });
});
