<!-- src/pages/ProfilePage.vue -->
<template>
	<q-page padding class="relative-position">

		<!-- background gradient (pure SVG, no CSS) -->
		<div class="absolute-full">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="100%"
				height="100%"
				preserveAspectRatio="none"
			>
				<defs>
					<linearGradient id="bg" x1="1" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="#a3bffa" />
						<stop offset="100%" stop-color="#c3aed6" />
					</linearGradient>
				</defs>
				<rect width="100%" height="100%" fill="url(#bg)" />
			</svg>
		</div>

		<!-- profile card -->
		<div class="row justify-center text-dark">
			<div class="col-12 col-sm-8 col-md-6">
				<q-card flat bordered class="q-pa-lg bg-white text-dark">

					<!-- avatar + basic info -->
					<div class="row items-center q-col-gutter-md">
						<div class="col-auto">
							<q-avatar v-if="avatarUrl" size="100px">
								<img :src="avatarUrl" alt="User avatar" />
							</q-avatar>
							<q-avatar v-else size="100px" color="primary" text-color="white">
								{{ avatarInitials }}
							</q-avatar>
						</div>
						<div class="col">
							<div class="text-h5 text-weight-bold text-black">
								{{ authUser?.fullName || 'Your Name' }}
							</div>
							<div class="text-subtitle2 text-grey-9">
								{{ authUser?.nickname ? '@' + authUser.nickname : '@nickname' }}
							</div>
							<div class="text-caption text-grey-9">
								{{ authUser?.email || 'your@email.com' }}
							</div>
						</div>
					</div>

					<q-separator spaced />

					<!-- info section -->
					<div class="q-gutter-sm">
						<div>
							<div class="text-subtitle1 text-weight-bold">Bio</div>
							<div class="text-body2 text-grey-9">
								{{ authUser?.bio || 'No bio yet.' }}
							</div>
						</div>

						<div>
							<div class="text-subtitle1 text-weight-bold">Joined</div>
							<div class="text-body2 text-grey-9">
								{{ joinedDate || 'Unknown' }}
							</div>
						</div>
					</div>

					<q-separator spaced />

					<div class="text-center q-mt-md">
						<q-btn color="black" label="Edit profile" icon="edit" unelevated />
					</div>
				</q-card>
			</div>
		</div>
	</q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from 'src/stores/auth'

defineOptions({ name: 'ProfilePage' })

const auth = useAuthStore()

const authUser = computed(() => auth.user)

const avatarUrl = computed(() => {
	const user = authUser.value
	// return empty string if there is no avatar, so template always gets a string
	return user?.avatarUrl ?? ''
})

const avatarInitials = computed(() => {
	const user = authUser.value
	if (!user) return '?'

	const chars: string[] = []

	const first = user.firstname?.charAt(0)
	if (first) chars.push(first)

	const last = user.lastname?.charAt(0)
	if (last) chars.push(last)

	if (!chars.length && user.fullName) {
		const parts = user.fullName.split(' ').filter(p => p && p.trim().length > 0)
		const p0 = parts[0]?.charAt(0)
		const p1 = parts[1]?.charAt(0)
		if (p0) chars.push(p0)
		if (p1) chars.push(p1)
	}

	const nick = user.nickname?.charAt(0)
	if (!chars.length && nick) chars.push(nick)

	const mail = user.email?.charAt(0)
	if (!chars.length && mail) chars.push(mail)

	return chars.join('').toUpperCase()
})

const joinedDate = computed(() => {
	const user = authUser.value
	if (!user || !user.createdAt) return ''

	const date = new Date(user.createdAt)
	if (Number.isNaN(date.getTime())) return ''

	return date.toLocaleDateString('en-US', {
		month: 'long',
		year: 'numeric',
	})
})
</script>