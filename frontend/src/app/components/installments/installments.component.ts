import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ModalService } from '../../core/services/modal.service';
import { InstallmentPlan } from '../../core/models/models';

@Component({
  selector: 'app-installments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './installments.component.html',
  styleUrls: ['./installments.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class InstallmentsComponent implements OnInit, OnDestroy {
  plans: InstallmentPlan[] = [];
  private subs = new Subscription();

  constructor(private api: ApiService, private modalService: ModalService, private router: Router) {}

  ngOnInit() {
    this.load();
    this.subs.add(this.modalService.installmentSaved$.subscribe(() => this.load()));
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  load() {
    this.api.getInstallments().subscribe(plans => this.plans = plans);
  }

  openPlan(id: number) { this.router.navigate(['/installments', id]); }

  freqLabel(f: string): string {
    if (f === 'weekly') return 'Weekly';
    if (f === 'monthly') return 'Monthly';
    return 'Bi-weekly';
  }

  fmt(n: number): string {
    return '₱' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: n % 1 !== 0 ? 2 : 0 });
  }

  formatDate(dstr: string | null): string {
    if (!dstr) return '—';
    const d = new Date(dstr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
