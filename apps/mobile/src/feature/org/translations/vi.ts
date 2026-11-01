import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const vi: TranslatedMessages<typeof en> = {
  roleAdmin: 'Quản trị viên',
  roleTutor: 'Giảng viên',
  roleStudent: 'Học viên',
  roleMember: 'Thành viên',
  loadError: 'Không tải được tổ chức của bạn',
  noOrgTitle: 'Chưa có tổ chức',
  noOrgDescription: 'Tài khoản này chưa thuộc tổ chức nào. Hãy nhờ quản trị viên đào tạo mời bạn, rồi đăng nhập lại.',
  chooseTitle: 'Chọn tổ chức',
  chooseDescription: 'Bạn có thể đổi tổ chức sau trong hồ sơ.'
};
