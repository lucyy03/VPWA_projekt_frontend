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
							<q-avatar>
								{{ m.name?.charAt(0)?.toUpperCase() ?? '?' }}
							</q-avatar>
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
</script>