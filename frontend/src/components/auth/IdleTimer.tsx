import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearStoredAuth } from '../../utils/api';

interface IdleTimerProps {
  timeoutMinutes?: number;
  children: React.ReactNode;
}

export const IdleTimer: React.FC<IdleTimerProps> = ({ 
  timeoutMinutes = 15, 
  children 
}) => {
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutMs = timeoutMinutes * 60 * 1000;

  const handleLogout = useCallback(() => {
    console.log('User idle for too long, logging out...');
    clearStoredAuth();
    navigate('/login');
  }, [navigate]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(handleLogout, timeoutMs);
  }, [handleLogout, timeoutMs]);

  useEffect(() => {
    const events = [
      'mousedown', 
      'mousemove', 
      'keypress', 
      'scroll', 
      'touchstart',
      'click'
    ];

    const resetTimerOnActivity = () => resetTimer();

    resetTimer();

    events.forEach(event => {
      window.addEventListener(event, resetTimerOnActivity);
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimerOnActivity);
      });
    };
  }, [resetTimer]);

  return <>{children}</>;
};
