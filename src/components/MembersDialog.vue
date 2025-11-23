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
							<q-avatar>
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

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Member } from 'src/stores/chats'

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
</script>