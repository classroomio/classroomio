export const submitForm = async (formData: any) => {
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      throw new Error('Failed to submit the form');
    }

    const data = await response.json();
    console.log('Response from API:', data);
  } catch (error) {
    console.error('Error submitting form:', error);
  }
};
