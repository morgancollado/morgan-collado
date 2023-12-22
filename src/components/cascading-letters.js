// components/CascadingLetters.js
import { Box } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const visuallyHiddenStyle = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    margin: '-1px',
    padding: 0,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    border: 0,
    whiteSpace: 'nowrap'
  };

const CascadingLetters = ({ letters, isAnimating }) => {
  // Define the animation
  const variants = {
    initial: (index) => ({
      opacity: 0,
      scale: 0.5,
      x: Math.random() > 0.5 ? -200 : 200,
      y: Math.random() > 0.5 ? -200 : 200,
      rotate: Math.random() * 360
    }),
    animate: (index) => ({
      opacity: [0, 1, 0],
      scale: [1, 1.5, 1],
      x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50],
      y: [0, Math.random() * 100 - 50, Math.random() * 100 - 50],
      rotate: [0, Math.random() * 360, Math.random() * 360]
    }),
    exit: { opacity: 0, scale: 0 }
  };

  return (
    <Box aria-live="polite" aria-atomic="true">
    <AnimatePresence>
      {isAnimating && letters.map((letter, index) => (
        <motion.div 
          key={index}
          custom={index}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          aria-hidden="true"
          transition={{ duration: 5, times: [0, 0.5] }}
          style={{ 
            position: 'absolute', 
            left: `${Math.random() * 100}%`, 
            top: `${Math.random() * 100}%`,
            fontFamily: 'Dancing Script, cursive',
            fontSize: '2rem'
          }}
        >
          {letter}
        </motion.div>
      ))}
    </AnimatePresence>
    {isAnimating && (
        <Box sx={visuallyHiddenStyle}>
          Animation of letters M, R, C cascading across the screen in a playful and frenetic manner.
        </Box>
      )}
    </Box>
  );
};

export default CascadingLetters;
