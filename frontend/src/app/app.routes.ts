import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ListDetailComponent } from './components/list-detail/list-detail.component';
import { MaintenanceComponent } from './components/maintenance/maintenance.component';
import { HistoryComponent } from './components/history/history.component';
import { SavingsComponent } from './components/savings/savings.component';
import { LoginComponent } from './components/login/login.component';
import { InstallmentsComponent } from './components/installments/installments.component';
import { InstallmentDetailComponent } from './components/installment-detail/installment-detail.component';
import { authGuard, guestGuard } from './core/services/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'lists/:id', component: ListDetailComponent, canActivate: [authGuard] },
  { path: 'savings', component: SavingsComponent, canActivate: [authGuard] },
  { path: 'installments', component: InstallmentsComponent, canActivate: [authGuard] },
  { path: 'installments/:id', component: InstallmentDetailComponent, canActivate: [authGuard] },
  { path: 'maintenance', component: MaintenanceComponent, canActivate: [authGuard] },
  { path: 'history', component: HistoryComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' }
];
