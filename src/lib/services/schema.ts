import { z } from 'zod';

// Shape of apps.metadata.service in Core: the page copy for one service.
// Every section after `outcome` is optional, so a service page can leave any
// of them out and the layout closes up with no gap. There is deliberately no
// price field: prices are never shown on the site.

const text = z.string().trim().min(1);

export const SERVICE_ICON_KEYS = ['access', 'reporting', 'needs', 'voice', 'visibility', 'team'] as const;
export type ServiceIconKey = (typeof SERVICE_ICON_KEYS)[number];

const titled = z.object({ title: text, body: text });

export const serviceContentSchema = z.object({
  /** One-line promise, shown under the hero name. */
  outcome: text,
  /** Optional second line under the outcome (Concierge: "Coming soon for ..."). */
  subline: text.optional(),
  /** One-line description for service cards. */
  cardLine: text.optional(),
  /** At-a-glance rows for the hero meta card. A row with kind "app" shows the linked app's tile. */
  meta: z
    .array(z.object({ label: text, value: text, kind: z.enum(['text', 'app']).optional() }))
    .optional(),
  whatYouGet: z
    .object({ heading: text.optional(), note: text.optional(), items: z.array(titled).min(1) })
    .optional(),
  steps: z.array(titled).min(3).max(5).optional(),
  fit: z.object({ fit: z.array(text).min(1), notFit: z.array(text).min(1) }).optional(),
  howWeWork: z
    .array(z.object({ title: text, body: text, icon: z.enum(SERVICE_ICON_KEYS).optional() }))
    .min(1)
    .max(3)
    .optional(),
  faq: z.array(z.object({ q: text, a: text })).min(1).optional(),
  closing: z.object({ heading: text, body: text }).optional(),
  /** One sentence for the "Want us to run this for you?" band on the linked app's page. */
  appBand: text.optional(),
});

export type ServiceContent = z.infer<typeof serviceContentSchema>;

/** Returns the parsed content, or null when the metadata is missing or does not match the schema. */
export function parseServiceContent(raw: unknown): ServiceContent | null {
  if (raw === null || raw === undefined) return null;
  const parsed = serviceContentSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
