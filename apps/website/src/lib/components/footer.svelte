<script>
  import Facebook from '@lucide/svelte/icons/facebook';
  import Youtube from '@lucide/svelte/icons/youtube';
  import Twitter from '@lucide/svelte/icons/twitter';
</script>

<footer
  class="ui:border-border relative overflow-hidden border-t bg-[linear-gradient(to_top,#eef3fb_0%,#f8fafc_100%)] px-[5%] py-12 lg:px-[10%]"
>
  <!-- Minor cloud — top-left, smaller than the hero -->
  <svg
    class="pointer-events-none absolute -top-4 left-3 z-[2] h-12 w-[160px] md:-top-5 md:left-4 md:h-16 md:w-[210px] lg:-top-6 lg:h-20 lg:w-[260px]"
    viewBox="0 0 240 110"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M 22 80
         C 22 60, 42 50, 62 56
         C 68 36, 100 30, 116 52
         C 130 32, 168 38, 174 60
         C 196 56, 216 68, 214 82
         C 214 96, 196 102, 174 96
         C 164 106, 130 106, 120 96
         C 110 106, 78 106, 66 94
         C 46 100, 22 96, 22 80 Z"
      fill="white"
      stroke="#94a3b8"
      stroke-width="1.5"
    />
  </svg>

  <!-- Second smaller cloud, offset right -->
  <svg
    class="pointer-events-none absolute top-3 left-32 z-[2] h-9 w-[110px] md:top-4 md:left-44 md:h-12 md:w-[140px] lg:top-6 lg:left-[200px] lg:h-14 lg:w-[180px]"
    viewBox="0 0 200 90"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M 16 64
         C 16 48, 34 40, 52 46
         C 58 30, 86 26, 100 44
         C 114 28, 144 34, 150 52
         C 168 48, 184 58, 182 70
         C 182 82, 168 86, 150 82
         C 142 90, 114 90, 106 82
         C 98 90, 70 90, 60 80
         C 42 86, 16 82, 16 64 Z"
      fill="white"
      stroke="#94a3b8"
      stroke-width="1.5"
    />
  </svg>

  <div class="relative z-10 flex flex-col gap-10 lg:flex-row lg:justify-between">
    <!-- Brand -->
    <div class="flex flex-col gap-4 lg:max-w-[220px]">
      <img width="32" height="32" loading="lazy" src="/logo-192.png" alt="ClassroomIO logo" />
      <p class="ui:text-muted-foreground text-sm leading-6">
        The Open Source LMS for compliance training and certification programs.
      </p>
      <div class="flex items-center gap-2">
        <a
          href="https://www.facebook.com/classroomiohq"
          target="_blank"
          aria-label="Facebook"
          class="ui:text-muted-foreground ui:hover:text-foreground p-1 transition-colors"
        >
          <Facebook size={18} />
        </a>
        <a
          href="https://twitter.com/classroomio"
          target="_blank"
          aria-label="Twitter"
          class="ui:text-muted-foreground ui:hover:text-foreground p-1 transition-colors"
        >
          <Twitter size={18} />
        </a>
        <a
          href="https://www.youtube.com/@ClassroomIO"
          target="_blank"
          aria-label="YouTube"
          class="ui:text-muted-foreground ui:hover:text-foreground p-1 transition-colors"
        >
          <Youtube size={18} />
        </a>
      </div>
    </div>

    <!-- Nav columns -->
    <nav class="grid grid-cols-2 gap-8 sm:grid-cols-4">
      <div>
        <p class="ui:text-foreground mb-4 text-sm font-semibold">Product</p>
        <ul class="space-y-3">
          <li>
            <a href="/mcp-recipes" class="ui:text-muted-foreground ui:hover:text-foreground text-sm transition-colors"
              >MCP Recipes</a
            >
          </li>
          <li>
            <a href="/automation" class="ui:text-muted-foreground ui:hover:text-foreground text-sm transition-colors"
              >API & MCP</a
            >
          </li>
          <li>
            <a href="/pricing" class="ui:text-muted-foreground ui:hover:text-foreground text-sm transition-colors"
              >Pricing</a
            >
          </li>
        </ul>
      </div>

      <div>
        <p class="ui:text-foreground mb-4 text-sm font-semibold">Solutions</p>
        <ul class="space-y-3">
          <li>
            <a
              href="/customer-education"
              class="ui:text-muted-foreground ui:hover:text-foreground text-sm transition-colors">Customer Education</a
            >
          </li>
          <li>
            <a
              href="/compliance-training"
              class="ui:text-muted-foreground ui:hover:text-foreground text-sm transition-colors">Compliance Training</a
            >
          </li>
          <li>
            <a
              href="/partner-training"
              class="ui:text-muted-foreground ui:hover:text-foreground text-sm transition-colors">Partner Training</a
            >
          </li>
        </ul>
      </div>

      <div>
        <p class="ui:text-foreground mb-4 text-sm font-semibold">Resources</p>
        <ul class="space-y-3">
          <li>
            <a
              href="/docs-vs-company-academy"
              class="ui:text-muted-foreground ui:hover:text-foreground text-sm transition-colors"
              >Docs vs Company Academy</a
            >
          </li>
          <li>
            <a
              href="/public-courses"
              class="ui:text-muted-foreground ui:hover:text-foreground text-sm transition-colors">Public Courses</a
            >
          </li>
          <li>
            <a href="/teach" class="ui:text-muted-foreground ui:hover:text-foreground text-sm transition-colors"
              >Teach with us</a
            >
          </li>
          <li>
            <a
              href="https://classroomio.com/docs/"
              target="_blank"
              class="ui:text-muted-foreground ui:hover:text-foreground text-sm transition-colors">Help Center</a
            >
          </li>
          <li>
            <a
              href="https://classroomio.com/docs/quickstart/signup"
              target="_blank"
              class="ui:text-muted-foreground ui:hover:text-foreground text-sm transition-colors">Getting Started</a
            >
          </li>
          <li>
            <a href="/oss-friends" class="ui:text-muted-foreground ui:hover:text-foreground text-sm transition-colors"
              >OSS Friends</a
            >
          </li>
        </ul>
      </div>

      <div>
        <p class="ui:text-foreground mb-4 text-sm font-semibold">Company</p>
        <ul class="space-y-3">
          <li>
            <a
              href="https://feedback.classroomio.com/roadmap"
              target="_blank"
              rel="noopener"
              class="ui:text-muted-foreground ui:hover:text-foreground text-sm transition-colors">Roadmap</a
            >
          </li>
          <li>
            <a
              href="mailto:help@classroomio.com"
              target="_blank"
              class="ui:text-muted-foreground ui:hover:text-foreground text-sm transition-colors">Support</a
            >
          </li>
          <li>
            <a href="/privacy" class="ui:text-muted-foreground ui:hover:text-foreground text-sm transition-colors"
              >Privacy Policy</a
            >
          </li>
          <li>
            <a href="/tos" class="ui:text-muted-foreground ui:hover:text-foreground text-sm transition-colors"
              >Terms of Use</a
            >
          </li>
        </ul>
      </div>
    </nav>
  </div>

  <div
    class="ui:border-border ui:text-muted-foreground relative z-10 mt-10 border-t pt-6 text-center text-xs lg:text-left"
  >
    All rights reserved — ClassroomIO © {new Date().getFullYear()}
  </div>
</footer>
