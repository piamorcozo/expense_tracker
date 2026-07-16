import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ModalService } from '../../core/services/modal.service';
import { SavingsEntry, SavingsSummary } from '../../core/models/models';
import { SwipeToDeleteDirective } from '../../core/directives/swipe-to-delete.directive';

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [CommonModule, SwipeToDeleteDirective],
  templateUrl: './savings.component.html',
  styleUrls: ['./savings.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SavingsComponent implements OnInit, OnDestroy {
  entries: SavingsEntry[] = [];
  summary: SavingsSummary | null = null;
  currentYear = new Date().getFullYear();
  private subs = new Subscription();

  constructor(private api: ApiService, private modalService: ModalService) {}

  ngOnInit() {
    this.load();
    this.subs.add(this.modalService.savingsSaved$.subscribe(() => this.load()));
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  load() {
    this.api.getSavings().subscribe(entries => this.entries = entries);
    this.api.getSavingsSummary().subscribe(summary => this.summary = summary);
  }

  deleteEntry(entry: SavingsEntry) {
    const label = this.formatDate(entry.date);
    this.modalService.confirm(`Are you sure you want to delete the ${this.fmt(entry.amount)} deposit from ${label}?`).subscribe(ok => {
      if (ok) this.api.deleteSavings(entry.id).subscribe(() => this.load());
    });
  }

  formatDate(dstr: string): string {
    const d = new Date(dstr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  fmt(n: number): string {
    return '₱' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: n % 1 !== 0 ? 2 : 0 });
  }
}
