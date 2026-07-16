import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'cutoff.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private themeSubject = new BehaviorSubject<'light' | 'dark'>(this.loadStoredTheme());
  theme$ = this.themeSubject.asObservable();

  constructor() {
    this.apply(this.themeSubject.value);
  }

  get current(): 'light' | 'dark' {
    return this.themeSubject.value;
  }

  toggle() {
    const next = this.current === 'light' ? 'dark' : 'light';
    this.themeSubject.next(next);
    localStorage.setItem(STORAGE_KEY, next);
    this.apply(next);
  }

  private apply(theme: 'light' | 'dark') {
    document.body.setAttribute('data-theme', theme);
  }

  private loadStoredTheme(): 'light' | 'dark' {
    return (localStorage.getItem(STORAGE_KEY) as 'light' | 'dark') || 'light';
  }
}
