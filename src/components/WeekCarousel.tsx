import { useRef, useState, useEffect, ReactNode, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './WeekCarousel.module.css';

interface WeekCarouselProps {
  children: ReactNode;
  className?: string;
}

export default function WeekCarousel({ children, className }: WeekCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    // Allow a 4px threshold for subpixel scrolling
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState, children]);

  // Center active button when children/selection change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      const activeBtn = el.querySelector('[class*="weekBtnActive"]') as HTMLElement;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = Math.max(260, scrollRef.current.clientWidth * 0.6);
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className={styles.carouselContainer}>
      <button
        type="button"
        className={`${styles.navBtn} ${styles.navBtnLeft} ${canScrollLeft ? styles.visible : ''}`}
        onClick={() => handleScroll('left')}
        aria-label="Jornada anterior"
        tabIndex={canScrollLeft ? 0 : -1}
      >
        <ChevronLeft size={18} />
      </button>

      <div ref={scrollRef} className={`${styles.scrollTrack} ${className || ''}`}>
        {children}
      </div>

      <button
        type="button"
        className={`${styles.navBtn} ${styles.navBtnRight} ${canScrollRight ? styles.visible : ''}`}
        onClick={() => handleScroll('right')}
        aria-label="Jornada siguiente"
        tabIndex={canScrollRight ? 0 : -1}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
