/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      animation: {
        'shake-announcement': 'shakeAnnouncement 0.5s ease-in-out',
        'flip-book': 'flipBook 0.6s ease-in-out',
        'scroll-unroll': 'scrollUnroll 0.8s ease-out',
        'check-items': 'attendanceCount 0.8s ease-in-out',
        'task-complete': 'taskComplete 0.6s ease-in-out',
        'grade-glow': 'gradeGlow 1s ease-in-out',
        'people-wave': 'peopleWave 0.8s ease-in-out',
        'chart-grow': 'dataScan 1s ease-in-out',
        'screen-glow': 'screenGlow 1s ease-in-out'
      },
      keyframes: {
        shakeAnnouncement: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' }
        },
        flipBook: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' }
        },
        scrollUnroll: {
          '0%': {
            transform: 'scaleY(0) translateY(-50%)',
            opacity: '0.5'
          },
          '50%': {
            transform: 'scaleY(0.8) translateY(-25%)',
            opacity: '0.8'
          },
          '100%': {
            transform: 'scaleY(1) translateY(0)',
            opacity: '1'
          }
        },
        attendanceCount: {
          '0%': {
            transform: 'scale(1)',
            opacity: '0.8'
          },
          '20%': {
            transform: 'scale(1.1)',
            opacity: '1'
          },
          '40%': {
            transform: 'scale(1.05)',
            opacity: '0.9'
          },
          '60%': {
            transform: 'scale(1.15)',
            opacity: '1'
          },
          '80%': {
            transform: 'scale(1.02)',
            opacity: '0.95'
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1'
          }
        },
        taskComplete: {
          '0%': { transform: 'scale(1) rotate(0deg)' },
          '25%': { transform: 'scale(1.1) rotate(-5deg)' },
          '50%': { transform: 'scale(1.2) rotate(5deg)' },
          '75%': { transform: 'scale(1.1) rotate(-2deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' }
        },
        gradeGlow: {
          '0%, 100%': {
            transform: 'scale(1)',
            filter: 'brightness(1) drop-shadow(0 0 0 rgba(34, 197, 94, 0))'
          },
          '50%': {
            transform: 'scale(1.15)',
            filter: 'brightness(1.3) drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))'
          }
        },
        peopleWave: {
          '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
          '25%': { transform: 'rotate(-5deg) scale(1.05)' },
          '50%': { transform: 'rotate(5deg) scale(1.1)' },
          '75%': { transform: 'rotate(-3deg) scale(1.05)' }
        },
        dataScan: {
          '0%': {
            transform: 'scale(1)',
            filter: 'brightness(1) drop-shadow(0 0 0 rgba(99, 102, 241, 0))'
          },
          '25%': {
            transform: 'scale(1.05)',
            filter: 'brightness(1.1) drop-shadow(0 0 4px rgba(99, 102, 241, 0.4))'
          },
          '50%': {
            transform: 'scale(1.1)',
            filter: 'brightness(1.2) drop-shadow(0 0 8px rgba(99, 102, 241, 0.6))'
          },
          '75%': {
            transform: 'scale(1.15) rotate(2deg)',
            filter: 'brightness(1.3) drop-shadow(0 0 12px rgba(99, 102, 241, 0.8))'
          },
          '100%': {
            transform: 'scale(1)',
            filter: 'brightness(1) drop-shadow(0 0 0 rgba(99, 102, 241, 0))'
          }
        },
        screenGlow: {
          '0%, 100%': {
            transform: 'scale(1)',
            filter: 'brightness(1) drop-shadow(0 0 0 rgba(59, 130, 246, 0))'
          },
          '50%': {
            transform: 'scale(1.1)',
            filter: 'brightness(1.2) drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))'
          }
        }
      }
    }
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')]
};
