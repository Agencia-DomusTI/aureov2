import { useState, useMemo, useRef, useEffect } from 'react';
import { servicesData } from '../constants/services';
import './ServiceSearch.css';

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export default function ServiceSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Flatten all services from the 3 categories
  const allServices = useMemo(() => {
    const list = [];
    Object.entries(servicesData).forEach(([tabKey, category]) => {
      category.items.forEach((item) => {
        list.push({
          ...item,
          tabKey,
          categoryTitle: category.title,
        });
      });
    });
    return list;
  }, []);

  // Filter services by title, summary, or description
  const filteredServices = useMemo(() => {
    const q = normalizeText(query);
    if (!q) return [];
    return allServices.filter((service) => {
      const matchName = normalizeText(service.name).includes(q);
      const matchSummary = normalizeText(service.summary).includes(q);
      const matchDesc = normalizeText(service.desc).includes(q);
      return matchName || matchSummary || matchDesc;
    });
  }, [query, allServices]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelect = (service) => {
    setQuery('');
    setIsOpen(false);
    setIsMobileOpen(false);
    window.dispatchEvent(
      new CustomEvent('aureo:select-service', {
        detail: {
          service,
          tabKey: service.tabKey,
        },
      }),
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setIsMobileOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div
      className={`header-search ${isMobileOpen ? 'is-mobile-open' : ''}`}
      ref={wrapperRef}
    >
      <button
        type="button"
        className="header-search__toggle-btn"
        aria-label="Abrir buscador de tratamientos"
        onClick={() => {
          setIsMobileOpen((prev) => !prev);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
      >
        <svg
          className="header-search__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      <div className="header-search__box">
        <svg
          className="header-search__icon header-search__icon--inside"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          ref={inputRef}
          type="search"
          className="header-search__input"
          placeholder="Buscar tratamiento…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          aria-label="Buscar tratamientos"
          autoComplete="off"
        />

        {query && (
          <button
            type="button"
            className="header-search__clear-btn"
            aria-label="Limpiar búsqueda"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        )}
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="header-search__dropdown" role="listbox">
          {filteredServices.length > 0 ? (
            <>
              <div className="header-search__results-header">
                <span>{filteredServices.length} tratamiento{filteredServices.length === 1 ? '' : 's'} encontrado{filteredServices.length === 1 ? '' : 's'}</span>
              </div>
              <ul className="header-search__results-list">
                {filteredServices.map((service) => (
                  <li key={`${service.tabKey}-${service.name}`}>
                    <button
                      type="button"
                      className="header-search__result-item"
                      onClick={() => handleSelect(service)}
                    >
                      <div className="header-search__result-header">
                        <strong className="header-search__result-title">
                          {service.name}
                        </strong>
                        <span className="header-search__result-category">
                          {service.categoryTitle}
                        </span>
                      </div>
                      {(service.summary || service.desc) && (
                        <p className="header-search__result-desc">
                          {service.summary || service.desc.slice(0, 110) + '…'}
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="header-search__empty">
              <p>No encontramos tratamientos para <strong>"{query}"</strong></p>
              <a
                href="#servicios"
                className="header-search__empty-link"
                onClick={() => {
                  setIsOpen(false);
                  setIsMobileOpen(false);
                }}
              >
                Ver todos los tratamientos →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
