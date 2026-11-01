import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const vi: TranslatedMessages<typeof en> = {
  signInTitle: 'Đăng nhập',
  signInSubtitle: 'Dùng tài khoản mà tổ chức của bạn đã mời.',
  or: 'hoặc',
  changeServer: 'Thay đổi',
  emailLabel: 'Email',
  emailPlaceholder: 'ban@congty.com',
  passwordLabel: 'Mật khẩu',
  forgotPassword: 'Quên mật khẩu?',
  passwordPlaceholder: 'Mật khẩu của bạn',
  signInFailed: 'Không thể đăng nhập. Hãy kiểm tra email và mật khẩu.',
  continueWithProvider: 'Tiếp tục với {provider}',
  googleSignInFailedTitle: 'Chưa hoàn tất đăng nhập bằng Google',
  googleSignInFailedDescription: 'Hãy thử lại hoặc đăng nhập bằng email và mật khẩu.',
  signInWithSso: 'Đăng nhập bằng SSO',
  tooManyAttempts: 'Quá nhiều lần thử. Hãy đợi một phút rồi thử lại.',
  ssoRequiredTitle: 'Tổ chức của bạn yêu cầu đăng nhập một lần',
  ssoRequiredDescription: 'Tài khoản thuộc {domain} đăng nhập qua {provider}, không dùng mật khẩu.',
  yourIdentityProvider: 'nhà cung cấp danh tính của bạn',
  ssoSubtitle: 'Dùng email công việc. Nếu tổ chức có đăng nhập một lần, bạn sẽ đăng nhập bằng tài khoản công ty.',
  workEmailLabel: 'Email công việc',
  workEmailInvalid: 'Nhập đầy đủ địa chỉ email công việc.',
  ssoNotSetUp:
    'Đăng nhập một lần chưa được thiết lập cho {domain}. Hãy đăng nhập bằng mật khẩu hoặc hỏi quản trị viên cách tổ chức của bạn đăng nhập.',
  ssoBrowserNote: 'Nhà cung cấp danh tính của tổ chức sẽ mở trong trình duyệt.',
  ssoDidNotFinish: 'Chưa hoàn tất đăng nhập bằng {provider}. Hãy thử lại.',
  singleSignOn: 'đăng nhập một lần',
  ssoCouldNotStart: 'Không thể bắt đầu đăng nhập một lần. Hãy thử lại.',
  resetTitle: 'Đặt lại mật khẩu',
  resetEmailInvalid: 'Nhập địa chỉ email bạn dùng để đăng nhập.',
  resetDescription: 'Chúng tôi gửi email cho bạn một liên kết để đặt mật khẩu mới trong trình duyệt.',
  sendResetLink: 'Gửi liên kết đặt lại',
  checkEmailTitle: 'Kiểm tra email',
  checkEmailDescription:
    'Nếu {email} có tài khoản ClassroomIO, liên kết đặt lại đang được gửi đến. Hãy mở liên kết, chọn mật khẩu mới rồi đăng nhập tại đây.',
  backToSignIn: 'Quay lại đăng nhập',
  useDifferentEmail: 'Dùng email khác',
  resetEmailFailed: 'Không thể gửi email đặt lại. Hãy thử lại.',
  invalidEmail: 'Nhập địa chỉ email hợp lệ.',
  invalidCredentials: 'Email hoặc mật khẩu không đúng.',
  emailNotVerified: 'Hãy xác minh địa chỉ email trước khi đăng nhập. Liên kết có trong hộp thư đến của bạn.'
};
