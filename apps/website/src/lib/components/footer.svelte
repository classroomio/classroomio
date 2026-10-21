<script>
  import Facebook from '@lucide/svelte/icons/facebook';
  import Youtube from '@lucide/svelte/icons/youtube';
  import Twitter from '@lucide/svelte/icons/twitter';
</script>

<footer
  class="ui:border-border relative overflow-hidden border-t bg-[linear-gradient(to_top,#eef3fb_0%,#f8fafc_100%)] px-6 pt-20 pb-10 md:px-10 lg:pt-24"
>
  <div class="max-w-content relative z-10 mx-auto flex flex-col gap-12 lg:flex-row lg:justify-between">
    <div class="flex flex-col gap-5 lg:max-w-[280px]">
      <img width="48" height="48" loading="lazy" src="/logo-192.png" alt="ClassroomIO logo" />
      <p class="ui:text-muted-foreground text-[15px] leading-relaxed">
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

    <nav class="grid grid-cols-2 gap-x-12 gap-y-10 sm:grid-cols-4">
      <div>
        <p class="ui:text-foreground mb-5 text-sm font-semibold">Product</p>
        <ul class="space-y-3.5">
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
          <li>
            <a href="/changelog" class="ui:text-muted-foreground ui:hover:text-foreground text-sm transition-colors"
              >Changelog</a
            >
          </li>
        </ul>
      </div>

      <div>
        <p class="ui:text-foreground mb-5 text-sm font-semibold">Solutions</p>
        <ul class="space-y-3.5">
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
        <p class="ui:text-foreground mb-5 text-sm font-semibold">Resources</p>
        <ul class="space-y-3.5">
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
              href="https://classroomio.com/help"
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
        <p class="ui:text-foreground mb-5 text-sm font-semibold">Company</p>
        <ul class="space-y-3.5">
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

  <div class="max-w-content ui:text-muted-foreground relative z-10 mx-auto mt-16 text-center text-[13px] lg:text-left">
    All rights reserved. ClassroomIO © {new Date().getFullYear()}
  </div>
</footer>
