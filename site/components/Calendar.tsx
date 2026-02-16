"use client";

import React, { useState, useMemo } from "react";
import styles from "./Calendar.module.css";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface CalendarProps {
  selected: Date | null;
  onSelect: (date: Date) => void;
}

/** Strip time from a Date so we can compare days cleanly */
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export const Calendar: React.FC<CalendarProps> = ({ selected, onSelect }) => {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  // Monday = 0 … Sunday = 6  (ISO week)
  const startWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Can we go back? Only if previous month contains today or future dates
  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const cells: React.ReactNode[] = [];

  // Empty leading cells
  for (let i = 0; i < startWeekday; i++) {
    cells.push(<span key={`empty-${i}`} className={styles.emptyCell} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(viewYear, viewMonth, day);
    const dateStart = startOfDay(date);
    const isPast = dateStart < today;
    const isToday = dateStart.getTime() === today.getTime();
    const isSelected =
      selected && startOfDay(selected).getTime() === dateStart.getTime();

    const className = [
      styles.dayCell,
      isPast && styles.pastDay,
      isToday && styles.today,
      isSelected && styles.selected,
    ]
      .filter(Boolean)
      .join(" ");

    cells.push(
      <button
        key={day}
        className={className}
        disabled={isPast}
        onClick={() => onSelect(date)}
        aria-label={`${MONTH_LABELS[viewMonth]} ${day}, ${viewYear}`}
        aria-pressed={isSelected || undefined}
      >
        {day}
      </button>,
    );
  }

  return (
    <div className={styles.calendar}>
      {/* Month / Year header */}
      <div className={styles.header}>
        <button
          className={styles.navBtn}
          onClick={prevMonth}
          disabled={!canGoPrev}
          aria-label="Previous month"
        >
          ←
        </button>
        <span className={styles.monthLabel}>
          {MONTH_LABELS[viewMonth]} {viewYear}
        </span>
        <button
          className={styles.navBtn}
          onClick={nextMonth}
          aria-label="Next month"
        >
          →
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className={styles.weekRow}>
        {DAY_LABELS.map((d) => (
          <span key={d} className={styles.weekLabel}>
            {d}
          </span>
        ))}
      </div>

      {/* Day grid */}
      <div className={styles.grid}>{cells}</div>
    </div>
  );
};
