import React from 'react';
import ReactDOM from 'react-dom';
import CustomCalendar from './App';

const CalendarEmbed = ({ config = {} }) => {
  return <CustomCalendar embed={true} {...config} />;
};

// For direct DOM rendering
const renderCalendar = (elementId, config = {}) => {
  const element = document.getElementById(elementId);
  if (element) {
    ReactDOM.render(<CalendarEmbed {...config} />, element);
  }
};

// For script tag embedding
if (typeof window !== 'undefined') {
  window.CalendlyClone = {
    init: (elementId, config) => {
      renderCalendar(elementId, config);
    }
  };
}

export default CalendarEmbed;