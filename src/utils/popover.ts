export function closePopover(id: string): void {
  const popover = document.getElementById(id);
  if (popover && "hidePopover" in popover && typeof popover.hidePopover === "function") {
    popover.hidePopover();
  }
}
