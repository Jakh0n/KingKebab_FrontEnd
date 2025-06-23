import { createUploadthing, type FileRouter } from 'uploadthing/next'

const f = createUploadthing()

export const ourFileRouter = {
	imageUploader: f({ image: { maxFileSize: '4MB' } })
		.middleware(async () => ({ userId: 'user-id' }))
		.onUploadComplete(async ({ file }) => ({ url: file.url })),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
