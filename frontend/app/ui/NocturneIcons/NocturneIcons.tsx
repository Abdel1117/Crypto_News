import type { SVGProps } from "react";

// Phosphor-style icons used by the landing page (regular weight, 256 viewBox).
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 16, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      stroke="currentColor"
      strokeWidth={16}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="flex-none"
    >
      <circle cx="16" cy="16" r="16" style={{ fill: "var(--n-accent)" }} />
      <path
        style={{ fill: "var(--n-bg)" }}
        d="M21.002 9.855A7.95 7.95 0 0 1 24 15.278l-2.847-.708a5.360 5.360 0 0 0-3.860-3.667c-2.866-.713-5.760.991-6.465 3.806s1.050 5.675 3.917 6.388a5.370 5.370 0 0 0 5.134-1.430l2.847.707a7.970 7.970 0 0 1-5.200 3.385L16.716 27l-2.596-.645l.644-2.575a8 8 0 0 1-1.298-.323l-.643 2.575l-2.596-.646l.810-3.241c-2.378-1.875-3.575-4.996-2.804-8.081s3.297-5.281 6.280-5.823L15.323 5l2.596.645l-.644 2.575a8 8 0 0 1 1.298.323l.643-2.575l2.596.646z"
      />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        stroke="none"
        d="M240,128a15.74,15.74,0,0,1-7.6,13.51L88.32,229.65a16,16,0,0,1-16.2.3A15.86,15.86,0,0,1,64,216.13V39.87a15.86,15.86,0,0,1,8.12-13.82,16,16,0,0,1,16.2.3L232.4,114.49A15.74,15.74,0,0,1,240,128Z"
      />
    </Icon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <line x1="40" y1="128" x2="216" y2="128" />
      <polyline points="144 56 216 128 144 200" />
    </Icon>
  );
}

export function EnvelopeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="224 56 128 144 32 56" />
      <path d="M32,56H224a0,0,0,0,1,0,0V192a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V56A0,0,0,0,1,32,56Z" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="112" cy="112" r="80" />
      <line x1="168.57" y1="168.57" x2="224" y2="224" />
    </Icon>
  );
}

export function CaretDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="208 96 128 176 48 96" />
    </Icon>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        stroke="none"
        d="M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z"
      />
    </Icon>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <line x1="40" y1="128" x2="216" y2="128" />
      <line x1="40" y1="64" x2="216" y2="64" />
      <line x1="40" y1="192" x2="216" y2="192" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <line x1="200" y1="56" x2="56" y2="200" />
      <line x1="200" y1="200" x2="56" y2="56" />
    </Icon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <line x1="128" y1="40" x2="128" y2="16" />
      <circle cx="128" cy="128" r="56" />
      <line x1="64" y1="64" x2="48" y2="48" />
      <line x1="64" y1="192" x2="48" y2="208" />
      <line x1="192" y1="64" x2="208" y2="48" />
      <line x1="192" y1="192" x2="208" y2="208" />
      <line x1="40" y1="128" x2="16" y2="128" />
      <line x1="128" y1="216" x2="128" y2="240" />
      <line x1="216" y1="128" x2="240" y2="128" />
    </Icon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M108.11,28.11A96.09,96.09,0,0,0,227.89,147.89,96,96,0,1,1,108.11,28.11Z" />
    </Icon>
  );
}

export function GithubLogoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M119.83,56A52,52,0,0,0,76,32a51.92,51.92,0,0,0-3.49,44.7A49.28,49.28,0,0,0,64,104v8a48,48,0,0,0,48,48h48a48,48,0,0,0,48-48v-8a49.28,49.28,0,0,0-8.51-27.3A51.92,51.92,0,0,0,196,32a52,52,0,0,0-43.83,24Z" />
      <path d="M104,232V192a32,32,0,0,1,32-32h0a32,32,0,0,1,32,32v40" />
      <path d="M104,208H72a32,32,0,0,1-32-32A32,32,0,0,0,8,144" />
    </Icon>
  );
}

export function LinkedinLogoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="32" y="32" width="192" height="192" rx="8" />
      <line x1="120" y1="112" x2="120" y2="176" />
      <line x1="88" y1="112" x2="88" y2="176" />
      <path d="M120,140a28,28,0,0,1,56,0v36" />
      <circle cx="88" cy="80" r="12" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <line x1="216" y1="128" x2="40" y2="128" />
      <polyline points="112 56 40 128 112 200" />
    </Icon>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M128,56C48,56,16,128,16,128s32,72,112,72,112-72,112-72S208,56,128,56Z" />
      <circle cx="128" cy="128" r="40" />
    </Icon>
  );
}

export function EyeSlashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <line x1="48" y1="40" x2="208" y2="216" />
      <path d="M154.91,157.6A40,40,0,0,1,101.09,98.4" />
      <path d="M74,68.6C33.23,89.24,16,128,16,128s32,72,112,72a118.05,118.05,0,0,0,54-12.6" />
      <path d="M208.6,169.1C230.39,149.58,240,128,240,128S208,56,128,56a123.07,123.07,0,0,0-20,1.62" />
      <path d="M135.53,88.71a40,40,0,0,1,32.3,35.53" />
    </Icon>
  );
}

export function LightningIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polygon points="160 16 144 96 208 120 96 240 112 160 48 136 160 16" />
    </Icon>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M216,112V56a8,8,0,0,0-8-8H48a8,8,0,0,0-8,8v56c0,96,88,120,88,120S216,208,216,112Z" />
      <polyline points="88 136 112 160 168 104" />
    </Icon>
  );
}

export function HouseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M104,216V152h48v64h64V120a8,8,0,0,0-2.34-5.66l-80-80a8,8,0,0,0-11.32,0l-80,80A8,8,0,0,0,40,120v96Z" />
    </Icon>
  );
}

