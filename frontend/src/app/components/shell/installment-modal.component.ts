import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalService } from '../../core/services/modal.service';
import { ApiService } from '../../core/services/api.service';
import { Bank, InstallmentFrequency } from '../../core/models/models';

@Component({
  selector: 'app-installment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './installment-modal.component.html',
  styleUrls: ['./installment-modal.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class InstallmentModalComponent {
  open = false;
  banks: Bank[] = [];
  name = '';
  amount: number | null = null;
  totalCount: number | null = 12;
  frequency: InstallmentFrequency = 'biweekly';
  startDate = '';
  bank = '';
  notes = '';

  constructor(private modalService: ModalService, private api: ApiService, private router: Router) {
    this.modalService.installmentModalOpen$.subscribe(v => {
      this.open = v;
      if (v) this.reset();
    });
  }

  reset() {
    this.name = '';
    this.amount = null;
    this.totalCount = 12;
    this.frequency = 'biweekly';
    this.startDate = new Date().toISOString().slice(0, 10);
    this.bank = '';
    this.notes = '';
    this.api.getBanks().subscribe(banks => {
      this.banks = banks;
      if (banks.length) this.bank = banks[0].name;
    });
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close();
  }

  close() { this.modalService.closeInstallmentModal(); }

  get previewTotal(): number {
    return (Number(this.amount) || 0) * (Number(this.totalCount) || 0);
  }

  save() {
    if (!this.name.trim() || !this.amount || !this.totalCount || !this.startDate) return;
    this.api.createInstallment({
      name: this.name.trim(),
      amount: Number(this.amount),
      total_count: Number(this.totalCount),
      frequency: this.frequency,
      start_date: this.startDate,
      bank: this.bank || null,
      notes: this.notes.trim() || null,
    }).subscribe(plan => {
      this.close();
      this.modalService.installmentSaved$.next(plan.id);
      this.modalService.showSuccess('Installment plan created!').subscribe(() => {
        this.router.navigate(['/installments', plan.id]);
      });
    });
  }
}
