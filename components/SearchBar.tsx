"use client";

import styles from "./SearchBar.module.css";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChange,
  placeholder = "Search for a song or artist…",
}: SearchBarProps) {
  return (
    <div className={styles.wrapper}>
      <label htmlFor="axis-search" className={styles.label}>
        Find your anchor song
      </label>
      <div className={styles.inputRow}>
        <span className={styles.icon} aria-hidden="true">
          ⌕
        </span>
        <input
          id="axis-search"
          type="search"
          className={styles.input}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
