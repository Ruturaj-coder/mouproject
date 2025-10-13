<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import axios from 'axios';

// --- MODIFIED: API Configuration with UID ---
// NOTE: The 'uid' is now required in the headers for all requests.
const apiClient = axios.create({
  baseURL: 'http://192.168.0.102:8093/AcademicYear',
  headers: {
    'Content-Type': 'application/json',
    'uid': 'vikas@vit.edu' // <-- ADD THIS LINE
  }
});

// --- Reactive State ---
const dialog = ref(false);
const deleteDialog = ref(false);
const search = ref('');
const form = ref(null);
const loading = ref(true);

const defaultItem = {
  id: null,
  name: '',
  organization: 'VIT, Pune',
  isActive: true,
};

const editedItem = ref({ ...defaultItem });
let itemToDelete = null;

const headers = ref([
  { title: 'S.No', key: 'sno', align: 'start', sortable: false },
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Organization', key: 'organization', align: 'start' },
  { title: 'Status', key: 'isActive', align: 'center' },
  { title: 'Action', key: 'actions', align: 'center', sortable: false },
]);

const academicYears = ref([]);

// --- Computed Properties ---
const isEditing = computed(() => !!editedItem.value.id);
const formTitle = computed(() => (isEditing.value ? 'Edit Academic Year' : 'Add Academic Year'));

// --- Form Validation Rules ---
const nameRules = [
  (v) => !!v || 'Academic Year name is required.',
  (v) => (v && v.length >= 4) || 'Name must be at least 4 characters long.',
];

// --- Watchers ---
watch(dialog, (val) => {
  if (!val) closeDialog();
});

watch(deleteDialog, (val) => {
  if (!val) closeDeleteDialog();
})

// --- API Methods ---

const fetchAcademicYears = async () => {
  loading.value = true;
  try {
    // No change needed here, apiClient will automatically add the header
    const response = await apiClient.post('/listAllAcademicYears');
    if (response.data && response.data.academic_years) {
      academicYears.value = response.data.academic_years.map(item => ({
        id: item.id,
        name: item.ay,
        organization: 'VIT, Pune',
        isActive: item.isactive,
      }));
    }
  } catch (error) {
    console.error("Error fetching academic years:", error);
  } finally {
    loading.value = false;
  }
};

// --- Component Lifecycle ---
onMounted(() => {
  fetchAcademicYears();
});


// --- Methods ---

const openAddDialog = () => {
  editedItem.value = { ...defaultItem };
  dialog.value = true;
};

const editItem = (item) => {
  editedItem.value = { ...item };
  dialog.value = true;
};

const deleteItem = (item) => {
  itemToDelete = item;
  deleteDialog.value = true;
};

const deleteItemConfirm = async () => {
  if (!itemToDelete) return;
  try {
    const payload = { id: itemToDelete.id };
    // No change needed here, apiClient will automatically add the header
    const response = await apiClient.post('/deleteAcademicYear', payload);
    console.log(response.data.msg);
    await fetchAcademicYears();
  } catch (error) {
    console.error("Error deleting academic year:", error);
  } finally {
    closeDeleteDialog();
  }
};

const closeDialog = () => {
  dialog.value = false;
  setTimeout(() => {
    editedItem.value = { ...defaultItem };
    form.value?.resetValidation();
  }, 300);
};

const closeDeleteDialog = () => {
  deleteDialog.value = false;
  itemToDelete = null;
};

const saveAcademicYear = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  try {
    if (isEditing.value) {
      const payload = {
        id: editedItem.value.id,
        ay: editedItem.value.name,
        isactive: editedItem.value.isActive,
      };
      // No change needed here, apiClient will automatically add the header
      const response = await apiClient.post('/updateAcademicYear', payload);
      console.log(response.data.msg);
    } else {
      const payload = {
        ay: editedItem.value.name,
      };
      // No change needed here, apiClient will automatically add the header
      const response = await apiClient.post('/addAcademicYear', payload);
      console.log(response.data.msg);
    }
    await fetchAcademicYears();
  } catch (error) {
    console.error("Error saving academic year:", error);
  } finally {
    closeDialog();
  }
};

const toggleStatus = async (item) => {
  try {
    const payload = {
      id: item.id,
      isactive: item.isActive,
    };
    // No change needed here, apiClient will automatically add the header
    const response = await apiClient.post('/updateAcademicYear', payload);
    console.log(response.data.msg);
  } catch (error) {
    console.error("Error updating status:", error);
    item.isActive = !item.isActive;
  }
};

</script>

<template>
  <v-container fluid>
    <v-card elevation="2">
      <v-toolbar flat>
        <v-toolbar-title class="text-h5 font-weight-medium">
          Academic Years
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-text-field v-model="search" label="Search" density="compact" variant="outlined"
          prepend-inner-icon="mdi-magnify" single-line hide-details class="mr-4"
          style="max-width: 300px;"></v-text-field>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openAddDialog">
          Add New
        </v-btn>
      </v-toolbar>

      <v-divider></v-divider>

      <v-data-table :headers="headers" :items="academicYears" :search="search" :loading="loading" items-per-page="10">
        <template v-slot:item.sno="{ index }">
          {{ index + 1 }}
        </template>

        <template v-slot:item.isActive="{ item }">
          <v-chip :color="item.isActive ? 'green' : 'red'" variant="elevated" size="small">
            {{ item.isActive ? 'Active' : 'Inactive' }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-center align-center">
            <v-switch v-model="item.isActive" color="primary" inset hide-details class="mr-2"
              @update:modelValue="toggleStatus(item)"></v-switch>
            <v-btn icon="mdi-pencil" variant="text" size="small" @click="editItem(item)"></v-btn>
            <v-btn icon="mdi-delete-outline" variant="text" color="error" size="small"
              @click="deleteItem(item)"></v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="pa-4">
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text class="pa-4">
          <v-form ref="form" @submit.prevent="saveAcademicYear">
            <v-text-field v-model="editedItem.name" :rules="nameRules" label="Academic Year Name *" variant="outlined"
              required></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDialog">
            Cancel
          </v-btn>
          <v-btn color="primary" variant="flat" @click="saveAcademicYear">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400px" persistent>
      <v-card>
        <v-card-title class="text-h5">Confirm Deletion</v-card-title>
        <v-card-text>Are you sure you want to delete this academic year?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="deleteItemConfirm">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<style scoped>
/* Optional: Add custom styles if needed. Vuetify's props handle most cases. */
.v-toolbar-title {
  color: #333;
}
</style>