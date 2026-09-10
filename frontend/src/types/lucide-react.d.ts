declare module "lucide-react" {
  import * as React from "react";
  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    className?: string;
  }
  export type Icon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >;
  export const ArrowUp: Icon;
  export const LoaderCircle: Icon;
  export const MessageSquarePlus: Icon;
  export const Sparkles: Icon;
  export const Trash2: Icon;
  export const Trash: Icon;
  export const LogOut: Icon;
  export const Calendar: Icon;
  export const CalendarDays: Icon;
  export const RefreshCcw: Icon;
  export const RefreshCw: Icon;
  export const Check: Icon;
  export const CheckCircle2: Icon;
  export const Video: Icon;
  export const Copy: Icon;
  export const AlertCircle: Icon;
  export const ExternalLink: Icon;
  export const X: Icon;
  export const ChevronDown: Icon;
  export const ChevronUp: Icon;
  export const Send: Icon;
  export const Bot: Icon;
  export const User: Icon;
}
