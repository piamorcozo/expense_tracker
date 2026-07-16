import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { UserService } from '../../core/services/user.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoginComponent {
  mode: 'login' | 'register' = 'login';
  username = '';
  password = '';
  confirmPassword = '';
  error = '';
  loading = false;

  constructor(
    private api: ApiService,
    private userService: UserService,
    public themeService: ThemeService,
    private router: Router
  ) {}

  toggleMode() {
    this.mode = this.mode === 'login' ? 'register' : 'login';
    this.error = '';
    this.confirmPassword = '';
  }

  submit() {
    this.error = '';
    const name = this.username.trim();
    if (!name || !this.password) {
      this.error = 'Enter username and password.';
      return;
    }
    if (this.mode === 'register') {
      if (this.password !== this.confirmPassword) {
        this.error = 'Passwords do not match.';
        return;
      }
      if (this.password.length < 4) {
        this.error = 'Password must be at least 4 characters.';
        return;
      }
    }

    this.loading = true;
    const req = this.mode === 'login'
      ? this.api.login(name, this.password)
      : this.api.createUser(name, this.password);

    req.subscribe({
      next: (user) => this.finishLogin(user.id),
      error: (err) => this.fail(err)
    });
  }

  private finishLogin(userId: number) {
    this.userService.setCurrentUser(userId);
    this.api.getUsers().subscribe(users => this.userService.setUsers(users));
    this.loading = false;
    this.router.navigateByUrl('/dashboard');
  }

  private fail(err: any) {
    this.loading = false;
    if (err?.status === 0) {
      this.error = 'Cannot reach the server. Check that the API URL is set correctly.';
      return;
    }
    this.error = err?.error?.error || 'Something went wrong. Try again.';
  }
}
