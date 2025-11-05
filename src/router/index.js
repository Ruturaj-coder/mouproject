import { createRouter, createWebHistory } from 'vue-router'
import AdminView from '../views/Admin/AdminView.vue'
import AcademicYearView from '../views/Admin/AcademicYearView.vue' 
import CompanyView from '../views/Admin/CompanyView.vue'
import MOUStatusView from '../views/Admin/MOUStatusView.vue'
import MOUTypeView from '../views/Admin/MOUTypeView.vue'
import EventTypeView from '../views/Admin/EventTypeView.vue'
import CampusView from '../views/Admin/CampusView.vue'
import MouHierarchyView from '../views/Admin/MouHierarchyView.vue'
import HomeView from '../views/HomeView.vue'
import SpocView from '../views/Spoc/SpocView.vue'
import MouManagement from '@/views/Spoc/MouManagement.vue'
import MouEvents from '@/views/Spoc/MouEvent.vue'
import AuthorityView from '@/views/Authority/AuthorityView.vue'
import ApproveMou from '@/views/Authority/ApproveMou.vue'
import MouReport from '@/views/Authority/MouReport.vue'

const routes = [
  {
    path: '/admin/home',
    name: 'admin-home',
    component: AdminView
  },
  {
    path: '/authority/home',
    name: 'authority-home',
    component: AuthorityView
  },
  {
    path: '/authority/approve-mou',
    name: 'authority-approve-mou',
    component: ApproveMou
  },
  {
    path: '/authority/mou-report',
    name: 'authority-mou-report',
    component: MouReport
  },
  {
    path: '/spoc/home',
    name: 'spoc-home',
    component: SpocView
  },
  {
    path: '/spoc/add-mou',
    name: 'spoc-add-mou',
    component: MouManagement
  },
  {
    path: '/spoc/mou-events',
    name: 'spoc-mou-events',
    component: MouEvents
  },
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    // The URL path remains the same
    path: '/admin/academic-year',
    name: 'academic-year',
    component: AcademicYearView 
  },
  {
    path: '/admin/companies', // <-- More appropriate URL
    name: 'companies',
    component: CompanyView 
  },
  {
    path: '/admin/mou-status', // <-- Define a new path for MOU Status
    name: 'mou-status',
    component: MOUStatusView // <-- Assign the new view to this path
  },
  {
    path: '/admin/mou-type', // <-- Define a new path for MOU Type
    name: 'mou-type',
    component: MOUTypeView // <-- Assign the new view to this path
  },
  {
    path: '/admin/campus',
    name: 'campus',
    component: CampusView
  },
  {
    path: '/admin/event-type',
    name: 'event-type',
    component: EventTypeView
  },
  {
    path: '/admin/mou-hierarchy',
    name: 'mou-hierarchy',
    component: MouHierarchyView
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router