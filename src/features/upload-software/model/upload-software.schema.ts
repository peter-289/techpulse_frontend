import { z } from 'zod';

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
});

export type Category = z.infer<typeof categorySchema>;

export const softwareUploadSchema = z.object({
  // Software metadata
  name: z.string().min(1, 'Software name is required.'),

  description: z
    .string()
    .min(20, 'Description must be at least 20 characters.'),

  categoryId: z.string().min(1, 'Please select a category.'),

  visibility: z.boolean(),

  price: z
    .coerce
    .number()
    .min(0, 'Software price cannot be negative.'),

  currency: z
    .string()
    .length(3, 'Currency code must be 3 characters (e.g., USD, KES)')
    .default('USD'),

  // Version/Release information
  version: z.string().min(1, 'Version number is required.'),

  changelog: z.string().default(''),

  // CORRECTION:
  // Files are part of the actual form schema. The upload page should
  // pass its selected File[] into this field so RHF/Zod can validate
  // the same files that will eventually be uploaded.
  files: z
    .array(z.instanceof(File))
    .min(1, 'At least one software artifact is required.')
    .superRefine((files, ctx) => {
      // CORRECTION:
      // Keep the accepted extensions in one place and normalize them
      // without the leading "." because we compare against the extension.
      const acceptedExtensions = new Set([
        'zip',
        'tar',
        'gz',
        'rar',
        '7z',
        'exe',
        'msi',
        'deb',
        'rpm',
        'whl',
        'pdf',
        'docx',
      ]);

      // CORRECTION:
      // Define the maximum size once instead of recalculating it for
      // every file.
      const maxFileSize = 500 * 1024 * 1024;

      files.forEach((file, index) => {
        // CORRECTION:
        // Extract the extension more safely. The previous implementation
        // could treat a filename such as "software." as having an empty
        // extension, which is fine to reject, but this makes the intent clearer.
        const extension = file.name.includes('.')
          ? file.name.split('.').pop()?.toLowerCase()
          : undefined;

        // CORRECTION:
        // The issue path inside superRefine should point to the current
        // array element, not ['files', index]. Zod already knows that
        // this refinement belongs to the "files" field.
        if (!extension || !acceptedExtensions.has(extension)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `File "${file.name}" has an unsupported extension. Allowed: ${[
              ...acceptedExtensions,
            ].join(', ')}`,
            path: [index],
          });
        }

        // CORRECTION:
        // Validate the size before the upload request reaches the backend.
        if (file.size > maxFileSize) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `File "${file.name}" exceeds the 500MB size limit.`,
            path: [index],
          });
        }
      });
    }),
});

export type SoftwareUploadInput = z.infer<typeof softwareUploadSchema>;

// Export with both names for compatibility
export const uploadSoftwareSchema = softwareUploadSchema;

export const softwareUploadResponseSchema = z.object({
  software_id: z.string(),
  version_id: z.string(),
  version: z.string(),

  artifacts: z.array(
    z.object({
      id: z.string(),
      filename: z.string(),
      size_bytes: z.number(),
      sha256: z.string(),
      content_type: z.string().optional().nullable(),
      status: z.string(),
    }),
  ),
});

export type SoftwareUploadResponse = z.infer<
  typeof softwareUploadResponseSchema
>;