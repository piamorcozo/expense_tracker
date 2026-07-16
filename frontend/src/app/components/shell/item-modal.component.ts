import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService, ItemModalContext } from '../../core/services/modal.service';
import { ApiService } from '../../core/services/api.service';
import { Bank, ItemStatusOption } from '../../core/models/models';

@Component({
  selector: 'app-item-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './item-modal.component.html',
  styleUrls: ['./item-modal.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ItemModalComponent {
  context: ItemModalContext | null = null;
  banks: Bank[] = [];
  statuses: ItemStatusOption[] = [];

  name = '';
  amount: number | null = null;
  bank = '';
  status = 'Pending';
  dueDate = '';
  remarks = '';

  constructor(private modalService: ModalService, private api: ApiService) {
    this.modalService.itemModal$.subscribe(ctx => {
      this.context = ctx;
      if (ctx) {
        this.api.getBanks().subscribe(banks => {
          this.banks = banks;
          if (!this.bank && banks.length) this.bank = banks[0].name;
        });
        this.api.getItemStatuses().subscribe(statuses => {
          this.statuses = statuses;
          if (!statuses.find(s => s.name === this.status) && statuses.length) {
            this.status = statuses[0].name;
          }
        });
        this.populate(ctx);
      }
    });
  }

  populate(ctx: ItemModalContext) {
    const item = ctx.editingItem;
    this.name = item?.name || '';
    this.amount = item?.amount ?? null;
    this.bank = item?.bank || '';
    this.status = item?.status || 'Pending';
    this.dueDate = item?.due_date || '';
    this.remarks = item?.remarks || '';
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close();
  }

  close() { this.modalService.closeItemModal(); }

  save() {
    if (!this.context || !this.name.trim()) return;
    const payload = {
      name: this.name.trim(),
      amount: this.amount || 0,
      bank: this.bank,
      status: this.status,
      due_date: this.dueDate || null,
      remarks: this.remarks || null,
    };
    const listId = this.context.listId;
    const editingItem = this.context.editingItem;

    const obs = editingItem
      ? this.api.updateItem(editingItem.id, payload)
      : this.api.createItem(listId, payload);

    obs.subscribe(() => {
      this.modalService.itemSaved$.next(listId);
      this.close();
    });
  }
}
