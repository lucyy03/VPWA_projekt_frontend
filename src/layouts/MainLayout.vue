<template>
  <q-layout view="lHh Lpr lFf">
    <!-- header -->
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>MyApp</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <!-- burger menu -->
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list padding>
        <!-- top section -->
        <q-item-label header>Burger menu</q-item-label>

        <q-item>
          <q-item-section avatar><q-avatar icon="person" /></q-item-section>
          <q-item-section>
            <q-item-label>Lucy the Vychodnar</q-item-label>
            <q-item-label caption>@lucy</q-item-label>
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


        <q-item clickable v-ripple @click="logout" class="absolute-bottom">
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>Logout</q-item-section>
        </q-item>
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import CliOverlay from 'src/components/CliOverlay.vue'

const router = useRouter();
const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

async function logout() {
  // handle logout later
  console.log('User logged out');
  await router.push('/login');
}
</script>
