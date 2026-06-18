export const Role = {
  PATIENT: "PATIENT",
  PRACTITIONER: "PRACTITIONER",
  NGO: "NGO",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Tier = {
  FREE: "FREE",
  BASIC: "BASIC",
  PREMIUM: "PREMIUM",
} as const;
export type Tier = (typeof Tier)[keyof typeof Tier];

export const Specialty = {
  NURSE: "NURSE",
  PHARMACIST: "PHARMACIST",
  PHYSIOTHERAPIST: "PHYSIOTHERAPIST",
} as const;
export type Specialty = (typeof Specialty)[keyof typeof Specialty];

export const AppointmentStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const Channel = {
  WEB: "WEB",
  USSD: "USSD",
} as const;
export type Channel = (typeof Channel)[keyof typeof Channel];

export const BillingStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  SUBSIDIZED: "SUBSIDIZED",
  WAIVED: "WAIVED",
} as const;
export type BillingStatus = (typeof BillingStatus)[keyof typeof BillingStatus];
