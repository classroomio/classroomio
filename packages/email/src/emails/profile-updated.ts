import * as z from 'zod';

import { EMAIL_LOCALES, STUDENT_EMAIL_CATALOG, type EmailLocale } from '@cio/utils/email';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';
import { escapeHtml } from '../utils/functions/email-helpers';

export const PROFILE_UPDATED_FIELDS = ['fullname', 'username', 'avatarUrl', 'locale'] as const;
type ProfileUpdatedField = (typeof PROFILE_UPDATED_FIELDS)[number];

interface ProfileUpdatedCopy {
  subject: string;
  greeting: string;
  bySelf: string;
  byAdmin: string;
  changed: string;
  when: string;
  notYou: string;
  cta: string;
  fields: Record<ProfileUpdatedField, string>;
}

// A security notice, so the copy lives here rather than in the org-editable student email catalog.
const COPY: Record<EmailLocale, ProfileUpdatedCopy> = {
  en: {
    subject: 'Your profile was updated',
    greeting: 'Hi {{name}},',
    bySelf: 'You updated your profile.',
    byAdmin: 'An admin of {{org_name}} updated your profile.',
    changed: 'What changed:',
    when: 'When:',
    notYou: "If you don't recognize this change, sign in to review your profile and change your password.",
    cta: 'Sign in',
    fields: { fullname: 'Name', username: 'Username', avatarUrl: 'Profile picture', locale: 'Language' }
  },
  hi: {
    subject: 'आपकी प्रोफ़ाइल अपडेट की गई',
    greeting: 'नमस्ते {{name}},',
    bySelf: 'आपने अपनी प्रोफ़ाइल अपडेट की।',
    byAdmin: '{{org_name}} के एक एडमिन ने आपकी प्रोफ़ाइल अपडेट की।',
    changed: 'क्या बदला:',
    when: 'कब:',
    notYou: 'अगर आप इस बदलाव को नहीं पहचानते, तो साइन इन करके अपनी प्रोफ़ाइल जाँचें और अपना पासवर्ड बदलें।',
    cta: 'साइन इन करें',
    fields: { fullname: 'नाम', username: 'यूज़रनेम', avatarUrl: 'प्रोफ़ाइल फ़ोटो', locale: 'भाषा' }
  },
  fr: {
    subject: 'Votre profil a été mis à jour',
    greeting: 'Bonjour {{name}},',
    bySelf: 'Vous avez mis à jour votre profil.',
    byAdmin: 'Un administrateur de {{org_name}} a mis à jour votre profil.',
    changed: 'Modifications :',
    when: 'Date :',
    notYou:
      'Si vous ne reconnaissez pas cette modification, connectez-vous pour vérifier votre profil et changez votre mot de passe.',
    cta: 'Se connecter',
    fields: { fullname: 'Nom', username: "Nom d'utilisateur", avatarUrl: 'Photo de profil', locale: 'Langue' }
  },
  pt: {
    subject: 'Seu perfil foi atualizado',
    greeting: 'Olá {{name}},',
    bySelf: 'Você atualizou seu perfil.',
    byAdmin: 'Um administrador de {{org_name}} atualizou seu perfil.',
    changed: 'O que mudou:',
    when: 'Quando:',
    notYou: 'Se você não reconhece esta alteração, entre na sua conta para revisar seu perfil e altere sua senha.',
    cta: 'Entrar',
    fields: { fullname: 'Nome', username: 'Nome de usuário', avatarUrl: 'Foto de perfil', locale: 'Idioma' }
  },
  de: {
    subject: 'Ihr Profil wurde aktualisiert',
    greeting: 'Hallo {{name}},',
    bySelf: 'Sie haben Ihr Profil aktualisiert.',
    byAdmin: 'Ein Administrator von {{org_name}} hat Ihr Profil aktualisiert.',
    changed: 'Was sich geändert hat:',
    when: 'Wann:',
    notYou:
      'Wenn Sie diese Änderung nicht kennen, melden Sie sich an, um Ihr Profil zu prüfen, und ändern Sie Ihr Passwort.',
    cta: 'Anmelden',
    fields: { fullname: 'Name', username: 'Benutzername', avatarUrl: 'Profilbild', locale: 'Sprache' }
  },
  vi: {
    subject: 'Hồ sơ của bạn đã được cập nhật',
    greeting: 'Xin chào {{name}},',
    bySelf: 'Bạn đã cập nhật hồ sơ của mình.',
    byAdmin: 'Một quản trị viên của {{org_name}} đã cập nhật hồ sơ của bạn.',
    changed: 'Thay đổi:',
    when: 'Thời gian:',
    notYou: 'Nếu bạn không nhận ra thay đổi này, hãy đăng nhập để kiểm tra hồ sơ và đổi mật khẩu.',
    cta: 'Đăng nhập',
    fields: { fullname: 'Tên', username: 'Tên người dùng', avatarUrl: 'Ảnh hồ sơ', locale: 'Ngôn ngữ' }
  },
  ru: {
    subject: 'Ваш профиль обновлён',
    greeting: 'Здравствуйте, {{name}}!',
    bySelf: 'Вы обновили свой профиль.',
    byAdmin: 'Администратор {{org_name}} обновил ваш профиль.',
    changed: 'Что изменилось:',
    when: 'Когда:',
    notYou: 'Если вы не узнаёте это изменение, войдите, чтобы проверить профиль, и смените пароль.',
    cta: 'Войти',
    fields: { fullname: 'Имя', username: 'Имя пользователя', avatarUrl: 'Фото профиля', locale: 'Язык' }
  },
  es: {
    subject: 'Tu perfil se ha actualizado',
    greeting: 'Hola {{name}},',
    bySelf: 'Actualizaste tu perfil.',
    byAdmin: 'Un administrador de {{org_name}} actualizó tu perfil.',
    changed: 'Qué cambió:',
    when: 'Cuándo:',
    notYou: 'Si no reconoces este cambio, inicia sesión para revisar tu perfil y cambia tu contraseña.',
    cta: 'Iniciar sesión',
    fields: { fullname: 'Nombre', username: 'Nombre de usuario', avatarUrl: 'Foto de perfil', locale: 'Idioma' }
  },
  pl: {
    subject: 'Twój profil został zaktualizowany',
    greeting: 'Cześć {{name}},',
    bySelf: 'Ta zmiana została wprowadzona z Twojego konta.',
    byAdmin: 'Administrator {{org_name}} zaktualizował Twój profil.',
    changed: 'Co się zmieniło:',
    when: 'Kiedy:',
    notYou: 'Jeśli nie rozpoznajesz tej zmiany, zaloguj się, aby sprawdzić swój profil, i zmień hasło.',
    cta: 'Zaloguj się',
    fields: {
      fullname: 'Imię i nazwisko',
      username: 'Nazwa użytkownika',
      avatarUrl: 'Zdjęcie profilowe',
      locale: 'Język'
    }
  },
  da: {
    subject: 'Din profil er blevet opdateret',
    greeting: 'Hej {{name}},',
    bySelf: 'Du har opdateret din profil.',
    byAdmin: 'En administrator i {{org_name}} har opdateret din profil.',
    changed: 'Hvad er ændret:',
    when: 'Hvornår:',
    notYou: 'Hvis du ikke genkender denne ændring, så log ind for at gennemgå din profil, og skift din adgangskode.',
    cta: 'Log ind',
    fields: { fullname: 'Navn', username: 'Brugernavn', avatarUrl: 'Profilbillede', locale: 'Sprog' }
  },
  tr: {
    subject: 'Profiliniz güncellendi',
    greeting: 'Merhaba {{name}},',
    bySelf: 'Profilinizi güncellediniz.',
    byAdmin: '{{org_name}} yöneticilerinden biri profilinizi güncelledi.',
    changed: 'Değişenler:',
    when: 'Ne zaman:',
    notYou: 'Bu değişikliği tanımıyorsanız, profilinizi kontrol etmek için oturum açın ve şifrenizi değiştirin.',
    cta: 'Oturum aç',
    fields: { fullname: 'Ad', username: 'Kullanıcı adı', avatarUrl: 'Profil fotoğrafı', locale: 'Dil' }
  },
  it: {
    subject: 'Il tuo profilo è stato aggiornato',
    greeting: 'Ciao {{name}},',
    bySelf: 'Hai aggiornato il tuo profilo.',
    byAdmin: 'Un amministratore di {{org_name}} ha aggiornato il tuo profilo.',
    changed: 'Cosa è cambiato:',
    when: 'Quando:',
    notYou: 'Se non riconosci questa modifica, accedi per controllare il tuo profilo e cambia la password.',
    cta: 'Accedi',
    fields: { fullname: 'Nome', username: 'Nome utente', avatarUrl: 'Immagine del profilo', locale: 'Lingua' }
  }
};

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/{{([a-z_]+)}}/g, (_, key: string) => escapeHtml(values[key] ?? ''));
}

