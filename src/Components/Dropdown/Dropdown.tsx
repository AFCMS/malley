import { IconType } from "react-icons/lib";
import { closePopover } from "../../utils/popover";
import { Link } from "react-router";

interface DropdownElement {
  icon: IconType;
  title: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface DropdownProps {
  id: string;
  bottomRight?: boolean; // Optional prop to align the dropdown to the bottom right
  children: DropdownElement[];
}

export default function Dropdown(props: DropdownProps) {
  return (
    <ul
      className={`dropdown menu rounded-box bg-base-100 mb-2 w-52 shadow-sm ${props.bottomRight ? "dropdown-bottom dropdown-start" : "dropdown-top dropdown-end"}`}
      popover="auto"
      id={props.id}
      style={{ positionAnchor: `--${props.id}` } as React.CSSProperties}
    >
      {props.children
        .filter((e) => e.disabled !== true)
        .map((element, index) => (
          <li key={index}>
            {element.href && !element.onClick ? (
              <Link
                to={element.href}
                onClick={() => {
                  closePopover(props.id);
                }}
              >
                <element.icon className="" />
                {element.title}
              </Link>
            ) : (
              <button className="" onClick={element.onClick}>
                <element.icon className="" />
                {element.title}
              </button>
            )}
          </li>
        ))}
    </ul>
  );
}
