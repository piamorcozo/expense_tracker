import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService, ConfirmContext } from '../../core/services/modal.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ConfirmModalComponent {
  context: ConfirmContext | null = null;

  constructor(private modalService: ModalService) {
    this.modalService.confirm$.subscribe(ctx => this.context = ctx);
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.cancel();
  }

  cancel() { this.modalService.resolveConfirm(false); }
  confirm() { this.modalService.resolveConfirm(true); }
}
