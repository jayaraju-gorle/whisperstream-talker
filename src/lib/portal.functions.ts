// Token-based clinic portal with role separation:
// - Support staff link (/portal/<token>): appointments only.
// - Clinic admin link (/portal/<token>?admin=<hmac>): clinic info/FAQs + appointments.
// - Aura demo portal (/aura-portal): public fictional sample for demonstrating both roles.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DAYS, stepError, testCodeError, toClinicInput, type ClinicInput } from "@/lib/clinic";
import { CLINIC_COLUMNS, type ClinicRow } from "@/lib/clinic-store";
import { PUBLIC_CLINIC_NAME, PUBLIC_SAMPLE_BUSINESS_ID } from "@/lib/public-clinic-demo";

const AURA_FALLBACK_DETAILS: ClinicInput = {
  name: PUBLIC_CLINIC_NAME,
  phone: "+91 7965481796",
  emergency_phone: "",
  email: "",
  address:
    "Suite 204, Willow Health Centre, Green Park neighbourhood, Hyderabad (fictional address)",
  map_url: "https://www.google.com/maps/search/?api=1&query=Hyderabad%2C%20Telangana%2C%20India",
  hours: DAYS.map((day) => ({
    day,
    open: day !== "Sunday",
    slots: [
      { from: "10:00", to: "13:00" },
      { from: "17:00", to: "20:00" },
    ],
  })),
  doctors: [
    {
      name: "Dr. Anika Rao",
      specialty: "Family medicine",
      days: "Mon–Sat 10:00–13:00, 17:00–20:00",
      fee: "₹600",
    },
    {
      name: "Dr. Rohan Mehta",
      specialty: "Child health",
      days: "Mon–Sat 17:00–20:00",
      fee: "₹700",
    },
  ],
  insurance: "",
  notes:
    "Fictional sample clinic for live demonstrations. Services: family consultations, child health, preventive check-ups and vaccination inquiries.",
};

const token = z.string().regex(/^[a-f0-9]{64}$/);
const adminKeySchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/)
  .optional();

function signingSecret() {
  const secret = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? process.env["LOVABLE_API_KEY"];
  if (!secret) throw new Error("Portal signing is unavailable.");
  return secret;
}

export async function portalAdminSignature(portalToken: string) {
  const { createHmac } = await import("node:crypto");
  return createHmac("sha256", signingSecret()).update(`portal-admin:${portalToken}`).digest("hex");
}

async function isValidAdminKey(portalToken: string, supplied?: string) {
  if (!supplied) return false;
  const { timingSafeEqual } = await import("node:crypto");
  const expected = Buffer.from(await portalAdminSignature(portalToken), "utf8");
  const actual = Buffer.from(supplied, "utf8");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function clinicFor(t: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("clinics")
    .select(CLINIC_COLUMNS)
    .eq("portal_token", t)
    .maybeSingle();
  if (!data) throw new Error("This portal link is invalid or has been replaced.");
  return { db: supabaseAdmin, clinic: data as unknown as ClinicRow };
}

const ClinicUpdateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  phone: z.string().trim().min(1).max(40),
  emergency_phone: z.string().max(40),
  email: z.string().max(160),
  address: z.string().max(400),
  map_url: z.string().max(400),
  hours: z
    .array(
      z.object({
        day: z.string(),
        open: z.boolean(),
        slots: z.array(z.object({ from: z.string(), to: z.string() })).min(1),
      }),
    )
    .length(7),
  doctors: z
    .array(
      z.object({
        name: z.string().max(120),
        specialty: z.string().max(200),
        days: z.string().max(160),
        fee: z.string().max(40),
      }),
    )
    .min(1),
  insurance: z.string().max(1000),
  notes: z.string().max(4000),
});

function validateClinicPayload(input: ClinicInput, isPublicSample: boolean): ClinicInput {
  const clean: ClinicInput = {
    ...input,
    name: isPublicSample ? "Aura Health Clinic" : input.name.trim(),
    doctors: input.doctors.filter((d) => d.name.trim()),
  };
  for (const step of [0, 1, 2]) {
    const err = stepError(step, clean);
    if (err) throw new Error(err);
  }
  return clean;
}

export const getPortal = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token, adminKey: adminKeySchema }).parse(d))
  .handler(async ({ data }) => {
    const { db, clinic } = await clinicFor(data.token);
    const isAdmin = await isValidAdminKey(data.token, data.adminKey);
    const { data: requests, error } = await db
      .from("clinic_appointment_requests")
      .select("id,channel,patient_name,phone,doctor,preferred_time,reason,status,created_at")
      .eq("clinic_id", clinic.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error("Couldn't load requests.");
    return {
      role: (isAdmin ? "admin" : "staff") as "admin" | "staff",
      clinic: { name: clinic.name },
      shortCode: isAdmin ? clinic.test_code : null,
      details: isAdmin ? toClinicInput(clinic) : null,
      requests: requests ?? [],
    };
  });

export const setPortalStatus = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({ token, id: z.string().uuid(), status: z.enum(["new", "confirmed", "cancelled"]) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { db, clinic } = await clinicFor(data.token);
    const { error } = await db
      .from("clinic_appointment_requests")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("clinic_id", clinic.id);
    if (error) throw new Error("Couldn't update the request.");
    return { ok: true };
  });

export const savePortalClinic = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        token,
        adminKey: z.string().regex(/^[a-f0-9]{64}$/),
        clinic: ClinicUpdateSchema,
        shortCode: z.string().max(20).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (!(await isValidAdminKey(data.token, data.adminKey)))
      throw new Error("Admin access is required to edit clinic details.");
    const { db, clinic } = await clinicFor(data.token);
    const clean = validateClinicPayload(data.clinic, false);
    const nextCode = data.shortCode?.trim().toUpperCase();
    if (nextCode !== undefined) {
      const codeErr = testCodeError(nextCode);
      if (codeErr) throw new Error(codeErr);
    }
    const { error } = await db
      .from("clinics")
      .update({
        ...clean,
        ...(nextCode ? { test_code: nextCode } : {}),
        hours: clean.hours as never,
        doctors: clean.doctors as never,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clinic.id);
    if (error) throw new Error(error.code === "23505" ? `Assistant code ${nextCode} is already in use.` : "Couldn't save clinic details.");
    return { ok: true, clinic: clean, shortCode: nextCode ?? clinic.test_code };
  });

