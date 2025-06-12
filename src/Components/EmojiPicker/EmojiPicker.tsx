import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

import { closePopover } from "../../utils/popover";

interface EmojiData {
  id: string;
  name: string;
  native: string;
  unified: string;
  keywords: string[];
  shortcodes: string;
  emoticons: string[];
}

interface EmojiPickerProps {
  id: string;
  onEmojiSelect: (emoji: string) => void;
}

export default function EmojiPicker(props: EmojiPickerProps) {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <>
      <button
        type="button"
        hidden={isMobile}
        className="btn btn-sm btn-square text-base"
        title="Add an emoji"
        popoverTarget={props.id}
        style={{ anchorName: `--${props.id}` } as React.CSSProperties}
      >
        😀
      </button>

      <div
        className="dropdown rounded-box bg-base-100 dropdown-end shadow-sm"
        popover="auto"
        hidden={isMobile}
        id={props.id}
        style={{ positionAnchor: `--${props.id}` } as React.CSSProperties}
      >
        <Picker
          data={data}
          onEmojiSelect={(e: EmojiData) => {
            props.onEmojiSelect(e.native);
            closePopover(props.id);
          }}
          theme="light"
          locale="en"
          previewPosition="none"
          searchPosition="sticky"
          navPosition="bottom"
          perLine={8}
          maxFrequentRows={2}
        />
      </div>
    </>
  );
}
