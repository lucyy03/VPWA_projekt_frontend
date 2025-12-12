import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_URL = import.meta.env.VITE_API_URL

type SignupSuccessResponse = {
	token: unknown
	user: unknown
}

type SignupErrorResponse = {
	error: string
}

type SignupResponse = SignupSuccessResponse | SignupErrorResponse

interface AuthUser {
	id: number
	fullName: string | null
	nickname: string | null
	email: string
	firstname: string | null
	lastname: string | null
	status: string | null
	bio: string | null
	createdAt: string
	avatarUrl: string | null
}

export const useAuthStore = defineStore('auth', () => {
	const user = ref<AuthUser | null>(null)
	const token = ref<string | null>(null)

	// load token/user from localStorage on first use
	if (typeof window !== 'undefined') {
		const storedToken = localStorage.getItem('auth_token')
		const storedUser = localStorage.getItem('auth_user')
		if (storedToken) token.value = storedToken
		if (storedUser) user.value = JSON.parse(storedUser)
	}

	async function signup(name: string, nickname: string, email: string, password: string) {
		console.log('signup submit', { name, nickname, email, password })

		try {
			const res = await fetch(`${API_URL}/auth/signup`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name, nickname, email, password }),
			})

			let data: SignupResponse | null = null

			try {
				data = (await res.json()) as SignupResponse
			} catch {
				//no json body or invalid json
				data = null
			}

			if (!res.ok) {
				console.error('signup failed', res.status, data)

				const message =
					data && 'error' in data && typeof data.error === 'string'
						? data.error
						: 'Signup failed. Please check your info.'

				return {
					ok: false as const,
					error: message,
				}
			}

			if (!data || !('token' in data) || !('user' in data)) {
				console.error('unexpected signup response shape', data)

				return {
					ok: false as const,
					error: 'Unexpected server response.',
				}
			}

			const successData: SignupSuccessResponse = data

			let rawToken: string | null = null

			if (typeof successData.token === 'string') {
				rawToken = successData.token
			} else if (typeof successData.token === 'object' && successData.token !== null) {
				const tokenObj = successData.token as {
					value?: string
					token?: string
				}

				rawToken = tokenObj.value ?? tokenObj.token ?? null
			}

			if (!rawToken) {
				console.error('could not extract token from signup response', successData)

				return {
					ok: false as const,
					error: 'Unexpected server response.',
				}
			}

			token.value = rawToken as typeof token.value
			user.value = successData.user as typeof user.value

			localStorage.setItem('auth_token', rawToken)
			localStorage.setItem('auth_user', JSON.stringify(successData.user))

			return {
				ok: true as const,
			}
		} catch (err) {
			console.error('signup error', err)

			return {
				ok: false as const,
				error: 'Network error. Please try again.',
			}
		}
	}

	async function login(email: string, password: string) {
		console.log('login submit', { email, password })

		try {
			const res = await fetch(`${API_URL}/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password }),
			})

			if (!res.ok) {
				console.error('login failed', res.status)
				return false
			}

			const data = await res.json()

			const rawToken: string =
				data.token?.value ?? data.token?.token ?? data.token

			token.value = rawToken
			user.value = data.user

			localStorage.setItem('auth_token', rawToken)
			localStorage.setItem('auth_user', JSON.stringify(data.user))

			return true
		} catch (err) {
			console.error('login error', err)
			return false
		}
	}

	async function updateStatus(newStatus: string) {
		if (!token.value || !user.value) {
			console.warn('updateStatus called without user/token')
			return
		}

		try {
			const res = await fetch(`${API_URL}/users/me/status`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token.value}`,
				},
				body: JSON.stringify({ status: newStatus }),
			})

			if (!res.ok) {
				console.error('updateStatus failed', res.status)
				return
			}

			const data = await res.json()

			// backend returns the user directly
			user.value = data

			localStorage.setItem('auth_user', JSON.stringify(user.value))
		} catch (err) {
			console.error('updateStatus error', err)
		}
	}

	async function logout() {
		console.log('User logged out')

		try {
			if (token.value) {
				await fetch(`${API_URL}/auth/logout`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token.value}`,
					},
				})
			}
		} catch (err) {
			console.error('logout error', err)
		}

		token.value = null
		user.value = null
		localStorage.removeItem('auth_token')
		localStorage.removeItem('auth_user')
	}

	return { user, token, signup, login, logout, updateStatus }
})