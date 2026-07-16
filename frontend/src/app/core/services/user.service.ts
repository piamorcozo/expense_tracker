import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/models';

const STORAGE_KEY = 'cutoff.currentUserId';

@Injectable({ providedIn: 'root' })
export class UserService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<number | null>(this.loadStoredUserId());
  currentUserId$ = this.currentUserSubject.asObservable();

  get currentUserId(): number | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.currentUserId !== null;
  }

  setUsers(users: User[]) {
    this.usersSubject.next(users);
  }

  get users(): User[] {
    return this.usersSubject.value;
  }

  setCurrentUser(id: number) {
    this.currentUserSubject.next(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  }

  logout() {
    this.currentUserSubject.next(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private loadStoredUserId(): number | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Number(raw) : null;
  }
}
