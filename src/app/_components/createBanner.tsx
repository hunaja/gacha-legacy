"use client";

import { useEffect, useState } from "react";
import { Button, Input, Select, SelectItem, Switch } from "@heroui/react";
import { api } from "~/trpc/react";

type Payment = { currency: "DIAMONDS" | "GOLD"; amount: number };

function BannerPayments({
  payments,
  setPayments,
}: {
  payments: Payment[];
  setPayments: (p: Payment[]) => void;
}) {
  const addPayment = () => {
    setPayments([...payments, { currency: "DIAMONDS", amount: 0 }]);
  };

  const updatePayment = (
    i: number,
    field: "currency" | "amount",
    value: any,
  ) => {
    const copy = [...payments];
    (copy[i] as any)[field] = value;
    setPayments(copy);
  };

  const removePayment = (i: number) => {
    setPayments(payments.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <h4 className="mt-4 mb-2 font-semibold">Accepted Payments</h4>
      {payments.map((p, i) => (
        <div key={i} className="mb-2 flex items-center gap-2">
          <Select
            selectedKeys={[p.currency]}
            onSelectionChange={(keys) =>
              updatePayment(
                i,
                "currency",
                keys.currentKey as "DIAMONDS" | "GOLD",
              )
            }
            className="w-32"
          >
            <SelectItem key="DIAMONDS">Diamonds</SelectItem>
            <SelectItem key="GOLD">Gold</SelectItem>
          </Select>
          <Input
            type="number"
            label="Amount"
            value={String(p.amount)}
            onChange={(e) => updatePayment(i, "amount", Number(e.target.value))}
            className="w-24"
          />
          <Button size="sm" color="danger" onPress={() => removePayment(i)}>
            Remove
          </Button>
        </div>
      ))}
      <Button size="sm" onPress={addPayment}>
        + Add Payment
      </Button>
    </div>
  );
}

export default function CreateBanner() {
  const [name, setName] = useState("");
  const [active, setActive] = useState(false);
  const [posterAllyId, setPosterAllyId] = useState("");
  const [bannerArtFile, setBannerArtFile] = useState<File | null>(null);

  const [commonRate, setCommonRate] = useState(60);
  const [rareRate, setRareRate] = useState(25);
  const [srRate, setSrRate] = useState(12);
  const [ssrRate, setSsrRate] = useState(2.8);
  const [sssrRate, setSssrRate] = useState(0.2);

  const [selectedAllies, setSelectedAllies] = useState<string[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const createBanner = api.banner.create.useMutation();
  const { data: allies, isLoading } = api.ally.list.useQuery();

  // Poster ally always in selectedAllies
  useEffect(() => {
    if (posterAllyId && !selectedAllies.includes(posterAllyId)) {
      setSelectedAllies((prev) => [...prev, posterAllyId]);
    }
  }, [posterAllyId, selectedAllies]);

  if (!allies) return <p>Fetching allies...</p>;

  const handleSubmit = async () => {
    if (!name || !posterAllyId || !bannerArtFile) {
      alert("Fill all required fields + upload art");
      return;
    }

    const res = await createBanner.mutateAsync({
      name,
      active,
      posterAllyId,
      commonRate,
      rareRate,
      srRate,
      ssrRate,
      sssrRate,
      allyIds: selectedAllies,
      acceptedPayments: payments,
    });

    await fetch(res.uploadUrl, {
      method: "PUT",
      body: bannerArtFile,
      headers: {
        "Content-Type": bannerArtFile.type,
      },
    });

    alert("✅ Banner created!");
    setName("");
    setActive(false);
    setPosterAllyId("");
    setBannerArtFile(null);
    setCommonRate(60);
    setRareRate(25);
    setSrRate(12);
    setSsrRate(2.8);
    setSssrRate(0.2);
    setSelectedAllies([]);
    setPayments([]);
  };

  return (
    <div className="w-96">
      <h3 className="my-2 text-xl font-semibold">Create Banner</h3>

      <Input
        label="Name"
        placeholder="Banner Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="my-2">
        <Switch isSelected={active} onValueChange={setActive}>
          Active
        </Switch>
      </div>

      <Select
        label="Poster Ally"
        selectedKeys={posterAllyId ? [posterAllyId] : []}
        onSelectionChange={(keys) =>
          keys.currentKey && setPosterAllyId(keys.currentKey)
        }
        className="my-2"
        isDisabled={isLoading}
      >
        {allies.map((a) => (
          <SelectItem key={a.id}>{a.name}</SelectItem>
        ))}
      </Select>

      <div className="my-2">
        <label className="block font-medium">Banner Art</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setBannerArtFile(e.target.files?.[0] ?? null)}
          className="file:mr-5 file:border-[1px] file:bg-stone-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-stone-700 hover:file:cursor-pointer hover:file:bg-blue-50 hover:file:text-blue-700"
        />
      </div>

      <div className="my-2 grid grid-cols-2 gap-2">
        <Input
          type="number"
          label="Common %"
          value={String(commonRate)}
          onChange={(e) => setCommonRate(Number(e.target.value))}
        />
        <Input
          type="number"
          label="Rare %"
          value={String(rareRate)}
          onChange={(e) => setRareRate(Number(e.target.value))}
        />
        <Input
          type="number"
          label="SR %"
          value={String(srRate)}
          onChange={(e) => setSrRate(Number(e.target.value))}
        />
        <Input
          type="number"
          label="SSR %"
          value={String(ssrRate)}
          onChange={(e) => setSsrRate(Number(e.target.value))}
        />
        <Input
          type="number"
          label="SSSR %"
          value={String(sssrRate)}
          onChange={(e) => setSssrRate(Number(e.target.value))}
        />
      </div>

      <Select
        label="Select Allies"
        selectionMode="multiple"
        selectedKeys={selectedAllies}
        onSelectionChange={(keys) => {
          // Always keep poster ally included
          const newKeys = new Set(keys as Set<string>);
          if (posterAllyId) newKeys.add(posterAllyId);
          setSelectedAllies(Array.from(newKeys));
        }}
        disabledKeys={new Set([posterAllyId])}
        className="my-2"
        isDisabled={isLoading}
      >
        {allies.map((a) => (
          <SelectItem key={a.id}>{a.name}</SelectItem>
        ))}
      </Select>

      <BannerPayments payments={payments} setPayments={setPayments} />

      <Button
        className="mt-4"
        onPress={handleSubmit}
        isDisabled={createBanner.isPending}
      >
        {createBanner.isPending ? "Submitting..." : "Submit Banner"}
      </Button>
    </div>
  );
}
