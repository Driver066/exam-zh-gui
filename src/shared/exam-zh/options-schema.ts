import { z } from 'zod';

import type { ExamZhOptionBag, ExamZhOptionValue } from '../document/model';

export const examZhOptionValueSchema: z.ZodType<ExamZhOptionValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    examZhOptionBagSchema,
    z.array(examZhOptionValueSchema),
  ]),
);

export const examZhOptionBagSchema: z.ZodType<ExamZhOptionBag> = z.record(
  z.string(),
  examZhOptionValueSchema,
);
