import { Patrick_Hand_SC } from "next/font/google";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

const font = Patrick_Hand_SC({
  weight: "400",
});

export default function StageModalBody({ stageId }: { stageId: string }) {
  const router = useRouter();
  const { data: stage } = api.stage.findById.useQuery({ stageId });
  const startFight = api.fight.startFight.useMutation({
    onSuccess(fight) {
      void router.push(`/fights/${fight.id}`);
    },
  });

  if (!stage) return <p className="mb-5 text-center">Loading Fight...</p>;

  console.log("Sprites:", stage.enemies);

  return (
    <>
      <div className="grid grid-cols-3 place-items-center gap-5 p-2">
        {stage.enemies.map((se) => (
          <div key={se.id} className="text-center text-lg">
            <Image
              src={se.spriteUrl}
              alt={`Sprite of ${se.enemy.name}`}
              width={100}
              height={100}
              className="mx-auto"
            />
            <b className="font-semibold">{se.enemy.name}</b>
            <p>Lv. {se.level}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => startFight.mutate({ stageId: stage.id })}
        className={`${font.className} mb-2 block bg-[url(/buttons/1Button.png)] bg-contain bg-center bg-no-repeat px-5 py-5 text-2xl font-bold text-gray-200 transition-transform hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        Start Fight
      </button>
    </>
  );
}
