/**
 * Demo data in the style of the factory's Excel sheet: one client per tab,
 * one block per furniture item. Day offsets are relative to today (Karachi).
 */
import type { Database } from "../src/types/database"

type Status = Database["public"]["Enums"]["production_status"]
type ItemStatus = Database["public"]["Enums"]["item_status"]
type Method = Database["public"]["Enums"]["payment_method"]

export type SeedItem = {
  name: string
  quantity: number
  unit: number
  size?: string
  sheet_code?: string
  metal_colour?: string
  pc?: string
  rack?: string
  fabric?: string
  leather?: string
  foam?: string
  railing?: string
  lock?: string
  note?: string
  status?: ItemStatus
}

export type SeedOrder = {
  client: number
  /** Days from today; negative = in the past. */
  orderedDaysAgo: number
  deadlineInDays: number
  status: Status
  /** For needs-to-start via the grace rule, enter the order a few days ago. */
  enteredDaysAgo?: number
  responsible?: number | null
  bill?: string
  instructions?: string
  deliveredDaysAgo?: number
  archived?: boolean
  delivery?: number
  /** Fractions of the grand total received, with day offsets. */
  payments?: { share: number; daysAgo: number; method: Method; note?: string }[]
  notes?: { by: number; text: string; daysAgo: number }[]
  items: SeedItem[]
}

export const SEED_STAFF = [
  { name: "Imran Ali", email: "seed.imran@example.com", phone: "0300-4412890" },
  { name: "Bilal Ahmed", email: "seed.bilal@example.com", phone: "0321-7781023" },
  { name: "Shahid Mehmood", email: "seed.shahid@example.com", phone: "0333-5120876" },
]

export const SEED_CLIENTS = [
  { name: "Hamza Sb", phone: "0300-8456721", company: null, address: "House 112, Block K, DHA Phase 5", city: "Lahore" },
  { name: "Beaconhouse School — Johar Town", phone: "042-35290011", company: "Beaconhouse School System", address: "65-B, Johar Town", city: "Lahore", notes: "Accounts office pays by cheque on the 10th." },
  { name: "Dr. Ayesha Malik", phone: "0322-4091277", company: "Malik Family Clinic", address: "14-C, Main Boulevard, Gulberg III", city: "Lahore" },
  { name: "Allied Bank — Gulberg Branch", phone: "042-35761900", company: "Allied Bank Ltd", address: "Main Boulevard, Gulberg II", city: "Lahore" },
  { name: "Kashif Butt", phone: "0301-6643219", company: null, address: "22 Street 4, Model Town Ext.", city: "Lahore" },
  { name: "The City School — Faisalabad", phone: "041-8714400", company: "The City School", address: "Canal Road Campus", city: "Faisalabad" },
  { name: "Sufi Textiles Head Office", phone: "0300-0461288", company: "Sufi Textiles", address: "Plot 17, Sundar Industrial Estate", city: "Lahore" },
  { name: "Mrs. Rabia Tariq", phone: "0345-2208761", company: null, address: "House 8, Sector C, Bahria Town", city: "Lahore" },
  { name: "Govt. Girls High School No. 2", phone: "0300-9921456", company: "School Education Dept.", address: "Mozang Road", city: "Lahore" },
  { name: "Al-Noor Hospital", phone: "042-37121212", company: "Al-Noor Trust", address: "Ferozepur Road", city: "Lahore" },
  { name: "Zain Ahmed", phone: "0312-4456980", company: null, address: "Apartment 6B, Gulberg Heights", city: "Lahore" },
  { name: "Hafiz Sb Residence", phone: "0300-4561203", company: null, address: "Mohallah Islampura", city: "Gujranwala" },
]

