<template>
	<q-page class="flex flex-center">
		<!-- background gradient as pure SVG (no CSS) -->
		<div class="absolute-full">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="100%"
				height="100%"
				preserveAspectRatio="none"
			>
				<defs>
					<!-- 135° equivalent gradient -->
					<linearGradient id="bg" x1="1" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="#667eea" />
						<stop offset="100%" stop-color="#764ba2" />
					</linearGradient>
				</defs>
				<rect width="100%" height="100%" fill="url(#bg)" />
			</svg>
		</div>

		<!-- signup card -->
		<q-card class="q-pa-md" :style="{ width: '360px', maxWidth: '90vw' }">
			<q-card-section class="text-h6 text-center bg-black text-white">
				✩°｡⋆ Sign Up to Daze ⋆｡°✩
			</q-card-section>

			<q-separator />

			<q-card-section class="q-gutter-md">
				<q-input
					v-model="first_name"
					type="text"
					label="First Name"
					autocomplete="first_name"
					dense
					outlined
				/>
				<q-input
					v-model="last_name"
					type="text"
					label="Last Name"
					autocomplete="last_name"
					dense
					outlined
				/>
				<q-input
					v-model="nickname"
					type="text"
					label="Nickname"
					autocomplete="nickname"
					dense
					outlined
				/>
				<q-input
					v-model="email"
					type="email"
					label="E-mail"
					autocomplete="email"
					dense
					outlined
				/>
				<q-input
					v-model="password"
					type="password"
					label="Password"
					autocomplete="current-password"
					dense
					outlined
					@keyup.enter="onSubmit"
				/>

				<div class="flex column items-center q-gutter-md q-mx-none">
					<q-btn
						:loading="loading"
						label="Sign Up"
						color="black"
						class="w-280"
						@click="onSubmit"
					/>
				</div>

				<div v-if="error" class="text-negative text-caption">{{ error }}</div>
			</q-card-section>
		</q-card>
	</q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const first_name = ref('')
const last_name = ref('')
const auth = useAuthStore()
const nickname = ref('')

async function onSubmit() {
	loading.value = true
	error.value = ''

	try {
		const fullName = `${first_name.value} ${last_name.value}`.trim()

		const result = await auth.signup(
			fullName,
			nickname.value,
			email.value,
			password.value,
		)

		if (result.ok) {
			await router.push('/chats')
		} else {
			error.value = result.error || 'Signup failed. Please check your info.'
		}
	} finally {
		loading.value = false
	}
}

</script>