import { addPathwayCourse, deletePathwayCourse } from '$lib/utils/services/pathways';
import type { PathwayCourse } from '$lib/utils/types';
import { snackbar } from '../Snackbar/store';

import { pathwayCourses } from './store';

export function getIsCourseComplete(completions, profileId: string | undefined): boolean {
  if (!Array.isArray(completions)) return false;
  return completions.some((c) => {
    return c.is_complete && c.profile_id === profileId;
  });
}

export function getPathwayNavItemRoute(pathwayId = '', routeId?: string) {
  const path = `/pathways/${pathwayId}`;

  if (!routeId) {
    return path;
  }

  return `${path}/${routeId}`;
}
export function timeAgo(timestamp: number | string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const timeDifference = Math.abs(now.getTime() - date.getTime());
  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  }
}

export async function saveNewPathwayCourses(newPathwayCourses) {
  for (const newCourse of newPathwayCourses) {
    try {
      console.log('first newCourse', newCourse);
      // Assert that newCourse is of type PathwayCourse
      const typedNewCourse = newCourse as unknown as PathwayCourse;

      const { data, error } = await addPathwayCourse(
        typedNewCourse.pathway_id,
        typedNewCourse.course_id,
        typedNewCourse.order
      );

      if (error) {
        console.error('Error updating course in Supabase:', error);
      }

      if (data && data.length > 0) {
        // takes the first object of the data array (there will always be one object because it's calling the function for each of them)
        const insertedCourse = data[0];
        console.log('insertedCourse', insertedCourse);

        // update the pathwayCourses store with the response of each of the calls from Supabase
        pathwayCourses.update((existingCourses) => [
          ...existingCourses,
          {
            id: insertedCourse.id,
            course_id: insertedCourse.course_id,
            pathway_id: insertedCourse.pathway_id,
            created_at: insertedCourse.created_at,
            updated_at: insertedCourse.updated_at,
            is_unlocked: insertedCourse.is_unlocked,
            order: insertedCourse.order,
            course: {
              ...typedNewCourse.course
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error updating course in Supabase:', error);
    }
  }
}

export async function deleteCourse(deletedCourses: PathwayCourse[]) {
  for (const course of deletedCourses) {
    try {
      // if (course.id) {
      const { error } = await deletePathwayCourse(course.course_id);
      if (error) {
        snackbar.error(error.message);
        return console.error('Error deleting course', error);
      }
      // }

      console.log('updating store...');
      pathwayCourses.update((existingCourses) =>
        existingCourses.filter((c) => c.course_id !== course.course_id)
      );
    } catch (error) {
      console.error('Error deleting course from Supabase:', error);
    }
  }
}
