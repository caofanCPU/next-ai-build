import RawBTCIcon from '@base-ui/assets/bitcoin';
import RawClerkIcon from '@base-ui/assets/clerk';
import RawCSSIcon from '@base-ui/assets/css';
import RawCSVIcon from '@base-ui/assets/csv';
import RawD8Icon from '@base-ui/assets/d8';
import RawDiffIcon from '@base-ui/assets/diff';
import RawDPAIcon from '@base-ui/assets/dpa';
import RawFAQIcon from '@base-ui/assets/faq';
import RawFAQBIcon from '@base-ui/assets/faqb';
import RawFAQSIcon from '@base-ui/assets/faqs';
import RawGitHubIcon from '@base-ui/assets/github';
import RawHtmlIcon from '@base-ui/assets/html';
import RawHttpIcon from '@base-ui/assets/http';
import RawItermIcon from '@base-ui/assets/iterm';
import RawJavaIcon from '@base-ui/assets/java';
import RawJsonIcon from '@base-ui/assets/json';
import RawLastUpdatedIcon from '@base-ui/assets/last-updated';
import RawLogIcon from '@base-ui/assets/log';
import RawMACIcon from '@base-ui/assets/mac';
import RawMarkdownIcon from '@base-ui/assets/markdown';
import RawMDXIcon from '@base-ui/assets/mdx';
import RawMmdIcon from '@base-ui/assets/mermaid';
import RawSchemeIcon from '@base-ui/assets/scheme';
import RawSnippetsIcon from '@base-ui/assets/snippets';
import RawSQLIcon from '@base-ui/assets/sql';
import RawSubPIcon from '@base-ui/assets/subp';
import RawT3PIcon from '@base-ui/assets/t3p';
import RawTestIcon from '@base-ui/assets/test';
import RawTxtIcon from '@base-ui/assets/txt';
import RawXMLIcon from '@base-ui/assets/xml';
import RawYamlIcon from '@base-ui/assets/yaml';
import { createGlobalIcon, createGlobalLucideIcon } from '@base-ui/components/icon-factory';
import {
  Airplay as RawAirplay,
  Album as RawAlbumIcon,
  AlignHorizontalJustifyEnd as RawAlignHorizontalJustifyEnd,
  ArrowLeft as RawArrowLeft,
  ArrowRight as RawArrowRight,
  ArrowUp as RawArrowUp,
  Baby as RawBaby,
  BadgeAlert as RawBadgeAlert,
  BadgeCheck as RawBadgeCheck,
  BadgeInfo as RawBadgeInfo,
  BadgeQuestionMark as RawBadgeQuestionMark,
  BadgeX as RawBadgeX,
  Bell as RawBell,
  Binary as RawBinary,
  Blocks as RawBlocks,
  BookA as RawBookA,
  BookAudio as RawBookAudio,
  BookCheck as RawBookCheck,
  BookDown as RawBookDown,
  BookHeadphones as RawBookHeadphones,
  BookOpen as RawBookOpen,
  Bookmark as RawBookmark,
  BookmarkCheck as RawBookmarkCheck,
  BookmarkMinus as RawBookmarkMinus,
  BookmarkPlus as RawBookmarkPlus,
  BookmarkX as RawBookmarkX,
  BookX as RawBookX,
  BotMessageSquare as RawBotMessageSquare,
  Brain as RawBrain,
  BrainCircuit as RawBrainCircuit,
  Briefcase as RawBriefcase,
  BringToFront as RawBringToFront,
  BrushCleaning as RawBrushCleaning,
  Building2 as RawBuilding2,
  Bug as RawBug,
  BugOff as RawBugOff,
  Car as RawCar,
  ChartColumnStacked as RawChartColumnStacked,
  Check as RawCheck,
  CheckCheck as RawCheckCheck,
  CheckLine as RawCheckLine,
  ChevronDown as RawChevronDown,
  ChevronLeft as RawChevronLeft,
  ChevronRight as RawChevronRight,
  ChevronUp as RawChevronUp,
  Circle as RawCircle,
  CircleAlert as RawCircleAlert,
  CircleArrowDown as RawCircleArrowDown,
  CircleArrowUp as RawCircleArrowUp,
  CircleQuestionMark as RawCircleQuestionMark,
  CircleSmall as RawCircleSmall,
  CircleStop as RawCircleStop,
  ClipboardType as RawClipboardType,
  Coffee as RawCoffee,
  Coins as RawCoins,
  Component as RawComponentIcon,
  Command as RawCommand,
  Copy as RawCopy,
  CopyCheck as RawCopyCheck,
  Copyright as RawCopyright,
  CornerDownLeft as RawCornerDownLeft,
  CornerDownRight as RawCornerDownRight,
  CornerLeftDown as RawCornerLeftDown,
  CornerLeftUp as RawCornerLeftUp,
  CornerRightDown as RawCornerRightDown,
  CornerRightUp as RawCornerRightUp,
  CornerUpLeft as RawCornerUpLeft,
  CornerUpRight as RawCornerUpRight,
  CreativeCommons as RawCreativeCommons,
  Crop as RawCrop,
  Cross as RawCross,
  Cpu as RawCpu,
  Database as RawDatabase,
  DatabaseZap as RawDatabaseZap,
  Dna as RawDna,
  Dot as RawDot,
  Download as RawDownload,
  Droplet as RawDroplet,
  DropletOff as RawDropletOff,
  Droplets as RawDroplets,
  Egg as RawEgg,
  EggFried as RawEggFried,
  EggOff as RawEggOff,
  Ellipsis as RawEllipsis,
  EllipsisVertical as RawEllipsisVertical,
  Eye as RawEye,
  EyeClosed as RawEyeClosed,
  EyeOff as RawEyeOff,
  ExternalLink as RawExternalLink,
  Facebook as RawFacebook,
  File as RawFile,
  FileDown as RawFileDown,
  FileInput as RawFileInput,
  FileLock2 as RawFileLock2,
  FileUp as RawFileUp,
  Fingerprint as RawFingerprint,
  Folder as RawFolder,
  FolderOpen as RawFolderOpen,
  Frown as RawFrown,
  Gem as RawGem,
  Gift as RawGift,
  GitMerge as RawGitMerge,
  GitPullRequestArrow as RawGitPullRequestArrow,
  Globe as RawGlobe,
  GlobeLock as RawGlobeLock,
  Grip as RawGrip,
  GripVertical as RawGripVertical,
  HandHeart as RawHandHeart,
  Handshake as RawHandshake,
  Highlighter as RawHighlighter,
  History as RawHistory,
  HousePlus as RawHousePlus,
  ImageDown as RawImageDown,
  ImageOff as RawImageOff,
  ImageUp as RawImageUp,
  Infinity as RawInfinity,
  Info as RawInfo,
  Key as RawKey,
  KeyRound as RawKeyRound,
  Keyboard as RawKeyboard,
  LandPlot as RawLandPlot,
  Languages as RawLanguages,
  Layout as RawLayout,
  LayoutTemplate as RawLayoutTemplate,
  Library as RawLibraryIcon,
  Lightbulb as RawLightbulb,
  Link as RawLink,
  ListTodo as RawListTodo,
  Loader2 as RawLoader2,
  LogIn as RawLogIn,
  LogOut as RawLogOut,
  Mail as RawMail,
  MessageCircleCode as RawMessageCircleCode,
  MessageCircleMore as RawMessageCircleMore,
  MessageSquareDiff as RawMessageSquareDiff,
  MoreHorizontal as RawMoreHorizontal,
  MousePointerClick as RawMousePointerClick,
  Music4 as RawMusic4,
  Moon as RawMoon,
  NotepadText as RawNotepadText,
  Palette as RawPalette,
  PanelLeft as RawPanelLeft,
  PanelsTopLeft as RawPanelsTopLeft,
  PawPrint as RawPawPrint,
  Pencil as RawPencil,
  Pi as RawPi,
  Pin as RawPin,
  PinOff as RawPinOff,
  Plus as RawPlus,
  QrCode as RawQrCode,
  ReceiptText as RawReceiptText,
  Redo2 as RawRedo2,
  RefreshCcw as RawRefreshCcw,
  Regex as RawRegex,
  Replace as RawReplace,
  Rocket as RawRocket,
  RotateCcw as RawRotateCcw,
  Rss as RawRss,
  Scale as RawScale,
  ScanSearch as RawScanSearch,
  Search as RawSearch,
  Send as RawSend,
  SendHorizontal as RawSendHorizontal,
  Server as RawServer,
  Settings as RawSettings,
  Settings2 as RawSettings2,
  Share as RawShare,
  Shield as RawShield,
  ShieldUser as RawShieldUser,
  ShoppingCart as RawShoppingCart,
  Sigma as RawSigma,
  Smile as RawSmile,
  SmilePlus as RawSmilePlus,
  SplinePointer as RawSplinePointer,
  Sparkles as RawSparkles,
  Sprout as RawSprout,
  SquareDashedBottomCode as RawSquareDashedBottomCode,
  SquaresExclude as RawSquaresExclude,
  SquareTerminal as RawSquareTerminal,
  Star as RawStar,
  Sun as RawSun,
  Tablets as RawTablets,
  Terminal as RawTerminal,
  Trash2 as RawTrash2,
  Twitter as RawTwitter,
  Undo2 as RawUndo2,
  Usb as RawUsb,
  UserRoundCheck as RawUserRoundCheck,
  Wand2 as RawWand2,
  Workflow as RawWorkflow,
  X as RawX,
  Zap as RawZap,
} from '@base-ui/components/limited-lucide-icons';

