import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MapPin, ShieldCheck, Stethoscope, ArrowRight } from "lucide-react";

const SPECIALTY_LABEL: Record<string, string> = {
  NURSE: "Nurse",
  PHARMACIST: "Pharmacist",
  PHYSIOTHERAPIST: "Physiotherapist",
};

const SPECIALTY_COLOR: Record<string, string> = {
  NURSE:            "bg-blue-50 text-blue-700 border-blue-200",
  PHARMACIST:       "bg-purple-50 text-purple-700 border-purple-200",
  PHYSIOTHERAPIST:  "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default async function PractitionersPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string; q?: string }>;
}) {
  const { specialty, q } = await searchParams;

  const practitioners = await prisma.practitioner.findMany({
    where: {
      isVerified: true,
      ...(specialty ? { specialty } : {}),
      ...(q
        ? {
            OR: [
              { user: { name: { contains: q } } },
              { location: { contains: q } },
            ],
          }
        : {}),
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  const specialties = ["NURSE", "PHARMACIST", "PHYSIOTHERAPIST"];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero strip */}
      <div className="bg-sidebar py-12">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-extrabold text-sidebar-foreground mb-2">
            Find a Practitioner
          </h1>
          <p className="text-sidebar-foreground/60 max-w-xl">
            Browse verified nurses, pharmacists, and physiotherapists across Zambia.
            Book directly from their profile.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link
            href="/practitioners"
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              !specialty
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary"
            }`}
          >
            All
          </Link>
          {specialties.map((s) => (
            <Link
              key={s}
              href={`/practitioners?specialty=${s}`}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                specialty === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary"
              }`}
            >
              {SPECIALTY_LABEL[s]}
            </Link>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-6">
          {practitioners.length} practitioner{practitioners.length !== 1 ? "s" : ""} found
        </p>

        {/* Grid */}
        {practitioners.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-30" strokeWidth={1} />
            <p className="font-medium">No practitioners found</p>
            <p className="text-sm mt-1">Try a different filter or check back soon.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {practitioners.map((p) => {
              const colorCls = SPECIALTY_COLOR[p.specialty] ?? "bg-gray-50 text-gray-700 border-gray-200";
              const initial = p.user.name?.[0]?.toUpperCase() ?? "P";
              return (
                <div
                  key={p.id}
                  className="bg-card border border-border rounded-2xl p-6 flex flex-col hover:shadow-md hover:border-primary/30 transition-all"
                >
                  {/* Avatar + verified */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-extrabold">
                      {initial}
                    </div>
                    {p.isVerified && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-emerald bg-brand-emerald/10 px-2.5 py-1 rounded-full">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-foreground text-lg mb-1">{p.user.name}</h3>

                  <span className={`self-start inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border mb-3 ${colorCls}`}>
                    {SPECIALTY_LABEL[p.specialty]}
                  </span>

                  {p.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      {p.location}
                    </p>
                  )}

                  {p.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {p.bio}
                    </p>
                  )}

                  <div className="mt-auto pt-4 border-t border-border">
                    <Link
                      href={`/patient/appointments/new?practitionerId=${p.id}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition"
                    >
                      Book Appointment <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
