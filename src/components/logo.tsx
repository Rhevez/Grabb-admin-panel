import Image from "next/image";

export function Logo() {
  return (
    <div className="relative h-14 w-[180px]">
      <Image
        src="/images/file_0000000075c881f88071932eaa9e6bb8.png"
        fill
        sizes="180px"
        className="object-contain"
        alt="Grabb Admin Panel logo"
        priority
      />
    </div>
  );
}
