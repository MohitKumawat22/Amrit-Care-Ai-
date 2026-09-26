import { AlertTriangle, AlertCircle, Info, CheckCircle, ShieldAlert } from "lucide-react";

const CONFIG = {
  critical: {
    label: "Critical",
    icon: ShieldAlert,
    className: "severity-critical severity-badge",
  },
  high: {
    label: "High",
    icon: AlertTriangle,
    className: "severity-high severity-badge",
  },
  moderate: {
    label: "Moderate",
    icon: AlertCircle,
    className: "severity-moderate severity-badge",
  },
  low: {
    label: "Low",
    icon: CheckCircle,
    className: "severity-low severity-badge",
  },
  info: {
    label: "Info",
    icon: Info,
    className: "severity-info severity-badge",
  },
};

/**
 * Accessible severity badge — never color-only.
 * Shows: colored dot + icon + text label.
 *
 * @param {Object} props
 * @param {"critical"|"high"|"moderate"|"low"|"info"} props.severity
 * @param {string} [props.className] - Additional classes
 */
export default function SeverityBadge({ severity, className = "" }) {
  const config = CONFIG[severity] || CONFIG.info;
  const Icon = config.icon;

  return (
    <span
      className={`${config.className} ${className}`}
      role="status"
      aria-label={`Severity: ${config.label}`}
    >
      <span className="severity-dot" aria-hidden="true" />
      <Icon className="w-3 h-3" aria-hidden="true" />
      {config.label}
    </span>
  );
}
