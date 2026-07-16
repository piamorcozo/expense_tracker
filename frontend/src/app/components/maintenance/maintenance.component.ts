import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ModalService } from '../../core/services/modal.service';
import { Bank, MustHave, ItemStatusOption } from '../../core/models/models';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MaintenanceComponent implements OnInit {
  mustHaves: MustHave[] = [];
  banks: Bank[] = [];
  itemStatuses: ItemStatusOption[] = [];
  newMustHave = '';
  newMustHaveAmount: number | null = null;
  newBank = '';
  newItemStatus = '';

  constructor(private api: ApiService, private modalService: ModalService) {}

  ngOnInit() {
    this.loadMustHaves();
    this.loadBanks();
    this.loadItemStatuses();
  }

  loadMustHaves() { this.api.getMustHaves().subscribe(m => this.mustHaves = m); }
  loadBanks() { this.api.getBanks().subscribe(b => this.banks = b); }
  loadItemStatuses() { this.api.getItemStatuses().subscribe(s => this.itemStatuses = s); }

  addMustHave() {
    if (!this.newMustHave.trim()) return;
    const amount = Number(this.newMustHaveAmount) || 0;
    this.api.createMustHave(this.newMustHave.trim(), amount).subscribe(() => {
      this.newMustHave = '';
      this.newMustHaveAmount = null;
      this.loadMustHaves();
    });
  }
  removeMustHave(m: MustHave) {
    this.modalService.confirm(`Are you sure you want to delete "${m.name}"?`).subscribe(ok => {
      if (ok) this.api.deleteMustHave(m.id).subscribe(() => this.loadMustHaves());
    });
  }

  addBank() {
    if (!this.newBank.trim()) return;
    this.api.createBank(this.newBank.trim()).subscribe(() => {
      this.newBank = '';
      this.loadBanks();
    });
  }
  removeBank(b: Bank) {
    this.modalService.confirm(`Are you sure you want to delete "${b.name}"?`).subscribe(ok => {
      if (ok) this.api.deleteBank(b.id).subscribe(() => this.loadBanks());
    });
  }

  addItemStatus() {
    if (!this.newItemStatus.trim()) return;
    this.api.createItemStatus(this.newItemStatus.trim()).subscribe({
      next: () => {
        this.newItemStatus = '';
        this.loadItemStatuses();
      }
    });
  }
  removeItemStatus(s: ItemStatusOption) {
    this.modalService.confirm(`Are you sure you want to delete "${s.name}"?`).subscribe(ok => {
      if (ok) this.api.deleteItemStatus(s.id).subscribe(() => this.loadItemStatuses());
    });
  }

  fmt(n: number): string {
    return '₱' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: n % 1 !== 0 ? 2 : 0 });
  }
}
