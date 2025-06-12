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
  return (
    <>
      <button
        type="button"
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
