import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const uploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  mimeType: z.enum(["application/pdf", "text/csv"], {
    errorMap: () => ({ message: "Only PDF and CSV files are accepted" }),
  }),
  fileSize: z
    .number()
    .positive("File size must be positive")
    .max(MAX_FILE_SIZE, "File size must not exceed 10MB"),
});

export type UploadInput = z.infer<typeof uploadSchema>;
