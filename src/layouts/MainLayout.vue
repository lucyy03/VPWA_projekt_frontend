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
          <q-item-section avatar><q-avatar icon="person" /></q-item-section>
          <q-item-section>
            <q-item-label>Lucy the Vychodnar</q-item-label>
            <q-item-label caption class="text-white">@lucy</q-item-label>
          </q-item-section>
        </q-item>
        <q-separator spaced />


        <q-item clickable v-ripple to="/chats" exact>
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>Chats</q-item-section>
        </q-item>

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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import CliOverlay from 'src/components/CliOverlay.vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'

const router = useRouter();
const leftDrawerOpen = ref(false);
const $q = useQuasar()
const auth = useAuthStore()

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
const userStatus = ref('online');
const statusOptions = [
  { label: 'Online', value: 'online' },
  { label: 'Do Not Disturb', value: 'dnd' },
  { label: 'Invisible', value: 'invisible' }
];
// computed icon and color for each status
const statusIcon = computed(() => {
  switch (userStatus.value) {
    case 'online':
      return 'circle';
    case 'dnd':
      return 'block';
    case 'invisible':
      return 'visibility_off';
    default:
      return 'help';
  }
});
const statusColor = computed(() => {
  switch (userStatus.value) {
    case 'online':
      return 'positive';
    case 'dnd':
      return 'negative';
    case 'invisible':
      return 'grey';
    default:
      return 'primary';
  }
});

// show one-time notification on page open
onMounted(() => {
  $q.notify({
    message: 'You have 1 new message',
    caption: 'from @lucy',
    icon: 'chat',
    color: 'primary',
    position: 'bottom-right',
    timeout: 10000, // auto-dismiss
    actions: [{ label: 'Open', color: 'white' }]
  })
})

</script>