const school30: SeedItem[] = [
  ...Array.from({ length: 12 }, (_, i): SeedItem => ({
    name: `Student desk (double) — Class ${i + 1 <= 6 ? "6A" : "6B"} row ${(i % 6) + 1}`,
    quantity: 5,
    unit: 9500,
    size: 'L= 42" W= 18" H= 29"',
    sheet_code: "A.N 4091",
    metal_colour: "Grey",
    pc: "Grey",
    rack: "Under-top book rack",
  })),
  ...Array.from({ length: 12 }, (_, i): SeedItem => ({
    name: `Student chair — row ${(i % 6) + 1}`,
    quantity: 10,
    unit: 4200,
    size: 'Seat 15" × 15", height 17"',
    metal_colour: "Grey",
    pc: "Grey",
  })),
  { name: "Teacher table", quantity: 2, unit: 21000, size: 'L= 48" W= 24" H= 30"', sheet_code: "A.N 2028", lock: "Godrej drawer lock" },
  { name: "Teacher chair", quantity: 2, unit: 9000, fabric: "Jute grey", foam: 'Master Molty 3"' },
  { name: "Whiteboard frame", quantity: 2, unit: 6500, size: "6 ft × 4 ft", note: "Aluminium frame, magnetic board" },
  { name: "Library rack", quantity: 4, unit: 18500, size: 'L= 36" W= 12" H= 72"', sheet_code: "A.N 2028", rack: "5 shelves" },
  { name: "Notice board", quantity: 2, unit: 3500, size: "4 ft × 3 ft", fabric: "Felt navy" },
  { name: "Lab stool", quantity: 20, unit: 3800, size: 'Height 24"', metal_colour: "Black", pc: "Black" },
]

