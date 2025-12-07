import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useAuthStore } from 'src/stores/auth'

const API_URL = import.meta.env.VITE_API_URL

interface SettingsResponse {
	notifications: boolean
	mentionOnlyNotifications: boolean
}

export const useSettingsStore = defineStore('settings', () => {
	const authStore = useAuthStore()

	const notifications = ref(true)
	const mentionsOnly = ref(false)
	const loading = ref(false)
	const saving = ref(false)
	const loadedOnce = ref(false)

	function getAuthHeaders() {
		if (!authStore.token) return {}
		return {
			Authorization: `Bearer ${authStore.token}`,
		}
	}

	async function fetchSettings() {
		if (!authStore.token) return
		loading.value = true
		try {
			const res = await fetch(`${API_URL}/settings/me`, {
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders(),
				},
			})
			if (!res.ok) {
				console.error('[settingsStore] fetchSettings failed', res.status)
				return
			}
			const data = (await res.json()) as SettingsResponse
			notifications.value = data.notifications
			mentionsOnly.value = data.mentionOnlyNotifications
			loadedOnce.value = true
		} catch (err) {
			console.error('[settingsStore] fetchSettings error', err)
		} finally {
			loading.value = false
		}
	}

	async function saveSettings() {
		if (!authStore.token) return
		saving.value = true
		try {
			const res = await fetch(`${API_URL}/settings/me`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders(),
				},
				body: JSON.stringify({
					notifications: notifications.value,
					mentionOnlyNotifications: mentionsOnly.value,
				}),
			})
			if (!res.ok) {
				console.error('[settingsStore] saveSettings failed', res.status)
			}
		} catch (err) {
			console.error('[settingsStore] saveSettings error', err)
		} finally {
			saving.value = false
		}
	}

	watch(
		() => authStore.user,
		user => {
			if (user) {
				void fetchSettings()
			} else {
				loadedOnce.value = false
			}
		},
		{ immediate: true },
	)

	return {
		notifications,
		mentionsOnly,
		loading,
		saving,
		loadedOnce,
		fetchSettings,
		saveSettings,
	}
})