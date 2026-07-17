import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

import { ThemeService } from './core/services/theme.service';
import { UserService } from './core/services/user.service';
import { ModalService } from './core/services/modal.service';
import { ApiService } from './core/services/api.service';

import { NewListModalComponent } from './components/shell/new-list-modal.component';
import { ItemModalComponent } from './components/shell/item-modal.component';
import { SavingsModalComponent } from './components/shell/savings-modal.component';
import { SwitchAccountModalComponent } from './components/shell/switch-account-modal.component';
import { ConfirmModalComponent } from './components/shell/confirm-modal.component';
import { SuccessModalComponent } from './components/shell/success-modal.component';
import { InstallmentModalComponent } from './components/shell/installment-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    NewListModalComponent, ItemModalComponent, SavingsModalComponent,
    SwitchAccountModalComponent, ConfirmModalComponent, SuccessModalComponent,
    InstallmentModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent implements OnInit {
  isListDetail = false;
  showFab = true;
  currentRoute = 'dashboard';
  isLoginPage = false;

  constructor(
    public themeService: ThemeService,
    public userService: UserService,
    private modalService: ModalService,
    private api: ApiService,
    private router: Router
  ) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      const url: string = e.urlAfterRedirects;
      this.isLoginPage = url.startsWith('/login');
      this.isListDetail = /^\/lists\/\d+/.test(url) || /^\/installments\/\d+/.test(url);
      this.currentRoute = url.split('/')[1] || 'dashboard';
      this.showFab = !this.isLoginPage && !this.isListDetail && this.currentRoute !== 'history';
    });
  }

  get users() { return this.userService.users; }
  get currentUserName(): string {
    const u = this.users.find(u => u.id === this.userService.currentUserId);
    return u ? u.name : '...';
  }

  ngOnInit() {
    if (this.userService.isLoggedIn) {
      this.api.getUsers().subscribe(users => this.userService.setUsers(users));
    }
  }

  openSwitchAccount() {
    this.modalService.openSwitchAccountModal();
  }

  onFabClick() {
    if (this.currentRoute === 'savings') {
      this.modalService.openSavingsModal();
    } else if (this.currentRoute === 'installments') {
      this.modalService.openInstallmentModal();
    } else {
      this.modalService.openNewList();
    }
  }

  goBack() {
    window.history.back();
  }
}
