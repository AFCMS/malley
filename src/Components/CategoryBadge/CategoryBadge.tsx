interface CategoryBadgeProps {
  name: string;
}

export default function CategoryBadge(props: CategoryBadgeProps) {
  return (
    <span className="inline-flex cursor-pointer items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 lowercase hover:bg-blue-200">
      #{props.name}
    </span>
  );
}
