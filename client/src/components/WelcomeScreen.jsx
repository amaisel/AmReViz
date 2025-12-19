import { motion } from 'framer-motion';

export default function WelcomeScreen({ onBegin, darkMode }) {
  return (
    <motion.div 
      className={`welcome-screen ${darkMode ? 'dark' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="welcome-content">
        <motion.h1 
          className="welcome-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          The American Revolution
        </motion.h1>
        
        <motion.p 
          className="welcome-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          An Interactive Journey Through Independence
        </motion.p>
        
        <motion.div 
          className="welcome-description"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <p>
            Experience the birth of a nation through time and space. This visualization 
            guides you through the key events of the Revolutionary War—from the Boston 
            Tea Party to the British surrender at Yorktown—in both chronological and 
            geospatial order.
          </p>
          <p className="welcome-credits">
            Inspired by data journalism from The Upshot, FiveThirtyEight, and the 
            tradition of making complex stories clear through visualization.
          </p>
        </motion.div>
        
        <motion.button 
          className="welcome-begin-btn"
          onClick={onBegin}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Begin the Journey
        </motion.button>
        
        <motion.div 
          className="welcome-scroll-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          <span>or scroll to start</span>
          <motion.div 
            className="scroll-arrow"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            ↓
          </motion.div>
        </motion.div>
      </div>
      
      <div className="welcome-years">
        <span className="year-start">1773</span>
        <div className="year-line"></div>
        <span className="year-end">1783</span>
      </div>
    </motion.div>
  );
}