export function SquaresFourIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="48" y="48" width="64" height="64" rx="8" />
      <rect x="144" y="48" width="64" height="64" rx="8" />
      <rect x="48" y="144" width="64" height="64" rx="8" />
      <rect x="144" y="144" width="64" height="64" rx="8" />
    </Icon>
  );
}

export function ChartLineUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="224 208 32 208 32 48" />
      <polyline points="224 96 160 152 96 104 32 160" />
    </Icon>
  );
}

export function GridFourIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="40" y="40" width="176" height="176" rx="8" />
      <line x1="128" y1="40" x2="128" y2="216" />
      <line x1="216" y1="128" x2="40" y2="128" />
    </Icon>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="128" cy="128" r="40" />
      <path d="M41.43,178.09A99.14,99.14,0,0,1,31.36,153.8l16.78-21a81.59,81.59,0,0,1,0-9.64l-16.77-21a99.43,99.43,0,0,1,10.05-24.3l26.71-3a81,81,0,0,1,6.81-6.81l3-26.7A99.14,99.14,0,0,1,102.2,31.36l21,16.78a81.59,81.59,0,0,1,9.64,0l21-16.77a99.43,99.43,0,0,1,24.3,10.05l3,26.71a81,81,0,0,1,6.81,6.81l26.7,3a99.14,99.14,0,0,1,10.07,24.29l-16.78,21a81.59,81.59,0,0,1,0,9.64l16.77,21a99.43,99.43,0,0,1-10,24.3l-26.71,3a81,81,0,0,1-6.81,6.81l-3,26.7a99.14,99.14,0,0,1-24.3,10.07l-21-16.78a81.59,81.59,0,0,1-9.64,0l-21,16.77a99.43,99.43,0,0,1-24.3-10l-3-26.71a81,81,0,0,1-6.81-6.81Z" />
    </Icon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="128" cy="96" r="64" />
      <path d="M32,216c19.37-33.47,54.55-56,96-56s76.63,22.53,96,56" />
    </Icon>
  );
}

export function CaretUpDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="80 176 128 224 176 176" />
      <polyline points="80 80 128 32 176 80" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <line x1="40" y1="128" x2="216" y2="128" />
      <line x1="128" y1="40" x2="128" y2="216" />
    </Icon>
  );
}

export function ChartLineIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="224 208 32 208 32 48" />
      <polyline points="224 96 160 152 96 104 32 160" />
    </Icon>
  );
}

export function ChartBarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="48 208 48 136 96 136" />
      <line x1="224" y1="208" x2="32" y2="208" />
      <polyline points="96 208 96 88 152 88" />
      <polyline points="152 208 152 40 208 40 208 208" />
    </Icon>
  );
}

export function SignOutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="112 40 48 40 48 216 112 216" />
      <line x1="112" y1="128" x2="216" y2="128" />
      <polyline points="174 88 216 128 174 168" />
    </Icon>
  );
}

export function StarOutlineIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M128,189.09l54.72,33.65a8.4,8.4,0,0,0,12.52-9.17l-14.88-62.79,48.7-42A8.46,8.46,0,0,0,224.27,94L160.36,88.8,135.74,29.2a8.36,8.36,0,0,0-15.48,0L95.64,88.8,31.73,94a8.46,8.46,0,0,0-4.79,14.83l48.7,42L60.76,213.57a8.4,8.4,0,0,0,12.52,9.17Z" />
    </Icon>
  );
}

export function ArrowCounterClockwiseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="24 56 24 104 72 104" />
      <path d="M67.59,192A88,88,0,1,0,65.77,65.77L24,104" />
    </Icon>
  );
}

export function ArrowsClockwiseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="184 104 232 104 232 56" />
      <path d="M188.4,192a88,88,0,1,1,1.83-126.23L232,104" />
    </Icon>
  );
}

export function ArrowsLeftRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="176 144 208 176 176 208" />
      <line x1="48" y1="176" x2="208" y2="176" />
      <polyline points="80 112 48 80 80 48" />
      <line x1="208" y1="80" x2="48" y2="80" />
    </Icon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="128" cy="128" r="96" />
      <polyline points="120 120 128 120 128 176 136 176" />
      <circle cx="126" cy="84" r="12" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function DownloadSimpleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <line x1="128" y1="144" x2="128" y2="32" />
      <polyline points="216 144 216 208 40 208 40 144" />
      <polyline points="168 104 128 144 88 104" />
    </Icon>
  );
}

export function LockSimpleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="40" y="88" width="176" height="128" rx="8" />
      <path d="M92,88V52a36,36,0,0,1,72,0V88" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="40 144 96 200 224 72" />
    </Icon>
  );
}

export function CookieIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M224,128a96,96,0,1,1-96-96,40,40,0,0,0,40,40A40,40,0,0,0,224,128Z" />
      <circle cx="156" cy="172" r="10" fill="currentColor" stroke="none" />
      <circle cx="92" cy="164" r="10" fill="currentColor" stroke="none" />
      <circle cx="84" cy="108" r="10" fill="currentColor" stroke="none" />
      <circle cx="132" cy="124" r="10" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function ChatDotsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M79.93,211.11a96,96,0,1,0-35-35L32.42,213.46a8,8,0,0,0,10.12,10.12Z" />
      <circle cx="84" cy="128" r="12" fill="currentColor" stroke="none" />
      <circle cx="128" cy="128" r="12" fill="currentColor" stroke="none" />
      <circle cx="172" cy="128" r="12" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function PaperPlaneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M48,40,224,128,48,216l32-88Z" />
      <line x1="80" y1="128" x2="144" y2="128" />
    </Icon>
  );
}
