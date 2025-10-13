<script setup>
import { ref, computed, watch } from 'vue';

// --- Reactive State ---
const dialog = ref(false);
const deleteDialog = ref(false);
const search = ref('');
const form = ref(null); 

const defaultItem = {
  id: null,
  level: null,
  post: '',
  user: null, // This will hold the selected user object
  isLastAuthority: false,
  organization: 'VIT, Pune',
  isActive: true,
};

const editedItem = ref({ ...defaultItem });
let itemToDelete = null;

// Table headers matching the image
const headers = ref([
  { title: 'S.No', key: 'sno', align: 'start', sortable: false },
  { title: 'Level No', key: 'level', align: 'start' },
  { title: 'Post', key: 'post', align: 'start' },
  { title: 'Is Last Authority ?', key: 'isLastAuthority', align: 'center', sortable: false },
  { title: 'User', key: 'user', align: 'start' },
  { title: 'Organization', key: 'organization', align: 'start' },
  { title: 'Action', key: 'actions', align: 'center', sortable: false },
]);

// Mock data for the table
const mouHierarchies = ref([
  { id: 1, level: 1, post: 'Institute MOU Coordinator', isLastAuthority: false, user: {id: 70103, name: 'Alankar Dasare'}, organization: 'VIT, Pune', isActive: true },
  { id: 2, level: 2, post: 'Management', isLastAuthority: true, user: {id: 70243, name: 'Vikas Chauhan'}, organization: 'VIT, Pune', isActive: true },
]);

// Mock data for the User dropdown in the form
const users = ref([
    {id: 70103, name: 'Alankar Dasare'},
    {id: 70243, name: 'Vikas Chauhan'},
    {id: 70350, name: 'Priya Sharma'},
    {id: 70481, name: 'Rahul Verma'},
]);

// --- Computed Properties ---
const formTitle = computed(() => (editedItem.value.id ? 'Edit MOU Hierarchy' : 'Add MOU Hierarchy'));

// --- Form Validation Rules ---
const levelRules = [(v) => !!v || 'Level No is required.'];
const postRules = [(v) => !!v || 'Post is required.'];
const userRules = [(v) => !!v || 'User is required.'];

// --- Watchers ---
watch(dialog, (val) => {
  if (!val) closeDialog();
});

watch(deleteDialog, (val) => {
  if (!val) closeDeleteDialog();
})

// --- Methods ---
const openAddDialog = () => {
  editedItem.value = { ...defaultItem };
  dialog.value = true;
};

const editItem = (item) => {
  // Ensure we are editing a deep copy
  editedItem.value = JSON.parse(JSON.stringify(item));
  dialog.value = true;
};

const deleteItem = (item) => {
  itemToDelete = item;
  deleteDialog.value = true;
};

const deleteItemConfirm = () => {
  if (itemToDelete) {
    const index = mouHierarchies.value.findIndex(h => h.id === itemToDelete.id);
    if (index > -1) {
      mouHierarchies.value.splice(index, 1);
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

const saveMouHierarchy = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  if (editedItem.value.id) {
    // Update existing item
    const index = mouHierarchies.value.findIndex(h => h.id === editedItem.value.id);
    if (index > -1) {
      Object.assign(mouHierarchies.value[index], editedItem.value);
    }
  } else {
    // Add new item
    const newItem = {
      ...editedItem.value,
      id: Date.now(), 
    };
    mouHierarchies.value.push(newItem); // Add to bottom to maintain level order
  }
  closeDialog();
};

</script>

<template>
  <v-container fluid>
    <v-card elevation="2">
      <v-toolbar flat>
        <v-toolbar-title class="text-h5 font-weight-medium">
          MOU Hierarchy
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
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          @click="openAddDialog"
        >
          Add New
        </v-btn>
      </v-toolbar>

      <v-divider></v-divider>

      <v-data-table
        :headers="headers"
        :items="mouHierarchies"
        :search="search"
        items-per-page="10"
      >
        <template v-slot:item.sno="{ index }">
          {{ index + 1 }}
        </template>
        
        <template v-slot:item.isLastAuthority="{ item }">
           <v-icon :color="item.isLastAuthority ? 'green' : 'red'">
             {{ item.isLastAuthority ? 'mdi-check-circle' : 'mdi-close-circle' }}
           </v-icon>
        </template>
        
        <template v-slot:item.user="{ item }">
            {{ item.user.id }} : {{ item.user.name }}
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

    <v-dialog v-model="dialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="pa-4">
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text class="pa-4">
           <v-form ref="form" @submit.prevent="saveMouHierarchy">
              <v-container>
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="editedItem.level"
                      label="Level No *"
                      type="number"
                      :rules="levelRules"
                      variant="outlined"
                      required
                    ></v-text-field>
                  </v-col>
                   <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="editedItem.post"
                      label="Post *"
                      :rules="postRules"
                      variant="outlined"
                      required
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-select
                        v-model="editedItem.user"
                        :items="users"
                        item-title="name"
                        item-value="id"
                        return-object
                        label="User *"
                        :rules="userRules"
                        variant="outlined"
                        required
                    >
                        <template v-slot:selection="{ item }">
                           {{ item.raw.id }} : {{ item.raw.name }}
                        </template>
                        <template v-slot:item="{ props, item }">
                            <v-list-item v-bind="props" :title="`${item.raw.id} : ${item.raw.name}`"></v-list-item>
                        </template>
                    </v-select>
                  </v-col>
                  <v-col cols="12">
                    <v-checkbox
                        v-model="editedItem.isLastAuthority"
                        label="Is Last Authority ?"
                    ></v-checkbox>
                  </v-col>
                </v-row>
              </v-container>
           </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDialog">
            Cancel
          </v-btn>
          <v-btn color="primary" variant="flat" @click="saveMouHierarchy">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <v-dialog v-model="deleteDialog" max-width="400px" persistent>
        <v-card>
            <v-card-title class="text-h5">Confirm Deletion</v-card-title>
            <v-card-text>Are you sure you want to delete this hierarchy level?</v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey-darken-1" variant="text" @click="closeDeleteDialog">Cancel</v-btn>
                <v-btn color="error" variant="flat" @click="deleteItemConfirm">Delete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    
  </v-container>
</template>