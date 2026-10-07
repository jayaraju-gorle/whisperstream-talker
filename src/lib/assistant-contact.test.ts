import { describe, expect, it } from "vitest";
import { contactDetails, contactUpdateMessage } from "./assistant-contact";

const details = { name: "Ram", email: "ram@example.com", phone: null, company: null, interest: null };

describe("shared contact details", () => {
  it("allows email contact without a phone number", () => {
    expect(contactDetails(details)).toEqual(details);
  });
  it("keeps an added phone number", () => {
    expect(contactDetails({ ...details, phone: "+91 9876543210" })?.phone).toBe("+91 9876543210");
  });
  it("rejects an invalid email", () => {
    expect(contactDetails({ ...details, email: "invalid" })).toBeNull();
  });
  it("includes unchanged email when updating a phone number", () => {
    const message = contactUpdateMessage({ ...details, phone: "+91 9876543210" });
    expect(message).toContain("Email: ram@example.com");
    expect(message).toContain("Phone: +91 9876543210");
  });
});