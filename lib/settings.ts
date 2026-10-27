import { prisma } from "@/lib/prisma";

// Default standard consultation fee in Zambian Kwacha (ZMW); admins can override it.
export const DEFAULT_CONSULTATION_FEE = 150;

export async function getConsultationFee() {
  const row = await prisma.setting.findUnique({ where: { key: "consultationFee" } });
  const fee = row ? Number(row.value) : NaN;
  return Number.isFinite(fee) && fee > 0 ? fee : DEFAULT_CONSULTATION_FEE;
}

export async function setConsultationFee(fee: number) {
  await prisma.setting.upsert({
    where: { key: "consultationFee" },
    update: { value: String(fee) },
    create: { key: "consultationFee", value: String(fee) },
  });
}
