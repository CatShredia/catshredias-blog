import { z } from "zod";

import { optionalPathOrUrl } from "@/lib/validations/path-or-url";

export const siteSettingsSchema = z.object({
  hhUrl: z.string().url("Некорректный URL").optional().or(z.literal("")),
  resumePdf: optionalPathOrUrl.optional().or(z.literal("")),
  lookingForWork: z.boolean(),
});
