import { createUploadthing, type FileRouter } from 'uploadthing/next'

const f = createUploadthing()

export const ourFileRouter = {
<<<<<<< HEAD
	imageUploader: f({ image: { maxFileSize: '4MB' } })
		.middleware(async () => ({ userId: 'user-id' }))
		.onUploadComplete(async ({ file }) => ({ url: file.url })),
=======
	profileImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
		.middleware(async () => {
			// This code runs on your server before upload
			return { userId: 'user' }
		})
		.onUploadComplete(async ({ metadata, file }) => {
			// This code RUNS ON YOUR SERVER after upload
			console.log('Upload complete for userId:', metadata.userId)
			console.log('file url', file.url)

			return { uploadedBy: metadata.userId, url: file.url }
		}),
>>>>>>> frontend-image-upload
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
