<script>
  import LogoYoutube from 'carbon-icons-svelte/lib/LogoYoutube.svelte';
  import LogoFacebook from 'carbon-icons-svelte/lib/LogoFacebook.svelte';
</script>

<div class="border-t-[1px] dark:bg-black dark:border-none px-[2%] lg:px-[14%]">
  <div class="flex flex-col items-center justify-between py-[10%] pl-5 lg:flex-row lg:pl-0">
    <div class="w-full min-w-[200px] lg:w-3/12">
      <div class="flex items-center mb-5">
        <img
          width="32"
          height="32"
          loading="lazy"
          src="/logo-192.png"
          alt="classroomio logo"
          class="mr-3"
        />
        <h3 class="text-base">
          ClassroomIO
        </h3>
      </div>
      <p class="lg:text-base mb-5 mr-2 text-sm leading-7 tracking-wide text-gray-400 dark:text-gray-500 lg:leading-7">
        The Open Source Learning Management System for Companies & The Easiest Way to Grow Your Teaching Business.
      </p>
      <!-- <a
        href="https://www.producthunt.com/posts/classroomio?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-classroomio"
        target="_blank"
        ><img
          loading="lazy"
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=425236&theme=light"
          alt="ClassroomIO - The&#0032;Open&#0032;Source&#0032;Platform&#0032;for&#0032;Tech&#0032;Bootcamps | Product Hunt"
          style="width: 250px; height: 54px;"
          width="250"
          height="54"
        /></a
      > -->
      <div class="mt-5 flex items-center gap-3 lg:mt-10 lg:gap-7">
        <a href="https://www.facebook.com/classroomiohq" target="_blank" aria-label="Facebook Link">
          <LogoFacebook
            class="scale-90 cursor-pointer fill-gray-400 transition-all hover:scale-110 hover:fill-gray-500 lg:scale-150"
            size={20}
          />
        </a>
        <a href="https://twitter.com/classroomio" target="_blank" aria-label="Twitter Link">
          <img
            width="20"
            height="20"
            loading="lazy"
            src="/twitter.svg"
            alt=""
            class="scale-90 cursor-pointer transition-all hover:scale-110 hover:fill-gray-500 lg:scale-150"
          />
        </a>
        <a href="https://www.youtube.com/@ClassroomIO" target="_blank" aria-label="Youtube Link">
          <LogoYoutube
            class="scale-90 cursor-pointer fill-gray-400 transition-all hover:scale-110 hover:fill-gray-500 lg:scale-150"
            size={20}
          />
        </a>
      </div>
    </div>

    <nav
      class="mt-16 flex w-full min-w-[400px] flex-col items-start justify-end gap-12 space-y-6 lg:mt-0 lg:w-3/4 lg:flex-row lg:space-y-0"
    >
      <div class="max-w-[120px]">
        <p class="lg:text-base mb-3 text-base font-semibold leading-6 text-gray-900 dark:text-gray-400 lg:mb-10">
          Product
        </p>
        <ul class="space-y-2 lg:space-y-4">
          <li
            class="lg:text-base text-sm leading-6 tracking-wide text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <a href="/#coursemanagement"> Course Management </a>
          </li>
          <li
            class="lg:text-base text-sm leading-6 tracking-wide text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <a href="/#customization"> Customizations </a>
          </li>
          <li
            class="lg:text-base text-sm leading-6 tracking-wide text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <a href="/#collaboration"> Forum </a>
          </li>
          <li
            class="lg:text-base text-sm leading-6 tracking-wide text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <a href="/#ai"> AI Lesson Planner </a>
          </li>
          <li
            class="lg:text-base text-sm leading-6 tracking-wide text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <a href="/#student-dashboard"> Student Dashboard </a>
          </li>
        </ul>
      </div>

      <div class="max-w-[120px]">
        <p class="lg:text-base mb-3 text-base font-semibold leading-6 text-gray-900 dark:text-gray-400 lg:mb-10">
          Solutions
        </p>
        <ul class="space-y-2 lg:space-y-4">
          <li
            class="lg:text-base text-sm leading-6 tracking-wide text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <a href="/employee-training">Employee Training</a>
          </li>
          <li
            class="lg:text-base text-sm leading-6 tracking-wide text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <a href="/bootcamps">Bootcamps</a>
          </li>
          <li
            class="lg:text-base text-sm leading-6 tracking-wide text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <a href="/customer-education">Customer Education</a>
          </li>
        </ul>
      </div>

      <div class="max-w-[120px]">
        <p class="lg:text-base mb-3 text-base font-semibold leading-6 text-gray-900 dark:text-gray-400 lg:mb-10">
          Resources
        </p>
        <ul class="space-y-2 lg:space-y-4">
          <li
            class="lg:text-base text-sm leading-6 tracking-wide text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <a href="/contact">Contact us</a>
          </li>
          <li
            class="lg:text-base text-sm leading-6 tracking-wide text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <a href="/teach">Teach with us</a>
          </li>
          <li
            class="lg:text-base text-sm leading-6 tracking-wide text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <a target="_blank" href="https://classroomio.com/docs/"> Help center </a>
          </li>
          <li
            class="lg:text-base text-sm leading-6 tracking-wide text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <a target="_blank" href="https://classroomio.com/docs/quickstart/signup">
              Getting Started
            </a>
          </li>
          <li
            class="lg:text-base text-sm leading-6 tracking-wide text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <a href="/oss-friends"> OSS Friends </a>
          </li>
        </ul>
      </div>

      <div class="max-w-[120px]">
        <p class="lg:text-base mb-3 text-base font-semibold leading-6 text-gray-900 dark:text-gray-400 lg:mb-10">
          Company
        </p>
        <ul class="space-y-2 lg:space-y-4">
          <li
            class="lg:text-base text-sm leading-6 tracking-wide text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <a href="/roadmap"> Roadmap </a>
          </li>
          <li
            class="lg:text-base text-sm leading-6 tracking-wide text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <a href="mailto:help@classroomio.com" target="_blank"> Support </a>
          </li>
          <li
            class="lg:text-base text-sm leading-6 tracking-wide text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <a
              href="https://app.enzuzo.com/policies/privacy/958fc978-5477-11ee-a03b-7b111830c594"
              target="_blank"
            >
              Privacy policy
            </a>
          </li>
          <li
            class="lg:text-base text-sm leading-6 tracking-wide text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <a target="_blank" href="https://classroomio.com/docs/quickstart/signup">
              Getting Started
            </a>
          </li>
          <li
            class="lg:text-base text-sm leading-6 tracking-wide text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <a
              href="https://app.enzuzo.com/policies/tos/958fc978-5477-11ee-a03b-7b111830c594"
              target="_blank"
            >
              Terms of use
            </a>
          </li>
        </ul>
      </div>
    </nav>
  </div>
  <footer
    class="lg:text-base border-t-[1px] py-[3%] text-center text-xs font-light leading-5 text-gray-500 dark:text-gray-400 dark:border-gray-800 lg:text-left"
  >
    <p>All rights reserved.</p>
    <p class="flex items-center">
      ClassroomIO © {new Date().getFullYear()} by
      <a href="https://twitter.com/rotimi_best" target="_blank" class="mx-1 text-blue-700 dark:text-blue-300 underline"
        >Rotimi Best</a
      >
      from
      <img loading="lazy" alt="Nigerian Flag" src="/ng.png" class="ml-2 h-3 w-3" />
    </p>
  </footer>
</div>
