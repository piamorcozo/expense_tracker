import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, take } from 'rxjs';
import { ExpenseItem } from '../models/models';

export interface ItemModalContext {
  listId: number;
  editingItem: ExpenseItem | null;
}

export interface ConfirmContext {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  // New list modal
  private newListOpenSubject = new BehaviorSubject<boolean>(false);
  newListOpen$ = this.newListOpenSubject.asObservable();

  // Add/Edit item modal
  private itemModalSubject = new BehaviorSubject<ItemModalContext | null>(null);
  itemModal$ = this.itemModalSubject.asObservable();

  // Add savings modal
  private savingsModalOpenSubject = new BehaviorSubject<boolean>(false);
  savingsModalOpen$ = this.savingsModalOpenSubject.asObservable();

  openNewList() { this.newListOpenSubject.next(true); }
  closeNewList() { this.newListOpenSubject.next(false); }

  openItemModal(listId: number, editingItem: ExpenseItem | null = null) {
    this.itemModalSubject.next({ listId, editingItem });
  }
  closeItemModal() { this.itemModalSubject.next(null); }

  openSavingsModal() { this.savingsModalOpenSubject.next(true); }
  closeSavingsModal() { this.savingsModalOpenSubject.next(false); }

  // New installment plan modal
  private installmentModalOpenSubject = new BehaviorSubject<boolean>(false);
  installmentModalOpen$ = this.installmentModalOpenSubject.asObservable();
  openInstallmentModal() { this.installmentModalOpenSubject.next(true); }
  closeInstallmentModal() { this.installmentModalOpenSubject.next(false); }
  installmentSaved$ = new Subject<number>();

  // Switch account / logout modal
  private switchAccountModalSubject = new BehaviorSubject<boolean>(false);
  switchAccountModal$ = this.switchAccountModalSubject.asObservable();
  openSwitchAccountModal() { this.switchAccountModalSubject.next(true); }
  closeSwitchAccountModal() { this.switchAccountModalSubject.next(false); }

  // Confirm delete / destructive action
  private confirmSubject = new BehaviorSubject<ConfirmContext | null>(null);
  confirm$ = this.confirmSubject.asObservable();
  private confirmResult$ = new Subject<boolean>();

  confirm(message: string, opts: Partial<ConfirmContext> = {}): Observable<boolean> {
    this.confirmSubject.next({
      title: opts.title || 'Confirm delete',
      message,
      confirmLabel: opts.confirmLabel || 'Yes, delete',
      cancelLabel: opts.cancelLabel || 'No',
    });
    return this.confirmResult$.pipe(take(1));
  }

  resolveConfirm(result: boolean) {
    this.confirmSubject.next(null);
    this.confirmResult$.next(result);
  }

  // Success notice (e.g. after creating a list)
  private successSubject = new BehaviorSubject<string | null>(null);
  success$ = this.successSubject.asObservable();
  private successClosed$ = new Subject<void>();

  showSuccess(message: string): Observable<void> {
    this.successSubject.next(message);
    return this.successClosed$.pipe(take(1));
  }

  closeSuccess() {
    this.successSubject.next(null);
    this.successClosed$.next();
  }

  // Fired after a successful save so listening components know to refetch
  listCreated$ = new Subject<number>();      // emits new list id
  itemSaved$ = new Subject<number>();        // emits list id whose items changed
  savingsSaved$ = new Subject<void>();
}
