import { writable } from 'svelte/store';

// export const deleteMemberModal = writable({
//   open: false,
// });

export const issueCertificateModal = writable({
  open: false,
  automatic: false,
  email: '',
  date: '',
  message: '',
});

export const resetForm = () =>
  issueCertificateModal.update(() => ({
    open: false,
    automatic: false,
    email: '',
    date: '',
    message: '',
  }));
