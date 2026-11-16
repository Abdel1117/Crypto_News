/** `nonce`: the request's, so the Content-Security-Policy lets this script run. */
export const ThemeScript = ({ nonce }: Readonly<{ nonce?: string }>) => {
  return (
    <script
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            function getTheme() {
              const stored = localStorage.getItem('theme');
              if (stored) return stored;
              return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            
            const theme = getTheme();
            const root = document.documentElement;
            
            if (theme === 'dark') {
              root.classList.add('dark');
            } else {
              root.classList.remove('dark');
            }

            // JS is running: landing sections may hide until their intro plays.
            root.setAttribute('data-motion', '');
          })();
        `,
      }}
    />
  );
};
