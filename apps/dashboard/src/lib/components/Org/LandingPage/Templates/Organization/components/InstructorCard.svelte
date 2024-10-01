<script>
  import RatingComponent from '$lib/components/Org/LandingPage/components/RatingComponent.svelte';
</script>

<div
  class="flex flex-col md:flex-row items-start gap-3 border max-h-full max-w-[300px] md:max-h-[250px] md:max-w-[550px] rounded-md p-3"
>
  <div class="bg-[#FFE8FF] w-full h-full rounded-md p-2">
    <img
      src="/images/classroomio-course-img-template.jpg"
      alt="tutor"
      class="object-cover w-full h-full rounded"
    />
  </div>
  <div class="w-full space-y-1">
    <p class="text-xl font-semibold">Adewale Tunji</p>
    <RatingComponent rating={4} />
    <p class="text-[#656565] text-sm text-justify line-clamp-6">
      Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ex dicta placeat sint, impedit
      voluptates autem fugit voluptatem tempora quo doloribus ipsum beatae dolorum accusantium nam
      vero tenetur ducimus ipsa quod. Minus alias magni qui ex, nam laborum delectus atque enim eius
      quisquam repellat, sed autem magnam aut animi doloribus libero?
    </p>
  </div>
</div>
