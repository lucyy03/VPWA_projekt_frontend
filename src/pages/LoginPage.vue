<template>
	<q-page class="flex flex-center">
		<!-- background layer: svg gradient, no css styles -->
		<div class="absolute-full">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="100%"
				height="100%"
				preserveAspectRatio="none"
			>
				<defs>
					<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stop-color="#667eea" />
						<stop offset="100%" stop-color="#764ba2" />
					</linearGradient>
				</defs>
				<rect width="100%" height="100%" fill="url(#bg)" />
			</svg>
		</div>

		<!-- foreground content -->
		<q-card style="width:360px;max-width:90vw">
			<q-card-section class="text-h6 text-center" style="background-color: black; color: white;">
				✩°｡⋆ Welcome to Daze ⋆｡°✩
			</q-card-section>
			<q-separator />
			<q-card-section class="q-gutter-md">
				<q-input
					v-model="email"
					type="email"
					label="E-mail or nickname"
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
						label="Log In"
						color="black"
						style="width: 280px"
						@click="onSubmit"
					/>

					<q-btn
						:loading="loading"
						label="Sign Up"
						color="black"
						style="width: 280px"
						@click="onSignUp"
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
const auth = useAuthStore()

async function onSubmit() {
	loading.value = true
	error.value = ''

	try {
		const ok = await auth.login(email.value, password.value)

		if (ok) {
			await router.push('/chats')
		} else {
			error.value = 'Invalid email/nickname or password.'
		}
	} finally {
		loading.value = false
	}
}

function onSignUp() {
	// handle signup
	loading.value = true
	error.value = ''
	loading.value = false
	void router.push('/signup')
}
</script>