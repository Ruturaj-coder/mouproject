<script setup>
import { ref, computed, watch } from 'vue';

// --- Reactive State ---
const dialog = ref(false); // For Add/Edit MOU Status dialog
const deleteDialog = ref(false); // For Delete confirmation dialog
const search = ref(''); // For the search input

const form = ref(null); // Ref for the form validation

const defaultItem = {
  id: null,
  name: '', // MOU Status Name (e.g., Draft, Review)
  organization: 'VIT, Pune', // Default organization
  isActive: true, // Status toggle
};

const editedItem = ref({ ...defaultItem }); // Item being added or edited
let itemToDelete = null; // Item selected for deletion

// Table headers
const headers = ref([
  { title: 'S.No', key: 'sno', align: 'start', sortable: false },
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Organization', key: 'organization', align: 'start' },
  { title: 'Action', key: 'actions', align: 'center', sortable: false }, // Contains switch, edit, delete
]);

// Mock data for MOU Status
const mouStatuses = ref([
  { id: 1, name: 'Draft', organization: 'VIT, Pune', isActive: true },
  { id: 2, name: 'Review', organization: 'VIT, Pune', isActive: true },
  { id: 3, name: 'Recommended', organization: 'VIT, Pune', isActive: true },
  { id: 4, name: 'Approved', organization: 'VIT, Pune', isActive: true },
  { id: 5, name: 'Rejected', organization: 'VIT, Pune', isActive: false },
  { id: 6, name: 'Expired', organization: 'VIT, Pune', isActive: false },
]);

// --- Computed Properties ---
const isEditing = computed(() => !!editedItem.value.id);
const formTitle = computed(() => (isEditing.value ? 'Edit MOU Status' : 'Add MOU Status'));

// --- Form Validation Rules ---
const nameRules = [
  (v) => !!v || 'MOU Status Name is required.',
];

// --- Watchers ---
// Reset the form when the dialog is closed without saving
watch(dialog, (val) => {
  if (!val) closeDialog();
});

watch(deleteDialog, (val) => {
  if (!val) closeDeleteDialog();
});

// --- Methods ---

const handleExport = () => {
  console.log('Exporting MOU Status data...');
  // Implement actual export logic here (e.g., generate CSV/Excel)
};

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

const deleteItemConfirm = () => {
  if (itemToDelete) {
    const index = mouStatuses.value.findIndex(status => status.id === itemToDelete.id);
    if (index > -1) {
      mouStatuses.value.splice(index, 1);
    }
  }
  closeDeleteDialog();
};

const closeDialog = () => {
  dialog.value = false;
  editedItem.value = { ...defaultItem }; // Reset to default
  form.value?.resetValidation(); // Reset validation state if form ref exists
};

const closeDeleteDialog = () => {
  deleteDialog.value = false;
  itemToDelete = null;
};

const saveMOUStatus = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  if (isEditing.value) {
    // Update existing item
    const index = mouStatuses.value.findIndex(status => status.id === editedItem.value.id);
    if (index > -1) {
      Object.assign(mouStatuses.value[index], editedItem.value);
    }
  } else {
    // Add new item
    const newItem = {
      ...editedItem.value,
      id: Date.now(), // Use a real ID from your backend in a real app
    };
    mouStatuses.value.unshift(newItem); // Add to the beginning of the list
  }
  closeDialog();
};
</script>

<template>
  <v-container fluid>
    <v-card elevation="2">
      <v-toolbar flat>
        <v-toolbar-title class="text-h5 font-weight-medium">
          MOU Status
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          label="Search"
          density="compact"
          variant="outlined"
          prepend-inner-icon="mdi-magnify"
          single-line
          hide-details
          class="mr-4"
          style="max-width: 300px;"
        ></v-text-field>

        <v-btn icon="mdi-filter" variant="text" size="large" class="mr-2"></v-btn>
        
        <v-btn
          text
          color="blue"
          prepend-icon="mdi-download"
          @click="handleExport"
          class="mr-2"
        >
          Export
        </v-btn>

        <v-btn
          color="primary"
          variant="flat"
          icon="mdi-plus"
          size="large"
          @click="openAddDialog"
        ></v-btn>
      </v-toolbar>

      <v-divider></v-divider>

      <v-data-table
        :headers="headers"
        :items="mouStatuses"
        :search="search"
        items-per-page="10"
      >
        <template v-slot:item.sno="{ index }">
          {{ index + 1 }}
        </template>
        
        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-center align-center">
            <v-switch
              v-model="item.isActive"
              color="primary"
              inset
              hide-details
              class="mr-2"
            ></v-switch>
            <v-btn icon="mdi-pencil" variant="text" size="small" @click="editItem(item)"></v-btn>
            <v-btn icon="mdi-delete-outline" variant="text" color="error" size="small" @click="deleteItem(item)"></v-btn>
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
            <v-form ref="form" @submit.prevent="saveMOUStatus">
              <v-text-field
                v-model="editedItem.name"
                :rules="nameRules"
                label="MOU Status Name *"
                variant="outlined"
                required
              ></v-text-field>
            </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDialog">
            Cancel
          </v-btn>
          <v-btn color="primary" variant="flat" @click="saveMOUStatus">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <v-dialog v-model="deleteDialog" max-width="400px" persistent>
        <v-card>
            <v-card-title class="text-h5">Confirm Deletion</v-card-title>
            <v-card-text>Are you sure you want to delete this MOU Status?</v-card-text>
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
.v-toolbar-title {
    color: #333;
}
</style>