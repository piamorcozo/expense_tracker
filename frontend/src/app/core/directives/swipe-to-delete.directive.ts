import { Directive, HostBinding, HostListener, Input } from '@angular/core';

/**
 * Swipe-left-to-reveal-delete, for mobile only.
 * Desktop is untouched (no touch events fire on mouse-only devices), so the
 * existing delete icon/button stays the way to delete there.
 *
 * Usage:
 *   <div class="item-row" appSwipeToDelete #swipe="swipeToDelete" (click)="swipe.isOpen ? swipe.close() : onRowClick()">
 *     ...
 *   </div>
 *   <div class="swipe-action" (click)="delete()"><iconify-icon icon="ph:trash"></iconify-icon></div>
 */
@Directive({
  selector: '[appSwipeToDelete]',
  standalone: true,
  exportAs: 'swipeToDelete'
})
export class SwipeToDeleteDirective {
  @Input('appSwipeToDeleteDisabled') disabled = false;
  @Input('appSwipeToDeleteWidth') revealWidthInput: number | null = null;

  private offset = 0;
  private dragging = false;
  private startX = 0;
  private startY = 0;
  private startOffset = 0;
  private lockedAxis: 'x' | 'y' | null = null;

  private readonly threshold = 32;

  private get revealWidth(): number {
    return this.revealWidthInput ?? 72;
  }

  private get isMobile(): boolean {
    return window.innerWidth < 860;
  }

  get isOpen(): boolean {
    return this.offset !== 0;
  }

  @HostBinding('style.transform')
  get transform(): string | null {
    return this.offset ? `translateX(${this.offset}px)` : null;
  }

  @HostBinding('class.swipe-dragging')
  get draggingClass(): boolean {
    return this.dragging;
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent) {
    if (this.disabled || !this.isMobile || e.touches.length !== 1) return;
    const t = e.touches[0];
    this.startX = t.clientX;
    this.startY = t.clientY;
    this.startOffset = this.offset;
    this.dragging = true;
    this.lockedAxis = null;
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(e: TouchEvent) {
    if (!this.dragging) return;
    const t = e.touches[0];
    const dx = t.clientX - this.startX;
    const dy = t.clientY - this.startY;

    if (!this.lockedAxis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      this.lockedAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (this.lockedAxis !== 'x') return;

    let next = this.startOffset + dx;
    next = Math.min(0, Math.max(-this.revealWidth, next));
    this.offset = next;
    e.preventDefault();
  }

  @HostListener('touchend')
  onTouchEnd() {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.lockedAxis === 'x') {
      this.offset = this.offset <= -this.threshold ? -this.revealWidth : 0;
    }
  }

  close() {
    this.offset = 0;
  }
}
