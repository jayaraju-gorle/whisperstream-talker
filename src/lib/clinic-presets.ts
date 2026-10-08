// Pre-filled clinic profiles for one-click onboarding. Details were taken from
// public listings (Practo, Skedoc, ivyhealthcare.in) and should be reviewed
// before saving — especially fees and doctor availability.
import type { ClinicInput } from "./clinic";

export const IVY_PRESET_LABEL = "Ivy Women and Fertility Centre";

const OPEN_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const IVY_PRESET: ClinicInput = {
  name: IVY_PRESET_LABEL,
  phone: "+91 75975 96666",
  emergency_phone: "",
  email: "",
  address:
    "3rd Floor, Above Coal Spark Restaurant, Gachibowli–Miyapur Rd, Banjara Basthi, Anjaiah Nagar, Gachibowli, Hyderabad, Telangana 500084",
  map_url: "https://maps.app.goo.gl/iy6xNvqdDzBdanBs6",
  hours: [
    ...OPEN_DAYS.map((day) => ({ day, open: true, slots: [{ from: "10:00", to: "15:00" }, { from: "17:00", to: "20:00" }] })),
    { day: "Sunday", open: true, slots: [{ from: "10:00", to: "14:00" }] },
  ],
  doctors: [
    { name: "Dr. Bharathi Sudha A", specialty: "Infertility specialist, obstetrician & gynaecologist (founder)", days: "Mon–Sat 10:00–20:00, Sun 10:00–14:00", fee: "₹600" },
    { name: "Dr. Sravya Buggana", specialty: "Gynaecologist, infertility specialist & laparoscopic surgeon", days: "Mon–Sat 10:30–15:00", fee: "₹600" },
    { name: "Dr. Bharath Chidige", specialty: "Orthopaedic surgeon & pain management", days: "Mon–Sat 17:00–20:00, Sun 10:00–13:00", fee: "₹600" },
    { name: "Dr. Havisha", specialty: "Internal medicine & general physician", days: "Mon–Sat 12:00–15:00", fee: "₹600" },
    { name: "Dr. Harish Chandra Reddy", specialty: "Psychiatrist (adult & child)", days: "Mon–Wed, Fri–Sat 15:00–17:00", fee: "₹3,000" },
  ],
  insurance: "",
  notes:
    "Women's health and fertility centre: IVF, IUI, ICSI, PCOD/PCOS care, pregnancy and high-risk pregnancy care. Also offers orthopaedics and pain management, general medicine, and psychiatric counselling. Registered under India's ART (Regulation) Act and ICMR-listed. First floor clinic above Coal Spark Restaurant; entry from Gachibowli–Miyapur Road.",
};

export const IYASHI_PRESET_LABEL = "Iyashi Clinics";

const IYASHI_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const IYASHI_PRESET: ClinicInput = {
  name: IYASHI_PRESET_LABEL,
  phone: "+91 78429 57575",
  emergency_phone: "",
  email: "",
  address:
    "3rd Floor, Meher Elite, Plot No. 324, Near YSR Statue, 60 Feet Road, Ayyappa Society Main Rd, Mega Hills, Madhapur, Hyderabad, Telangana 500081",
  map_url: "https://maps.app.goo.gl/g3yRGnthyvs82pAD6",
  hours: [
    ...IYASHI_DAYS.map((day) => ({ day, open: true, slots: [{ from: "10:00", to: "21:00" }] })),
    { day: "Sunday", open: false, slots: [{ from: "10:00", to: "21:00" }] },
  ],
  doctors: [
    {
      name: "Dr. Chaitra Rachamalla",
      specialty: "Consultant gynaecologist & obstetrician, infertility specialist (Gold Medalist; MBBS, MS-OBGYN, Diploma in ART & RM, APPR London)",
      days: "Mon–Sat 10:00–21:00",
      fee: "₹800",
    },
    {
      name: "Dr. S.V.S. Yashwant",
      specialty: "Consultant paediatrician & neonatologist (MBBS, MD-PAEDS Niloufer, MRCPCH UK, PGPN-PRO)",
      days: "Mon–Sat 10:00–21:00",
      fee: "₹800",
    },
  ],
  insurance: "",
  notes:
    "Women & child healthcare: gynaecology, obstetrics, high-risk pregnancy, infertility/ART, newborn & neonatal care, child vaccination & immunization, growth assessment, and general paediatrics, plus wellness and surgical care. Appointments/WhatsApp: +91 76720 00735. Website: https://womenchildcare.com",
};
