import { onUnmounted } from 'vue';

export const visualViewport = (cb) => {
  const handler = () => {
    document.documentElement.style.height = `${window.visualViewport?.height}px`;
    if (document.documentElement.scrollTop > 0) {
      document.documentElement.scrollTop = 0;
    }
    cb?.();
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handler);
    window.visualViewport.addEventListener('scroll', handler);
  }

  return () => {
    window.visualViewport?.removeEventListener('resize', handler);
    window.visualViewport?.removeEventListener('scroll', handler);
  };
};

export default (cb) => {
  onUnmounted(visualViewport(cb));
};