export { createGlobalIcon, createGlobalLucideIcon, GlobalAccentIcon } from '@base-ui/components/icon-factory';
export { getGlobalIcon, getIconElement, globalLucideIcons } from '@base-ui/components/global-icon';
export { createSiteIcon } from '@base-ui/components/site-icon';

export const AlbumIcon = createGlobalLucideIcon(RawAlbumIcon, 'AlbumIcon');
export const AirplayIcon = createGlobalLucideIcon(RawAirplay, 'AirplayIcon');
export const AlignHorizontalJustifyEndIcon = createGlobalLucideIcon(RawAlignHorizontalJustifyEnd, 'AlignHorizontalJustifyEndIcon');
export const ArrowLeftIcon = createGlobalLucideIcon(RawArrowLeft, 'ArrowLeftIcon');
export const ArrowRightIcon = createGlobalLucideIcon(RawArrowRight, 'ArrowRightIcon');
export const ArrowUpIcon = createGlobalLucideIcon(RawArrowUp, 'ArrowUpIcon');
export const BabyIcon = createGlobalLucideIcon(RawBaby, 'BabyIcon');
export const BadgeInfoIcon = createGlobalLucideIcon(RawBadgeInfo, 'BadgeInfoIcon');
export const BadgeAlertIcon = createGlobalLucideIcon(RawBadgeAlert, 'BadgeAlertIcon');
export const BadgeCheckIcon = createGlobalLucideIcon(RawBadgeCheck, 'BadgeCheckIcon');
export const BadgeXIcon = createGlobalLucideIcon(RawBadgeX, 'BadgeXIcon');
export const BellIcon = createGlobalLucideIcon(RawBell, 'BellIcon');
export const BinaryIcon = createGlobalLucideIcon(RawBinary, 'BinaryIcon');
export const BlocksIcon = createGlobalLucideIcon(RawBlocks, 'BlocksIcon');
export const BookXIcon = createGlobalLucideIcon(RawBookX, 'BookXIcon');
export const BookOpenIcon = createGlobalLucideIcon(RawBookOpen, 'BookOpenIcon');
export const BookAudioIcon = createGlobalLucideIcon(RawBookAudio, 'BookAudioIcon');
export const BookAIcon = createGlobalLucideIcon(RawBookA, 'BookAIcon');
export const BookCheckIcon = createGlobalLucideIcon(RawBookCheck, 'BookCheckIcon');
export const BookDownIcon = createGlobalLucideIcon(RawBookDown, 'BookDownIcon');
export const BookHeadphonesIcon = createGlobalLucideIcon(RawBookHeadphones, 'BookHeadphonesIcon');
export const BookmarkIcon = createGlobalLucideIcon(RawBookmark, 'BookmarkIcon');
export const BookmarkCheckIcon = createGlobalLucideIcon(RawBookmarkCheck, 'BookmarkCheckIcon');
export const BookmarkMinusIcon = createGlobalLucideIcon(RawBookmarkMinus, 'BookmarkMinusIcon');
export const BookmarkPlusIcon = createGlobalLucideIcon(RawBookmarkPlus, 'BookmarkPlusIcon');
export const BookmarkXIcon = createGlobalLucideIcon(RawBookmarkX, 'BookmarkXIcon');
export const BotMessageSquareIcon = createGlobalLucideIcon(RawBotMessageSquare, 'BotMessageSquareIcon');
export const BrainIcon = createGlobalLucideIcon(RawBrain, 'BrainIcon');
export const BrainCircuitIcon = createGlobalLucideIcon(RawBrainCircuit, 'BrainCircuitIcon');
export const BriefcaseIcon = createGlobalLucideIcon(RawBriefcase, 'BriefcaseIcon');
export const BringToFrontIcon = createGlobalLucideIcon(RawBringToFront, 'BringToFrontIcon');
export const BrushCleaningIcon = createGlobalLucideIcon(RawBrushCleaning, 'BrushCleaningIcon');
export const Building2Icon = createGlobalLucideIcon(RawBuilding2, 'Building2Icon');
export const BugIcon = createGlobalLucideIcon(RawBug, 'BugIcon');
export const BugOffIcon = createGlobalLucideIcon(RawBugOff, 'BugOffIcon');
export const BadgeQuestionMarkIcon = createGlobalLucideIcon(RawBadgeQuestionMark, 'BadgeQuestionMarkIcon');
export const CarIcon = createGlobalLucideIcon(RawCar, 'CarIcon');
export const ChartColumnStackedIcon = createGlobalLucideIcon(RawChartColumnStacked, 'ChartColumnStackedIcon');
export const CircleIcon = createGlobalLucideIcon(RawCircle, 'CircleIcon');
export const CircleAlertIcon = createGlobalLucideIcon(RawCircleAlert, 'CircleAlertIcon');
export const CircleQuestionMarkIcon = createGlobalLucideIcon(RawCircleQuestionMark, 'CircleQuestionMarkIcon');
export const CircleSmallIcon = createGlobalLucideIcon(RawCircleSmall, 'CircleSmallIcon');
export const CircleStopIcon = createGlobalLucideIcon(RawCircleStop, 'CircleStopIcon');
export const CheckIcon = createGlobalLucideIcon(RawCheck, 'CheckIcon');
export const CircleArrowDownIcon = createGlobalLucideIcon(RawCircleArrowDown, 'CircleArrowDownIcon');
export const CircleArrowUpIcon = createGlobalLucideIcon(RawCircleArrowUp, 'CircleArrowUpIcon');
export const CheckCheckIcon = createGlobalLucideIcon(RawCheckCheck, 'CheckCheckIcon');
export const CheckLineIcon = createGlobalLucideIcon(RawCheckLine, 'CheckLineIcon');
export const ChevronDownIcon = createGlobalLucideIcon(RawChevronDown, 'ChevronDownIcon');
export const ChevronLeftIcon = createGlobalLucideIcon(RawChevronLeft, 'ChevronLeftIcon');
export const ChevronRightIcon = createGlobalLucideIcon(RawChevronRight, 'ChevronRightIcon');
export const ChevronUpIcon = createGlobalLucideIcon(RawChevronUp, 'ChevronUpIcon');
export const ClipboardTypeIcon = createGlobalLucideIcon(RawClipboardType, 'ClipboardTypeIcon');
export const CoffeeIcon = createGlobalLucideIcon(RawCoffee, 'CoffeeIcon');
export const CoinsIcon = createGlobalLucideIcon(RawCoins, 'CoinsIcon');
export const ComponentIcon = createGlobalLucideIcon(RawComponentIcon, 'ComponentIcon');
export const CommandIcon = createGlobalLucideIcon(RawCommand, 'CommandIcon');
export const CopyIcon = createGlobalLucideIcon(RawCopy, 'CopyIcon');
export const CopyCheckIcon = createGlobalLucideIcon(RawCopyCheck, 'CopyCheckIcon');
export const CopyrightIcon = createGlobalLucideIcon(RawCopyright, 'CopyrightIcon');
export const CornerDownLeftIcon = createGlobalLucideIcon(RawCornerDownLeft, 'CornerDownLeftIcon');
export const CornerDownRightIcon = createGlobalLucideIcon(RawCornerDownRight, 'CornerDownRightIcon');
export const CornerLeftDownIcon = createGlobalLucideIcon(RawCornerLeftDown, 'CornerLeftDownIcon');
export const CornerLeftUpIcon = createGlobalLucideIcon(RawCornerLeftUp, 'CornerLeftUpIcon');
export const CornerRightDownIcon = createGlobalLucideIcon(RawCornerRightDown, 'CornerRightDownIcon');
export const CornerRightUpIcon = createGlobalLucideIcon(RawCornerRightUp, 'CornerRightUpIcon');
export const CornerUpLeftIcon = createGlobalLucideIcon(RawCornerUpLeft, 'CornerUpLeftIcon');
export const CornerUpRightIcon = createGlobalLucideIcon(RawCornerUpRight, 'CornerUpRightIcon');
export const CreativeCommonsIcon = createGlobalLucideIcon(RawCreativeCommons, 'CreativeCommonsIcon');
export const CropIcon = createGlobalLucideIcon(RawCrop, 'CropIcon');
export const CrossIcon = createGlobalLucideIcon(RawCross, 'CrossIcon');
export const CpuIcon = createGlobalLucideIcon(RawCpu, 'CpuIcon');
export const DatabaseIcon = createGlobalLucideIcon(RawDatabase, 'DatabaseIcon');
export const DatabaseZapIcon = createGlobalLucideIcon(RawDatabaseZap, 'DatabaseZapIcon');
export const DnaIcon = createGlobalLucideIcon(RawDna, 'DnaIcon');
export const DotIcon = createGlobalLucideIcon(RawDot, 'DotIcon');
export const DownloadIcon = createGlobalLucideIcon(RawDownload, 'DownloadIcon');
export const DropletIcon = createGlobalLucideIcon(RawDroplet, 'DropletIcon');
export const DropletOffIcon = createGlobalLucideIcon(RawDropletOff, 'DropletOffIcon');
export const DropletsIcon = createGlobalLucideIcon(RawDroplets, 'DropletsIcon');
export const EggIcon = createGlobalLucideIcon(RawEgg, 'EggIcon');
export const EggFriedIcon = createGlobalLucideIcon(RawEggFried, 'EggFriedIcon');
export const EggOffIcon = createGlobalLucideIcon(RawEggOff, 'EggOffIcon');
export const EllipsisIcon = createGlobalLucideIcon(RawEllipsis, 'EllipsisIcon');
export const EllipsisVerticalIcon = createGlobalLucideIcon(RawEllipsisVertical, 'EllipsisVerticalIcon');
export const EyeIcon = createGlobalLucideIcon(RawEye, 'EyeIcon');
export const EyeClosedIcon = createGlobalLucideIcon(RawEyeClosed, 'EyeClosedIcon');
export const EyeOffIcon = createGlobalLucideIcon(RawEyeOff, 'EyeOffIcon');
export const ExternalLinkIcon = createGlobalLucideIcon(RawExternalLink, 'ExternalLinkIcon');
export const FacebookIcon = createGlobalLucideIcon(RawFacebook, 'FacebookIcon');
export const ShieldIcon = createGlobalLucideIcon(RawShield, 'ShieldIcon');
export const FileIcon = createGlobalLucideIcon(RawFile, 'FileIcon');
export const FileDownIcon = createGlobalLucideIcon(RawFileDown, 'FileDownIcon');
export const FileInputIcon = createGlobalLucideIcon(RawFileInput, 'FileInputIcon');
export const FileLock2Icon = createGlobalLucideIcon(RawFileLock2, 'FileLock2Icon');
export const FileUpIcon = createGlobalLucideIcon(RawFileUp, 'FileUpIcon');
export const FingerprintIcon = createGlobalLucideIcon(RawFingerprint, 'FingerprintIcon');
export const FolderIcon = createGlobalLucideIcon(RawFolder, 'FolderIcon');
export const FolderOpenIcon = createGlobalLucideIcon(RawFolderOpen, 'FolderOpenIcon');
export const FrownIcon = createGlobalLucideIcon(RawFrown, 'FrownIcon');
export const GemIcon = createGlobalLucideIcon(RawGem, 'GemIcon');
export const GiftIcon = createGlobalLucideIcon(RawGift, 'GiftIcon');
export const GitMergeIcon = createGlobalLucideIcon(RawGitMerge, 'GitMergeIcon');
export const GitPullRequestArrowIcon = createGlobalLucideIcon(RawGitPullRequestArrow, 'GitPullRequestArrowIcon');
export const GlobeIcon = createGlobalLucideIcon(RawGlobe, 'GlobeIcon');
export const GlobeLockIcon = createGlobalLucideIcon(RawGlobeLock, 'GlobeLockIcon');
export const GripIcon = createGlobalLucideIcon(RawGrip, 'GripIcon');
export const GripVerticalIcon = createGlobalLucideIcon(RawGripVertical, 'GripVerticalIcon');
export const HandHeartIcon = createGlobalLucideIcon(RawHandHeart, 'HandHeartIcon');
export const HandshakeIcon = createGlobalLucideIcon(RawHandshake, 'HandshakeIcon');
export const HighlighterIcon = createGlobalLucideIcon(RawHighlighter, 'HighlighterIcon');
export const HistoryIcon = createGlobalLucideIcon(RawHistory, 'HistoryIcon');
export const HousePlusIcon = createGlobalLucideIcon(RawHousePlus, 'HousePlusIcon');
export const InfinityIcon = createGlobalLucideIcon(RawInfinity, 'InfinityIcon');
export const InfoIcon = createGlobalLucideIcon(RawInfo, 'InfoIcon');
export const ImageDownIcon = createGlobalLucideIcon(RawImageDown, 'ImageDownIcon');
export const ImageOffIcon = createGlobalLucideIcon(RawImageOff, 'ImageOffIcon');
export const ImageUpIcon = createGlobalLucideIcon(RawImageUp, 'ImageUpIcon');
export const KeyIcon = createGlobalLucideIcon(RawKey, 'KeyIcon');
export const KeyRoundIcon = createGlobalLucideIcon(RawKeyRound, 'KeyRoundIcon');
export const KeyboardIcon = createGlobalLucideIcon(RawKeyboard, 'KeyboardIcon');
export const LandPlotIcon = createGlobalLucideIcon(RawLandPlot, 'LandPlotIcon');
export const LanguagesIcon = createGlobalLucideIcon(RawLanguages, 'LanguagesIcon');
export const LayoutIcon = createGlobalLucideIcon(RawLayout, 'LayoutIcon');
export const LayoutTemplateIcon = createGlobalLucideIcon(RawLayoutTemplate, 'LayoutTemplateIcon');
export const LibraryIcon = createGlobalLucideIcon(RawLibraryIcon, 'LibraryIcon');
export const LightbulbIcon = createGlobalLucideIcon(RawLightbulb, 'LightbulbIcon');
export const LinkIcon = createGlobalLucideIcon(RawLink, 'LinkIcon');
export const ListTodoIcon = createGlobalLucideIcon(RawListTodo, 'ListTodoIcon');
export const Loader2Icon = createGlobalLucideIcon(RawLoader2, 'Loader2Icon');
export const LogInIcon = createGlobalLucideIcon(RawLogIn, 'LogInIcon');
export const LogOutIcon = createGlobalLucideIcon(RawLogOut, 'LogOutIcon');
export const MailIcon = createGlobalLucideIcon(RawMail, 'MailIcon');
export const MessageCircleMoreIcon = createGlobalLucideIcon(RawMessageCircleMore, 'MessageCircleMoreIcon');
export const MessageCircleCodeIcon = createGlobalLucideIcon(RawMessageCircleCode, 'MessageCircleCodeIcon');
export const MessageSquareDiffIcon = createGlobalLucideIcon(RawMessageSquareDiff, 'MessageSquareDiffIcon');
export const Music4Icon = createGlobalLucideIcon(RawMusic4, 'Music4Icon');
export const MoonIcon = createGlobalLucideIcon(RawMoon, 'MoonIcon');
export const MoreHorizontalIcon = createGlobalLucideIcon(RawMoreHorizontal, 'MoreHorizontalIcon');
export const MousePointerClickIcon = createGlobalLucideIcon(RawMousePointerClick, 'MousePointerClickIcon');
export const NotepadTextIcon = createGlobalLucideIcon(RawNotepadText, 'NotepadTextIcon');
export const PaletteIcon = createGlobalLucideIcon(RawPalette, 'PaletteIcon');
export const PanelLeftIcon = createGlobalLucideIcon(RawPanelLeft, 'PanelLeftIcon');
export const PanelsTopLeftIcon = createGlobalLucideIcon(RawPanelsTopLeft, 'PanelsTopLeftIcon');
export const PawPrintIcon = createGlobalLucideIcon(RawPawPrint, 'PawPrintIcon');
export const PencilIcon = createGlobalLucideIcon(RawPencil, 'PencilIcon');
export const PiIcon = createGlobalLucideIcon(RawPi, 'PiIcon');
export const PinIcon = createGlobalLucideIcon(RawPin, 'PinIcon');
export const PinOffIcon = createGlobalLucideIcon(RawPinOff, 'PinOffIcon');
export const PlusIcon = createGlobalLucideIcon(RawPlus, 'PlusIcon');
export const QrCodeIcon = createGlobalLucideIcon(RawQrCode, 'QrCodeIcon');
export const ReceiptTextIcon = createGlobalLucideIcon(RawReceiptText, 'ReceiptTextIcon');
export const Redo2Icon = createGlobalLucideIcon(RawRedo2, 'Redo2Icon');
export const RefreshCcwIcon = createGlobalLucideIcon(RawRefreshCcw, 'RefreshCcwIcon');
export const RegexIcon = createGlobalLucideIcon(RawRegex, 'RegexIcon');
export const ReplaceIcon = createGlobalLucideIcon(RawReplace, 'ReplaceIcon');
export const RocketIcon = createGlobalLucideIcon(RawRocket, 'RocketIcon');
export const RotateCcwIcon = createGlobalLucideIcon(RawRotateCcw, 'RotateCcwIcon');
export const RssIcon = createGlobalLucideIcon(RawRss, 'RssIcon');
export const ScaleIcon = createGlobalLucideIcon(RawScale, 'ScaleIcon');
export const ScanSearchIcon = createGlobalLucideIcon(RawScanSearch, 'ScanSearchIcon');
export const SearchIcon = createGlobalLucideIcon(RawSearch, 'SearchIcon');
export const SendIcon = createGlobalLucideIcon(RawSend, 'SendIcon');
export const SendHorizontalIcon = createGlobalLucideIcon(RawSendHorizontal, 'SendHorizontalIcon');
export const SettingsIcon = createGlobalLucideIcon(RawSettings, 'SettingsIcon');
export const Settings2Icon = createGlobalLucideIcon(RawSettings2, 'Settings2Icon');
export const ShareIcon = createGlobalLucideIcon(RawShare, 'ShareIcon');
export const SigmaIcon = createGlobalLucideIcon(RawSigma, 'SigmaIcon');
export const ShieldUserIcon = createGlobalLucideIcon(RawShieldUser, 'ShieldUserIcon');
export const ShoppingCartIcon = createGlobalLucideIcon(RawShoppingCart, 'ShoppingCartIcon');
export const SmileIcon = createGlobalLucideIcon(RawSmile, 'SmileIcon');
export const SmilePlusIcon = createGlobalLucideIcon(RawSmilePlus, 'SmilePlusIcon');
export const SproutIcon = createGlobalLucideIcon(RawSprout, 'SproutIcon');
export const SquareDashedBottomCodeIcon = createGlobalLucideIcon(RawSquareDashedBottomCode, 'SquareDashedBottomCodeIcon');
export const SquaresExcludeIcon = createGlobalLucideIcon(RawSquaresExclude, 'SquaresExcludeIcon');
export const SquareTerminalIcon = createGlobalLucideIcon(RawSquareTerminal, 'SquareTerminalIcon');
export const ServerIcon = createGlobalLucideIcon(RawServer, 'ServerIcon');
export const SplinePointerIcon = createGlobalLucideIcon(RawSplinePointer, 'SplinePointerIcon');
export const SparklesIcon = createGlobalLucideIcon(RawSparkles, 'SparklesIcon');
export const StarIcon = createGlobalLucideIcon(RawStar, 'StarIcon');
export const SunIcon = createGlobalLucideIcon(RawSun, 'SunIcon');
export const TabletsIcon = createGlobalLucideIcon(RawTablets, 'TabletsIcon');
export const TerminalIcon = createGlobalLucideIcon(RawTerminal, 'TerminalIcon');
export const Trash2Icon = createGlobalLucideIcon(RawTrash2, 'Trash2Icon');
export const TwitterIcon = createGlobalLucideIcon(RawTwitter, 'TwitterIcon');
export const Undo2Icon = createGlobalLucideIcon(RawUndo2, 'Undo2Icon');
export const UsbIcon = createGlobalLucideIcon(RawUsb, 'UsbIcon');
export const UserRoundCheckIcon = createGlobalLucideIcon(RawUserRoundCheck, 'UserRoundCheckIcon');
export const Wand2Icon = createGlobalLucideIcon(RawWand2, 'Wand2Icon');
export const WorkflowIcon = createGlobalLucideIcon(RawWorkflow, 'WorkflowIcon');
export const XIcon = createGlobalLucideIcon(RawX, 'XIcon');
export const ZapIcon = createGlobalLucideIcon(RawZap, 'ZapIcon');

