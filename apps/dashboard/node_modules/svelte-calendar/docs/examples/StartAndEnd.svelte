<script>
	import dayjs from 'dayjs';
	import { Datepicker } from '../../index';

	const today = new Date();
	const tomorrow = dayjs().add(1, 'day').toDate();
</script>

<Datepicker start={today} end={tomorrow} />
