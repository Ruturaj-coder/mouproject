<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

// --- API Configuration ---
// !! IMPORTANT: Get the UID of the logged-in user
// This is a placeholder. You must get this from your auth state (Pinia, LocalStorage, etc.)
const loggedInUserUid = 'INSTRUCTOR_UID_HERE'; 

const baseApiUrl = 'http://192.168.0.102:8093';

// Client for MoU operations
const mouApiClient = axios.create({
  baseURL: `${baseApiUrl}/mou`,
});

// Clients for all the dropdowns (as per your UrlMappings.groovy)
// We assume they all require the 'uid' header like your AcademicYearController
const createDropdownClient = (controllerName) => {
  return axios.create({
    baseURL: `${baseApiUrl}/${controllerName}`,
    headers: {
      'Content-Type': 'application/json',
      'uid': loggedInUserUid 
    }
  });
};

const academicYearApiClient = createDropdownClient('AcademicYear');
const companyApiClient = createDropdownClient('Company');
const campusApiClient = createDropdownClient('Campus');
const mouStatusApiClient = createDropdownClient('MouStatus');
const mouTypeApiClient = createDropdownClient('MouType');
// ... create other clients as needed (Department, Instructor, Organization)

// --- Component State ---
const mous = ref([]);
const loading = ref(true);
const dialog = ref(false);
const deleteDialog = ref(false);
const search = ref('');

// --- Form State ---
const form = ref(null);
const defaultItem = {
  id: null,
  title: '',
  scope: '',
  start_date: null,
  end_date: null,
  date_of_signing: null,
  company_spoc_name: '',
  company_spoc_email: '',
  company_spoc_contact: '',
  
  // Relational IDs
  organizationId: null,
  companyId: null,
  departmentId: null,
  finalmoustatusId: null,
  internalspocId: null,
  approvedbyId: null,
  moutypeId: null,
  campusId: null,
  entrybyId: null,
  academicyearId: null,

  // File paths
  draft_mou_file_path: null,
  final_mou_file_path: null,
  nda_mou_file_path: null,
};
const editedItem = ref({ ...defaultItem });
let itemToDelete = ref(null);

// File input refs
const draftMouFile = ref(null);
const finalMouFile = ref(null);
const ndaMouFile = ref(null);

// --- Dropdown Data Refs ---
// These are now empty and will be filled from your API
const organizations = ref([]);
const companies = ref([]);
const departments = ref([]);
const statuses = ref([]);
const instructors = ref([]);
const mouTypes = ref([]);
const campuses = ref([]);
const academicYears = ref([]);

// --- Computed Properties ---
const isEditing = computed(() => !!editedItem.value.id);
const formTitle = computed(() => (isEditing.value ? 'Edit MoU' : 'Create New MoU'));

// --- Data Table Headers ---
const headers = ref([
  { title: 'S.No', key: 'sno', align: 'start', sortable: false },
  { title: 'Title', key: 'title', align: 'start' },
  { title: 'Company', key: 'company.name', align: 'start' }, // This will work if Grails renders the nested object
  { title: 'Status', key: 'finalmoustatus.name', align: 'start' },
  { title: 'Start Date', key: 'start_date', align: 'center' },
  { title: 'End Date', key: 'end_date', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false },
]);

// --- API Methods ---

// 1. Fetch all MoUs (R in CRUD)
const fetchMous = async () => {
  loading.value = true;
  try {
    // Calls GET /mou which maps to index()
    const response = await mouApiClient.get('/'); 
    mous.value = response.data;
  } catch (error) {
    console.error("Error fetching MoUs:", error);
  } finally {
    loading.value = false;
  }
};

