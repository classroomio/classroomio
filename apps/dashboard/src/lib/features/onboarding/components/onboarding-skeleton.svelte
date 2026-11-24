<script lang="ts">
  import { Skeleton } from '@cio/ui/base/skeleton';
</script>

<div class="ui:bg-background flex min-h-screen w-full flex-col px-4 py-10 lg:px-12">
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-6">
    <Skeleton class="h-9 w-48" />
    <div class="grid gap-6 lg:grid-cols-2">
      <div class="flex flex-col gap-4">
        <Skeleton class="h-4 w-40" />
        <Skeleton class="h-9 w-3/4" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-2/3" />
        <Skeleton class="mt-6 h-28 w-full" />
      </div>
      <Skeleton class="hidden h-72 w-full lg:block" />
    </div>
  </div>
</div>
