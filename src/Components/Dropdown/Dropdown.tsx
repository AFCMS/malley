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
  placement?: "top-start" | "top-end" | "bottom-start" | "bottom-end"; // Flexible placement prop
  children: DropdownElement[];
}

export default function Dropdown(props: DropdownProps) {
  // Determine dropdown classes based on placement prop
  const getDropdownClasses = () => {
    if (props.placement) {
      switch (props.placement) {
        case "top-start":
          return "dropdown-top dropdown-start";
        case "top-end":
          return "dropdown-top dropdown-end";
        case "bottom-start":
          return "dropdown-bottom dropdown-start";
        case "bottom-end":
          return "dropdown-bottom dropdown-end";
        default:
          return "dropdown-top dropdown-end";
      }
    }
    // Default to top-end if no placement specified
    return "dropdown-top dropdown-end";
  };

  return (
    <ul
      className={`dropdown menu rounded-box bg-base-100 mb-2 w-52 shadow-sm ${getDropdownClasses()}`}
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
