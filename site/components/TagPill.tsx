import React from "react";
import styles from "./TagPill.module.css";

interface TagPillProps {
  label: string;
  className?: string;
}

export const TagPill: React.FC<TagPillProps> = ({ label, className }) => (
  <span className={`${styles.tagPill} ${className ?? ""}`}>{label}</span>
);
