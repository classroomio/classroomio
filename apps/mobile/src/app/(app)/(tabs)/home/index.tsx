import { StudentHome } from '@/feature/course/components/student-home';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';
import { AdminHome } from '@/feature/staff/components/admin-home';
import { TutorHome } from '@/feature/staff/components/tutor-home';

export default function HomeScreen() {
  const { role } = useActiveOrg();

  if (role === 'admin') return <AdminHome />;
  if (role === 'tutor') return <TutorHome />;

  return <StudentHome />;
}
