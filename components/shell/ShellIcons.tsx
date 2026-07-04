import type { ReactNode } from "react";

type IconProps = {
  size?: number;
  className?: string;
};

function Icon({
  size = 16,
  className,
  viewBox = "0 0 24 24",
  children,
}: IconProps & {
  viewBox?: string;
  children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export function HomeIcon({ size = 24, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M12.5 3.247a1 1 0 0 0-1 0L4 8.577V19h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V8.577l-7.5-5.33z" />
    </Icon>
  );
}

export function SearchIcon({ size = 16, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M10.5 3a7.5 7.5 0 1 0 4.196 13.777l3.647 3.647a.75.75 0 0 0 1.06-1.06l-3.647-3.647A7.5 7.5 0 0 0 10.5 3Zm0 12a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z" />
    </Icon>
  );
}

/** Spotify-style library / browse icon (two bars + tilted bar). */
export function LibraryBrowseIcon({ size = 16, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M3.862 5.574a2.75 2.75 0 0 1 2.75-2.75h2.336a2.75 2.75 0 0 1 2.75 2.75v12.336a2.75 2.75 0 0 1-2.75 2.75H6.612a2.75 2.75 0 0 1-2.75-2.75V5.574Zm8.336 0a2.75 2.75 0 0 1 2.75-2.75h1.086a2.75 2.75 0 0 1 2.613 3.739l-2.336 6.574a2.75 2.75 0 0 1-2.613 1.761h-1.086a2.75 2.75 0 0 1-2.75-2.75V5.574Z" />
    </Icon>
  );
}

export function BellIcon({ size = 16, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6v-5a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2z" />
    </Icon>
  );
}

export function PlusCircleIcon({ size = 16, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17ZM12 7a.75.75 0 0 1 .75.75v3.5h3.5a.75.75 0 0 1 0 1.5h-3.5v3.5a.75.75 0 0 1-1.5 0v-3.5h-3.5a.75.75 0 0 1 0-1.5h3.5v-3.5A.75.75 0 0 1 12 7Z" />
    </Icon>
  );
}

export function PanelCollapseLeftIcon({ size = 16, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M4 5.75A.75.75 0 0 1 4.75 5h14.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 5.75ZM4 12a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 4 12Zm0 6.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H4.75a.75.75 0 0 1-.75-.75ZM17.03 9.47a.75.75 0 0 1 0 1.06l-1.72 1.72 1.72 1.72a.75.75 0 1 1-1.06 1.06l-2.25-2.25a.75.75 0 0 1 0-1.06l2.25-2.25a.75.75 0 0 1 1.06 0Z" />
    </Icon>
  );
}

export function PanelExpandLeftIcon({ size = 16, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M4 5.75A.75.75 0 0 1 4.75 5h14.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 5.75ZM4 12a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 4 12Zm0 6.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H4.75a.75.75 0 0 1-.75-.75ZM14.47 9.47a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 0 1 0-1.06Z" />
    </Icon>
  );
}

export function PanelCollapseRightIcon({ size = 16, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M4 5.75A.75.75 0 0 1 4.75 5h14.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 5.75ZM4 12a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 12Zm0 6.25a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1-.75-.75ZM6.97 9.47a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06L8.69 12 6.97 10.28a.75.75 0 0 1 0-1.06Z" />
    </Icon>
  );
}

export function PanelExpandRightIcon({ size = 16, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M4 5.75A.75.75 0 0 1 4.75 5h14.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 5.75ZM4 12a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 12Zm0 6.25a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1-.75-.75ZM17.03 9.47a.75.75 0 0 1 0 1.06l-1.72 1.72 1.72 1.72a.75.75 0 1 1-1.06 1.06l-2.25-2.25a.75.75 0 0 1 0-1.06l2.25-2.25a.75.75 0 0 1 1.06 0Z" />
    </Icon>
  );
}
