<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

// --- (1) !! CRITICAL CONFIGURATION !! ---
// You MUST set these values based on your application's state.
const loggedInUserUid = 'INSTRUCTOR_UID_HERE';
const loggedInInstructorId = 1; // Primary key ID of the instructor
const organizationName = 'VIT, Pune'; // Name required for headers

// --- (2) API CLIENTS ---
const baseApiUrl = 'http://192.168.0.102:8093';

// Client for MoU (no auth headers needed, as per MouController)
const mouApiClient = axios.create({
  baseURL: `${baseApiUrl}/mou`,
});

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
const mouStatusApiClient = createAuthApiClient('MouStatus');
// ASSUMPTION: You have a MouTransactionController
const mouTransactionApiClient = createAuthApiClient('MouTransaction'); 

// --- (3) COMPONENT STATE ---
const loadingMous = ref(false);
const loadingHistory = ref(false);

const allMous = ref([]);
const academicYears = ref([]);
const mouStatuses = ref([]);
const approvalHistory = ref([]); // For the table inside the dialog

const filterAyId = ref(null); // The selected Academic Year ID

// Dialog state
const dialog = ref(false);
const selectedMou = ref(null);
const approvalData = ref({
  mouStatusId: null,
  remark: '',
});

// --- (4) DATA FETCHING METHODS ---
onMounted(() => {
  // Fetch dropdown data on load
  fetchAcademicYears();
  fetchMouStatuses();
});

// Fetch Academic Years (from previous convo)
const fetchAcademicYears = async () => {
  try {
    const response = await academicYearApiClient.post('/listAllAcademicYears');
    if (response.data?.academic_years) {
      academicYears.value = response.data.academic_years.map(ay => ({ id: ay.id, name: ay.ay }));
    }
  } catch (error) { console.error("Error fetching academic years:", error); }
};

// Fetch MoU Statuses (for the approval dropdown)
const fetchMouStatuses = async () => {
  try {
    // ASSUMPTION: You have a MouStatusController with listAllMouStatuses
    const response = await mouStatusApiClient.post('/listAllMouStatuses');
    if (response.data?.mou_statuses) {
      mouStatuses.value = response.data.mou_statuses.map(s => ({ id: s.id, name: s.name }));
    }
  } catch (error) { console.error("Error fetching MoU statuses:", error); }
};

// Fetch MoUs based on the selected Academic Year
const fetchMous = async () => {
  if (!filterAyId.value) {
    alert("Please select an Academic Year.");
    return;
  }
  loadingMous.value = true;
  allMous.value = [];
  try {
    // This is simple: gets all MoUs. We will filter on the frontend.
    const response = await mouApiClient.get('/'); 
    
    // Frontend filtering
    allMous.value = response.data.filter(mou => mou.academicyear?.id === filterAyId.value);

  } catch (error) {
    console.error("Error fetching MoUs:", error);
  } finally {
    loadingMous.value = false;
  }
};

// Fetch the approval history for the selected MoU
const fetchApprovalHistory = async (mouId) => {
  loadingHistory.value = true;
  approvalHistory.value = [];
  try {
    // ASSUMPTION: An action that takes {mou_id: id} and returns a list of transactions
    const response = await mouTransactionApiClient.post('/listTransactionsForMou', { mou_id: mouId });
    if (response.data?.transactions) {
      approvalHistory.value = response.data.transactions;
    }
  } catch (error) {
    console.error("Error fetching approval history:", error);
  } finally {
    loadingHistory.value = false;
  }
};

// --- (5) DIALOG AND SAVE METHODS ---
const openApprovalDialog = (mou) => {
  selectedMou.value = mou;
  approvalData.value = {
    mouStatusId: mou.finalmoustatus?.id || null,
    remark: '',
  };
  // Fetch history every time the dialog opens
  fetchApprovalHistory(mou.id);
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  selectedMou.value = null;
};

// This is a complex two-part save
const saveApproval = async () => {
  if (!selectedMou.value || !approvalData.value.mouStatusId) {
    alert("Please select a status.");
    return;
  }

  try {
    // --- Step 1: Update the MoU's main status ---
    // We send FormData because that's what MouController.update expects
    const updateFormData = new FormData();
    updateFormData.append('finalmoustatus.id', approvalData.value.mouStatusId);

    // Calls POST /mou/update/{id}
    await mouApiClient.post(`/update/${selectedMou.value.id}`, updateFormData);

    // --- Step 2: Add a log entry to the MouTransaction ---
    const transactionPayload = {
      mou_id: selectedMou.value.id,
      mou_status_id: approvalData.value.mouStatusId,
      remark: approvalData.value.remark,
      approver_id: loggedInInstructorId, // Or whatever your service needs
    };
    // ASSUMPTION: An action to save the transaction
    await mouTransactionApiClient.post('/addTransaction', transactionPayload);

    // --- Step 3: Refresh and close ---
    closeDialog();
    fetchMous(); // Refresh the main table
  } catch (error) {
    console.error("Error saving approval:", error);
    alert("Failed to save approval. See console for details.");
  }
};

</script>

<template>
  <v-container fluid>
    <v-card elevation="2">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-select
              v-model="filterAyId"
              :items="academicYears"
              item-title="name"
              item-value="id"
              label="Academic Year"
              density="compact"
              variant="outlined"
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-btn color="primary" @click="fetchMous">View</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider></v-divider>

      <v-data-table
        :headers="[
          { title: 'Title', key: 'title' },
          { title: 'Company', key: 'company.name' },
          { title: 'Type', key: 'moutype.name' },
          { title: 'Start Date', key: 'start_date' },
          { title: 'End Date', key: 'end_date' },
          { title: 'SPOC', key: 'internalspoc.name' },
          { title: 'Status', key: 'finalmoustatus.name' },
          { title: 'Approve', key: 'actions', sortable: false },
        ]"
        :items="allMous"
        :loading="loadingMous"
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
          <v-chip size="small" :color="item.finalmoustatus?.name === 'Approved' ? 'green' : 'orange'">
            {{ item.finalmoustatus?.name || 'Pending' }}
          </v-chip>
        </template>
        
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-check-decagram-outline"
            variant="text"
            color="blue"
            size="small"
            @click="openApprovalDialog(item)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="900px" persistent>
      <v-card v-if="selectedMou">
        <v-card-title class="pa-4">
          <span class="text-h5">Approve MOU: {{ selectedMou.title }}</span>
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <v-col cols="12" md="5">
              <v-select
                v-model="approvalData.mouStatusId"
                :items="mouStatuses"
                item-title="name"
                item-value="id"
                label="MOU Status *"
                variant="outlined"
                :rules="[v => !!v || 'Status is required']"
              ></v-select>
              <v-textarea
                v-model="approvalData.remark"
                label="Remark"
                variant="outlined"
                rows="4"
              ></v-textarea>
            </v-col>
            
            <v-col cols="12" md="7">
              <v-data-table
                :headers="[
                  { title: 'Level', key: 'level' },
                  { title: 'Name', key: 'approverName' },
                  { title: 'Status', key: 'statusName' },
                  { title: 'Remark', key: 'remark' },
                ]"
                :items="approvalHistory"
                :loading="loadingHistory"
                density="compact"
                height="250px"
                title="Approval History"
              ></v-data-table>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveApproval">Save Status</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>