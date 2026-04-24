export interface UserProfile {
	id: string
	name: string
	username: string
	employeeId: string
	photoUrl: string
}

export interface UpdateUserProfileDto {
	name?: string
	photoUrl?: string
}

export interface UserProfileResponse {
	_id: string
	name: string
	username: string
	employeeId: string
	photoUrl: string
	position: string
	isAdmin: boolean
	createdAt: string
	updatedAt: string
}