// 2. Save (Create/Update) MoU (C & U in CRUD)
const saveMou = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  const formData = new FormData();

  // Append all text/date/ID fields
  formData.append('title', editedItem.value.title || '');
  formData.append('scope', editedItem.value.scope || '');
  formData.append('start_date', editedItem.value.start_date || '');
  formData.append('end_date', editedItem.value.end_date || '');
  formData.append('date_of_signing', editedItem.value.date_of_signing || '');
  formData.append('company_spoc_name', editedItem.value.company_spoc_name || '');
  formData.append('company_spoc_email', editedItem.value.company_spoc_email || '');
  formData.append('company_spoc_contact', editedItem.value.company_spoc_contact || '');

  // Append relational IDs
  formData.append('organization.id', editedItem.value.organizationId || '');
  formData.append('company.id', editedItem.value.companyId || '');
  formData.append('department.id', editedItem.value.departmentId || '');
  formData.append('finalmoustatus.id', editedItem.value.finalmoustatusId || '');
  formData.append('internalspoc.id', editedItem.value.internalspocId || '');
  formData.append('approvedby.id', editedItem.value.approvedbyId || '');
  formData.append('moutype.id', editedItem.value.moutypeId || '');
  formData.append('campus.id', editedItem.value.campusId || '');
  formData.append('entryby.id', editedItem.value.entrybyId || '');
  formData.append('academicyear.id', editedItem.value.academicyearId || '');

  // Append files
  if (draftMouFile.value && draftMouFile.value.length > 0) {
    formData.append('draftMouFile', draftMouFile.value[0]);
  }
  if (finalMouFile.value && finalMouFile.value.length > 0) {
    formData.append('finalMouFile', finalMouFile.value[0]);
  }
  if (ndaMouFile.value && ndaMouFile.value.length > 0) {
    formData.append('ndaMouFile', ndaMouFile.value[0]);
  }

  try {
    if (isEditing.value) {
      // MODIFIED: Calls POST /mou/update/123
      await mouApiClient.post(`/update/${editedItem.value.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else {
      // MODIFIED: Calls POST /mou/save
      await mouApiClient.post('/save', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    await fetchMous(); // Refresh the list
  } catch (error) {
    console.error("Error saving MoU:", error);
  } finally {
    closeDialog();
  }
};

// 3. Delete MoU (D in CRUD)
const deleteMouConfirm = async () => {
  if (!itemToDelete.value) return;
  try {
    // MODIFIED: Calls DELETE /mou/delete/123
    await mouApiClient.delete(`/delete/${itemToDelete.value.id}`); 
    await fetchMous(); // Refresh the list
  } catch (error)
 {
    console.error("Error deleting MoU:", error);
  } finally {
    closeDeleteDialog();
  }
};

// --- NEW: API Methods for Dropdowns ---
// Generic fetch function assuming a 'listAll' action and a 'name' field for the title
const fetchDropdownData = async (apiClient, listRef, actionName, responseKey) => {
  try {
    // We use POST as established from your AcademicYearController
    const response = await apiClient.post(`/${actionName}`); 
    if (response.data && response.data[responseKey]) {
      // Map to a format v-select understands
      listRef.value = response.data[responseKey].map(item => ({
        id: item.id,
        // Assuming the display field is 'name' or 'ay'
        name: item.name || item.ay || item.title 
      }));
    }
  } catch (error) {
    console.error(`Error fetching ${responseKey}:`, error);
  }
};

// --- Lifecycle Hook ---
onMounted(() => {
  // Fetch main table data
  fetchMous();
  
  // Fetch all dropdown data
  // ASSUMPTIONS:
  // 1. The action name (e.g., 'listAllCompanies')
  // 2. The key in the JSON response (e.g., 'companies')
  // Please adjust these strings if your controller actions are named differently.
  
  fetchDropdownData(academicYearApiClient, academicYears, 'listAllAcademicYears', 'academic_years');
  fetchDropdownData(companyApiClient, companies, 'listAllCompanies', 'companies'); // Assumed action/key
  fetchDropdownData(campusApiClient, campuses, 'listAllCampuses', 'campuses'); // Assumed action/key
  fetchDropdownData(mouStatusApiClient, statuses, 'listAllMouStatuses', 'mou_statuses'); // Assumed action/key
  fetchDropdownData(mouTypeApiClient, mouTypes, 'listAllMouTypes', 'mou_types'); // Assumed action/key

  // !! TODO: You still need to provide controllers/mappings for these:
  // fetchDropdownData(departmentApiClient, departments, 'listAllDepartments', 'departments');
  // fetchDropdownData(instructorApiClient, instructors, 'listAllInstructors', 'instructors');
  // fetchDropdownData(organizationApiClient, organizations, 'listAllOrganizations', 'organizations');
});

// --- Dialog & Form Methods (No changes from here down) ---
const clearFileInputs = () => {
  draftMouFile.value = null;
  finalMouFile.value = null;
  ndaMouFile.value = null;
};

const openAddDialog = () => {
  editedItem.value = { 
    ...defaultItem,
    entrybyId: loggedInUserUid, // Automatically set the entry person
    // You could also set a default organization or campusId here
  };
  clearFileInputs();
  form.value?.resetValidation();
  dialog.value = true;
};

const openEditDialog = (item) => {
  editedItem.value = {
    id: item.id,
    title: item.title,
    scope: item.scope,
    start_date: item.start_date ? item.start_date.split('T')[0] : null,
    end_date: item.end_date ? item.end_date.split('T')[0] : null,
    date_of_signing: item.date_of_signing ? item.date_of_signing.split('T')[0] : null,
    company_spoc_name: item.company_spoc_name,
    company_spoc_email: item.company_spoc_email,
    company_spoc_contact: item.company_spoc_contact,
    
    // Map relations
    organizationId: item.organization?.id || null,
    companyId: item.company?.id || null,
    departmentId: item.department?.id || null,
    finalmoustatusId: item.finalmoustatus?.id || null,
    internalspocId: item.internalspoc?.id || null,
    approvedbyId: item.approvedby?.id || null,
    moutypeId: item.moutype?.id || null,
    campusId: item.campus?.id || null,
    entrybyId: item.entryby?.id || null,
    academicyearId: item.academicyear?.id || null,

    // File paths
    draft_mou_file_path: item.draft_mou_file_path,
    final_mou_file_path: item.final_mou_file_path,
    nda_mou_file_path: item.nda_mou_file_path,
  };
  clearFileInputs();
  form.value?.resetValidation();
  dialog.value = true;
};

const openDeleteDialog = (item) => {
  itemToDelete.value = item;
  deleteDialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
};

const closeDeleteDialog = () => {
  deleteDialog.value = false;
  itemToDelete.value = null;
};

// --- Form Rules ---
const rules = {
  required: v => !!v || 'This field is required.',
  email: v => !v || /.+@.+\..+/.test(v) || 'Must be a valid email.',
};

</script>

<template>
  <v-container fluid>
    <v-card elevation="2">
      <v-toolbar flat>
        <v-toolbar-title class="text-h5 font-weight-medium">
          MOU Management
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          label="Search MoUs"
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
          Add New MoU
        </v-btn>
      </v-toolbar>
      <v-divider></v-divider>

      <v-data-table
        :headers="headers"
        :items="mous"
        :search="search"
        :loading="loading"
        items-per-page="10"
      >
        <template v-slot:item.sno="{ index }">
          {{ index + 1 }}
        </template>
        
        <template v-slot:item.start_date="{ item }">
          {{ item.start_date ? new Date(item.start_date).toLocaleDateString() : 'N/A' }}
        </template>
        <template v-slot:item.end_date="{ item }">
          {{ item.end_date ? new Date(item.end_date).toLocaleDateString() : 'N/A' }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEditDialog(item)" title="Edit"></v-btn>
          <v-btn icon="mdi-delete-outline" variant="text" color="error" size="small" @click="openDeleteDialog(item)" title="Delete"></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="900px" persistent>
      <v-card>
        <v-card-title class="pa-4">
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>
        <v-divider></v-divider>

        <v-card-text class="pa-4" style="max-height: 70vh; overflow-y: auto;">
          <v-form ref="form" @submit.prevent="saveMou">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="editedItem.title"
                    :rules="[rules.required]"
                    label="MoU Title *"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="editedItem.scope"
                    label="Scope"
                    variant="outlined"
                    rows="3"
                  ></v-textarea>
                </v-col>

                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="editedItem.start_date"
                    label="Start Date"
                    type="date"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="editedItem.end_date"
                    label="End Date"
                    type="date"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="editedItem.date_of_signing"
                    label="Date of Signing"
                    type="date"
                    variant="outlined"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6" md="4">
                  <v-select
                    v-model="editedItem.companyId"
                    :items="companies"
                    item-title="name"
                    item-value="id"
                    label="Company *"
                    :rules="[rules.required]"
                    variant="outlined"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-select
                    v-model="editedItem.departmentId"
                    :items="departments"
                    item-title="name"
                    item-value="id"
                    label="Department *"
                    :rules="[rules.required]"
                    variant="outlined"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-select
                    v-model="editedItem.finalmoustatusId"
                    :items="statuses"
                    item-title="name"
                    item-value="id"
                    label="Status *"
                    :rules="[rules.required]"
                    variant="outlined"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-select
                    v-model="editedItem.internalspocId"
                    :items="instructors"
                    item-title="name"
                    item-value="id"
                    label="Internal SPOC *"
                    :rules="[rules.required]"
                    variant="outlined"
                  ></v-select>
                </v-col>
                 <v-col cols="12" sm="6" md="4">
                  <v-select
                    v-model="editedItem.academicyearId"
                    :items="academicYears"
                    item-title="name"
                    item-value="id"
                    label="Academic Year *"
                    :rules="[rules.required]"
                    variant="outlined"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-select
                    v-model="editedItem.moutypeId"
                    :items="mouTypes"
                    item-title="name"
                    item-value="id"
                    label="MoU Type"
                    variant="outlined"
                  ></v-select>
                </v-col>

                <v-col cols="12" sm="6" md="4">
                  <v-select
                    v-model="editedItem.campusId"
                    :items="campuses"
                    item-title="name"
                    item-value="id"
                    label="Campus *"
                    :rules="[rules.required]"
                    variant="outlined"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="editedItem.company_spoc_name"
                    label="Company SPOC Name"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="editedItem.company_spoc_email"
                    label="Company SPOC Email"
                    :rules="[rules.email]"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="editedItem.company_spoc_contact"
                    label="Company SPOC Contact"
                    variant="outlined"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="4">
                  <v-file-input
                    v-model="draftMouFile"
                    label="Draft MoU File"
                    variant="outlined"
                    density="compact"
                    show-size
                  ></v-file-input>
                  <v-btn v-if="isEditing && editedItem.draft_mou_file_path" size="small" :href="editedItem.draft_mou_file_path" target="_blank" prepend-icon="mdi-open-in-new" variant="text">
                    View Current
                  </v-btn>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-file-input
                    v-model="finalMouFile"
                    label="Final MoU File"
                    variant="outlined"
                    density="compact"
                    show-size
                  ></v-file-input>
                  <v-btn v-if="isEditing && editedItem.final_mou_file_path" size="small" :href="editedItem.final_mou_file_path" target="_blank" prepend-icon="mdi-open-in-new" variant="text">
                    View Current
                  </v-btn>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-file-input
                    v-model="ndaMouFile"
                    label="NDA File"
                    variant="outlined"
                    density="compact"
                    show-size
                  ></v-file-input>
                  <v-btn v-if="isEditing && editedItem.nda_mou_file_path" size="small" :href="editedItem.nda_mou_file_path" target="_blank" prepend-icon="mdi-open-in-new" variant="text">
                    View Current
                  </v-btn>
                </v-col>

              </v-row>
            </v-container>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDialog">
            Cancel
          </v-btn>
          <v-btn color="primary" variant="flat" @click="saveMou">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400px" persistent>
      <v-card>
        <v-card-title class="text-h5">Confirm Deletion</v-card-title>
        <v-card-text>Are you sure you want to delete this MoU? This action cannot be undone.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="deleteMouConfirm">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<style scoped>
/* Scoped styles for this component */
.v-toolbar-title {
  color: #333;
}
</style>