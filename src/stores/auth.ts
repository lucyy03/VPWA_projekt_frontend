import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_URL = import.meta.env.VITE_API_URL

interface AuthUser {
	id: number
	fullName: string | null
	nickname: string | null
	email: string
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

			if (!res.ok) {
				console.error('signup failed', res.status)
				return false
			}

			const data = await res.json()

			// backend returns { token, user }
			// token.value is the actual string we send as bearer
			const rawToken: string =
				data.token?.value ?? data.token?.token ?? data.token

			token.value = rawToken
			user.value = data.user

			localStorage.setItem('auth_token', rawToken)
			localStorage.setItem('auth_user', JSON.stringify(data.user))

			return true
		} catch (err) {
			console.error('signup error', err)
			return false
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

	return { user, token, signup, login, logout }
})