export const getClinicAdminKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ clinicId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: clinic, error } = await context.supabase
      .from("clinics")
      .select("portal_token")
      .eq("id", data.clinicId)
      .maybeSingle();
    if (error || !clinic?.portal_token) throw new Error("Couldn't generate admin portal link.");
    return { adminKey: await portalAdminSignature(clinic.portal_token) };
  });

function auraRoleForCode(code?: string): "admin" | "staff" | null {
  const normalized = code?.trim().toUpperCase();
  if (normalized === "AURA-ADMIN") return "admin";
  if (normalized === "AURA-STAFF") return "staff";
  return null;
}

export const getAuraPublicInfo = createServerFn({ method: "POST" }).handler(async () => {
  if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) return { ...AURA_FALLBACK_DETAILS, shortCode: "AURA" };
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const { data: clinic } = await db
    .from("clinics")
    .select(CLINIC_COLUMNS)
    .eq("id", PUBLIC_SAMPLE_BUSINESS_ID)
    .maybeSingle();
  return clinic
    ? { ...toClinicInput(clinic as unknown as ClinicRow), shortCode: clinic.test_code ?? "AURA" }
    : { ...AURA_FALLBACK_DETAILS, shortCode: "AURA" };
});

export const getAuraDemoPortal = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ code: z.string().min(1).max(40) }).parse(d))
  .handler(async ({ data }) => {
    const role = auraRoleForCode(data.code);
    if (!role) throw new Error("Invalid access code.");
    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
      return {
        localPreview: true,
        role,
        clinic: { name: PUBLIC_CLINIC_NAME },
        shortCode: role === "admin" ? "AURA" : null,
        details: role === "admin" ? AURA_FALLBACK_DETAILS : null,
        requests: [],
      };
    }
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const [{ data: clinic, error: cErr }, { data: requests, error: rErr }] = await Promise.all([
      db.from("clinics").select(CLINIC_COLUMNS).eq("id", PUBLIC_SAMPLE_BUSINESS_ID).maybeSingle(),
      db
        .from("clinic_appointment_requests")
        .select("id,channel,patient_name,phone,doctor,preferred_time,reason,status,created_at")
        .eq("clinic_id", PUBLIC_SAMPLE_BUSINESS_ID)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    if (cErr || !clinic) throw new Error("Demo clinic portal is unavailable.");
    if (rErr) throw new Error("Couldn't load appointment requests.");
    return {
      localPreview: false,
      role,
      clinic: { name: clinic.name },
      shortCode: role === "admin" ? clinic.test_code : null,
      details: role === "admin" ? toClinicInput(clinic as unknown as ClinicRow) : null,
      requests: requests ?? [],
    };
  });

export const setAuraDemoStatus = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        code: z.string().min(1).max(40),
        id: z.string().uuid(),
        status: z.enum(["new", "confirmed", "cancelled"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (!auraRoleForCode(data.code)) throw new Error("Invalid access code.");
    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) return { ok: true };
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { error } = await db
      .from("clinic_appointment_requests")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("clinic_id", PUBLIC_SAMPLE_BUSINESS_ID);
    if (error) throw new Error("Couldn't update the request.");
    return { ok: true };
  });

export const deleteAuraDemoRequest = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ code: z.string().min(1).max(40), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    if (auraRoleForCode(data.code) !== "admin") throw new Error("Admin access code required.");
    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) return { ok: true };
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { error } = await db
      .from("clinic_appointment_requests")
      .delete()
      .eq("id", data.id)
      .eq("clinic_id", PUBLIC_SAMPLE_BUSINESS_ID);
    if (error) throw new Error("Couldn't delete the request.");
    return { ok: true };
  });

export const saveAuraDemoClinic = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        code: z.string().min(1).max(40),
        clinic: ClinicUpdateSchema,
        shortCode: z.string().max(20).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (auraRoleForCode(data.code) !== "admin") throw new Error("Admin access code required.");
    const clean = validateClinicPayload(data.clinic, false);
    const nextCode = data.shortCode?.trim().toUpperCase();
    if (nextCode !== undefined) {
      const codeErr = testCodeError(nextCode);
      if (codeErr) throw new Error(codeErr);
    }
    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
      return { ok: true, clinic: clean, shortCode: nextCode ?? "AURA" };
    }
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { error } = await db
      .from("clinics")
      .update({
        ...clean,
        ...(nextCode ? { test_code: nextCode } : {}),
        hours: clean.hours as never,
        doctors: clean.doctors as never,
        updated_at: new Date().toISOString(),
      })
      .eq("id", PUBLIC_SAMPLE_BUSINESS_ID);
    if (error) {
      throw new Error(
        error.code === "23505" ? `Assistant code ${nextCode} is already in use.` : "Couldn't save clinic details.",
      );
    }
    return { ok: true, clinic: clean, shortCode: nextCode };
  });
