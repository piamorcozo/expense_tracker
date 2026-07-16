import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ModalService } from '../../core/services/modal.service';
import { ExpenseList, ExpenseItem } from '../../core/models/models';
import { SwipeToDeleteDirective } from '../../core/directives/swipe-to-delete.directive';

@Component({
  selector: 'app-list-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, SwipeToDeleteDirective],
  templateUrl: './list-detail.component.html',
  styleUrls: ['./list-detail.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ListDetailComponent implements OnInit, OnDestroy {
  list: ExpenseList | null = null;
  editingName = false;
  nameDraft = '';
  private subs = new Subscription();
  private listId!: number;

  constructor(private route: ActivatedRoute, private api: ApiService, private modalService: ModalService) {}

  ngOnInit() {
    this.subs.add(this.route.params.subscribe(p => {
      this.listId = Number(p['id']);
      this.load();
    }));
    this.subs.add(this.modalService.itemSaved$.subscribe(listId => {
      if (listId === this.listId) this.load();
    }));
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  load() {
    this.api.getList(this.listId).subscribe(l => this.list = l);
  }

  get metaLine(): string {
    if (!this.list) return '';
    if (this.list.type === 'cutoff') return `${this.list.month} ${this.list.day} · Budget ${this.fmt(this.list.budget)}`;
    return this.list.budget ? `Other expense · Budget ${this.fmt(this.list.budget)}` : 'Other expense';
  }

  get pendingItems(): ExpenseItem[] {
    return (this.list?.items || []).filter(i => i.status !== 'Paid');
  }

  get pendingTotal(): number {
    return this.pendingItems.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  }

  get pendingCount(): number {
    return this.pendingItems.length;
  }

  statusClass(status: string) {
    return status === 'Open' ? 'status-open' : status === 'Closed' ? 'status-closed' : 'status-pending';
  }

  setStatus(status: string) {
    if (!this.list || this.list.status === status) return;
    this.api.setListStatus(this.list.id, status).subscribe(() => this.load());
  }

  startEditName() {
    if (!this.list) return;
    this.nameDraft = this.list.name;
    this.editingName = true;
  }

  cancelEditName() {
    this.editingName = false;
    this.nameDraft = '';
  }

  saveName() {
    if (!this.list) return;
    const name = this.nameDraft.trim();
    if (!name || name === this.list.name) {
      this.cancelEditName();
      return;
    }
    this.api.updateList(this.list.id, { name }).subscribe(l => {
      this.list = l;
      this.editingName = false;
      this.nameDraft = '';
    });
  }

  addExpense() {
    if (this.list) this.modalService.openItemModal(this.list.id);
  }

  markAllPaid() {
    if (!this.list) return;
    this.api.markAllItemsPaid(this.list.id).subscribe(l => this.list = l);
  }

  editItem(item: ExpenseItem) {
    if (this.list) this.modalService.openItemModal(this.list.id, item);
  }

  deleteItem(item: ExpenseItem) {
    this.modalService.confirm(`Are you sure you want to delete "${item.name}"?`).subscribe(ok => {
      if (ok) this.api.deleteItem(item.id).subscribe(() => this.load());
    });
  }

  fmt(n: number): string {
    return '₱' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: n % 1 !== 0 ? 2 : 0 });
  }

  formatDate(dstr: string): string {
    const d = new Date(dstr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  iconFor(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('rent')) return 'ph:house';
    if (n.includes('electric')) return 'ph:lightbulb';
    if (n.includes('water')) return 'ph:drop';
    if (n.includes('internet')) return 'ph:wifi-high';
    if (n.includes('grocer')) return 'ph:shopping-cart';
    if (n.includes('skincare') || n.includes('beauty')) return 'ph:sparkle';
    if (n.includes('gas')) return 'ph:gas-pump';
    if (n.includes('gift')) return 'ph:gift';
    if (n.includes('insurance')) return 'ph:shield-check';
    if (n.includes('phone')) return 'ph:device-mobile';
    if (n.includes('credit')) return 'ph:credit-card';
    return 'ph:wallet';
  }
}
