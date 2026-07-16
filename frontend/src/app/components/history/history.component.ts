import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ExpenseList } from '../../core/models/models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HistoryComponent implements OnInit {
  closedLists: ExpenseList[] = [];

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.api.getLists({ status: 'Closed' }).subscribe(lists => this.closedLists = lists);
  }

  viewList(id: number) { this.router.navigate(['/lists', id]); }

  fmt(n: number): string {
    return '₱' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: n % 1 !== 0 ? 2 : 0 });
  }
}
