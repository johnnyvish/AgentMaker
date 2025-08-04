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
  ArrowLeft,
  Brain,
  Save,
  Play,
  Hand,
  LayoutDashboard,
  Grid3X3,
  Command,
  Activity,
  Bell,
  Filter,
  Workflow,
  Bot,
  AlertTriangle,
  CheckCircle,
  FileText,
  Settings,
  Users,
  Calendar,
  BarChart3,
  Shield,
  Cpu,
  Network,
  // Additional icons for integrations
  MessageCircle,
  User,
  UserPlus,
  CreditCard,
  DollarSign,
  Image as LucideImage,
  Video,
  CheckSquare,
  Cloud,
  HardDrive,
  AlertCircle,
  Grid,
  // Logic component icons
  Repeat,
  GitBranch,
  ShieldCheck,
  Layers,
  // Additional icons for triggers
  FileSearch,
  Clipboard,
} from "lucide-react";

// Brand icons from react-icons
import {
  FaSlack,
  FaDiscord,
  FaTwitter,
  FaLinkedin,
  FaGithub,
  FaTelegram,
  FaWhatsapp,
  FaPaypal,
  FaStripe,
  FaAws,
  FaGoogle,
  FaDropbox,
  FaSpotify,
  FaYoutube,
  FaTwitch,
  FaSteam,
  FaShopify,
  FaWordpress,
  FaJira,
  FaTrello,
  FaHubspot,
  FaSalesforce,
  FaMailchimp,
  FaMicrosoft,
} from "react-icons/fa";

// Additional brand icons from other react-icons packages
import {
  SiAsana,
  SiNotion,
  SiZoom,
  SiSendgrid,
  SiCloudinary,
  SiRedis,
  SiPostgresql,
  SiMongodb,
  SiAirtable,
} from "react-icons/si";

// ============================================
// ICON MANAGEMENT
// ============================================

export const getIcon = (
  iconName: string,
  size: string = "w-5 h-5",
  className: string = "text-[var(--foreground)]"
) => {
  const iconClass = `${size} ${className}`;
  const iconProps = {
    className: iconClass,
    "aria-label": `${iconName} icon`,
  };

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
    case "arrow-left":
      return <ArrowLeft className={iconClass} />;
    case "dashboard":
      return <LayoutDashboard className={iconClass} />;
    case "grid":
      return <Grid3X3 className={iconClass} />;
    case "command":
      return <Command className={iconClass} />;
    case "activity":
      return <Activity className={iconClass} />;
    case "bell":
      return <Bell className={iconClass} />;
    case "filter":
      return <Filter className={iconClass} />;
    case "workflow":
      return <Workflow className={iconClass} />;
    case "bot":
      return <Bot className={iconClass} />;
    case "alert-triangle":
      return <AlertTriangle className={iconClass} />;
    case "check-circle":
      return <CheckCircle className={iconClass} />;
    case "file-text":
      return <FileText className={iconClass} />;
    case "settings":
      return <Settings className={iconClass} />;
    case "users":
      return <Users className={iconClass} />;
    case "calendar":
      return <Calendar className={iconClass} />;
    case "bar-chart-3":
      return <BarChart3 className={iconClass} />;
    case "shield":
      return <Shield className={iconClass} />;
    case "cpu":
      return <Cpu className={iconClass} />;
    case "network":
      return <Network className={iconClass} />;
    case "message-circle":
      return <MessageCircle className={iconClass} />;
    case "user":
      return <User className={iconClass} />;
    case "user-plus":
      return <UserPlus className={iconClass} />;
    case "credit-card":
      return <CreditCard className={iconClass} />;
    case "dollar-sign":
      return <DollarSign className={iconClass} />;
    case "image":
      return <LucideImage {...iconProps} />;
    case "video":
      return <Video className={iconClass} />;
    case "check-square":
      return <CheckSquare className={iconClass} />;
    case "cloud":
      return <Cloud className={iconClass} />;
    case "hard-drive":
      return <HardDrive className={iconClass} />;
    case "alert-circle":
      return <AlertCircle className={iconClass} />;
    case "grid":
      return <Grid className={iconClass} />;

    // Logic component icons
    case "repeat":
      return <Repeat className={iconClass} />;
    case "git-branch":
      return <GitBranch className={iconClass} />;
    case "shield-check":
      return <ShieldCheck className={iconClass} />;
    case "layers":
      return <Layers className={iconClass} />;
    case "file-search":
      return <FileSearch className={iconClass} />;
    case "clipboard":
      return <Clipboard className={iconClass} />;

    // Brand icons
    case "slack":
      return <FaSlack className={iconClass} />;
    case "discord":
      return <FaDiscord className={iconClass} />;
    case "twitter":
      return <FaTwitter className={iconClass} />;
    case "linkedin":
      return <FaLinkedin className={iconClass} />;
    case "github":
      return <FaGithub className={iconClass} />;
    case "telegram":
      return <FaTelegram className={iconClass} />;
    case "whatsapp":
      return <FaWhatsapp className={iconClass} />;
    case "paypal":
      return <FaPaypal className={iconClass} />;
    case "stripe":
      return <FaStripe className={iconClass} />;
    case "aws":
      return <FaAws className={iconClass} />;
    case "google":
      return <FaGoogle className={iconClass} />;
    case "dropbox":
      return <FaDropbox className={iconClass} />;
    case "spotify":
      return <FaSpotify className={iconClass} />;
    case "youtube":
      return <FaYoutube className={iconClass} />;
    case "twitch":
      return <FaTwitch className={iconClass} />;
    case "steam":
      return <FaSteam className={iconClass} />;
    case "shopify":
      return <FaShopify className={iconClass} />;
    case "wordpress":
      return <FaWordpress className={iconClass} />;
    case "jira":
      return <FaJira className={iconClass} />;
    case "trello":
      return <FaTrello className={iconClass} />;
    case "asana":
      return <SiAsana className={iconClass} />;
    case "notion":
      return <SiNotion className={iconClass} />;
    case "zoom":
      return <SiZoom className={iconClass} />;
    case "hubspot":
      return <FaHubspot className={iconClass} />;
    case "salesforce":
      return <FaSalesforce className={iconClass} />;
    case "mailchimp":
      return <FaMailchimp className={iconClass} />;
    case "sendgrid":
      return <SiSendgrid className={iconClass} />;
    case "cloudinary":
      return <SiCloudinary className={iconClass} />;
    case "redis":
      return <SiRedis className={iconClass} />;
    case "postgresql":
      return <SiPostgresql className={iconClass} />;
    case "mongodb":
      return <SiMongodb className={iconClass} />;
    case "airtable":
      return <SiAirtable className={iconClass} />;
    case "microsoft":
      return <FaMicrosoft className={iconClass} />;
    default:
      return <Circle className={iconClass} />;
  }
};
