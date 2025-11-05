<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

// --- (1) !! CRITICAL CONFIGURATION !! ---
// You MUST set these values based on your application's state.
const loggedInUserUid = 'INSTRUCTOR_UID_HERE'; // Placeholder for the logged-in user's UID
const loggedInInstructorId = 1; // Placeholder for the logged-in user's primary key ID
const loggedInOrganizationId = 1; // Placeholder for the user's organization ID
const organizationName = 'VIT, Pune'; // Placeholder for the user's organization Name
const baseApiUrl = 'http://192.168.0.102:8093';

// --- (2) API CLIENTS ---
// Create a reusable function to build API clients that require auth headers
const createApiClient = (controller) => {
  return axios.create({
    baseURL: `${baseApiUrl}/${controller}`,
    headers: {
      'Content-Type': 'application/json',
      'uid': loggedInUserUid,
      'organization_name': organizationName,
    }
  });
};

// API client for fetching MoUs (from previous conversation)
const mouApiClient = axios.create({
  baseURL: `${baseApiUrl}/mou`,
});

// API clients for this page
const eventTypeApiClient = createApiClient('EventType');
const mouEventApiClient = createApiClient('MouEvent');
const academicYearApiClient = createApiClient('AcademicYear');
const mouTypeApiClient = createApiClient('MouType');

// --- (3) COMPONENT STATE ---
// Data for filters and tabs
const academicYears = ref([]);
const mouTypes = ref([]);
const eventTypes = ref([]);

// State for MoU selection
const loadingMous = ref(false);
const filterAyId = ref(null);
const filterMouTypeId = ref(null);
const allMous = ref([]);
const selectedMou = ref(null); // Holds the ID of the selected MoU

// State for MoU Events
const loadingEvents = ref(false);
const allMouEvents = ref([]);
const selectedEventTypeId = ref(null); // Bound to the v-tabs

// Dialog state
const eventDialog = ref(false);
const form = ref(null);
const defaultEventItem = {
  id: null,
  name: '', // This maps to "Topic" from your image
  event_date: null, // This maps to "Start Date" from your image
};
const editedEvent = ref({ ...defaultEventItem });
const isEditingEvent = computed(() => !!editedEvent.value.id);
const eventFormTitle = computed(() => isEditingEvent.value ? 'Edit Event' : 'Add New Event');

// --- (4) COMPUTED PROPERTIES ---
// Filter the list of MoUs based on the dropdowns
const filteredMous = computed(() => {
  return allMous.value.filter(mou => {
    const ayMatch = !filterAyId.value || mou.academicyear?.id === filterAyId.value;
    const typeMatch = !filterMouTypeId.value || mou.moutype?.id === filterMouTypeId.value;
    return ayMatch && typeMatch;
  });
});

// Filter the list of events based on the selected MoU and Event Type tab
const filteredMouEvents = computed(() => {
  if (!selectedMou.value || !selectedEventTypeId.value) {
    return [];
  }
  return allMouEvents.value.filter(event => {
    // Check mou.title as listAllMouEvents returns the title string [cite: 20]
    return event.mou === selectedMou.value.title &&
           event.event_type === eventTypes.value.find(et => et.id === selectedEventTypeId.value)?.name;
  });
});

// --- (5) LIFECYCLE HOOK ---
onMounted(() => {
  // Fetch data for all filters and tabs
  fetchAcademicYears();
  fetchMouTypes();
  fetchEventTypes();
});

// --- (6) DATA FETCHING METHODS ---
// Fetch Academic Years (from previous convo)
const fetchAcademicYears = async () => {
  try {
    const response = await academicYearApiClient.post('/listAllAcademicYears');
    if (response.data?.academic_years) {
      academicYears.value = response.data.academic_years.map(ay => ({ id: ay.id, name: ay.ay }));
    }
  } catch (error) { console.error("Error fetching academic years:", error); }
};

// Fetch MoU Types (from previous convo)
const fetchMouTypes = async () => {
  try {
    const response = await mouTypeApiClient.post('/listAllMouTypes'); // Assuming 'listAllMouTypes'
    if (response.data?.mou_types) { // Assuming 'mou_types'
      mouTypes.value = response.data.mou_types.map(mt => ({ id: mt.id, name: mt.name }));
    }
  } catch (error) { console.error("Error fetching MoU types:", error); }
};

