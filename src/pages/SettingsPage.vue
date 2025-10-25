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

					<!-- dark mode -->
					<div class="row items-center justify-between q-py-sm">
						<div class="col">
							<div class="text-subtitle1 text-weight-medium">Dark Mode</div>
						</div>
						<div class="col-auto">
							<q-toggle
								v-model="darkMode"
								color="black"
								checked-icon="dark_mode"
								unchecked-icon="light_mode"
							/>
						</div>
					</div>

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
							/>
						</div>
					</div>

					<q-separator spaced />

					<!-- visibility -->
					<div class="row items-center justify-between q-py-sm">
						<div class="col">
							<div class="text-subtitle1 text-weight-medium">Visibility</div>
						</div>
						<div class="col-auto">
							<q-toggle
								v-model="visibility"
								color="black"
								label="Off / On"
								left-label
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
import { ref } from 'vue'
import { useQuasar } from 'quasar'

//assumption: quasar dark mode plugin is enabled
const $q = useQuasar()

const darkMode = ref(false)
const notifications = ref(true)
const mentions = ref(true)
const visibility = ref(true)

function onSave() {
	$q.notify({
		type: 'positive',
		message: 'Settings saved (frontend only)'
	})
}
</script>