export const GitHubIcon = createGlobalIcon(RawGitHubIcon, 'GitHubIcon');
export const D8Icon = createGlobalIcon(RawD8Icon, 'D8Icon');
export const ClerkIcon = createGlobalIcon(RawClerkIcon, 'ClerkIcon');
export const ItermIcon = createGlobalIcon(RawItermIcon, 'ItermIcon');
export const MarkdownIcon = createGlobalIcon(RawMarkdownIcon, 'MarkdownIcon');
export const MDXIcon = createGlobalIcon(RawMDXIcon, 'MDXIcon');
export const HtmlIcon = createGlobalIcon(RawHtmlIcon, 'HtmlIcon');
export const JsonIcon = createGlobalIcon(RawJsonIcon, 'JsonIcon');
export const XMLIcon = createGlobalIcon(RawXMLIcon, 'XMLIcon');
export const YamlIcon = createGlobalIcon(RawYamlIcon, 'YamlIcon');
export const CSVIcon = createGlobalIcon(RawCSVIcon, 'CSVIcon');
export const TxtIcon = createGlobalIcon(RawTxtIcon, 'TxtIcon');
export const JavaIcon = createGlobalIcon(RawJavaIcon, 'JavaIcon');
export const SQLIcon = createGlobalIcon(RawSQLIcon, 'SQLIcon');
export const LogIcon = createGlobalIcon(RawLogIcon, 'LogIcon');
export const MACIcon = createGlobalIcon(RawMACIcon, 'MACIcon');
export const BTCIcon = createGlobalIcon(RawBTCIcon, 'BTCIcon');
export const CSSIcon = createGlobalIcon(RawCSSIcon, 'CSSIcon');
export const MmdIcon = createGlobalIcon(RawMmdIcon, 'MmdIcon');
export const LastUpdatedIcon = createGlobalIcon(RawLastUpdatedIcon, 'LastUpdatedIcon');
export const SnippetsIcon = createGlobalIcon(RawSnippetsIcon, 'SnippetsIcon');
export const TestIcon = createGlobalIcon(RawTestIcon, 'TestIcon');
export const DiffIcon = createGlobalIcon(RawDiffIcon, 'DiffIcon');
export const DPAIcon = createGlobalIcon(RawDPAIcon, 'DPAIcon');
export const SubPIcon = createGlobalIcon(RawSubPIcon, 'SubPIcon');
export const T3PIcon = createGlobalIcon(RawT3PIcon, 'T3PIcon');
export const HttpIcon = createGlobalIcon(RawHttpIcon, 'HttpIcon');
export const SchemeIcon = createGlobalIcon(RawSchemeIcon, 'SchemeIcon');
export const FAQIcon = createGlobalIcon(RawFAQIcon, 'FAQIcon');
export const FAQBIcon = createGlobalIcon(RawFAQBIcon, 'FAQBIcon');
export const FAQSIcon = createGlobalIcon(RawFAQSIcon, 'FAQSIcon');
