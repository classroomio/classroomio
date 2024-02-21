<script>
  import LogoYoutube from 'carbon-icons-svelte/lib/LogoYoutube.svelte';
  import LogoFacebook from 'carbon-icons-svelte/lib/LogoFacebook.svelte';
</script>

<div class="px-[2%] lg:px-[14%] border-t-[1px]">
  <div class="flex flex-col lg:flex-row justify-between items-center py-[10%] pl-5 lg:pl-0">
    <div class="w-full lg:w-2/4">
      <img
        width="32"
        height="32"
        loading="lazy"
        src="/logo-192.png"
        alt="classroomio logo"
        class="w-[10%] lg:w-[5%] mb-5 lg:mb-10"
      />
      <p class="text-sm lg:text-md tracking-wide leading-7 lg:leading-7 text-gray-600 mb-5 mr-2">
        Launch Your Online Bootcamp In Minutes
        <br />
        Making teaching and learning seamless for tech bootcamps
      </p>
      <a
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
      >
      <div class="flex items-center mt-5 lg:mt-10 gap-3 lg:gap-7">
        <a href="https://www.facebook.com/classroomiohq" target="_blank" aria-label="Facebook Link">
          <LogoFacebook
            class="fill-gray-400 hover:fill-gray-500 hover:scale-110 scale-90 lg:scale-150 transition-all cursor-pointer"
            size={20}
          />
        </a>
        <a href="https://twitter.com/classroomio" target="_blank" aria-label="Twitter Link">
          <img
            width="10"
            height="10"
            loading="lazy"
            src="/twitter_logo.png"
            alt=""
            class="w-3 hover:fill-gray-500 hover:scale-110 scale-90 lg:scale-150 transition-all cursor-pointer"
          />
        </a>
        <a href="https://www.youtube.com/@ClassroomIO" target="_blank" aria-label="Youtube Link">
          <LogoYoutube
            class="fill-gray-400 hover:fill-gray-500 hover:scale-110 scale-90 lg:scale-150 transition-all cursor-pointer"
            size={20}
          />
        </a>
      </div>
    </div>

    <nav
      class="flex justify-between items-start flex-col lg:flex-row w-full lg:w-2/4 gap-3 mt-16 lg:mt-0 space-y-6 lg:space-y-0"
    >
      <div>
        <p class="mb-3 lg:mb-10 text-base lg:text-md font-semibold leading-6 text-gray-900">
          Product
        </p>
        <ul class="space-y-2 lg:space-y-4">
          <li class="text-sm lg:text-md tracking-wide leading-6 text-gray-600 hover:text-gray-900">
            <a href="/#coursemanagement"> Course Management </a>
          </li>
          <li class="text-sm lg:text-md tracking-wide leading-6 text-gray-600 hover:text-gray-900">
            <a href="/#customization"> Customizations </a>
          </li>
          <li class="text-sm lg:text-md tracking-wide leading-6 text-gray-600 hover:text-gray-900">
            <a href="/#collaboration"> Forum </a>
          </li>
          <li class="text-sm lg:text-md tracking-wide leading-6 text-gray-600 hover:text-gray-900">
            <a href="/#ai"> AI Lesson Planner </a>
          </li>
        </ul>
      </div>

      <div>
        <p class="mb-3 lg:mb-10 text-base lg:text-md font-semibold leading-6 text-gray-900">
          Resources
        </p>
        <ul class="space-y-2 lg:space-y-4">
          <li class="text-sm lg:text-md tracking-wide leading-6 text-gray-600 hover:text-gray-900">
            <a href="/blog"> Blog </a>
          </li>
          <li class="text-sm lg:text-md tracking-wide leading-6 text-gray-600 hover:text-gray-900">
            <a target="_blank" href="https://classroomio.com/docs/"> Help center </a>
          </li>
          <li class="text-sm lg:text-md tracking-wide leading-6 text-gray-600 hover:text-gray-900">
            <a target="_blank" href="https://classroomio.com/docs/what-is-classroomio">
              What is ClassroomIO?
            </a>
          </li>
          <li class="text-sm lg:text-md tracking-wide leading-6 text-gray-600 hover:text-gray-900">
            <a target="_blank" href="https://classroomio.com/docs/quickstart/signup">
              Getting Started
            </a>
          </li>
          <li class="text-sm lg:text-md tracking-wide leading-6 text-gray-600 hover:text-gray-900">
            <a href="/oss-friends"> OSS Friends </a>
          </li>
        </ul>
      </div>

      <div>
        <p class="mb-3 lg:mb-10 text-base lg:text-md font-semibold leading-6 text-gray-900">
          Company
        </p>
        <ul class="space-y-2 lg:space-y-4">
          <li class="text-sm lg:text-md tracking-wide leading-6 text-gray-600 hover:text-gray-900">
            <a href="mailto:help@classroomio.com" target="_blank"> Contact us </a>
          </li>
          <li class="text-sm lg:text-md tracking-wide leading-6 text-gray-600 hover:text-gray-900">
            <a
              href="https://app.enzuzo.com/policies/privacy/958fc978-5477-11ee-a03b-7b111830c594"
              target="_blank"
            >
              Privacy policy
            </a>
          </li>
          <li class="text-sm lg:text-md tracking-wide leading-6 text-gray-600 hover:text-gray-900">
            <a target="_blank" href="https://classroomio.com/docs/quickstart/signup">
              Getting Started
            </a>
          </li>
          <li class="text-sm lg:text-md tracking-wide leading-6 text-gray-600 hover:text-gray-900">
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
    class="border-t-[1px] py-[3%] text-xs lg:text-md leading-5 font-light text-gray-500 text-center lg:text-left"
  >
    <p>All rights reserved.</p>
    <p class="flex items-center">
      ClassroomIO © {new Date().getFullYear()} by
      <a href="https://twitter.com/rotimi_best" target="_blank" class="underline text-blue-700 mx-1"
        >Rotimi Best</a
      >
      from
      <img loading="lazy" alt="Nigerian Flag" src="/ng.png" class="ml-2 h-3 w-3" />
    </p>
  </footer>
</div>
