// div-back-to-top.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-back-to-top',
 
  imports: [CommonModule],
  templateUrl: './back-to-top.component.html',
  styleUrls: ['./back-to-top.component.scss']
})
export class BackToTopComponent implements OnInit, OnDestroy {
  @ViewChild('scrollContainer', { static: true }) scrollContainer!: ElementRef;

  @Input() containerHeight: string = '400px'; // Height of scrollable container
  @Input() showAfter: number = 100; // Show button after scrolling this many pixels
  @Input() useIcon: boolean = false; // Use icon instead of CSS arrow
  @Input() icon: string = '↑'; // Icon to display
  @Input() ariaLabel: string = 'Back to top';
  @Input() showProgress: boolean = true; // Show scroll progress bar
  @Input() showButton: boolean = true; // Show back to top button

  @Output() onScroll = new EventEmitter<any>();
  @Output() onBackToTop = new EventEmitter<void>();

  isVisible = false;
  scrollProgress = 0;

  ngOnInit() {
    // Any additional initialization
  }

  ngOnDestroy() {
    // Clean up if needed
  }

  onScrollEvent(event: Event) {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    // Calculate scroll percentage
    const maxScroll = scrollHeight - clientHeight;
    const scrollPercent = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

    // Update progress
    this.scrollProgress = Math.min(100, Math.max(0, scrollPercent));

    // Show/hide button
    this.isVisible = scrollTop > this.showAfter;

    // Emit scroll event
    this.onScroll.emit({ scrollTop, scrollPercent });
  }

  scrollToTop() {
    const container = this.scrollContainer.nativeElement;
    container.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    this.onBackToTop.emit();
  }

  // Public method to scroll to specific position
  scrollTo(position: number, smooth: boolean = true) {
    const container = this.scrollContainer.nativeElement;
    container.scrollTo({
      top: position,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }

  // Public method to get current scroll position
  getCurrentScrollPosition(): number {
    return this.scrollContainer.nativeElement.scrollTop;
  }
}