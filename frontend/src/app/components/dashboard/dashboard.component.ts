import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ModalService } from '../../core/services/modal.service';
import { ExpenseList } from '../../core/models/models';
import { resolveListIcon } from '../../core/list-icons';

type PendingFilter = 'all' | 'month' | 'quarter' | 'custom';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardComponent implements OnInit, OnDestroy {
  lists: ExpenseList[] = [];
  pendingFilter: PendingFilter = 'all';
  customFrom = '';
  customTo = '';
  private months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  private subs = new Subscription();

  constructor(private api: ApiService, private modalService: ModalService, private router: Router) {}

  ngOnInit() {
    this.load();
    this.subs.add(this.modalService.listCreated$.subscribe(() => this.load()));
    this.subs.add(this.modalService.itemSaved$.subscribe(() => this.load()));
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  load() {
    this.api.getLists().subscribe(lists => this.lists = lists);
  }

  get openCutoff(): ExpenseList | undefined {
    return this.lists.find(l => l.type === 'cutoff' && l.status === 'Open');
  }

  /** All Open other-expense lists — not limited to one. */
  get openOthers(): ExpenseList[] {
    return this.lists.filter(l => l.type === 'other' && l.status === 'Open');
  }

  get pendingLists(): ExpenseList[] {
    const pending = this.lists.filter(l => l.status === 'Pending');
    if (this.pendingFilter === 'all') return pending;

    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    return pending.filter(l => {
      const d = this.listDate(l);
      if (this.pendingFilter === 'month') {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }
      if (this.pendingFilter === 'quarter') {
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return d >= threeMonthsAgo && d <= endOfMonth;
      }
      if (this.pendingFilter === 'custom') {
        if (!this.customFrom && !this.customTo) return true;
        if (this.customFrom) {
          const from = new Date(this.customFrom + 'T00:00:00');
          if (d < from) return false;
        }
        if (this.customTo) {
          const to = new Date(this.customTo + 'T23:59:59');
          if (d > to) return false;
        }
        return true;
      }
      return true;
    });
  }

  get pct(): number {
    const l = this.openCutoff;
    if (!l || !l.budget) return 0;
    return Math.min(100, Math.round((l.spent / l.budget) * 100));
  }

  setPendingFilter(filter: PendingFilter) {
    this.pendingFilter = filter;
  }

  onCustomRangeChange() {
    // getter re-evaluates from bound dates
  }

  /** Logical date for filtering: cutoff month/day, else created_at. */
  listDate(l: ExpenseList): Date {
    if (l.type === 'cutoff' && l.month && l.day) {
      const monthIndex = this.months.indexOf(l.month);
      const year = l.created_at ? new Date(l.created_at).getFullYear() : new Date().getFullYear();
      if (monthIndex >= 0) return new Date(year, monthIndex, Number(l.day));
    }
    return l.created_at ? new Date(l.created_at) : new Date(0);
  }

  iconFor(l: ExpenseList): string {
    return resolveListIcon(l.icon, l.type);
  }

  fmt(n: number): string {
    return '₱' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: n % 1 !== 0 ? 2 : 0 });
  }

  goToList(id: number) { this.router.navigate(['/lists', id]); }

  quickAdd(e: Event, listId: number) {
    e.stopPropagation();
    this.modalService.openItemModal(listId);
  }
}
