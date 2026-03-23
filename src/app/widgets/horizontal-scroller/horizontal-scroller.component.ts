// horizontal-scroller2.component.ts

import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  Input,
  ContentChildren,
  QueryList,
  TemplateRef,
  inject
} from '@angular/core';

@Component({
  selector: 'app-horizontal-scroller',
 
  imports: [CommonModule],
  templateUrl: './horizontal-scroller.component.html',
  styleUrls: ['./horizontal-scroller.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HorizontalScrollerComponent implements AfterViewInit, AfterContentInit, OnDestroy {


  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef<HTMLDivElement>;

  // ContentChildren to capture template references
  @ContentChildren('itemTemplate') itemTemplates!: QueryList<TemplateRef<any>>;

  // Input for customizing scroll amount
  @Input() scrollAmount = 200;

  // Arrow visibility states
  canScrollLeft = false;
  canScrollRight = true;

  // Drag functionality properties
  isDragging = false;
  private startX = 0;
  private scrollLeft = 0;
  private dragVelocity = 0;
  private lastDragTime = 0;
  private lastDragX = 0;
  private animationFrameId: number | null = null;

  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  ngAfterContentInit(): void {
    // Listen for changes in content children
    this.itemTemplates.changes.subscribe(() => {
      this.cdr.markForCheck();
      setTimeout(() => {
        this.updateArrowVisibility();
        this.cdr.markForCheck();
      }, 100);
    });
  }

  ngAfterViewInit(): void {
    // Small delay to ensure content is rendered
    setTimeout(() => {
      this.updateArrowVisibility();
      this.cdr.markForCheck();
    }, 100);

    // Add resize observer to update arrows when content changes
    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(() => {
        this.updateArrowVisibility();
        this.cdr.markForCheck();
      });

      resizeObserver.observe(this.scrollContainer.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  scrollToLeft(): void {
    const container = this.scrollContainer.nativeElement;
    container.scrollBy({
      left: -this.scrollAmount,
      behavior: 'smooth'
    });
  }

  scrollToRight(): void {
    const container = this.scrollContainer.nativeElement;
    container.scrollBy({
      left: this.scrollAmount,
      behavior: 'smooth'
    });
  }

  onScroll(): void {
    this.updateArrowVisibility();
    this.cdr.markForCheck();
  }

  onWheel(event: WheelEvent): void {
    // Only handle horizontal scrolling if vertical scroll is detected
    if (event.deltaY !== 0) {
      event.preventDefault();
      const container = this.scrollContainer.nativeElement;

      // Smooth out the scroll amount
      const scrollAmount = event.deltaY > 0 ? 100 : -100;

      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  startDrag(event: MouseEvent | TouchEvent): void {
    this.isDragging = true;
    const container = this.scrollContainer.nativeElement;

    // Get the starting position
    if (event instanceof MouseEvent) {
      this.startX = event.pageX - container.offsetLeft;
    } else if (event.touches.length > 0) {
      this.startX = event.touches[0].pageX - container.offsetLeft;
    }

    this.scrollLeft = container.scrollLeft;
    this.lastDragTime = Date.now();
    this.lastDragX = this.startX;
    this.dragVelocity = 0;

    // Prevent text selection while dragging
    event.preventDefault();

    // Update UI
    this.cdr.markForCheck();
  }

  onDrag(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;

    event.preventDefault();
    const container = this.scrollContainer.nativeElement;

    let currentX: number;
    if (event instanceof MouseEvent) {
      currentX = event.pageX - container.offsetLeft;
    } else if (event.touches.length > 0) {
      currentX = event.touches[0].pageX - container.offsetLeft;
    } else {
      return;
    }

    // Calculate the distance moved
    const walk = (currentX - this.startX) * 1.5; // Multiply for faster drag
    const newScrollLeft = this.scrollLeft - walk;

    // Calculate velocity for momentum scrolling
    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastDragTime;

    if (timeDiff > 0) {
      this.dragVelocity = (currentX - this.lastDragX) / timeDiff;
    }

    container.scrollLeft = newScrollLeft;

    this.lastDragTime = currentTime;
    this.lastDragX = currentX;
  }

  endDrag(): void {
    if (!this.isDragging) return;

    this.isDragging = false;

    // Apply momentum scrolling
    if (Math.abs(this.dragVelocity) > 0.1) {
      this.applyMomentum();
    }

    // Update UI
    this.cdr.markForCheck();
  }

  private applyMomentum(): void {
    const container = this.scrollContainer.nativeElement;
    let velocity = this.dragVelocity * -150; // Adjust momentum strength
    const friction = 0.95; // Friction coefficient
    const minVelocity = 0.5;

    const animate = () => {
      if (Math.abs(velocity) > minVelocity) {
        container.scrollLeft += velocity / 60; // Divide by 60 for 60fps
        velocity *= friction;

        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.animationFrameId = null;
      }
    };

    animate();
  }

  private updateArrowVisibility(): void {
    const container = this.scrollContainer.nativeElement;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;

    // Add small threshold to handle floating point errors
    this.canScrollLeft = scrollLeft > 5;
    this.canScrollRight = scrollLeft < maxScrollLeft - 5;
  }

}