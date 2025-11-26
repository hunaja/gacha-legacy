import Image from "next/image";

export default function AscensionStars({ f }: { f: { ascension: number } }) {
  if (f.ascension === 0) return <></>;

  return (
    <>
      <Image
        src="/ascension/AscensionCropped.png"
        width={40}
        height={40}
        alt="Ascension 1"
      />
      {f.ascension > 1 && (
        <Image
          width={40}
          src="/ascension/Ascension0Cropped.png"
          height={40}
          className="-ml-6"
          alt="Ascension 2"
        />
      )}
      {f.ascension > 2 && (
        <Image
          width={40}
          src="/ascension/Ascension2Cropped.png"
          height={40}
          className="-ml-6"
          alt="Ascension 3"
        />
      )}
      {f.ascension > 3 && (
        <Image
          width={40}
          src="/ascension/Ascension3Cropped.png"
          height={40}
          className="-ml-6"
          alt="Ascension 4"
        />
      )}
      {f.ascension > 4 && (
        <Image
          width={40}
          src="/ascension/Ascension4Cropped.png"
          height={40}
          className="-ml-6"
          alt="Ascension 5"
        />
      )}
    </>
  );
}
