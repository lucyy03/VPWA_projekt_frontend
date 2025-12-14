<template>
	<q-dialog v-model="localOpen" persistent>
		<q-card style="min-width:350px;max-width:90vw">
			<q-card-section class="row items-center">
				<div class="text-h6">vote kick member</div>
				<q-space />
				<q-btn flat round dense icon="close" @click="close" />
			</q-card-section>

			<q-card-section class="q-pa-none">
				<q-list bordered separator>
					<q-item
						v-for="m in voteKickCandidates"
						:key="m.id"
						clickable
						@click="onSelect(m)"
					>
						<q-item-section avatar>
							<div :class="['member-avatar-ring', statusRingClass(m.status)]">
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
							</div>
						</q-item-section>

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
					</q-item>

					<q-item v-if="!voteKickCandidates.length">
						<q-item-section>
							<q-item-label caption>
								no members available for vote kick
							</q-item-label>
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

.member-avatar-ring--online { border-color: #21ba45; }
.member-avatar-ring--dnd { border-color: #c10015; }
.member-avatar-ring--offline { border-color: #9e9e9e; }
</style>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Member } from 'src/stores/chats'

const props = defineProps<{
	modelValue: boolean
	members: Member[]
	adminId: number | null
	meId: number
}>()

const emit = defineEmits<{
	(e:'update:modelValue', value:boolean): void
	(e:'vote-kick', member: Member): void
}>()

const localOpen = ref(props.modelValue)

watch(
	() => props.modelValue,
	(v) => {
		localOpen.value = v
	},
)

watch(
	() => localOpen.value,
	(v) => {
		emit('update:modelValue', v)
	},
)

const voteKickCandidates = computed(() =>
	props.members.filter(m => m.id !== props.adminId && m.id !== props.meId),
)

function close() {
	localOpen.value = false
}

function onSelect(member: Member) {
	emit('vote-kick', member)
	close()
}

function avatarStyle(m: Member): string {
	const base = 'width:32px;height:32px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;'
	const bg = m.color ? `background:${m.color};` : 'background:#607D8B;'
	return base + bg
}

function statusRingClass(status?: string | null): string {
	if (status === 'online') return 'member-avatar-ring--online'
	if (status === 'dnd') return 'member-avatar-ring--dnd'
	return 'member-avatar-ring--offline'
}

</script>