import { useState, useRef } from "react";

import { queries } from "../../contexts/supabase/supabase";

import TopBar from "../../layouts/TopBar/TopBar";
import EmojiPicker from "../../Components/EmojiPicker/EmojiPicker";

const maxAllowedSize = 2 * 1024 * 1024; // 2MB in bytes

export default function Settings() {
  const [bio, setBio] = useState<string>("");
  const [avatarMediaFile, setAvatarMediaFile] = useState<File | null>(null);
  const [bannerMediaFile, setBannerMediaFile] = useState<File | null>(null);

  const bioTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEmojiSelect = (emoji: string) => {
    const textarea = bioTextareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBefore = bio.substring(0, cursorPos);
    const textAfter = bio.substring(cursorPos);

    const newText = textBefore + emoji + textAfter;
    setBio(newText);

    // Remettre le focus sur le textarea après insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
    }, 0);
  };

  return (
    <div className="m flex w-full flex-col">
      <TopBar title="Settings" />

      <div className="flex w-full flex-col gap-4 p-4">
        {" "}
        <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
          <legend className="fieldset-legend">Bio</legend>
          <div className="relative">
            <textarea
              ref={bioTextareaRef}
              id="bio"
              className="textarea w-full resize-none"
              placeholder="Describe yourself in a few words..."
              rows={3}
              maxLength={500}
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
              }}
            />
            <div className="absolute right-3 bottom-3 z-50">
              <EmojiPicker id="settings-emoji" onEmojiSelect={handleEmojiSelect} />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
            <span>Add emojis to personalize your bio!</span>
            <div className="flex items-center gap-2">
              <span>{bio.length}/500</span>
              <button
                className="btn"
                onClick={() => {
                  void queries.profiles.updateBio(bio);
                }}
              >
                Save
              </button>
            </div>
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
                    alert("Success!");
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
                    alert("Success!");
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
