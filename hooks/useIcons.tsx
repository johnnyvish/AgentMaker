import {
  Home,
  Check,
  X,
  Plus,
  Trash2,
  Zap,
  Circle,
  Diamond,
  Link as LinkIcon,
  Clock,
  Mail,
  Send,
  Globe,
  MessageSquare,
  Database,
  Search,
  ArrowUpRight,
  Brain,
  Save,
  Play,
  Hand,
  LayoutDashboard,
  Grid3X3,
  Command,
  Activity,
} from "lucide-react";

// ============================================
// ICON MANAGEMENT
// ============================================

export const getIcon = (
  iconName: string,
  size: string = "w-5 h-5",
  className: string = "text-[var(--foreground)]"
) => {
  const iconClass = `${size} ${className}`;

  switch (iconName) {
    case "home":
      return <Home className={iconClass} />;
    case "check":
      return <Check className={iconClass} />;
    case "x":
      return <X className={iconClass} />;
    case "plus":
      return <Plus className={iconClass} />;
    case "trash":
      return <Trash2 className={iconClass} />;
    case "save":
      return <Save className={iconClass} />;
    case "play":
      return <Play className={iconClass} />;
    case "zap":
      return <Zap className={iconClass} />;
    case "circle":
      return <Circle className={iconClass} />;
    case "diamond":
      return <Diamond className={iconClass} />;
    case "brain":
      return <Brain className={iconClass} />;
    case "hand":
      return <Hand className={iconClass} />;
    case "link":
      return <LinkIcon className={iconClass} />;
    case "clock":
      return <Clock className={iconClass} />;
    case "mail":
      return <Mail className={iconClass} />;
    case "send":
      return <Send className={iconClass} />;
    case "globe":
      return <Globe className={iconClass} />;
    case "message-square":
      return <MessageSquare className={iconClass} />;
    case "database":
      return <Database className={iconClass} />;
    case "search":
      return <Search className={iconClass} />;
    case "arrow-up-right":
      return <ArrowUpRight className={iconClass} />;
    case "dashboard":
      return <LayoutDashboard className={iconClass} />;
    case "grid":
      return <Grid3X3 className={iconClass} />;
    case "command":
      return <Command className={iconClass} />;
    case "activity":
      return <Activity className={iconClass} />;
    default:
      return <Circle className={iconClass} />;
  }
};
