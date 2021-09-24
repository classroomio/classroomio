export default (created_at, due_date) => {
  return !!due_date
    ? !!(new Date(created_at).getTime() <= new Date(due_date).getTime())
    : true;
};
