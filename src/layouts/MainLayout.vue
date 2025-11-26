<template>
  <q-layout view="lHh Lpr lFf">
    <!-- header -->
    <q-header elevated class="bg-dark text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>
          <img src="https://png.pngtree.com/png-vector/20190726/ourlarge/pngtree-chat-icon-design-vector-png-image_1608710.jpg" alt="Daze Logo" style="height: 32px; vertical-align: middle; margin-right: 8px" />
          Daze</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <!-- burger menu -->
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered style="background-color: #1d1d1d; color: white;">
      <q-list padding>
        <!-- top section -->
        <q-item-label header>Menu</q-item-label>

        <q-item>
          <q-item-section avatar>
            <div :class="['member-avatar-ring', statusRingClass(userStatus)]">
              <q-avatar v-if="menuAvatarUrl" size="32px">
                <img :src="menuAvatarUrl" alt="User avatar" />
              </q-avatar>
              <q-avatar v-else size="32px" color="primary" text-color="white">
                {{ menuAvatarInitials }}
              </q-avatar>
            </div>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ menuDisplayName }}</q-item-label>
            <q-item-label caption class="text-white">
              {{ menuDisplayNickname }}
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-separator spaced />

        <q-item clickable v-ripple to="/chats" exact>
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>Chats</q-item-section>
        </q-item>

        <!-- <q-item clickable v-ripple to="/chats_old" exact>
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>Chats old</q-item-section>
        </q-item> -->

        <q-item clickable v-ripple to="/profile">
          <q-item-section avatar>
            <q-icon name="person" />
          </q-item-section>
          <q-item-section>Profile</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/settings">
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>Settings</q-item-section>
        </q-item>

        <!-- divider and extra links -->
        <q-separator spaced />

        <!-- bottom section (status + logout) -->
        <div class="absolute-bottom q-pa-md column">
          <q-select
            filled
            v-model="userStatus"
            :options="statusOptions"
            label="Status"
            emit-value
            map-options
            dense
            options-dense
            hide-bottom-space
            class="q-mb-sm"
            dark
            color="white"
            label-color="white"
          >
            <template v-slot:prepend>
              <q-icon :name="statusIcon" :color="statusColor" />
            </template>
          </q-select>

          <q-item clickable v-ripple @click="logout">
            <q-item-section avatar>
              <q-icon name="logout" />
            </q-item-section>
            <q-item-section>Logout</q-item-section>
          </q-item>
        </div>
      </q-list>
    </q-drawer>

    <!-- main page area -->
    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- only render on routes that opt in -->
    <CliOverlay v-if="$route.meta.cli === true" />

  </q-layout>
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
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import CliOverlay from 'src/components/CliOverlay.vue'
import { useAuthStore } from 'src/stores/auth'

const router = useRouter();
const leftDrawerOpen = ref(false);
const auth = useAuthStore()

const authUser = computed(() => auth.user)

const menuAvatarUrl = computed(() => {
	const user = authUser.value
	return user?.avatarUrl ?? ''
})

const menuAvatarInitials = computed(() => {
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

const menuDisplayName = computed(() => {
	const user = authUser.value
	if (!user) return 'Guest'

	if (user.fullName && user.fullName.trim().length > 0) {
		return user.fullName
	}

	const parts: string[] = []
	if (user.firstname) parts.push(user.firstname)
	if (user.lastname) parts.push(user.lastname)

	if (parts.length) return parts.join(' ')

	return 'Guest'
})

const menuDisplayNickname = computed(() => {
	const user = authUser.value
	if (!user || !user.nickname) return '@nickname'
	return `@${user.nickname}`
})

// ui only
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

async function logout() {
  // call the store but keep router push here
  await auth.logout()
  await router.push('/login');
}

// user status handling
const userStatus = ref(authUser.value?.status ?? 'online')

const statusOptions = [
	{ label: 'Online', value: 'online' },
	{ label: 'Do Not Disturb', value: 'dnd' },
	{ label: 'Offline', value: 'offline' },
]

// keep local select in sync when auth user changes (e.g. after login/refresh)
watch(authUser, newUser => {
	if (newUser && newUser.status) {
		userStatus.value = newUser.status
	}
})

// push changes to backend when user picks something
watch(userStatus, async (newStatus, oldStatus) => {
	if (newStatus === oldStatus) return
	if (!authUser.value) return

	try {
		await auth.updateStatus(newStatus)
	} catch (err) {
		console.error('failed to update status', err)
	}
})

// computed icon and color for each status
const statusIcon = computed(() => {
	switch (userStatus.value) {
		case 'online':
			return 'circle'
		case 'dnd':
			return 'block'
		case 'offline':
			return 'visibility_off'
		default:
			return 'help'
	}
})

const statusColor = computed(() => {
	switch (userStatus.value) {
		case 'online':
			return 'positive'
		case 'dnd':
			return 'negative'
		case 'offline':
			return 'grey'
		default:
			return 'primary'
	}
})

function statusRingClass(status?: string | null): string {
	if (status === 'online') return 'member-avatar-ring--online'
	if (status === 'dnd') return 'member-avatar-ring--dnd'
	return 'member-avatar-ring--offline'
}


</script>