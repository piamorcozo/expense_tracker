import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserService } from './user.service';
import {
  User, Bank, MustHave, ItemStatusOption, ExpenseList, ExpenseItem, SavingsEntry, SavingsSummary
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient, private userService: UserService) {}

  private get userId(): number | null {
    return this.userService.currentUserId;
  }

  // ---------- Auth ----------
  login(username: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.base}/login`, { username, password });
  }
  verifyPassword(userId: number, password: string): Observable<User> {
    return this.http.post<User>(`${this.base}/verify-password`, { user_id: userId, password });
  }

  // ---------- Users ----------
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users`);
  }
  createUser(name: string, password: string, emoji = '🐷'): Observable<User> {
    return this.http.post<User>(`${this.base}/users`, { name, password, emoji });
  }

  // ---------- Banks ----------
  getBanks(): Observable<Bank[]> {
    return this.http.get<Bank[]>(`${this.base}/banks`, { params: { user_id: this.userId ?? '' } });
  }
  createBank(name: string): Observable<Bank> {
    return this.http.post<Bank>(`${this.base}/banks`, { name, user_id: this.userId });
  }
  deleteBank(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/banks/${id}`);
  }

  // ---------- Must-haves ----------
  getMustHaves(): Observable<MustHave[]> {
    return this.http.get<MustHave[]>(`${this.base}/musthaves`, { params: { user_id: this.userId ?? '' } });
  }
  createMustHave(name: string, amount: number): Observable<MustHave> {
    return this.http.post<MustHave>(`${this.base}/musthaves`, { name, amount, user_id: this.userId });
  }
  deleteMustHave(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/musthaves/${id}`);
  }

  // ---------- Item status options ----------
  getItemStatuses(): Observable<ItemStatusOption[]> {
    return this.http.get<ItemStatusOption[]>(`${this.base}/item-statuses`, { params: { user_id: this.userId ?? '' } });
  }
  createItemStatus(name: string): Observable<ItemStatusOption> {
    return this.http.post<ItemStatusOption>(`${this.base}/item-statuses`, { name, user_id: this.userId });
  }
  deleteItemStatus(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/item-statuses/${id}`);
  }

  // ---------- Lists ----------
  getLists(params: { status?: string; type?: string; includeItems?: boolean } = {}): Observable<ExpenseList[]> {
    const query: any = { user_id: this.userId ?? '' };
    if (params.status) query.status = params.status;
    if (params.type) query.type = params.type;
    if (params.includeItems) query.include_items = 'true';
    return this.http.get<ExpenseList[]>(`${this.base}/lists`, { params: query });
  }
  getList(id: number): Observable<ExpenseList> {
    return this.http.get<ExpenseList>(`${this.base}/lists/${id}`);
  }
  createList(payload: Partial<ExpenseList> & { type: string }): Observable<ExpenseList> {
    return this.http.post<ExpenseList>(`${this.base}/lists`, { ...payload, user_id: this.userId });
  }
  updateList(id: number, payload: Partial<ExpenseList>): Observable<ExpenseList> {
    return this.http.put<ExpenseList>(`${this.base}/lists/${id}`, payload);
  }
  setListStatus(id: number, status: string): Observable<ExpenseList> {
    return this.http.patch<ExpenseList>(`${this.base}/lists/${id}/status`, { status });
  }
  deleteList(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/lists/${id}`);
  }

  // ---------- Items ----------
  createItem(listId: number, payload: Partial<ExpenseItem>): Observable<ExpenseItem> {
    return this.http.post<ExpenseItem>(`${this.base}/lists/${listId}/items`, payload);
  }
  updateItem(id: number, payload: Partial<ExpenseItem>): Observable<ExpenseItem> {
    return this.http.put<ExpenseItem>(`${this.base}/items/${id}`, payload);
  }
  markAllItemsPaid(listId: number): Observable<ExpenseList> {
    return this.http.patch<ExpenseList>(`${this.base}/lists/${listId}/items/mark-paid`, {});
  }
  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/items/${id}`);
  }

  // ---------- Savings ----------
  getSavings(): Observable<SavingsEntry[]> {
    return this.http.get<SavingsEntry[]>(`${this.base}/savings`, { params: { user_id: this.userId ?? '' } });
  }
  createSavings(payload: Partial<SavingsEntry>): Observable<SavingsEntry> {
    return this.http.post<SavingsEntry>(`${this.base}/savings`, { ...payload, user_id: this.userId });
  }
  deleteSavings(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/savings/${id}`);
  }
  getSavingsSummary(): Observable<SavingsSummary> {
    return this.http.get<SavingsSummary>(`${this.base}/savings/summary`, { params: { user_id: this.userId ?? '' } });
  }
}
