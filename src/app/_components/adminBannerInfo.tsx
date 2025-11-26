"use client";

import {
  Button,
  Chip,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import Image from "next/image";
import { useState } from "react";
import { api } from "~/trpc/react";

const rarityOrder: Record<string, number> = {
  COMMON: 1,
  RARE: 2,
  SR: 3,
  SSR: 4,
  SSSR: 5,
};

export default function AdminBannerInfo({ bannerId }: { bannerId: string }) {
  const { data: banner } = api.banner.get.useQuery({
    bannerId,
    ignoreActiveFlag: true,
  });
  const [allies] = api.ally.list.useSuspenseQuery();
  const [newAllyId, setNewAllyId] = useState<null | string>(null);
  const utils = api.useUtils();
  const addAlly = api.banner.addAlly.useMutation({
    onSuccess() {
      setNewAllyId(null);
      void utils.banner.get.invalidate();
    },
  });
  const deleteAlly = api.banner.removeAlly.useMutation({
    onSuccess() {
      void utils.banner.get.invalidate();
    },
  });

  if (!banner) return <p>Loading...</p>;

  const bannerAllyIds = banner.allies.map((a) => a.allyId);
  const addableAllies = allies.filter((a) => !bannerAllyIds.includes(a.id));

  return (
    <>
      <h2 className="mb-5 text-center text-lg">Rarity Rates</h2>
      <Table aria-label="Rates for different drops">
        <TableHeader>
          <TableColumn>Rarity</TableColumn>
          <TableColumn>Rate %</TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow key="1">
            <TableCell>Common</TableCell>
            <TableCell>{banner.commonRate}</TableCell>
          </TableRow>
          <TableRow key="2">
            <TableCell>Rare</TableCell>
            <TableCell>{banner.rareRate}</TableCell>
          </TableRow>
          <TableRow key="3">
            <TableCell>SR</TableCell>
            <TableCell>{banner.srRate}</TableCell>
          </TableRow>
          <TableRow key="4">
            <TableCell>SSR</TableCell>
            <TableCell>{banner.ssrRate}</TableCell>
          </TableRow>
          <TableRow key="5">
            <TableCell>SSSR</TableCell>
            <TableCell>{banner.sssrRate}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <h2 className="mt-5 text-center text-lg">Allies</h2>
      {banner.allies.length > 0 && (
        <ul className="list-disc">
          {banner.allies
            .sort(
              (a, b) =>
                rarityOrder[b.ally.rarity]! - rarityOrder[a.ally.rarity]!,
            )
            .map((a) => (
              <li key={a.id} className="my-2 flex items-center">
                <Image
                  src={a.ally.spriteUrl}
                  width={100}
                  height={100}
                  alt={`Sprite of ${a.ally.name}`}
                  className="ml-2"
                />
                <span className="ml-2">
                  <b>{a.ally.name}</b> {a.ally.rarity}
                </span>
                {banner.posterAllyId === a.allyId ? (
                  <Chip className="ml-5">Poster Ally</Chip>
                ) : (
                  <Button
                    color="danger"
                    className="ml-5"
                    onPress={() =>
                      deleteAlly.mutate({ bannerId, allyId: a.allyId })
                    }
                  >
                    Delete
                  </Button>
                )}
              </li>
            ))}
          <div className="my-5">
            <Select
              label="Add Ally"
              className="w-96" // @ts-expect-error HeroUI tweaking
              selectedKeys={[newAllyId]}
              onChange={(e) => setNewAllyId(e.target.value)}
            >
              {addableAllies?.map((ally) => (
                <SelectItem key={ally.id}>{ally.name}</SelectItem>
              ))}
            </Select>
            <Button
              isDisabled={!newAllyId}
              size="lg"
              className="ml-5"
              onPress={() => addAlly.mutate({ bannerId, allyId: newAllyId! })}
            >
              Add
            </Button>
          </div>
        </ul>
      )}
    </>
  );
}
