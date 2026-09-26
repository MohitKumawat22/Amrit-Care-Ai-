import { AlertCircle, Inbox, Search, Calendar, PlusCircle } from "lucide-react";

const ICONS = {
  empty: Inbox,
  error: AlertCircle,
  search: Search,
  calendar: Calendar,
  add: PlusCircle,
};

/**
 * Reusable empty / error state component.
 *
 * @param {Object} props
 * @param {"empty"|"error"|"search"|"calendar"|"add"} props.icon - Icon to display
 * @param {string} props.title - Heading text
 * @param {string} props.description - Body text
 * @param {React.ReactNode} [props.action] - Optional CTA element
 */
export default function EmptyState({ icon = "empty", title, description, action }) {
  const Icon = ICONS[icon] || ICONS.empty;

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-teal-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