function formatChangedAt(changedAt: string, locale: EmailLocale): string {
  const formatted = new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC'
  }).format(new Date(changedAt));

  return `${formatted} UTC`;
}

export const profileUpdatedEmail = defineEmail({
  id: 'profileUpdated',
  subject: (fields) => COPY[fields.locale].subject,
  schema: z.object({
    name: z.string().min(1),
    changedFields: z.array(z.enum(PROFILE_UPDATED_FIELDS)).min(1),
    changedBy: z.enum(['self', 'admin']),
    orgName: z.string().min(1),
    changedAt: z.iso.datetime(),
    locale: z.enum(EMAIL_LOCALES),
    loginUrl: z.url(),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const copy = COPY[fields.locale];
    const values = { name: fields.name, org_name: fields.orgName };
    const actorLine = fields.changedBy === 'admin' ? copy.byAdmin : copy.bySelf;
    const changedList = fields.changedFields.map((field) => escapeHtml(copy.fields[field])).join(', ');

    const content = `
    <p>${fill(copy.greeting, values)}</p>
    <p>${fill(actorLine, values)}</p>
    <p><strong>${escapeHtml(copy.changed)}</strong> ${changedList}</p>
    <p><strong>${escapeHtml(copy.when)}</strong> ${escapeHtml(formatChangedAt(fields.changedAt, fields.locale))}</p>
    <p>${escapeHtml(copy.notYou)}</p>
    <div>
      <a class="button" href="${escapeHtml(fields.loginUrl)}">${escapeHtml(copy.cta)}</a>
    </div>
  `;

    return getDefaultTemplate(content, fields.branding, fields.locale, STUDENT_EMAIL_CATALOG[fields.locale].footer);
  }
});
