import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalService } from '../../core/services/modal.service';
import { ApiService } from '../../core/services/api.service';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/models';

@Component({
  selector: 'app-switch-account-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './switch-account-modal.component.html',
  styleUrls: ['./switch-account-modal.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SwitchAccountModalComponent {
  open = false;
  step: 'list' | 'password' = 'list';
  selected: User | null = null;
  password = '';
  error = '';
  loading = false;

  constructor(
    private modalService: ModalService,
    private api: ApiService,
    private userService: UserService,
    private router: Router
  ) {
    this.modalService.switchAccountModal$.subscribe(open => {
      this.open = open;
      if (open) {
        this.reset();
        this.api.getUsers().subscribe(users => this.userService.setUsers(users));
      }
    });
  }

  get otherUsers(): User[] {
    return this.userService.users.filter(u => u.id !== this.userService.currentUserId);
  }

  reset() {
    this.step = 'list';
    this.selected = null;
    this.password = '';
    this.error = '';
    this.loading = false;
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close();
  }

  close() {
    this.modalService.closeSwitchAccountModal();
  }

  pickUser(user: User) {
    this.selected = user;
    this.step = 'password';
    this.password = '';
    this.error = '';
  }

  backToList() {
    this.step = 'list';
    this.selected = null;
    this.password = '';
    this.error = '';
  }

  confirmSwitch() {
    if (!this.selected || !this.password) {
      this.error = 'Enter the password.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.api.verifyPassword(this.selected.id, this.password).subscribe({
      next: (user) => {
        this.userService.setCurrentUser(user.id);
        this.loading = false;
        this.close();
        const path = this.router.url;
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => this.router.navigateByUrl(path));
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || 'Incorrect password.';
      }
    });
  }

  signOut() {
    this.userService.logout();
    this.close();
    this.router.navigateByUrl('/login');
  }
}
