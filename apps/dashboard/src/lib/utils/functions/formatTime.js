export default function formatTime(utcTimestamp) {
  const date = new Date(utcTimestamp);
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}${ampm}`;
  return formattedTime;
}
