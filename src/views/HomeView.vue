<script setup>
import { ref } from 'vue';

// Array of navigation links for the dashboard cards
const adminLinks = ref([
  {
    title: 'Admin',
    description: 'Manage system-wide settings and users',
    icon: 'mdi-shield-account',
    path: '/admin/home',
  },
  {
    title: 'SPOC',
    description: 'Manage company partnerships and MOUs',
    icon: 'mdi-account-tie',
    path: '/spoc/home',
  },
  {
    title: 'Authority',
    description: 'Track MOU statuses and reports',
    icon: 'mdi-gavel',
    path: '/authority/home',
  },
]);
</script>

<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col>
        <h1 class="text-h4 font-weight-medium">Welcome Dashboard</h1>
        <p class="text-medium-emphasis">Select a module below to manage its settings.</p>
      </v-col>
    </v-row>

    <v-divider class="my-4"></v-divider>

    <v-row>
      <v-col
        v-for="item in adminLinks"
        :key="item.title"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <router-link :to="item.path" class="text-decoration-none">
          <v-card
            hover
            class="dashboard-card"
            elevation="2"
            height="100%"
          >
            <v-card-item class="pa-4">
              <div class="d-flex align-center">
                <v-avatar color="primary" rounded="lg" size="50">
                   <v-icon :icon="item.icon" size="30" color="white"></v-icon>
                </v-avatar>
                <div class="ml-4">
                  <v-card-title class="font-weight-bold text-h6 pa-0">
                    {{ item.title }}
                  </v-card-title>
                </div>
              </div>
              <v-card-text class="pa-0 mt-2">
                {{ item.description }}
              </v-card-text>
            </v-card-item>
          </v-card>
        </router-link>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.dashboard-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
}
</style>