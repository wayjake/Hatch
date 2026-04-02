import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

export const uploadRouter = {
  lessonVideo: f({
    video: { maxFileSize: "512MB", maxFileCount: 1 },
  }).onUploadComplete(({ file }) => {
    return { url: file.ufsUrl, type: file.type };
  }),

  lessonThumbnail: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  }).onUploadComplete(({ file }) => {
    return { url: file.ufsUrl };
  }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
