<script setup>
import { ref, computed, watch } from 'vue';

// --- Reactive State ---
const dialog = ref(false);
const deleteDialog = ref(false);
const search = ref('');
const form = ref(null);

const defaultItem = {
  id: null,
  name: '', // MOU Type Name (e.g., Academic, Research)
  organization: 'VIT, Pune',
  isActive: true,
};

const editedItem = ref({ ...defaultItem });
let itemToDelete = null;

// Table headers
const headers = ref([
  { title: 'S.No', key: 'sno', align: 'start', sortable: false },
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Organization', key: 'organization', align: 'start' },
  { title: 'Action', key: 'actions', align: 'center', sortable: false },
]);

// Mock data for MOU Type
const mouTypes = ref([
  { id: 1, name: 'Academic', organization: 'VIT, Pune', isActive: true },
  { id: 2, name: 'Research', organization: 'VIT, Pune', isActive: true },
  { id: 3, name: 'Internship', organization: 'VIT, Pune', isActive: true },
  { id: 4, name: 'Placement', organization: 'VIT, Pune', isActive: false },
]);

// --- Computed Properties ---
const isEditing = computed(() => !!editedItem.value.id);
const formTitle = computed(() => (isEditing.value ? 'Edit MOU Type' : 'Add MOU Type'));

// --- Form Validation Rules ---
const nameRules = [
  (v) => !!v || 'MOU Type Name is required.',
];

// --- Watchers ---
watch(dialog, (val) => {
  if (!val) closeDialog();
});

watch(deleteDialog, (val) => {
  if (!val) closeDeleteDialog();
});

// --- Methods ---

const handleExport = () => {
  console.log('Exporting MOU Type data...');
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
    const index = mouTypes.value.findIndex(type => type.id === itemToDelete.id);
    if (index > -1) {
      mouTypes.value.splice(index, 1);
    }
  }
  closeDeleteDialog();
};

const closeDialog = () => {
  dialog.value = false;
  editedItem.value = { ...defaultItem };
  form.value?.resetValidation();
};

const closeDeleteDialog = () => {
  deleteDialog.value = false;
  itemToDelete = null;
};

const saveMOUType = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  if (isEditing.value) {
    const index = mouTypes.value.findIndex(type => type.id === editedItem.value.id);
    if (index > -1) {
      Object.assign(mouTypes.value[index], editedItem.value);
    }
  } else {
    const newItem = {
      ...editedItem.value,
      id: Date.now(),
    };
    mouTypes.value.unshift(newItem);
  }
  closeDialog();
};
</script>

<template>
  <v-container fluid>
    <v-card elevation="2">
      <v-toolbar flat>
        <v-toolbar-title class="text-h5 font-weight-medium">
          MOU Type
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
        :items="mouTypes"
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
            <v-form ref="form" @submit.prevent="saveMOUType">
              <v-text-field
                v-model="editedItem.name"
                :rules="nameRules"
                label="MOU Type Name *"
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
          <v-btn color="primary" variant="flat" @click="saveMOUType">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <v-dialog v-model="deleteDialog" max-width="400px" persistent>
        <v-card>
            <v-card-title class="text-h5">Confirm Deletion</v-card-title>
            <v-card-text>Are you sure you want to delete this MOU Type?</v-card-text>
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
<style scoped>
/* Optional: Add custom styles if needed. Vuetify's props handle most cases. */
.v-toolbar-title {
    color: #333;
}
</style>