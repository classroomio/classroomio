import { writable, get as getFromStore } from 'svelte/store';
import dayjs from 'dayjs';

const PICKER_TYPES = ['days', 'months', 'years'];

const updateSelected = (value, property) => (state) => {
	const newState = { ...state, [property]: value };
	return { ...newState, selected: new Date(newState.year, newState.month, newState.day) };
};

const pipe = (...fns) => (val) => fns.reduce((accum, fn) => fn(accum), val);

const zeroDay = (date) => dayjs(date).startOf('day').toDate();

const get = ({ selected, start, end, startOfWeekIndex = 0, shouldEnlargeDay = false }) => {
	const { subscribe, set, update } = writable({
		open: false,
		hasChosen: false,
		selected,
		start: zeroDay(start),
		end: zeroDay(end),
		shouldEnlargeDay,
		enlargeDay: false,
		year: selected.getFullYear(),
		month: selected.getMonth(),
		day: selected.getDate(),
		activeView: 'days',
		activeViewDirection: 1,
		startOfWeekIndex
	});

	return {
		set,
		subscribe,
		getState() {
			return getFromStore({ subscribe });
		},
		enlargeDay(enlargeDay = true) {
			update((state) => ({ ...state, enlargeDay }));
		},
		getSelectableVector(date) {
			const { start, end } = this.getState();
			if (date < start) return -1;
			if (date > end) return 1;
			return 0;
		},
		isSelectable(date, clamping = []) {
			const vector = this.getSelectableVector(date);
			if (vector === 0) return true;
			if (!clamping.length) return false;
			const clamped = this.clampValue(dayjs(date), clamping).toDate();
			return this.isSelectable(clamped);
		},
		clampValue(day, clampable) {
			const vector = this.getSelectableVector(day.toDate());
			if (vector === 0) return day;
			const boundaryKey = vector === 1 ? 'end' : 'start';
			const boundary = dayjs(this.getState()[boundaryKey]);
			return clampable.reduce((day, type) => day[type](boundary[type]()), day);
		},
		add(amount, unit, clampable = []) {
			update(({ month, year, day, ...state }) => {
				const d = this.clampValue(dayjs(new Date(year, month, day)).add(amount, unit), clampable);
				if (!this.isSelectable(d.toDate())) return { ...state, year, month, day };
				return {
					...state,
					month: d.month(),
					year: d.year(),
					day: d.date(),
					selected: d.toDate()
				};
			});
		},
		setActiveView(newActiveView) {
			const newIndex = PICKER_TYPES.indexOf(newActiveView);
			if (newIndex === -1) return;
			update(({ activeView, ...state }) => ({
				...state,
				activeViewDirection: PICKER_TYPES.indexOf(activeView) > newIndex ? -1 : 1,
				activeView: newActiveView
			}));
		},
		setYear(year) {
			update(updateSelected(year, 'year'));
		},
		setMonth(month) {
			update(updateSelected(month, 'month'));
		},
		setDay(day) {
			update(
				pipe(
					updateSelected(day.getDate(), 'day'),
					updateSelected(day.getMonth(), 'month'),
					updateSelected(day.getFullYear(), 'year')
				)
			);
		},
		close(extraState) {
			update((state) => ({ ...state, ...extraState, open: false }));
		},
		selectDay() {
			this.close({ hasChosen: true });
		},
		getCalendarPage(month, year) {
			const { startOfWeekIndex } = this.getState();
			let last = { date: new Date(year, month, 1), outsider: false };
			const days = [];

			while (last.date.getMonth() === month) {
				days.push(last);
				const date = new Date(last.date);
				date.setDate(last.date.getDate() + 1);
				last = { date, outsider: false };
			}

			while (days[0].date.getDay() !== startOfWeekIndex) {
				const date = new Date(days[0].date);
				date.setDate(days[0].date.getDate() - 1);
				days.unshift({
					date,
					outsider: true
				});
			}

			last.outsider = true;
			while (days.length < 42) {
				days.push(last);
				last = { date: new Date(last.date), outsider: true };
				last.date.setDate(last.date.getDate() + 1);
			}

			return days;
		}
	};
};

export default { get };
