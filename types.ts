

export enum ElementType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  QR = 'QR',
  SHAPE = 'SHAPE'
}

export type VerificationStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type UserRole = 'SUPER_ADMIN' | 'ADMIN_INSTANSI' | 'OPERATOR' | 'VIEWER';
export type CardOrientation = 'PORTRAIT' | 'LANDSCAPE';
export type EmploymentType = 'PNS' | 'PPNPN' | 'HONORER' | 'MAGANG' | 'UMUM';

export interface AppSettings {
  appName: string;
  version: string;
  appLogoUrl: string; // Used in Login screen (Large)
  appIconUrl: string; // Used in Sidebar (Small) or Icon Class Name
  appIconType: 'IMAGE' | 'ICON'; // Determines if appIconUrl is an image URL or FontAwesome class
}

export interface ScanLog {
  id: string;
  timestamp: string;
  location: string;
  statusAtTime: VerificationStatus;
}

export interface IssuanceLog {
  id: string;
  memberId: string;
  memberName: string;
  employeeId: string;
  issuedDate: string;
  issuedBy: string;
  type: 'NEW' | 'REPLACEMENT' | 'RENEWAL' | 'VERIFICATION';
  status: 'ISSUED' | 'PRINTED' | 'REVOKED' | 'SCANNED';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  role: UserRole;
  action: 'LOGIN' | 'LOGOUT' | 'PRINT' | 'NFC_WRITE' | 'UPDATE_CONFIG' | 'CREATE_USER' | 'DELETE_USER' | 'UPDATE_MEMBER';
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  ipAddress?: string; // Simulated
}

export interface SystemUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin?: string;
  password?: string; // In real app this is hashed. For demo: plain text '123456'
}

export interface InstitutionConfig {
  name: string;
  secondaryName?: string; // Primary + Secondary Line branding
  logoUrl: string; // Used for watermark and header
  primaryColor: string; // Brand color
  digitalSignatureUrl: string; // Official signature image
  address: string;
  disclaimer: string;
  regulations: string; // New field for card rules
  
  // General Design Settings
  validityYears: number;
  
  // Watermark Settings
  enableWatermark: boolean;
  watermarkOpacity: number; // 0.03 - 0.08
  watermarkScale: number; // 1.2 - 1.5
  
  // Pattern Settings
  enablePattern: boolean;
  patternText: string;
  patternLayout: 'GRID' | 'BRICK' | 'V_GRID' | 'V_BRICK'; // Expanded Layouts
  patternColor: string; // Custom Color
  patternOpacity: number; // 0.04 - 0.1
  patternRotation: number; // 15 - 30 deg
  patternSpacing: number; // Controls Line Height / Gap
  patternFontSize: number; // For microtext control

  // Department Logic
  departmentTemplates?: Record<string, string>; // Mapping: "Department Name" -> "Template ID"
}

export interface CardElement {
  id: string;
  type: ElementType;
  content: string; // Text content or Image URL
  x: number;
  y: number;
  width?: number;
  height?: number;
  dataField?: keyof Member; // For bulk generation mapping
  style: {
    fontSize?: number;
    color?: string;
    fontWeight?: string;
    backgroundColor?: string;
    borderRadius?: number;
    zIndex?: number;
    fontFamily?: string;
    opacity?: number;
    textAlign?: 'left' | 'center' | 'right';
    fontStyle?: 'normal' | 'italic';
    borderWidth?: number;
    borderColor?: string;
    // QR Specific Styles
    qrDotStyle?: 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded';
    qrCornerStyle?: 'square' | 'dot' | 'extra-rounded'; // Outer Frame
    qrCornerDotStyle?: 'square' | 'dot'; // Inner Eye
    qrCornerColor?: string;
    qrColorType?: 'single' | 'gradient';
    qrColor1?: string;
    qrColor2?: string;
    qrBgColor?: string; // Background Color
    qrLogoUrl?: string;
    qrLogoSize?: number;
    qrAnimation?: 'none' | 'pulse' | 'bounce' | 'spin' | 'hover-pulse';
    // Text Advanced Styles
    textFillMode?: 'solid' | 'gradient' | 'pattern';
    textGradient?: string; // e.g. "linear-gradient(to right, #f00, #00f)"
    textPatternUrl?: string;
    textStrokeWidth?: number;
    textStrokeColor?: string;
    textShadowColor?: string;
    textShadowBlur?: number;
    letterSpacing?: string;
    textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
  };
  data?: any; // Extra data (e.g. for QR payload)
}

export interface BackgroundImageConfig {
  url: string;
  opacity: number;
  scale: number;
}

export interface CardTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'OFFICIAL' | 'CORPORATE' | 'EVENT' | 'CUSTOM';
  layout: {
    front: {
      background: string;
      backgroundImage?: BackgroundImageConfig;
      elements: CardElement[];
      json?: any;
    };
    back: {
      background: string;
      backgroundImage?: BackgroundImageConfig;
      elements: CardElement[];
      json?: any;
    };
  };
  config?: Partial<InstitutionConfig>;
}

export interface Member {
  id: string;
  fullName: string;
  role: string;
  department: string;
  employeeId: string; // NIP / NIK / ID
  skNumber?: string; // Specific for PPNPN
  employmentType: EmploymentType;
  photoUrl?: string;
  // Verification Fields
  status: VerificationStatus;
  approvalStatus: ApprovalStatus;
  joinedDate: string;
  expiryDate: string;
  scanHistory: ScanLog[];
}

export interface AIProfileResponse {
  fullName: string;
  role: string;
  tagline: string;
  department: string;
  colorTheme: string[];
}

// Web NFC API Types (Experimental)
export interface NDEFReader extends EventTarget {
  scan: () => Promise<void>;
  write: (message: any) => Promise<void>;
  onreading: (event: any) => void;
  onreadingerror: (event: any) => void;
}

declare global {
  interface Window {
    NDEFReader?: {
      new (): NDEFReader;
    };
  }
}