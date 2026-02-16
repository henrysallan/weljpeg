import React from "react";
import styles from "./TagPill.module.css";

interface TagPillProps {
  label: string;
  className?: string;
  style?: React.CSSProperties;
}

export const TagPill: React.FC<TagPillProps> = ({ label, className, style }) => (
  <span className={`${styles.tagPill} ${className ?? ""}`} style={style}>{label}</span>
);
