import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalService } from '../../core/services/modal.service';
import { ApiService } from '../../core/services/api.service';
import { ListType } from '../../core/models/models';
import { LIST_ICON_OPTIONS, defaultListIcon } from '../../core/list-icons';

@Component({
  selector: 'app-new-list-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-list-modal.component.html',
  styleUrls: ['./new-list-modal.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class NewListModalComponent {
  open = false;
  type: ListType = 'cutoff';
  name = '';
  month = 'June';
  day = '15';
  budget: number | null = null;
  icon = defaultListIcon('cutoff');
  iconOptions = LIST_ICON_OPTIONS;
  months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  constructor(private modalService: ModalService, private api: ApiService, private router: Router) {
    this.modalService.newListOpen$.subscribe(v => {
      this.open = v;
      if (v) this.reset();
    });
  }

  reset() {
    this.type = 'cutoff';
    this.name = '';
    this.budget = null;
    this.month = 'June';
    this.day = '15';
    this.icon = defaultListIcon('cutoff');
  }

  setType(type: ListType) {
    this.type = type;
    // Only auto-switch if still on the previous type's default
    if (this.icon === defaultListIcon(type === 'cutoff' ? 'other' : 'cutoff')) {
      this.icon = defaultListIcon(type);
    }
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close();
  }

  close() { this.modalService.closeNewList(); }

  save() {
    if (!this.name.trim()) return;
    const payload: any = {
      name: this.name.trim(),
      type: this.type,
      budget: this.budget || 0,
      icon: this.icon,
    };
    if (this.type === 'cutoff') {
      payload.month = this.month;
      payload.day = this.day;
    }
    this.api.createList(payload).subscribe(list => {
      this.close();
      this.modalService.listCreated$.next(list.id);
      this.modalService.showSuccess('Successfully created new list!').subscribe(() => {
        this.router.navigate(['/lists', list.id]);
      });
    });
  }
}