// Fetch Event Types for the tabs [cite: 29, 33]
const fetchEventTypes = async () => {
  try {
    const response = await eventTypeApiClient.post('/listAllEventTypes'); 
    if (response.data?.eventTypes) { 
      eventTypes.value = response.data.eventTypes.map(et => ({ id: et.id, name: et.name })); 
      // Set the first tab as active by default
      if (eventTypes.value.length > 0) {
        selectedEventTypeId.value = eventTypes.value[0].id;
      }
    }
  } catch (error) { console.error("Error fetching event types:", error); }
};

// Fetch the list of MoUs
const fetchMous = async () => {
  loadingMous.value = true;
  selectedMou.value = null; // Clear selection
  allMouEvents.value = []; // Clear events
  try {
    const response = await mouApiClient.get('/'); // Gets all MoUs
    allMous.value = response.data;
  } catch (error) {
    console.error("Error fetching MoUs:", error);
  } finally {
    loadingMous.value = false;
  }
};

// Fetch all MouEvents [cite: 34, 37]
const fetchMouEvents = async () => {
  loadingEvents.value = true;
  try {
    const response = await mouEventApiClient.post('/listAllMouEvents');
    allMouEvents.value = response.data?.mou_events || [];
  } catch (error) {
    console.error("Error fetching MoU events:", error);
  } finally {
    loadingEvents.value = false;
  }
};

// This function is called when a user clicks on an MoU row
const onMouSelected = (item) => {
  selectedMou.value = item;
  // When an MoU is selected, fetch all events.
  // The computed property 'filteredMouEvents' will then display the correct ones.
  fetchMouEvents();
};

// --- (7) CRUD METHODS FOR MOU EVENT ---
const closeEventDialog = () => {
  eventDialog.value = false;
  form.value?.resetValidation();
  editedEvent.value = { ...defaultEventItem };
};

const openAddEventDialog = () => {
  if (!selectedMou.value || !selectedEventTypeId.value) {
    alert("Please select an MoU and an Event Type first.");
    return;
  }
  editedEvent.value = { ...defaultEventItem };
  eventDialog.value = true;
};

const openEditEventDialog = (event) => {
  // Find the full event object from the original list
  const fullEvent = allMouEvents.value.find(e => e.id === event.id);
  editedEvent.value = {
    id: fullEvent.id,
    name: fullEvent.name,
    event_date: fullEvent.event_date ? fullEvent.event_date.split('T')[0] : null,
  };
  eventDialog.value = true;
};

const saveEvent = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  // Construct the payload based on MouEventService [cite: 1]
  const payload = {
    name: editedEvent.value.name,
    event_date: editedEvent.value.event_date,
    organization_id: loggedInOrganizationId, // Required by service [cite: 3]
    mou_id: selectedMou.value.id, // Required by service [cite: 3]
    eventtype_id: selectedEventTypeId.value, // Required by service [cite: 3]
    entryby_id: loggedInInstructorId, // Required by service [cite: 3]
  };

  try {
    if (isEditingEvent.value) {
      // Update Event [cite: 37]
      payload.id = editedEvent.value.id;
      await mouEventApiClient.post('/updateMouEvent', payload);
    } else {
      // Add Event [cite: 37]
      await mouEventApiClient.post('/addMouEvent', payload);
    }
    fetchMouEvents(); // Refresh the list
  } catch (error) {
    console.error("Error saving event:", error);
  } finally {
    closeEventDialog();
  }
};

const deleteEvent = async (event) => {
  if (!confirm("Are you sure you want to delete this event?")) return;
  
  try {
    // Delete Event [cite: 37]
    await mouEventApiClient.post('/deleteMouEvent', { id: event.id });
    fetchMouEvents(); // Refresh the list
  } catch (error) {
    console.error("Error deleting event:", error);
  }
};

// --- Form Validation Rules ---
const rules = {
  required: v => !!v || 'This field is required.',
};
</script>

