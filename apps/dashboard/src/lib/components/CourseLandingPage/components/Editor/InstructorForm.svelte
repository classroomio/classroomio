<script>
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import get from 'lodash/get';
  import isEmpty from 'lodash/isEmpty';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import UploadImage from '$lib/components/UploadImage/index.svelte';
  import { uploadAvatar } from '$lib/utils/services/courses';

  export let course = {};
  let name;
  let role;
  let imgUrl;
  let description;
  let courseNo;
  let avatar;
  let hasBeenSet = false;

  function setter(value, setterKey) {
    if (!value) return;

    const _course = cloneDeep(course);
    set(_course, setterKey, value);
    course = _course;
  }

  async function onAvatarChange(_avatar) {
    if (!_avatar) return;

    const logo = await uploadAvatar(course.id, _avatar);
    imgUrl = logo;
  }

  function setDefaults(course) {
    if (isEmpty(course) || hasBeenSet) return;

    hasBeenSet = true;
    name = get(course, 'metadata.instructor.name');
    role = get(course, 'metadata.instructor.role');
    imgUrl = get(course, 'metadata.instructor.imgUrl');
    description = get(course, 'metadata.instructor.description');
    courseNo = get(course, 'metadata.instructor.courseNo');
  }

  $: setter(name, 'metadata.instructor.name');
  $: setter(role, 'metadata.instructor.role');
  $: setter(imgUrl, 'metadata.instructor.imgUrl');
  $: setter(description, 'metadata.instructor.description');
  $: setter(courseNo, 'metadata.instructor.courseNo');

  $: onAvatarChange(avatar);

  $: setDefaults(course);
</script>

<div class="mt-5">
  <label for="upload" class="font-bold">Instructor Logo</label>
  <UploadImage bind:avatar src={imgUrl} />
</div>

<TextField
  className="mt-5"
  labelClassName="font-bold"
  label="Instructor name"
  placeholder="Your company name"
  bind:value={name}
/>

<TextField
  className="mt-5"
  labelClassName="font-bold"
  label="Instructor Role"
  placeholder="e.g Software developer"
  bind:value={role}
/>

<TextArea
  label="About instructor"
  placeholder="A short background about the instructor"
  rows="6"
  className="mt-5"
  labelClassName="font-bold"
  bind:value={description}
/>

<TextField
  className="mt-5"
  labelClassName="font-bold"
  label="Total number of courses"
  type="number"
  bind:value={courseNo}
/>
