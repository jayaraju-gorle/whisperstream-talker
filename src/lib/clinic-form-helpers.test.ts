import { describe, expect, it } from "vitest";
import {
  extractCoordsFromMapUrl,
  formatClinicNotes,
  formatStructuredAddress,
  googleMapsPinUrl,
  parseClinicNotes,
  parseStructuredAddress,
} from "./clinic-form-helpers";

describe("structured address helpers", () => {
  it("parses and round-trips a typical Indian clinic address", () => {
    const raw =
      "63B, sbi bank lane, Kondapur, Sri Ram Nagar, Gachibowli, Hyderabad, Telangana 500084";
    const parsed = parseStructuredAddress(raw);
    expect(parsed).toEqual({
      street: "63B, sbi bank lane",
      locality: "Kondapur, Sri Ram Nagar, Gachibowli",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500084",
    });
    expect(formatStructuredAddress(parsed)).toBe(raw);
  });

  it("handles short addresses without losing text", () => {
    const parsed = parseStructuredAddress("Kakatiya Hills, Madhapur, Hyderabad – 500081");
    expect(parsed.city).toBe("Hyderabad");
    expect(parsed.pincode).toBe("500081");
    expect(formatStructuredAddress(parsed)).toContain("Madhapur");
  });
});

describe("map coordinate helpers", () => {
  it("extracts coordinates from Google Maps pin URLs and builds canonical pin links", () => {
    const url = googleMapsPinUrl(17.460123, 78.361234);
    expect(url).toBe("https://www.google.com/maps/search/?api=1&query=17.460123,78.361234");
    expect(extractCoordsFromMapUrl(url)).toEqual({ lat: 17.460123, lng: 78.361234 });
    expect(extractCoordsFromMapUrl("https://www.google.com/maps/@17.448293,78.391485,17z")).toEqual(
      { lat: 17.448293, lng: 78.391485 },
    );
    expect(extractCoordsFromMapUrl("https://maps.app.goo.gl/abc")).toBeNull();
  });
});

describe("clinic FAQ notes helpers", () => {
  it("round-trips overview text and structured Q&A pairs", () => {
    const formatted = formatClinicNotes("Premier painless dental care in Kondapur.", [
      { question: "Is parking available?", answer: "Yes, free parking is available outside." },
      { question: "Do you accept UPI?", answer: "Yes, we accept UPI, cards, and cash." },
    ]);
    expect(formatted).toContain("FAQs:\nQ: Is parking available?");
    expect(parseClinicNotes(formatted)).toEqual({
      overview: "Premier painless dental care in Kondapur.",
      faqs: [
        { question: "Is parking available?", answer: "Yes, free parking is available outside." },
        { question: "Do you accept UPI?", answer: "Yes, we accept UPI, cards, and cash." },
      ],
    });
  });

  it("keeps plain legacy notes as overview with empty FAQs", () => {
    expect(parseClinicNotes("Open daily. Painless dentistry.")).toEqual({
      overview: "Open daily. Painless dentistry.",
      faqs: [],
    });
  });
});
