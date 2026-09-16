import React, { useState, useEffect } from 'react';
import { Search, Calendar, Keyboard } from 'lucide-react';

export default function TopHeader({ onGlobalSearch, onFocusSearch }) {
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
    <header className="top-header">
      {/* Search Input Bar with F2 Badge */}
      <div className="header-search-box">
        <Search size={18} color="#94a3b8" />
        <input
          type="text"
          id="global-search-input"
          className="header-search-input"
          placeholder="Buscar producto por nombre, código o escanear..."
          onChange={(e) => onGlobalSearch?.(e.target.value)}
        />
        <div className="search-shortcut-badge" onClick={onFocusSearch} style={{ cursor: 'pointer' }}>
          <Keyboard size={13} />
          <span>F2 - Buscar</span>
        </div>
      </div>

      {/* Right Section: Date/Time Only (No login / No user avatar) */}
      <div className="header-right-widgets">
        <div className="header-date-widget">
          <Calendar size={18} color="#2563eb" />
          <span style={{ fontWeight: 600, color: '#1e293b' }}>
            {formattedDate}, {formattedTime}
          </span>
        </div>
      </div>
    </header>
  );
}
