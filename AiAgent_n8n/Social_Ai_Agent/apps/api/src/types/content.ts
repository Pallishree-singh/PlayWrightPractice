export const CONTENT_STATUSES = [
  "PENDING",
  "TOPIC_GENERATED",
  "POST_GENERATED",
  "IMAGE_GENERATED",
  "COMPLETED",
  "FAILED"
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export type ContentPipelineResult = {
  id: string;
  date: string;
  category: string;
  topic: string;
  linkedinPost?: string | null;
  imagePath?: string | null;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};