export const SEED_ORDERS: SeedOrder[] = [
  // ---- Overdue -------------------------------------------------------------
  {
    client: 3, orderedDaysAgo: 26, deadlineInDays: -4, status: "in_production", responsible: 0, bill: "B-1042",
    instructions: "Deliver after 4 pm. Call the branch manager before coming.",
    delivery: 5000,
    payments: [{ share: 0.4, daysAgo: 25, method: "cheque", note: "Advance, cheque no. 004512" }],
    notes: [{ by: 0, text: "Counter top laminate arrived late from the supplier.", daysAgo: 6 }],
    items: [
      { name: "Reception counter", quantity: 1, unit: 165000, size: 'L= 96" W= 30" H= 42"', sheet_code: "A.N 4091, 2028", metal_colour: "Champagne", lock: "Central lock", status: "in_production" },
      { name: "Teller workstation", quantity: 4, unit: 48000, size: 'L= 60" W= 30" H= 30"', sheet_code: "A.N 4091", rack: "Side rack 3 drawers", lock: "Godrej", status: "ready" },
      { name: "Visitor chair", quantity: 8, unit: 14500, fabric: "Jute grey", foam: 'Master Molty 4"', metal_colour: "Black matt", status: "ready" },
    ],
  },
  {
    client: 0, orderedDaysAgo: 18, deadlineInDays: -1, status: "ready_for_delivery", responsible: 2, bill: "B-1051",
    payments: [{ share: 0.5, daysAgo: 18, method: "cash" }],
    items: [
      { name: "Executive table", quantity: 1, unit: 135000, size: 'L= 96" W= 42" H= 30"', sheet_code: "A.N 4091", metal_colour: "Black matt", rack: "Side rack with 3 drawers", lock: "Central lock", status: "ready" },
      { name: "Executive chair", quantity: 1, unit: 58000, leather: "Brown leatherette", foam: 'Diamond 6"', status: "ready" },
      { name: "Side rack", quantity: 2, unit: 26000, size: 'L= 36" W= 18" H= 30"', sheet_code: "A.N 4091", status: "ready" },
    ],
  },
  {
    client: 9, orderedDaysAgo: 30, deadlineInDays: -9, status: "on_hold", responsible: 1, bill: "AH-77",
    instructions: "Client asked to pause until the ward renovation is complete.",
    notes: [{ by: 1, text: "On hold at the client's request. Frames are cut, polish not started.", daysAgo: 12 }],
    items: [
      { name: "Patient bedside cabinet", quantity: 12, unit: 16500, size: 'L= 18" W= 16" H= 30"', sheet_code: "Merino 21011", lock: "Cam lock" },
      { name: "Attendant sofa-cum-bed", quantity: 6, unit: 42000, fabric: "Vinyl blue (washable)", foam: 'Diamond 6"', metal_colour: "Off-white", pc: "Off-white" },
    ],
  },
  {
    client: 10, orderedDaysAgo: 14, deadlineInDays: -2, status: "new", responsible: null, enteredDaysAgo: 14,
    items: [{ name: "Study table with hutch", quantity: 1, unit: 38000, size: 'L= 48" W= 22" H= 30", hutch 24"', sheet_code: "A.N 2028" }],
  },

  // ---- Due soon (today .. 3 days) ------------------------------------------
  {
    client: 1, orderedDaysAgo: 20, deadlineInDays: 0, status: "in_production", responsible: 0, bill: "BH-5521",
    delivery: 12000,
    payments: [{ share: 0.3, daysAgo: 19, method: "cheque", note: "Advance" }],
    notes: [{ by: 0, text: "First 6 desks polished. Remaining go out tomorrow morning.", daysAgo: 1 }],
    items: [
      { name: "Student desk (single)", quantity: 30, unit: 8200, size: 'L= 24" W= 18" H= 29"', sheet_code: "A.N 4091", metal_colour: "Grey", pc: "Grey", status: "ready" },
      { name: "Student chair", quantity: 30, unit: 4200, metal_colour: "Grey", pc: "Grey", status: "in_production" },
    ],
  },
  {
    client: 7, orderedDaysAgo: 12, deadlineInDays: 2, status: "in_production", responsible: 2, bill: "B-1060",
    payments: [{ share: 0.5, daysAgo: 12, method: "bank_transfer", note: "Meezan Bank IBFT" }],
    items: [
      { name: "Bed king size", quantity: 1, unit: 95000, size: '78" × 72"', sheet_code: "Kronospan 8513", fabric: "Velvet beige (headboard)", foam: 'Master Molty 2"', status: "ready" },
      { name: "Side table", quantity: 2, unit: 18000, size: 'L= 20" W= 16" H= 24"', sheet_code: "Kronospan 8513", status: "ready" },
      { name: "Dressing table with mirror", quantity: 1, unit: 46000, sheet_code: "Kronospan 8513", note: "Mirror 36\" × 24\", bevelled edge", status: "in_production" },
      { name: "Wardrobe 3-door", quantity: 1, unit: 120000, size: 'L= 72" W= 24" H= 84"', sheet_code: "Kronospan 8513", lock: "Central lock", railing: "SS hanging rod", status: "pending" },
    ],
  },
  {
    client: 4, orderedDaysAgo: 9, deadlineInDays: 3, status: "new", responsible: 1,
    items: [{ name: "Sofa set 3+2+1", quantity: 1, unit: 185000, fabric: "Velvet maroon", foam: 'Diamond 6"', note: "Wooden legs, walnut finish" }],
  },
  {
    client: 6, orderedDaysAgo: 15, deadlineInDays: 1, status: "ready_for_delivery", responsible: 2, bill: "ST-310",
    delivery: 8000,
    payments: [{ share: 0.6, daysAgo: 14, method: "bank_transfer" }],
    items: [
      { name: "Conference table", quantity: 1, unit: 210000, size: 'L= 144" W= 54" H= 30"', sheet_code: "A.N 4091", metal_colour: "Champagne", note: "Two cable ports in the centre", status: "ready" },
      { name: "Conference chair", quantity: 14, unit: 19500, leather: "Black leatherette", foam: 'Master Molty 4"', status: "ready" },
    ],
  },

  // ---- Needs to start ---------------------------------------------------------
  {
    client: 5, orderedDaysAgo: 6, deadlineInDays: 8, status: "new", responsible: 1, enteredDaysAgo: 6, bill: "TCS-882",
    instructions: "Deliver to the Canal Road campus gate 2. School closes at 2 pm.",
    delivery: 15000,
    payments: [{ share: 0.25, daysAgo: 5, method: "cheque" }],
    items: school30,
  },
  {
    client: 2, orderedDaysAgo: 2, deadlineInDays: 9, status: "new", responsible: 0,
    items: [
      { name: "Doctor's table", quantity: 1, unit: 52000, size: 'L= 60" W= 30" H= 30"', sheet_code: "A.N 2028", rack: "Side rack 2 drawers", lock: "Godrej" },
      { name: "Examination couch", quantity: 1, unit: 34000, leather: "Off-white leatherette", foam: 'Diamond 4"', metal_colour: "Off-white" },
      { name: "Waiting bench (3 seater)", quantity: 3, unit: 27000, metal_colour: "Black matt", pc: "Black", fabric: "Jute grey" },
    ],
  },
  {
    client: 11, orderedDaysAgo: 5, deadlineInDays: 25, status: "new", responsible: null, enteredDaysAgo: 5,
    items: [{ name: "Wooden mandir-style cabinet", quantity: 1, unit: 30000, size: 'L= 30" W= 14" H= 48"', note: "Sheesham, natural polish" }],
  },

  // ---- On track ---------------------------------------------------------------
  {
    client: 8, orderedDaysAgo: 4, deadlineInDays: 21, status: "in_production", responsible: 0, bill: "GGHS-12",
    payments: [{ share: 0.2, daysAgo: 4, method: "cheque" }],
    items: [
      { name: "Student bench (3 seater)", quantity: 40, unit: 12500, size: 'L= 60" W= 15" H= 29"', metal_colour: "Green", pc: "Green", status: "in_production" },
      { name: "Teacher table", quantity: 4, unit: 21000, sheet_code: "A.N 2028" },
    ],
  },
  {
    client: 3, orderedDaysAgo: 3, deadlineInDays: 30, status: "new", responsible: 2, enteredDaysAgo: 1,
    items: [{ name: "Manager workstation (L-shape)", quantity: 2, unit: 72000, size: 'L= 66" × 48" W= 24"', sheet_code: "A.N 4091", lock: "Central lock" }],
  },
  {
    client: 6, orderedDaysAgo: 8, deadlineInDays: 16, status: "in_production", responsible: 1, bill: "ST-318",
    payments: [{ share: 0.5, daysAgo: 7, method: "bank_transfer" }],
    items: [
      { name: "Workstation (4 person cluster)", quantity: 3, unit: 98000, size: 'Each seat L= 48" W= 24"', sheet_code: "A.N 4091", metal_colour: "Black matt", railing: "Wire manager tray", status: "in_production" },
      { name: "Mobile pedestal", quantity: 12, unit: 14000, sheet_code: "A.N 4091", lock: "Central lock", status: "pending" },
      { name: "Staff chair (mesh)", quantity: 12, unit: 17500, metal_colour: "Black", status: "pending" },
    ],
  },
  {
    client: 7, orderedDaysAgo: 1, deadlineInDays: 35, status: "new", responsible: null,
    items: [
      { name: "Kids bunk bed", quantity: 1, unit: 68000, size: '72" × 36" each bunk', railing: "Safety rail both sides", sheet_code: "A.N 2028" },
      { name: "Study desk (kids)", quantity: 2, unit: 21000, size: 'L= 36" W= 20" H= 26"' },
    ],
  },
  {
    client: 1, orderedDaysAgo: 2, deadlineInDays: 40, status: "new", responsible: 0, bill: "BH-5600",
    items: [
      { name: "Library table (6 seater)", quantity: 4, unit: 46000, size: 'L= 72" W= 36" H= 30"', sheet_code: "A.N 2028" },
      { name: "Library chair", quantity: 24, unit: 8500, fabric: "Jute blue", foam: 'Master Molty 2"' },
      { name: "Book shelf (double sided)", quantity: 6, unit: 39000, size: 'L= 48" W= 24" H= 72"', rack: "6 shelves each side" },
    ],
  },
  {
    client: 0, orderedDaysAgo: 5, deadlineInDays: 14, status: "in_production", responsible: 2,
    items: [{ name: "Center table", quantity: 1, unit: 32000, size: 'L= 48" W= 24" H= 18"', note: "Glass top 8 mm, tinted", status: "in_production" }],
  },

  // ---- Delivered (this month and last month) ---------------------------------
  {
    client: 4, orderedDaysAgo: 25, deadlineInDays: -6, status: "delivered", deliveredDaysAgo: 3, responsible: 1, bill: "B-1033",
    delivery: 3000,
    payments: [{ share: 0.5, daysAgo: 25, method: "cash" }, { share: 0.5, daysAgo: 3, method: "cash", note: "Balance on delivery" }],
    items: [{ name: "Dining table (6 chairs)", quantity: 1, unit: 145000, size: 'L= 72" W= 40" H= 30"', note: "Sheesham, walnut polish", status: "ready" }],
  },
  {
    client: 9, orderedDaysAgo: 40, deadlineInDays: -10, status: "delivered", deliveredDaysAgo: 1, responsible: 0, bill: "AH-61",
    payments: [{ share: 0.7, daysAgo: 38, method: "cheque" }],
    notes: [{ by: 2, text: "Delivered and installed. Balance cheque promised for next week.", daysAgo: 1 }],
    items: [
      { name: "Nurse station counter", quantity: 1, unit: 175000, sheet_code: "Merino 21011", lock: "Central lock", status: "ready" },
      { name: "Medicine cabinet (glass doors)", quantity: 4, unit: 36000, lock: "Cam lock", status: "ready" },
    ],
  },
  {
    client: 10, orderedDaysAgo: 50, deadlineInDays: -30, status: "delivered", deliveredDaysAgo: 32, responsible: 2,
    payments: [{ share: 1, daysAgo: 32, method: "bank_transfer" }],
    items: [{ name: "TV console", quantity: 1, unit: 54000, size: 'L= 72" W= 16" H= 22"', sheet_code: "Kronospan 8513", status: "ready" }],
  },
  {
    client: 5, orderedDaysAgo: 60, deadlineInDays: -35, status: "delivered", deliveredDaysAgo: 36, responsible: 1, bill: "TCS-801",
    payments: [{ share: 1, daysAgo: 40, method: "cheque" }],
    items: [{ name: "Principal office set", quantity: 1, unit: 240000, note: "Table, chair, side rack and 2 visitor chairs", status: "ready" }],
  },
  {
    client: 2, orderedDaysAgo: 20, deadlineInDays: -2, status: "delivered", deliveredDaysAgo: 2, responsible: 0,
    payments: [{ share: 1.05, daysAgo: 2, method: "cash", note: "Included Rs 4,000 extra for transport" }],
    items: [{ name: "Medicine rack", quantity: 2, unit: 38000, size: 'L= 36" W= 12" H= 72"', status: "ready" }],
  },

  // ---- Cancelled, archived, no amount yet -------------------------------------
  {
    client: 11, orderedDaysAgo: 22, deadlineInDays: 5, status: "cancelled", responsible: null,
    notes: [{ by: 1, text: "Client cancelled — moving to Islamabad.", daysAgo: 10 }],
    items: [{ name: "Sofa set 3+1+1", quantity: 1, unit: 150000, fabric: "Chenille grey" }],
  },
  {
    client: 8, orderedDaysAgo: 90, deadlineInDays: -70, status: "delivered", deliveredDaysAgo: 72, archived: true, responsible: 0,
    payments: [{ share: 1, daysAgo: 72, method: "cheque" }],
    items: [{ name: "Classroom cupboard", quantity: 6, unit: 28000, lock: "Godrej", status: "ready" }],
  },
  {
    client: 4, orderedDaysAgo: 0, deadlineInDays: 28, status: "new", responsible: null,
    instructions: "Price to be confirmed after the client approves the fabric sample.",
    items: [
      { name: "Bed with storage", quantity: 1, unit: 0, size: '78" × 60"', note: "Hydraulic lift storage" },
      { name: "Side table", quantity: 2, unit: 0 },
    ],
  },
]
