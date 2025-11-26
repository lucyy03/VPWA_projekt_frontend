<template>
	<q-dialog v-model="localOpen">
		<q-card style="min-width:350px;max-width:90vw">
			<q-card-section class="row items-center">
				<div class="text-h6">channel members</div>
				<q-space />
				<q-btn flat round dense icon="close" @click="close" />
			</q-card-section>

			<q-card-section class="q-pa-none">
				<q-list bordered separator>
					

					<q-item v-for="m in members" :key="m.id">
						<q-item-section avatar>
							<div :class="['member-avatar-ring', statusRingClass(m.status)]">
								<q-avatar v-if="m.id === meId && menuAvatarUrl" size="32px">
									<img :src="menuAvatarUrl" alt="User avatar" />
								</q-avatar>

								<q-avatar v-else>
									<template v-if="m.avatar">
										<img :src="m.avatar" alt="avatar" />
									</template>
									<template v-else>
										<div
											class="flex items-center justify-center"
											:style="avatarStyle(m)"
										>
											{{ m.name?.charAt(0)?.toUpperCase() ?? '?' }}
										</div>
									</template>
								</q-avatar>
							</div>
						</q-item-section>

						<q-item-section>
							<q-item-section>
								<q-item-label>
									{{ m.name }}
									<span v-if="m.id === meId" class="text-grey-7"> (you)</span>
								</q-item-label>

								<q-item-label
									v-if="m.id === adminId"
									caption
									class="text-primary"
								>
									admin
								</q-item-label>
								<q-item-label caption class="text-grey-6">
									{{ memberStatusLabel(m.status) }}
								</q-item-label>
							</q-item-section>
						</q-item-section>

						<q-item-section
							v-if="canModerate && m.id !== adminId"
							side
						>
							<div class="row q-gutter-xs">
								<q-btn
									dense
									round
									size="sm"
									icon="person_remove"
									@click.stop="emit('kick', m)"
								/>
								<q-btn
									dense
									round
									size="sm"
									icon="block"
									color="negative"
									outline
									@click.stop="emit('ban', m)"
								/>
							</div>
						</q-item-section>
					</q-item>
				</q-list>
			</q-card-section>

			<q-card-actions align="right">
				<q-btn flat label="close" color="primary" @click="close" />
			</q-card-actions>
		</q-card>
	</q-dialog>
</template>

<style scoped>
.member-avatar-ring {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 2px;
	border-radius: 9999px;
	border: 2px solid transparent;
}

/* green - online */
.member-avatar-ring--online {
	border-color: #21ba45; /* quasar positive-ish green */
}

/* red - dnd */
.member-avatar-ring--dnd {
	border-color: #c10015; /* quasar negative-ish red */
}

/* grey - offline */
.member-avatar-ring--offline {
	border-color: #9e9e9e;
}
</style>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Member } from 'src/stores/chats'
import { useAuthStore } from 'src/stores/auth'

const props = defineProps<{
	modelValue: boolean
	members: Member[]
	adminId: number | null
	chatId: number
	canModerate: boolean
	meId: number
}>()

const emit = defineEmits<{
	(e:'update:modelValue', value:boolean): void
	(e:'kick', member: Member): void
	(e:'ban', member: Member): void
}>()

const localOpen = ref(props.modelValue)
const auth = useAuthStore()
const authUser = computed(() => auth.user)
const menuAvatarUrl = computed(() => {
	const user = authUser.value
	return user?.avatarUrl ?? ''
})

watch(
	() => props.modelValue,
	(v) => {
		localOpen.value = v
	}
)

watch(
	() => localOpen.value,
	(v) => {
		emit('update:modelValue', v)
	}
)

function close() {
	localOpen.value = false
}

function avatarStyle(m: Member): string {
	const base = 'width:32px;height:32px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;'
	const bg = m.color ? `background:${m.color};` : 'background:#607D8B;'
	return base + bg
}

function memberStatusLabel(status?: string | null): string {
	if (status === 'online') return 'online'
	if (status === 'dnd') return 'do not disturb'
	if (status === 'offline') return 'offline'
	return ''
}

function statusRingClass(status?: string | null): string {
	if (status === 'online') return 'member-avatar-ring--online'
	if (status === 'dnd') return 'member-avatar-ring--dnd'
	return 'member-avatar-ring--offline'
}

</script>