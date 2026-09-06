<script>
  /** Cadre en pointillés évoquant le contour d'une ardoise de bistrot. */
  let { title, subtitle, children, footer } = $props();
</script>

<div class="chalk-surface min-h-dvh px-4 py-6">
  <div
    class="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-col rounded-lg border-2 border-dotted border-line px-5 py-6"
  >
    {#if title}
      <header class="mb-6 text-center">
        <h1 class="font-display text-4xl leading-none text-chalk">{title}</h1>
        {#if subtitle}
          <p class="mt-2 text-sm text-muted">{subtitle}</p>
        {/if}
      </header>
    {/if}

    <main class="flex flex-1 flex-col">
      {@render children()}
    </main>

    {#if footer}
      <footer class="mt-6 pt-4">
        {@render footer()}
      </footer>
    {/if}
  </div>
</div>
