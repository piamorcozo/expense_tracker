import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ModalService } from '../../core/services/modal.service';
import { InstallmentPlan, InstallmentPayment } from '../../core/models/models';

@Component({
  selector: 'app-installment-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './installment-detail.component.html',
  styleUrls: ['./installment-detail.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class InstallmentDetailComponent implements OnInit, OnDestroy {
  plan: InstallmentPlan | null = null;
  advanceOpen = false;
  advanceCount = 1;
  private planId!: number;
  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    this.subs.add(this.route.params.subscribe(p => {
      this.planId = Number(p['id']);
      this.load();
    }));
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  load() {
    this.api.getInstallment(this.planId).subscribe(plan => {
      this.plan = plan;
      this.advanceCount = 1;
    });
  }

  /** Unpaid first (by schedule #), paid sink to the bottom. */
  get sortedPayments(): InstallmentPayment[] {
    const payments = this.plan?.payments || [];
    return [...payments].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'Pending' ? -1 : 1;
      return a.installment_number - b.installment_number;
    });
  }

  freqLabel(f: string): string {
    if (f === 'weekly') return 'Weekly';
    if (f === 'monthly') return 'Monthly';
    return 'Bi-weekly';
  }

  onPaymentClick(pay: InstallmentPayment) {
    if (pay.status === 'Pending') {
      this.modalService.confirm(
        `Pay installment #${pay.installment_number} for ${this.fmt(pay.amount)}?`,
        { title: 'Confirm payment', confirmLabel: 'Yes', cancelLabel: 'No' }
      ).subscribe(ok => {
        if (ok) this.api.setInstallmentPaymentStatus(pay.id, 'Paid').subscribe(plan => this.plan = plan);
      });
    } else {
      this.modalService.confirm(
        `Mark installment #${pay.installment_number} as pending again?`,
        { title: 'Undo payment', confirmLabel: 'Yes', cancelLabel: 'No' }
      ).subscribe(ok => {
        if (ok) this.api.setInstallmentPaymentStatus(pay.id, 'Pending').subscribe(plan => this.plan = plan);
      });
    }
  }

  get advanceTotal(): number {
    if (!this.plan) return 0;
    return (Number(this.plan.amount) || 0) * (Number(this.advanceCount) || 0);
  }

  openAdvanceModal() {
    if (!this.plan?.pending_count) return;
    this.advanceCount = 1;
    this.advanceOpen = true;
  }

  closeAdvanceModal() { this.advanceOpen = false; }

  onAdvanceOverlay(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.closeAdvanceModal();
  }

  decAdvance() {
    this.advanceCount = Math.max(1, (Number(this.advanceCount) || 1) - 1);
  }

  incAdvance() {
    const max = this.plan?.pending_count || 1;
    this.advanceCount = Math.min(max, (Number(this.advanceCount) || 1) + 1);
  }

  confirmAdvance() {
    if (!this.plan || !this.plan.pending_count) return;
    const count = Math.min(Math.max(1, Number(this.advanceCount) || 1), this.plan.pending_count);
    this.api.payInstallmentAdvance(this.plan.id, count).subscribe(plan => {
      this.plan = plan;
      this.closeAdvanceModal();
    });
  }

  earlyPayoff() {
    if (!this.plan || !this.plan.pending_count) return;
    this.modalService.confirm(
      `Mark all ${this.plan.pending_count} remaining payments as paid?`,
      { title: 'Early payoff', confirmLabel: 'Yes, pay off', cancelLabel: 'No' }
    ).subscribe(ok => {
      if (ok) this.api.payoffInstallment(this.plan!.id).subscribe(plan => this.plan = plan);
    });
  }

  deletePlan() {
    if (!this.plan) return;
    this.modalService.confirm(`Are you sure you want to delete "${this.plan.name}"?`).subscribe(ok => {
      if (!ok) return;
      this.api.deleteInstallment(this.plan!.id).subscribe(() => this.router.navigate(['/installments']));
    });
  }

  daysUntil(dstr: string): number {
    const due = new Date(dstr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - today.getTime()) / 86400000);
  }

  dueLabel(dstr: string): string {
    const days = this.daysUntil(dstr);
    if (days === 0) return 'Due today';
    if (days > 0) return `${days} day${days === 1 ? '' : 's'} left`;
    const overdue = Math.abs(days);
    return `${overdue} day${overdue === 1 ? '' : 's'} overdue`;
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
