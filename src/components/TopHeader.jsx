import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

export default function TopHeader() {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDate.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = currentDate.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="top-header" style={{ justifyContent: 'flex-end' }}>
      {/* Right Section: Date/Time Only */}
      <div className="header-right-widgets">
        <div className="header-date-widget">
          <Calendar size={18} color="var(--primary)" />
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            {formattedDate}, {formattedTime}
          </span>
        </div>
      </div>
    </header>
  );
}
