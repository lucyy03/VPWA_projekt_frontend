import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
	function logout() {
		//keep existing behavior so just log
		console.log('User logged out')
	}
    function login(email: string, password: string) {
		//keep existing
		console.log('login submit', { email, password })
	}

	function signup(name: string, email: string, password: string) {
		console.log('signup submit', { name, email, password })
	}

	return { logout, login, signup }
})
