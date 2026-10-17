import { expect, it } from "vitest";
import { canManageBusinessPhone } from "./business-phone";

it("allows only the business owner to manage its live number", () => {
  expect(canManageBusinessPhone("owner", "owner")).toBe(true);
  expect(canManageBusinessPhone("owner", "another-user")).toBe(false);
  expect(canManageBusinessPhone(undefined, "owner")).toBe(false);
});