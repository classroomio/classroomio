<script>
  function onTelegramAuth(user) {
    alert(
      "Logged in as " +
        user.first_name +
        " " +
        user.last_name +
        " (" +
        user.id +
        (user.username ? ", @" + user.username : "") +
        ")"
    );
  }
</script>

<svelte:head>
  <title>Join ClassroomIO</title>
</svelte:head>

<div class="lg:w-3/5 mx-auto md:mx-10 lg:mb-20">
  <p>Login/Sign up into ClassroomIO</p>
  <script
    async
    src="https://telegram.org/js/telegram-widget.js?14"
    data-telegram-login="classroomio_bot"
    data-size="large"
    data-auth-url="login-redirect"
    data-request-access="write"></script>
</div>
