import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../core/services/modal.service';

@Component({
  selector: 'app-success-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-modal.component.html',
  styleUrls: ['./success-modal.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SuccessModalComponent {
  message: string | null = null;

  constructor(private modalService: ModalService) {
    this.modalService.success$.subscribe(msg => this.message = msg);
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close();
  }

  close() { this.modalService.closeSuccess(); }
}
