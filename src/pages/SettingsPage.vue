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

		<!-- page content -->
		<div class="row justify-center text-dark">
			<div class="col-12 col-sm-8 col-md-6">
				<q-card flat bordered class="q-pa-lg">

					<div class="text-h5 q-mb-md text-bold text-center">Settings</div>
					<q-separator spaced />


					<!-- notifications -->
					<div class="row items-center justify-between q-py-sm">
						<div class="col">
							<div class="text-subtitle1 text-weight-medium">Notifications</div>
						</div>
						<div class="col-auto">
							<q-toggle
								v-model="notifications"
								color="black"
								label="Off / On"
								left-label
							/>
						</div>
					</div>

					<q-separator spaced />

					<!-- notifications for only mentions -->
					<div class="row items-center justify-between q-py-sm">
						<div class="col">
							<div class="text-subtitle1 text-weight-medium">
								Notifications for only mentions
							</div>
						</div>
						<div class="col-auto">
							<q-toggle
								v-model="mentions"
								color="black"
								label="Off / On"
								left-label
								:disable="!notifications"
							/>
						</div>
					</div>

					<q-separator spaced />

					<div class="text-center q-mt-md">
						<q-btn label="Save Settings" color="black" unelevated @click="onSave" />
					</div>

				</q-card>
			</div>
		</div>
	</q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useSettingsStore } from 'src/stores/settings'

const $q = useQuasar()
const settingsStore = useSettingsStore()

//wire notifications toggle to store
const notifications = computed({
	get() {
		return settingsStore.notifications
	},
	set(val: boolean) {
		settingsStore.notifications = val
	},
})

//wire "mentions only" toggle to store
const mentions = computed({
	get() {
		return settingsStore.mentionsOnly
	},
	set(val: boolean) {
		settingsStore.mentionsOnly = val
	},
})

onMounted(() => {
	if (!settingsStore.loadedOnce) {
		void settingsStore.fetchSettings()
	}
})

async function onSave() {
	await settingsStore.saveSettings()

	$q.notify({
		type: 'positive',
		message: 'Settings saved',
	})
}
</script>