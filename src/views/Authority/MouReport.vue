<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

// --- (1) !! CRITICAL CONFIGURATION !! ---
const loggedInUserUid = 'INSTRUCTOR_UID_HERE';
const organizationName = 'VIT, Pune';

// --- (2) API CLIENTS ---
const baseApiUrl = 'http://192.168.0.102:8093';

// Auth-heavy client generator
const createAuthApiClient = (controller) => {
  return axios.create({
    baseURL: `${baseApiUrl}/${controller}`,
    headers: {
      'Content-Type': 'application/json',
      'uid': loggedInUserUid,
      'organization_name': organizationName,
    }
  });
};

const academicYearApiClient = createAuthApiClient('AcademicYear');
const campusApiClient = createAuthApiClient('Campus');
const mouTypeApiClient = createAuthApiClient('MouType');
const mouStatusApiClient = createAuthApiClient('MouStatus');
// !! PLACEHOLDER CLIENTS (Need real controllers)
const departmentApiClient = createAuthApiClient('Department'); 
const instructorApiClient = createAuthApiClient('Instructor');
// Client for the report
const mouApiClient = createAuthApiClient('Mou');

// --- (3) COMPONENT STATE ---
// Dropdown data
const academicYears = ref([]);
const campuses = ref([]);
const departments = ref([]); // Will be empty without controller
const mouTypes = ref([]);
const instructors = ref([]); // Will be empty without controller
const mouStatuses = ref([]);

// Filter state
const filters = ref({
  academicYearId: null,
  campusId: null,
  departmentId: null,
  mouTypeId: null,
  spocId: null, // Instructor
  mouStatusId: null,
  fromDate: null,
  toDate: null,
});
const search = ref(''); // For the data table

// Report results
const loadingReport = ref(false);
const reportData = ref([]);

// --- (4) DATA FETCHING METHODS ---
onMounted(() => {
  // Fetch all dropdown data when the component loads
  fetchAcademicYears();
  fetchCampuses();
  fetchDepartments();
  fetchMouTypes();
  fetchInstructors();
  fetchMouStatuses();
});

// Generic fetch function for dropdowns
const fetchDropdownData = async (apiClient, action, listRef, key, nameField) => {
  try {
    const response = await apiClient.post(action);
    if (response.data?.[key]) {
      listRef.value = response.data[key].map(item => ({ id: item.id, name: item[nameField] }));
    }
  } catch (error) { console.error(`Error fetching ${key}:`, error); }
};

// Functions to load all dropdowns
const fetchAcademicYears = () => fetchDropdownData(academicYearApiClient, '/listAllAcademicYears', academicYears, 'academic_years', 'ay');
const fetchCampuses = () => fetchDropdownData(campusApiClient, '/listAllCampuses', campuses, 'campuses', 'name'); // Assumed action/key/name
const fetchMouTypes = () => fetchDropdownData(mouTypeApiClient, '/listAllMouTypes', mouTypes, 'mou_types', 'name'); // Assumed action/key/name
const fetchMouStatuses = () => fetchDropdownData(mouStatusApiClient, '/listAllMouStatuses', mouStatuses, 'mou_statuses', 'name'); // Assumed action/key/name

// !! PLACEHOLDER FETCHES
const fetchDepartments = async () => {
  // departments.value = await ... (NEEDS CONTROLLER)
  departments.value = [{ id: 1, name: 'Computer (Demo)' }, { id: 2, name: 'IT (Demo)' }];
};
const fetchInstructors = async () => {
  // instructors.value = await ... (NEEDS CONTROLLER)
  instructors.value = [{ id: 1, name: 'Alankar Dasare (Demo)' }, { id: 2, name: 'Dipak Pawar (Demo)' }];
};

// --- (5) REPORTING METHODS ---
const fetchReport = async () => {
  loadingReport.value = true;
  reportData.value = [];
  try {
    // !! CRITICAL: This action 'findMouReport' does not exist!
    // You MUST create this action in your MouController.
    // It should accept a JSON body matching the 'filters' ref.
    const response = await mouApiClient.post('/findMouReport', filters.value);
    
    if (response.data?.reportResults) {
      reportData.value = response.data.reportResults;
    }
  } catch (error) {
    console.error("Error fetching report:", error);
    alert("Failed to fetch report. You may need to create the 'findMouReport' action in your MouController.");
  } finally {
    loadingReport.value = false;
  }
};

const exportData = () => {
  // Placeholder for export logic
  alert("Export function requires a library like 'xlsx'.");
};

</script>

<template>
  <v-container fluid>
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.academicYearId"
              :items="academicYears"
              item-title="name"
              item-value="id"
              label="Academic Year"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.campusId"
              :items="campuses"
              item-title="name"
              item-value="id"
              label="Campus"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.departmentId"
              :items="departments"
              item-title="name"
              item-value="id"
              label="Department"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.mouTypeId"
              :items="mouTypes"
              item-title="name"
              item-value="id"
              label="MOU Type"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            ></v-select>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.spocId"
              :items="instructors"
              item-title="name"
              item-value="id"
              label="Internal SPOC"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.mouStatusId"
              :items="mouStatuses"
              item-title="name"
              item-value="id"
              label="MOU Status"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="filters.fromDate"
              label="From Date"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="filters.toDate"
              label="To Date"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
            ></v-text-field>
          </v-col>
        </v-row>
        
        <v-row class="mt-4">
          <v-col cols="12" class="d-flex justify-end">
            <v-btn color="primary" @click="fetchReport" :loading="loadingReport">Fetch</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card elevation="2">
      <v-toolbar flat>
        <v-toolbar-title>MOU Report</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          label="Search in results..."
          density="compact"
          variant="outlined"
          prepend-inner-icon="mdi-magnify"
          single-line
          hide-details
          class="mr-4"
          style="max-width: 300px;"
        ></v-text-field>
        <v-btn color="secondary" variant="outlined" @click="exportData" prepend-icon="mdi-export">
          Export
        </v-btn>
      </v-toolbar>
      <v-divider></v-divider>
      
      <v-data-table
        :headers="[
          { title: 'Title', key: 'title' },
          { title: 'Company', key: 'company.name' },
          { title: 'Type', key: 'moutype.name' },
          { title: 'SPOC', key: 'internalspoc.name' },
          { title: 'Status', key: 'finalmoustatus.name' },
          { title: 'Start Date', key: 'start_date' },
          { title: 'End Date', key: 'end_date' },
        ]"
        :items="reportData"
        :search="search"
        :loading="loadingReport"
        density="compact"
      >
        <template v-slot:item.company.name="{ item }">
          {{ item.company?.name || 'N/A' }}
        </template>
        <template v-slot:item.moutype.name="{ item }">
          {{ item.moutype?.name || 'N/A' }}
        </template>
        <template v-slot:item.internalspoc.name="{ item }">
          {{ item.internalspoc?.name || 'N/A' }}
        </template>
        <template v-slot:item.finalmoustatus.name="{ item }">
          {{ item.finalmoustatus?.name || 'N/A' }}
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>