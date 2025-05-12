(function() {
    // Configuration
    const config = {
      apiUrl: 'http://localhost:3001', // Default API URL
      stylesheet: 'http://localhost:3000/static/css/main.css' // Default styles
    };
  
    // Load CSS
    const loadCSS = () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = config.stylesheet;
      document.head.appendChild(link);
    };
  
    // Load React if not already loaded
    const loadReact = () => {
      return new Promise((resolve) => {
        if (window.React && window.ReactDOM) {
          resolve();
          return;
        }
  
        const reactScript = document.createElement('script');
        reactScript.src = 'https://unpkg.com/react@17/umd/react.production.min.js';
        reactScript.onload = () => {
          const reactDOMScript = document.createElement('script');
          reactDOMScript.src = 'https://unpkg.com/react-dom@17/umd/react-dom.production.min.js';
          reactDOMScript.onload = resolve;
          document.head.appendChild(reactDOMScript);
        };
        document.head.appendChild(reactScript);
      });
    };
  
    // Load our app
    const loadApp = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = `${config.apiUrl}/static/js/main.js`;
        script.onload = resolve;
        document.head.appendChild(script);
      });
    };
  
    // Initialize all calendar embeds
    const initCalendars = () => {
      const elements = document.querySelectorAll('[data-calendly-embed]');
      elements.forEach((el) => {
        const elementId = 'calendly-embed-' + Math.random().toString(36).substr(2, 8);
        el.id = elementId;
        
        const customConfig = {
          apiUrl: el.getAttribute('data-api-url') || config.apiUrl,
          // Add other config options here
        };
  
        if (window.CalendlyClone) {
          window.CalendlyClone.init(elementId, customConfig);
        }
      });
    };
  
    // Main initialization
    const init = () => {
      loadCSS();
      loadReact()
        .then(loadApp)
        .then(() => {
          // Check for CalendlyClone every 100ms until it's loaded
          const checkInterval = setInterval(() => {
            if (window.CalendlyClone) {
              clearInterval(checkInterval);
              initCalendars();
            }
          }, 100);
        });
    };
  
    // Start the process
    if (document.readyState === 'complete') {
      init();
    } else {
      window.addEventListener('load', init);
    }
  })();