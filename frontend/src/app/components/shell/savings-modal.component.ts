import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../core/services/modal.service';
import { ApiService } from '../../core/services/api.service';
import { Bank } from '../../core/models/models';

@Component({
  selector: 'app-savings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './savings-modal.component.html',
  styleUrls: ['./savings-modal.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SavingsModalComponent {
  open = false;
  banks: Bank[] = [];
  amount: number | null = null;
  date = '';
  bank = '';
  status = 'Deposited';

  constructor(private modalService: ModalService, private api: ApiService) {
    this.modalService.savingsModalOpen$.subscribe(v => {
      this.open = v;
      if (v) {
        this.amount = null;
        this.date = new Date().toISOString().slice(0, 10);
        this.status = 'Deposited';
        this.api.getBanks().subscribe(banks => {
          this.banks = banks;
          if (banks.length) this.bank = banks[0].name;
        });
      }
    });
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close();
  }

  close() { this.modalService.closeSavingsModal(); }

  save() {
    if (!this.amount) return;
    this.api.createSavings({
      amount: this.amount,
      date: this.date,
      bank: this.bank,
      status: this.status as 'Deposited' | 'Pending',
    }).subscribe(() => {
      this.modalService.savingsSaved$.next();
      this.close();
    });
  }
}
