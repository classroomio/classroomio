import { defineSearch, defineInputFields } from 'zapier-platform-core';

import { apiUrl } from '../lib/config';
import { findStudentByEmail, STUDENT_OUTPUT_FIELDS, STUDENT_SAMPLE } from '../lib/lookups';
import { readString } from '../lib/records';

export const findStudent = defineSearch({
  key: 'find_student',
  noun: 'Student',
  display: { label: 'Find Student', description: 'Finds a student in your organization by email.' },
  operation: {
    inputFields: defineInputFields([{ key: 'email', label: 'Email', required: true }]),
    perform: async (z, bundle) => {
      const member = await findStudentByEmail(z, String(bundle.inputData.email));

      return member ? [member] : [];
    },
    sample: STUDENT_SAMPLE,
    outputFields: STUDENT_OUTPUT_FIELDS
  }
});

export const findCourse = defineSearch({
  key: 'find_course',
  noun: 'Course',
  display: { label: 'Find Course', description: 'Finds a course by its slug or exact title.' },
  operation: {
    inputFields: defineInputFields([
      { key: 'slug', label: 'Slug', required: false },
      { key: 'title', label: 'Title', required: false, helpText: 'Exact title. Used when Slug is empty.' }
    ]),
    perform: async (z, bundle) => {
      const slug = readString(bundle.inputData.slug);
      const title = readString(bundle.inputData.title);

      if (!slug && !title) {
        throw new z.errors.Error('Fill in Slug or Title', 'InvalidInput', 400);
      }

      const response = await z.request({ url: apiUrl('/courses'), params: slug ? { slug } : { title: title! } });

      return response.data.data;
    },
    sample: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science'
    }
  }
});

export const searches = [findStudent, findCourse];
