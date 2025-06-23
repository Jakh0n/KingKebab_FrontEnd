import { createRouteHandler } from 'uploadthing/next'
<<<<<<< HEAD
=======

>>>>>>> frontend-image-upload
import { ourFileRouter } from './core'

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
	router: ourFileRouter,
})
