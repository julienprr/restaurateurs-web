<script>
  /** Bouton « craie » : fond transparent, bordure en pointillés. */
  let {
    variant = 'accent',
    type = 'button',
    disabled = false,
    onclick,
    children,
    ...rest
  } = $props();

  const variants = {
    accent: 'border-accent text-accent',
    teal: 'border-teal text-teal',
    muted: 'border-line text-muted'
  };
</script>

<button
  {type}
  {disabled}
  {onclick}
  class="w-full rounded-md border-2 border-dashed px-4 py-3 text-sm font-semibold tracking-wide
         transition-colors duration-150 active:bg-white/5
         disabled:cursor-not-allowed disabled:opacity-40 disabled:active:bg-transparent
         {variants[variant]}"
  {...rest}
>
  {@render children()}
</button>
