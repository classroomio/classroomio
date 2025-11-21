<script>
  import { Skeleton } from '@cio/ui/base/skeleton';
</script>

<div class="mb-7 flex max-w-3xl flex-col gap-5 rounded-md border border-gray-300 p-4">
  <div class="flex items-center gap-2">
    <Skeleton class="h-8 w-8 overflow-hidden rounded-full" />
    <Skeleton class="h-4 w-[30%]" />
  </div>
  <Skeleton class="h-4 w-full" />
  <Skeleton class="h-4 w-full" />
  <Skeleton class="h-4 w-full" />
</div>
