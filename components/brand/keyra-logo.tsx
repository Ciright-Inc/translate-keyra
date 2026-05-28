import Image from "next/image";

type KeyraLogoProps = {
  variant?: "light" | "dark";
  className?: string;
  priority?: boolean;
};

export function KeyraLogo({
  variant = "light",
  className = "",
  priority = false,
}: KeyraLogoProps) {
  const src = variant === "dark" ? "/keyra-logo-white.png" : "/keyra-logo-black.png";
  const resolvedClassName = `h-8 w-auto object-contain object-left ${className}`.trim();

  return (
    <Image
      src={src}
      alt="KEYRA"
      width={208}
      height={68}
      priority={priority}
      className={resolvedClassName}
    />
  );
}
