import { useState, useRef } from "react";

import { queries } from "../../contexts/supabase/supabase";

import TopBar from "../../layouts/TopBar/TopBar";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface EmojiData {
  native: string;
  id: string;
  name: string;
  colons: string;
  skin: number;
  unified: string;
}

const maxAllowedSize = 2 * 1024 * 1024; // 2MB in bytes

export default function Settings() {
  const [bio, setBio] = useState<string>("");
  const [avatarMediaFile, setAvatarMediaFile] = useState<File | null>(null);
  const [bannerMediaFile, setBannerMediaFile] = useState<File | null>(null);

  const bioTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEmojiSelect = (emoji: EmojiData) => {
    const textarea = bioTextareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBefore = bio.substring(0, cursorPos);
    const textAfter = bio.substring(cursorPos);

    const newText = textBefore + emoji.native + textAfter;
    setBio(newText);

    // Remettre le focus sur le textarea après insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos + emoji.native.length, cursorPos + emoji.native.length);
    }, 0);
  };

  return (
    <div className="m flex w-full flex-col">
      <TopBar title="Settings" />

      <div className="flex w-full flex-col gap-4 p-4">
        {" "}
        <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
          <legend className="fieldset-legend">Bio</legend>
          <div className="join">
            <div className="relative flex-1">
              <textarea
                ref={bioTextareaRef}
                id="bio"
                className="textarea join-item w-full resize-none"
                placeholder="Décrivez-vous en quelques mots..."
                rows={3}
                maxLength={500}
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                }}
              />

              {/* Bouton emoji */}
              <div className="dropdown dropdown-bottom dropdown-end absolute right-3 bottom-3 z-50">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost btn-sm hover:bg-base-200 bg-base-100/80 border-base-300/50 h-9 min-h-9 w-9 border p-0 shadow-sm backdrop-blur-sm"
                  title="Ajouter un emoji"
                  style={{ fontSize: "16px" }}
                >
                  😀
                </div>
                <div
                  tabIndex={0}
                  className="dropdown-content bg-base-100 rounded-box border-base-300 z-[999] mt-1 overflow-hidden border p-2 shadow-2xl"
                  style={{ transform: "translateX(-20px)" }}
                >
                  <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    theme="light"
                    locale="fr"
                    previewPosition="none"
                    searchPosition="sticky"
                    navPosition="bottom"
                    perLine={8}
                    maxFrequentRows={2}
                  />
                </div>
              </div>
            </div>
            <button
              className="btn join-item"
              onClick={() => {
                void queries.profiles.updateBio(bio);
              }}
            >
              Save
            </button>
          </div>
          <div className="mt-2 flex justify-between text-sm text-gray-500">
            <span>Ajoutez des emojis pour personnaliser votre bio !</span>
            <span>{bio.length}/500</span>
          </div>
        </fieldset>
        <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
          <legend className="fieldset-legend">Avatar</legend>
          <div className="join">
            <input
              id="avatar"
              type="file"
              className="file-input join-item w-full"
              placeholder=""
              multiple={false}
              accept="image/*"
              onChange={(e) => {
                if (e.target.files) {
                  if (e.target.files[0].size > maxAllowedSize) {
                    alert("File size exceeds the maximum allowed size of 2MB.");
                    e.target.value = "";
                  }
                  setAvatarMediaFile(e.target.files[0]);
                }
              }}
            />
            <button
              className="btn join-item"
              onClick={() => {
                queries.profiles
                  .updateAvatar(avatarMediaFile)
                  .then(() => {
                    setAvatarMediaFile(null);
                    alert("Sucess!");
                  })
                  .catch((error: unknown) => {
                    alert("Error updating avatar. Please try again.");
                    console.error("Error updating avatar:", error);
                  });
              }}
            >
              Save
            </button>
          </div>
          <label className="label">Max size 2MB</label>
        </fieldset>
        <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
          <legend className="fieldset-legend">Banner</legend>
          <div className="join">
            <input
              id="banner"
              type="file"
              className="file-input join-item w-full"
              placeholder=""
              multiple={false}
              accept="image/*"
              onChange={(e) => {
                if (e.target.files) {
                  if (e.target.files[0].size > maxAllowedSize) {
                    alert("File size exceeds the maximum allowed size of 2MB.");
                    e.target.value = "";
                  }
                  setBannerMediaFile(e.target.files[0]);
                }
              }}
            />
            <button
              className="btn join-item"
              onClick={() => {
                queries.profiles
                  .updateBanner(bannerMediaFile)
                  .then(() => {
                    setBannerMediaFile(null);
                    alert("Sucess!");
                  })
                  .catch((error: unknown) => {
                    alert("Error updating banner. Please try again.");
                    console.error("Error updating banner:", error);
                  });
              }}
            >
              Save
            </button>
          </div>
          <label className="label">Max size 2MB</label>
        </fieldset>
      </div>
    </div>
  );
}
