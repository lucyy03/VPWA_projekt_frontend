export default () => {
	if (typeof window === 'undefined') {
		return
	}

	if (!('Notification' in window)) {
		console.warn('[notifications boot] Notification API not available in this browser')
		return
	}

	console.log('[notifications boot] initial permission:', Notification.permission)

	if (Notification.permission === 'default') {
		const handler = () => {
			console.log('[notifications boot] requesting permission after user gesture')
			Notification.requestPermission()
				.then(permission => {
					console.log('[notifications boot] permission result:', permission)
				})
				.catch(err => {
					console.error('[notifications boot] requestPermission error', err)
				})
				.finally(() => {
					document.removeEventListener('click', handler)
				})
		}

		document.addEventListener('click', handler, { once: true })
	}
}