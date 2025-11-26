"use client";

import { useState } from "react";
import { addToast, Button } from "@heroui/react";
import { api } from "~//trpc/react";

export default function CreateAllyBackground() {
  const [file, setFile] = useState<File | null>(null);

  const createUploadUrl = api.allyBackgrounds.createUploadUrl.useMutation();
  const utils = api.useUtils();

  const handleSubmit = async () => {
    if (!file) return;

    // 1. Luo map + hae upload url
    const { uploadUrl, allyBackground } = await createUploadUrl.mutateAsync();

    // 2. Upload tiedosto Minioon
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    await utils.allyBackgrounds.invalidate();

    addToast({
      title: "New Ally Background",
      description: `Added ally background ${allyBackground.id}`,
    });
    setFile(null);
  };

  return (
    <>
      <h3 className="mt-5 mb-2 text-xl font-semibold">
        Create an Ally Background
      </h3>

      <label className="mb-2 block">
        Background Artwork (png):
        <br />
        <input
          className="file:mr-5 file:border-[1px] file:bg-stone-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-stone-700 hover:file:cursor-pointer hover:file:bg-blue-50 hover:file:text-blue-700"
          type="file"
          accept="image/png"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setFile(e.target.files[0]);
            }
          }}
        />
      </label>

      <Button
        className="mt-2"
        onPress={handleSubmit}
        isDisabled={createUploadUrl.isPending}
        color="primary"
      >
        {createUploadUrl.isPending ? "Submitting..." : "Submit Background"}
      </Button>
    </>
  );
}
