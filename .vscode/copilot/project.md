The project uses TailwindCSS v4 and DaisyUI for it's styling.

TSX classes are all in this format:

```tsx
interface ClassNameProps {
  someProp: boolean;
}

export default function ClassName(props: ClassNameProps) {
  return <div>{/* Content */}</div>;
}
```

Interactions with the Supabase backend are handled in the `src/contexts/supabase/supabase.ts`. Authentication status is abstracted again as a React context through the `src/contexts/auth/AuthContext.tsx` file.
