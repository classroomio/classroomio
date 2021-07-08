<script>
  import { stores } from "@sapper/app";
  import PageNav from "../../PageNav/index.svelte";
  import UserCard from "../../UserCard/index.svelte";

  const { page } = stores();

  const teachers = [
    {
      name: "Alexander Pokidin",
      title: "Senior Software Engineer",
      avatar:
        "https://media-exp1.licdn.com/dms/image/C5603AQFWia2m2J0syA/profile-displayphoto-shrink_100_100/0/1517423655318?e=1625702400&v=beta&t=SVGGkisvjOVcbz6Ejtb8pEDzRnqqFxMAMXGZgW-WE70",
      telegramLink: "https://t.me/seed_of_abraham",
      mailLink: "mailto:irb.ossystem@gmail.com",
    },
    {
      name: "Andrey Filatov",
      title: "Fullstack Software Engineer",
      avatar:
        "https://media-exp1.licdn.com/dms/image/C5103AQHuKuAX7RdoRw/profile-displayphoto-shrink_100_100/0/1517226025504?e=1625702400&v=beta&t=dReL72K1hYLVXBw_-v5LTDfjHLeDqfRC6IzBYOdqjqc",
      telegramLink: "https://t.me/seed_of_abraham",
      mailLink: "mailto:irb.ossystem@gmail.com",
    },
    {
      name: "Sergey Semko",
      title: "Senior Software Engineer",
      avatar:
        "https://media-exp1.licdn.com/dms/image/C5603AQFUEHk5pxnIyA/profile-displayphoto-shrink_100_100/0/1558013476527?e=1625702400&v=beta&t=Y3uBohyYlRvVf_U-1o4elfRGdcTFkKQMH9NqbD5lHlc",
      telegramLink: "https://t.me/seed_of_abraham",
      mailLink: "mailto:irb.ossystem@gmail.com",
    },
    {
      name: "Natalia Fedii",
      title: "Project Manager",
      avatar:
        "https://media-exp1.licdn.com/dms/image/C5603AQEi-IuSUG6kTQ/profile-displayphoto-shrink_100_100/0/1517884922407?e=1625702400&v=beta&t=rbj0wEM20msiDSQnTdwr68E4uv9N6xJTvObl3hLuRLc",
      telegramLink: "https://t.me/seed_of_abraham",
      mailLink: "mailto:irb.ossystem@gmail.com",
    },
  ];
  const students = [...teachers, ...teachers, ...teachers];
</script>

<PageNav title="People" disableSticky={true} />
<div class="m-3">
  <h3>
    <a id="teachers" name="teachers" href="{$page.path}#teachers">Teachers</a>
  </h3>
  <div class="flex flex-wrap">
    {#each teachers as teacher}
      <UserCard
        name={teacher.name}
        avatarUrl={teacher.avatar}
        title={teacher.title}
        telegramLink={teacher.telegramLink}
        mailLink={teacher.mailLink}
      />
    {/each}
  </div>
</div>

<div class="m-3">
  <h3>
    <a id="students" name="students" href="{$page.path}#students">Students</a>
  </h3>
  <div class="flex flex-wrap">
    {#each students as student}
      <UserCard
        name={student.name}
        avatarUrl={student.avatar}
        title={student.title}
      />
    {/each}
  </div>
</div>
