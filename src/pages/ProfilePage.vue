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
							<q-avatar size="100px">
								<img
									src="https://randomgif.durzumzhumog.workers.dev/"
									alt="User avatar"
								/>
							</q-avatar>
						</div>
						<div class="col">
							<div class="text-h5 text-weight-bold text-black">Jim Halpert</div>
							<div class="text-subtitle2 text-grey-9">@bigtuna42</div>
							<div class="text-caption text-grey-9">jim.halpert@office.com</div>
						</div>
					</div>

					<q-separator spaced />

					<!-- info section -->
					<div class="q-gutter-sm">
						<div>
							<div class="text-subtitle1 text-weight-bold">Bio</div>
							<div class="text-body2 text-grey-9">
								Bears. Beets. Battlestar Galactica.
							</div>
						</div>

						<div>
							<div class="text-subtitle1 text-weight-bold">Joined</div>
							<div class="text-body2 text-grey-9">October, 2025</div>
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
defineOptions({ name: 'ProfilePage' })
</script>