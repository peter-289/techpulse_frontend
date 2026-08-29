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
  description: z.string().min(20, 'Description must be at least 20 characters.'),
  categoryId: z.string().min(1, 'Please select a category.'),
  visibility: z.boolean(),
  price: z.coerce.number().min(0, 'Software price cannot be negative.'),
  currency: z.string().length(3, 'Currency code must be 3 characters (e.g., USD, KES)').default('USD'),
  
  // Version/Release information
  version: z.string().min(1, 'Version number is required.'),
  changelog: z.string().default(''),
  
  // Artifacts (multiple files) - Accept both File[] and FileList
  files: z.array(z.instanceof(File))
    .min(1, 'At least one software artifact is required.')
    .superRefine((files, ctx) => {
      const acceptedExtensions = ['zip', 'tar', 'gz', 'rar', '7z', 'exe', 'msi', 'deb', 'rpm', 'whl', 'pdf', 'docx'];
      
      files.forEach((file, index) => {
        const fileName = file.name.toLowerCase();
        const ext = fileName.split('.').pop();
        
        if (!ext || !acceptedExtensions.includes(ext)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `File "${file.name}" has an unsupported extension. Allowed: ${acceptedExtensions.join(', ')}`,
            path: ['files', index]
          });
        }
        
        // 500MB limit per file
        if (file.size > 500 * 1024 * 1024) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `File "${file.name}" exceeds 500MB size limit.`,
            path: ['files', index]
          });
        }
      });
    })
});

export type SoftwareUploadInput = z.infer<typeof softwareUploadSchema>;

// Export with both names for compatibility
export const uploadSoftwareSchema = softwareUploadSchema;

export const softwareUploadResponseSchema = z.object({
  software_id: z.string(),
  version_id: z.string(),
  version: z.string(),
  artifacts: z.array(z.object({
    id: z.string(),
    filename: z.string(),
    size_bytes: z.number(),
    sha256: z.string(),
    content_type: z.string().optional().nullable(),
    status: z.string(),
  })),
});

export type SoftwareUploadResponse = z.infer<typeof softwareUploadResponseSchema>;