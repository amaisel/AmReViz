import { motion, AnimatePresence } from 'framer-motion';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];

export default function EventCard({ event, darkMode }) {
  if (!event) return null;

  const date = new Date(event.date);
  const formattedDate = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

  const typeColors = {
    battle: darkMode ? '#dc2626' : '#8b2323',
    political: darkMode ? '#2563eb' : '#1e3a5f',
    diplomatic: darkMode ? '#059669' : '#2d5a27'
  };

  const typeLabels = {
    battle: 'Battle',
    political: 'Political',
    diplomatic: 'Diplomatic'
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        className={`event-card-fixed ${darkMode ? 'dark' : ''}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        key={event.id}
      >
        <div 
          className="event-card-type-badge"
          style={{ backgroundColor: typeColors[event.type] }}
        >
          {typeLabels[event.type]}
        </div>
        
        <h2 className="event-card-title">{event.title}</h2>
        
        <div className="event-card-meta">
          <span className="event-card-date">{formattedDate}</span>
          <span className="event-card-location">{event.location}</span>
        </div>
        
        <p className="event-card-description">{event.description}</p>
        
        <div className="event-card-significance">
          <strong>Historical Significance</strong>
          <p>{event.significance}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