<template>
  <v-container fluid>
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="5">
            <v-select
              v-model="filterAyId"
              :items="academicYears"
              item-title="name"
              item-value="id"
              label="Select Academic Year"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" md="5">
            <v-select
              v-model="filterMouTypeId"
              :items="mouTypes"
              item-title="name"
              item-value="id"
              label="Select MoU Type"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-btn color="primary" @click="fetchMous" block>
              Fetch MoUs
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="mb-4" elevation="2">
      <v-toolbar flat>
        <v-toolbar-title>Select an MoU</v-toolbar-title>
      </v-toolbar>
      <v-data-table
        :headers="[
          { title: 'Company', key: 'company.name' },
          { title: 'Type', key: 'moutype.name' },
          { title: 'Campus', key: 'campus.name' },
          { title: 'Department', key: 'department.name' },
          { title: 'Internal SPOC', key: 'internalspoc.name' },
          { title: 'Status', key: 'finalmoustatus.name' },
        ]"
        :items="filteredMous"
        :loading="loadingMous"
        item-value="id"
        @click:row="(_, { item }) => onMouSelected(item)"
        class="clickable-row"
        density="compact"
      >
        <template v-slot:item="{ item, internalItem, columns }">
          <tr :class="{ 'bg-blue-lighten-4': selectedMou?.id === item.id }" @click="onMouSelected(item)">
            <td v-for="col in columns" :key="col.key">
              <template v-if="col.key.includes('.')">
                {{ item[col.key.split('.')[0]] ? item[col.key.split('.')[0]][col.key.split('.')[1]] : 'N/A' }}
              </template>
              <template v-else>
                {{ item[col.key] }}
              </template>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-card>

    <v-card elevation="2" v-if="selectedMou">
      <v-toolbar flat>
        <v-toolbar-title>
          Events for: <span class="text-primary">{{ selectedMou.title }}</span>
        </v-toolbar-title>
      </v-toolbar>
      
      <v-tabs v-model="selectedEventTypeId" bg-color="primary-lighten-1" grow>
        <v-tab
          v-for="eventType in eventTypes"
          :key="eventType.id"
          :value="eventType.id"
        >
          {{ eventType.name }}
        </v-tab>
      </v-tabs>

      <v-window v-model="selectedEventTypeId">
        <v-window-item 
          v-for="eventType in eventTypes" 
          :key="eventType.id" 
          :value="eventType.id"
        >
          <v-card-text>
            <v-toolbar flat>
              <v-toolbar-title class="text-h6">
                {{ eventType.name }} Events
              </v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn color="primary" @click="openAddEventDialog" prepend-icon="mdi-plus">
                Add {{ eventType.name }} Event
              </v-btn>
            </v-toolbar>

            <v-data-table
              :headers="[
                { title: 'Topic', key: 'name' },
                { title: 'Event Date', key: 'event_date' },
                { title: 'Entry By', key: 'entryby' },
                { title: 'Actions', key: 'actions', sortable: false },
              ]"
              :items="filteredMouEvents"
              :loading="loadingEvents"
              density="compact"
            >
              <template v-slot:item.event_date="{ item }">
                {{ item.event_date ? new Date(item.event_date).toLocaleDateString() : 'N/A' }}
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEditEventDialog(item)" title="Edit"></v-btn>
                <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="deleteEvent(item)" title="Delete"></v-btn>
                </template>
            </v-data-table>
          </v-card-text>
        </v-window-item>
      </v-window>
    </v-card>

    <v-dialog v-model="eventDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="pa-4">
          <span class="text-h5">{{ eventFormTitle }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field
              v-model="editedEvent.name"
              label="Event Topic"
              :rules="[rules.required]"
              variant="outlined"
              class="mb-4"
            ></v-text-field>
            <v-text-field
              v-model="editedEvent.event_date"
              label="Event Date"
              type="date"
              :rules="[rules.required]"
              variant="outlined"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeEventDialog">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveEvent">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<style scoped>
.clickable-row {
  cursor: pointer;
}
.clickable-row:hover {
  background-color: #f5f5f5;
}
</style>