import type { EmailLocale, StudentEmailLocaleCopy } from './index';

const en: StudentEmailLocaleCopy = {
  footer: { rightsReserved: 'All rights reserved.', website: 'Website', terms: 'Terms', privacy: 'Privacy' },
  templates: {
    studentCourseInvite: {
      subject: 'You are invited to join a course',
      body: '<p>Hi there,</p><p>You have been invited to join <strong>{{course_name}}</strong> on {{org_name}}.</p><p>This invitation expires at <strong>{{expires_at}}</strong>.</p>',
      cta: 'Join course'
    },
    studentCourseWelcome: {
      subject: 'You have access to {{course_name}}',
      body: '<p>Hi there,</p><p>You now have access to <strong>{{course_name}}</strong> in <strong>{{org_name}}</strong>.</p><p>If you run into any issues, reach out to your instructor.</p><p>Cheers,<br>{{org_name}}</p>',
      cta: 'Open course'
    },
    studentCourseCompletion: {
      subject: 'Congratulations — you completed the course requirements',
      body: '<p>Hi {{student_name}},</p><p>Congratulations! You have met the completion requirements for <strong>{{course_name}}</strong>.</p>{{course_message}}<p>Cheers,<br>{{org_name}}</p>',
      cta: 'View certificate'
    },
    studentOrgInvite: {
      subject: 'You have been invited to join as a student',
      body: '<p>Hi there,</p><p>You have been invited to join <strong>{{org_name}}</strong> as a student.</p>{{course_names}}<p>This invitation expires at <strong>{{expires_at}}</strong>.</p>',
      cta: 'Accept invitation'
    },
    studentCohortWelcome: {
      subject: 'You have access to a cohort',
      body: '<p>Hi there,</p><p>You now have access to <strong>{{cohort_name}}</strong> in <strong>{{org_name}}</strong>.</p><p>If you run into any issues, reach out to your instructor.</p><p>Cheers,<br>{{org_name}}</p>',
      cta: 'Open cohort'
    },
    studentProvePayment: {
      subject: 'One more step left',
      body: '<p>Hi {{student_name}},</p><p>You are one step closer to joining <strong>{{course_name}}</strong>.</p><p>Please send your proof of payment to <strong>{{teacher_email}}</strong> to join the course.</p><p>Talk to you soon and see you in class.</p><p>{{org_name}}</p>'
    },
    cohortGoalReminder: {
      subject: 'Reminder: a cohort goal is due soon',
      body: '<p>Hi there,</p><p>The goal <strong>{{goal_title}}</strong> in <strong>{{cohort_name}}</strong> at {{org_name}} needs your attention.</p><p>{{due_status}}</p><p>Your progress: <strong>{{completed_count}} of {{required_count}} courses completed</strong>.</p><p>Cheers,<br>{{org_name}}</p>',
      cta: 'Open the LMS'
    },
    quizAssigned: {
      subject: 'You have a quiz to complete',
      body: '<p>Hi there,</p><p>A quiz — <strong>{{exercise_title}}</strong> — has been assigned to you in <strong>{{course_name}}</strong> at <strong>{{org_name}}</strong>.</p><p>Cheers,<br>{{org_name}}</p>',
      cta: 'Take the quiz'
    },
    sessionReminder: {
      subject: 'Reminder: your live session is coming up',
      body: '<p>Hi there,</p><p>Your live session <strong>{{session_title}}</strong> in <strong>{{course_name}}</strong> starts <strong>{{when}}</strong>.</p><p><strong>When:</strong> {{session_time}}</p><p>See you there,<br>{{org_name}}</p>',
      cta: 'Join the session'
    },
    sessionUpdated: {
      subject: 'Updated: your live session details changed',
      body: '<p>Hi there,</p><p>The live session <strong>{{session_title}}</strong> in <strong>{{course_name}}</strong> has been updated.</p><p><strong>New time:</strong> {{session_time}}</p><p>The attached calendar invitation will update the event on your calendar.</p><p>Cheers,<br>{{org_name}}</p>',
      cta: 'Join the session'
    },
    submissionGraded: {
      subject: 'Your exercise submission has been updated',
      body: '<p>Hello {{student_name}},</p><p>The status of your submission for <strong>{{exercise_title}}</strong> in <strong>{{course_name}}</strong> is now <strong>{{status}}</strong>.</p><p><strong>Your score:</strong> {{score}}</p><p>This exercise is part of the lesson <strong>{{lesson_title}}</strong>.</p>',
      cta: 'Open exercise',
      ctaWhenScored: 'View your result'
    },
    newsfeedPost: {
      subject: 'New post in course',
      body: '<p><strong>{{teacher_name}}</strong> made a post in a course you are taking: <strong>{{course_name}}</strong>.</p>{{post_content}}',
      cta: 'View post'
    }
  }
};

const fr: StudentEmailLocaleCopy = {
  footer: {
    rightsReserved: 'Tous droits réservés.',
    website: 'Site web',
    terms: 'Conditions',
    privacy: 'Confidentialité'
  },
  templates: {
    studentCourseInvite: {
      subject: 'Vous êtes invité à rejoindre un cours',
      body: '<p>Bonjour,</p><p>Vous êtes invité à rejoindre <strong>{{course_name}}</strong> sur {{org_name}}.</p><p>Cette invitation expire le <strong>{{expires_at}}</strong>.</p>',
      cta: 'Rejoindre le cours'
    },
    studentCourseWelcome: {
      subject: 'Vous avez accès à {{course_name}}',
      body: '<p>Bonjour,</p><p>Vous avez maintenant accès à <strong>{{course_name}}</strong> dans <strong>{{org_name}}</strong>.</p><p>En cas de problème, contactez votre formateur.</p><p>À bientôt,<br>{{org_name}}</p>',
      cta: 'Ouvrir le cours'
    },
    studentCourseCompletion: {
      subject: 'Félicitations — vous avez terminé le cours',
      body: '<p>Bonjour {{student_name}},</p><p>Félicitations ! Vous avez rempli les conditions de réussite de <strong>{{course_name}}</strong>.</p>{{course_message}}<p>À bientôt,<br>{{org_name}}</p>',
      cta: 'Voir le certificat'
    },
    studentOrgInvite: {
      subject: 'Vous êtes invité à rejoindre en tant qu’apprenant',
      body: '<p>Bonjour,</p><p>Vous êtes invité à rejoindre <strong>{{org_name}}</strong> en tant qu’apprenant.</p>{{course_names}}<p>Cette invitation expire le <strong>{{expires_at}}</strong>.</p>',
      cta: 'Accepter l’invitation'
    },
    studentCohortWelcome: {
      subject: 'Vous avez accès à une cohorte',
      body: '<p>Bonjour,</p><p>Vous avez maintenant accès à <strong>{{cohort_name}}</strong> dans <strong>{{org_name}}</strong>.</p><p>En cas de problème, contactez votre formateur.</p><p>À bientôt,<br>{{org_name}}</p>',
      cta: 'Ouvrir la cohorte'
    },
    studentProvePayment: {
      subject: 'Encore une étape',
      body: '<p>Bonjour {{student_name}},</p><p>Vous êtes tout près de rejoindre <strong>{{course_name}}</strong>.</p><p>Envoyez votre preuve de paiement à <strong>{{teacher_email}}</strong> pour rejoindre le cours.</p><p>À très bientôt en classe.</p><p>{{org_name}}</p>'
    },
    cohortGoalReminder: {
      subject: 'Rappel : un objectif de cohorte arrive à échéance',
      body: '<p>Bonjour,</p><p>L’objectif <strong>{{goal_title}}</strong> dans <strong>{{cohort_name}}</strong> chez {{org_name}} requiert votre attention.</p><p>{{due_status}}</p><p>Votre progression : <strong>{{completed_count}} cours terminés sur {{required_count}}</strong>.</p><p>À bientôt,<br>{{org_name}}</p>',
      cta: 'Ouvrir le LMS'
    },
    quizAssigned: {
      subject: 'Vous avez un quiz à terminer',
      body: '<p>Bonjour,</p><p>Le quiz <strong>{{exercise_title}}</strong> vous a été attribué dans <strong>{{course_name}}</strong> chez <strong>{{org_name}}</strong>.</p><p>À bientôt,<br>{{org_name}}</p>',
      cta: 'Faire le quiz'
    },
    sessionReminder: {
      subject: 'Rappel : votre session en direct approche',
      body: '<p>Bonjour,</p><p>Votre session <strong>{{session_title}}</strong> dans <strong>{{course_name}}</strong> commence <strong>{{when}}</strong>.</p><p><strong>Quand :</strong> {{session_time}}</p><p>À bientôt,<br>{{org_name}}</p>',
      cta: 'Rejoindre la session'
    },
    sessionUpdated: {
      subject: 'Mise à jour : les détails de votre session ont changé',
      body: '<p>Bonjour,</p><p>La session <strong>{{session_title}}</strong> dans <strong>{{course_name}}</strong> a été mise à jour.</p><p><strong>Nouvel horaire :</strong> {{session_time}}</p><p>L’invitation de calendrier jointe mettra votre événement à jour.</p><p>À bientôt,<br>{{org_name}}</p>',
      cta: 'Rejoindre la session'
    },
    submissionGraded: {
      subject: 'Votre devoir a été mis à jour',
      body: '<p>Bonjour {{student_name}},</p><p>Le statut de votre devoir <strong>{{exercise_title}}</strong> du cours <strong>{{course_name}}</strong> est maintenant <strong>{{status}}</strong>.</p><p><strong>Votre score :</strong> {{score}}</p><p>Cet exercice fait partie de la leçon <strong>{{lesson_title}}</strong>.</p>',
      cta: 'Ouvrir l’exercice',
      ctaWhenScored: 'Voir votre résultat'
    },
    newsfeedPost: {
      subject: 'Nouvelle publication dans le cours',
      body: '<p><strong>{{teacher_name}}</strong> a publié dans un cours que vous suivez : <strong>{{course_name}}</strong>.</p>{{post_content}}',
      cta: 'Voir la publication'
    }
  }
};

const de: StudentEmailLocaleCopy = {
  footer: {
    rightsReserved: 'Alle Rechte vorbehalten.',
    website: 'Website',
    terms: 'Bedingungen',
    privacy: 'Datenschutz'
  },
  templates: {
    studentCourseInvite: {
      subject: 'Sie wurden zu einem Kurs eingeladen',
      body: '<p>Hallo,</p><p>Sie wurden eingeladen, <strong>{{course_name}}</strong> bei {{org_name}} beizutreten.</p><p>Diese Einladung läuft am <strong>{{expires_at}}</strong> ab.</p>',
      cta: 'Kurs beitreten'
    },
    studentCourseWelcome: {
      subject: 'Sie haben Zugriff auf {{course_name}}',
      body: '<p>Hallo,</p><p>Sie haben jetzt Zugriff auf <strong>{{course_name}}</strong> bei <strong>{{org_name}}</strong>.</p><p>Bei Problemen wenden Sie sich an Ihre Lehrkraft.</p><p>Viele Grüße,<br>{{org_name}}</p>',
      cta: 'Kurs öffnen'
    },
    studentCourseCompletion: {
      subject: 'Glückwunsch — Sie haben den Kurs abgeschlossen',
      body: '<p>Hallo {{student_name}},</p><p>Glückwunsch! Sie haben die Anforderungen für <strong>{{course_name}}</strong> erfüllt.</p>{{course_message}}<p>Viele Grüße,<br>{{org_name}}</p>',
      cta: 'Zertifikat ansehen'
    },
    studentOrgInvite: {
      subject: 'Sie wurden als Lernende:r eingeladen',
      body: '<p>Hallo,</p><p>Sie wurden eingeladen, <strong>{{org_name}}</strong> als Lernende:r beizutreten.</p>{{course_names}}<p>Diese Einladung läuft am <strong>{{expires_at}}</strong> ab.</p>',
      cta: 'Einladung annehmen'
    },
    studentCohortWelcome: {
      subject: 'Sie haben Zugriff auf eine Kohorte',
      body: '<p>Hallo,</p><p>Sie haben jetzt Zugriff auf <strong>{{cohort_name}}</strong> bei <strong>{{org_name}}</strong>.</p><p>Bei Problemen wenden Sie sich an Ihre Lehrkraft.</p><p>Viele Grüße,<br>{{org_name}}</p>',
      cta: 'Kohorte öffnen'
    },
    studentProvePayment: {
      subject: 'Nur noch ein Schritt',
      body: '<p>Hallo {{student_name}},</p><p>Sie sind dem Beitritt zu <strong>{{course_name}}</strong> einen Schritt näher.</p><p>Senden Sie Ihren Zahlungsnachweis an <strong>{{teacher_email}}</strong>, um dem Kurs beizutreten.</p><p>Bis bald im Kurs.</p><p>{{org_name}}</p>'
    },
    cohortGoalReminder: {
      subject: 'Erinnerung: Ein Kohortenziel ist bald fällig',
      body: '<p>Hallo,</p><p>Das Ziel <strong>{{goal_title}}</strong> in <strong>{{cohort_name}}</strong> bei {{org_name}} benötigt Ihre Aufmerksamkeit.</p><p>{{due_status}}</p><p>Fortschritt: <strong>{{completed_count}} von {{required_count}} Kursen abgeschlossen</strong>.</p><p>Viele Grüße,<br>{{org_name}}</p>',
      cta: 'LMS öffnen'
    },
    quizAssigned: {
      subject: 'Sie haben ein Quiz zu erledigen',
      body: '<p>Hallo,</p><p>Das Quiz <strong>{{exercise_title}}</strong> wurde Ihnen in <strong>{{course_name}}</strong> bei <strong>{{org_name}}</strong> zugewiesen.</p><p>Viele Grüße,<br>{{org_name}}</p>',
      cta: 'Quiz starten'
    },
    sessionReminder: {
      subject: 'Erinnerung: Ihre Live-Sitzung beginnt bald',
      body: '<p>Hallo,</p><p>Ihre Live-Sitzung <strong>{{session_title}}</strong> in <strong>{{course_name}}</strong> beginnt <strong>{{when}}</strong>.</p><p><strong>Zeit:</strong> {{session_time}}</p><p>Bis gleich,<br>{{org_name}}</p>',
      cta: 'Sitzung beitreten'
    },
    sessionUpdated: {
      subject: 'Aktualisiert: Ihre Sitzungsdetails wurden geändert',
      body: '<p>Hallo,</p><p>Die Live-Sitzung <strong>{{session_title}}</strong> in <strong>{{course_name}}</strong> wurde aktualisiert.</p><p><strong>Neue Zeit:</strong> {{session_time}}</p><p>Die angehängte Kalendereinladung aktualisiert Ihren Termin.</p><p>Viele Grüße,<br>{{org_name}}</p>',
      cta: 'Sitzung beitreten'
    },
    submissionGraded: {
      subject: 'Ihre Einreichung wurde aktualisiert',
      body: '<p>Hallo {{student_name}},</p><p>Der Status Ihrer Einreichung für <strong>{{exercise_title}}</strong> im Kurs <strong>{{course_name}}</strong> ist jetzt <strong>{{status}}</strong>.</p><p><strong>Ihre Punktzahl:</strong> {{score}}</p><p>Diese Übung gehört zur Lektion <strong>{{lesson_title}}</strong>.</p>',
      cta: 'Übung öffnen',
      ctaWhenScored: 'Ergebnis ansehen'
    },
    newsfeedPost: {
      subject: 'Neuer Beitrag im Kurs',
      body: '<p><strong>{{teacher_name}}</strong> hat in Ihrem Kurs <strong>{{course_name}}</strong> einen Beitrag veröffentlicht.</p>{{post_content}}',
      cta: 'Beitrag ansehen'
    }
  }
};

const es: StudentEmailLocaleCopy = {
  footer: {
    rightsReserved: 'Todos los derechos reservados.',
    website: 'Sitio web',
    terms: 'Términos',
    privacy: 'Privacidad'
  },
  templates: {
    studentCourseInvite: {
      subject: 'Te han invitado a unirte a un curso',
      body: '<p>Hola,</p><p>Te han invitado a unirte a <strong>{{course_name}}</strong> en {{org_name}}.</p><p>Esta invitación vence el <strong>{{expires_at}}</strong>.</p>',
      cta: 'Unirse al curso'
    },
    studentCourseWelcome: {
      subject: 'Tienes acceso a {{course_name}}',
      body: '<p>Hola,</p><p>Ya tienes acceso a <strong>{{course_name}}</strong> en <strong>{{org_name}}</strong>.</p><p>Si tienes algún problema, contacta con tu instructor.</p><p>Saludos,<br>{{org_name}}</p>',
      cta: 'Abrir curso'
    },
    studentCourseCompletion: {
      subject: 'Enhorabuena: has completado el curso',
      body: '<p>Hola {{student_name}},</p><p>¡Enhorabuena! Has cumplido los requisitos de <strong>{{course_name}}</strong>.</p>{{course_message}}<p>Saludos,<br>{{org_name}}</p>',
      cta: 'Ver certificado'
    },
    studentOrgInvite: {
      subject: 'Te han invitado a unirte como estudiante',
      body: '<p>Hola,</p><p>Te han invitado a unirte a <strong>{{org_name}}</strong> como estudiante.</p>{{course_names}}<p>Esta invitación vence el <strong>{{expires_at}}</strong>.</p>',
      cta: 'Aceptar invitación'
    },
    studentCohortWelcome: {
      subject: 'Tienes acceso a una cohorte',
      body: '<p>Hola,</p><p>Ya tienes acceso a <strong>{{cohort_name}}</strong> en <strong>{{org_name}}</strong>.</p><p>Si tienes algún problema, contacta con tu instructor.</p><p>Saludos,<br>{{org_name}}</p>',
      cta: 'Abrir cohorte'
    },
    studentProvePayment: {
      subject: 'Solo falta un paso',
      body: '<p>Hola {{student_name}},</p><p>Estás más cerca de unirte a <strong>{{course_name}}</strong>.</p><p>Envía el comprobante de pago a <strong>{{teacher_email}}</strong> para unirte al curso.</p><p>Nos vemos pronto en clase.</p><p>{{org_name}}</p>'
    },
    cohortGoalReminder: {
      subject: 'Recordatorio: se acerca la fecha de un objetivo',
      body: '<p>Hola,</p><p>El objetivo <strong>{{goal_title}}</strong> de <strong>{{cohort_name}}</strong> en {{org_name}} necesita tu atención.</p><p>{{due_status}}</p><p>Tu progreso: <strong>{{completed_count}} de {{required_count}} cursos completados</strong>.</p><p>Saludos,<br>{{org_name}}</p>',
      cta: 'Abrir el LMS'
    },
    quizAssigned: {
      subject: 'Tienes un cuestionario pendiente',
      body: '<p>Hola,</p><p>Se te ha asignado el cuestionario <strong>{{exercise_title}}</strong> en <strong>{{course_name}}</strong> de <strong>{{org_name}}</strong>.</p><p>Saludos,<br>{{org_name}}</p>',
      cta: 'Hacer el cuestionario'
    },
    sessionReminder: {
      subject: 'Recordatorio: tu sesión en directo se acerca',
      body: '<p>Hola,</p><p>Tu sesión <strong>{{session_title}}</strong> de <strong>{{course_name}}</strong> comienza <strong>{{when}}</strong>.</p><p><strong>Cuándo:</strong> {{session_time}}</p><p>Nos vemos,<br>{{org_name}}</p>',
      cta: 'Unirse a la sesión'
    },
    sessionUpdated: {
      subject: 'Actualización: cambiaron los datos de tu sesión',
      body: '<p>Hola,</p><p>La sesión <strong>{{session_title}}</strong> de <strong>{{course_name}}</strong> se ha actualizado.</p><p><strong>Nueva hora:</strong> {{session_time}}</p><p>La invitación de calendario adjunta actualizará el evento.</p><p>Saludos,<br>{{org_name}}</p>',
      cta: 'Unirse a la sesión'
    },
    submissionGraded: {
      subject: 'Tu entrega se ha actualizado',
      body: '<p>Hola {{student_name}},</p><p>El estado de tu entrega de <strong>{{exercise_title}}</strong> del curso <strong>{{course_name}}</strong> ahora es <strong>{{status}}</strong>.</p><p><strong>Tu puntuación:</strong> {{score}}</p><p>Este ejercicio corresponde a la lección <strong>{{lesson_title}}</strong>.</p>',
      cta: 'Abrir ejercicio',
      ctaWhenScored: 'Ver tu resultado'
    },
    newsfeedPost: {
      subject: 'Nueva publicación en el curso',
      body: '<p><strong>{{teacher_name}}</strong> publicó en uno de tus cursos: <strong>{{course_name}}</strong>.</p>{{post_content}}',
      cta: 'Ver publicación'
    }
  }
};

const pt: StudentEmailLocaleCopy = {
  footer: { rightsReserved: 'Todos os direitos reservados.', website: 'Site', terms: 'Termos', privacy: 'Privacidade' },
  templates: {
    studentCourseInvite: {
      subject: 'Você foi convidado para participar de um curso',
      body: '<p>Olá,</p><p>Você foi convidado para participar de <strong>{{course_name}}</strong> na {{org_name}}.</p><p>Este convite expira em <strong>{{expires_at}}</strong>.</p>',
      cta: 'Participar do curso'
    },
    studentCourseWelcome: {
      subject: 'Você tem acesso a {{course_name}}',
      body: '<p>Olá,</p><p>Agora você tem acesso a <strong>{{course_name}}</strong> na <strong>{{org_name}}</strong>.</p><p>Se tiver algum problema, fale com seu instrutor.</p><p>Até breve,<br>{{org_name}}</p>',
      cta: 'Abrir curso'
    },
    studentCourseCompletion: {
      subject: 'Parabéns — você concluiu o curso',
      body: '<p>Olá, {{student_name}},</p><p>Parabéns! Você cumpriu os requisitos de <strong>{{course_name}}</strong>.</p>{{course_message}}<p>Até breve,<br>{{org_name}}</p>',
      cta: 'Ver certificado'
    },
    studentOrgInvite: {
      subject: 'Você foi convidado para participar como aluno',
      body: '<p>Olá,</p><p>Você foi convidado para participar da <strong>{{org_name}}</strong> como aluno.</p>{{course_names}}<p>Este convite expira em <strong>{{expires_at}}</strong>.</p>',
      cta: 'Aceitar convite'
    },
    studentCohortWelcome: {
      subject: 'Você tem acesso a uma turma',
      body: '<p>Olá,</p><p>Agora você tem acesso a <strong>{{cohort_name}}</strong> na <strong>{{org_name}}</strong>.</p><p>Se tiver algum problema, fale com seu instrutor.</p><p>Até breve,<br>{{org_name}}</p>',
      cta: 'Abrir turma'
    },
    studentProvePayment: {
      subject: 'Falta só mais um passo',
      body: '<p>Olá, {{student_name}},</p><p>Você está mais perto de participar de <strong>{{course_name}}</strong>.</p><p>Envie o comprovante de pagamento para <strong>{{teacher_email}}</strong> para entrar no curso.</p><p>Nos vemos em breve na aula.</p><p>{{org_name}}</p>'
    },
    cohortGoalReminder: {
      subject: 'Lembrete: uma meta da turma vence em breve',
      body: '<p>Olá,</p><p>A meta <strong>{{goal_title}}</strong> em <strong>{{cohort_name}}</strong> na {{org_name}} precisa da sua atenção.</p><p>{{due_status}}</p><p>Seu progresso: <strong>{{completed_count}} de {{required_count}} cursos concluídos</strong>.</p><p>Até breve,<br>{{org_name}}</p>',
      cta: 'Abrir o LMS'
    },
    quizAssigned: {
      subject: 'Você tem um questionário para concluir',
      body: '<p>Olá,</p><p>O questionário <strong>{{exercise_title}}</strong> foi atribuído a você em <strong>{{course_name}}</strong> na <strong>{{org_name}}</strong>.</p><p>Até breve,<br>{{org_name}}</p>',
      cta: 'Fazer questionário'
    },
    sessionReminder: {
      subject: 'Lembrete: sua sessão ao vivo está próxima',
      body: '<p>Olá,</p><p>Sua sessão <strong>{{session_title}}</strong> em <strong>{{course_name}}</strong> começa <strong>{{when}}</strong>.</p><p><strong>Quando:</strong> {{session_time}}</p><p>Até lá,<br>{{org_name}}</p>',
      cta: 'Entrar na sessão'
    },
    sessionUpdated: {
      subject: 'Atualização: os dados da sua sessão mudaram',
      body: '<p>Olá,</p><p>A sessão <strong>{{session_title}}</strong> em <strong>{{course_name}}</strong> foi atualizada.</p><p><strong>Novo horário:</strong> {{session_time}}</p><p>O convite de calendário anexado atualizará o evento.</p><p>Até breve,<br>{{org_name}}</p>',
      cta: 'Entrar na sessão'
    },
    submissionGraded: {
      subject: 'Sua atividade foi atualizada',
      body: '<p>Olá, {{student_name}},</p><p>O status da sua atividade <strong>{{exercise_title}}</strong> do curso <strong>{{course_name}}</strong> agora é <strong>{{status}}</strong>.</p><p><strong>Sua pontuação:</strong> {{score}}</p><p>Este exercício pertence à lição <strong>{{lesson_title}}</strong>.</p>',
      cta: 'Abrir exercício',
      ctaWhenScored: 'Ver seu resultado'
    },
    newsfeedPost: {
      subject: 'Nova publicação no curso',
      body: '<p><strong>{{teacher_name}}</strong> publicou em um curso que você faz: <strong>{{course_name}}</strong>.</p>{{post_content}}',
      cta: 'Ver publicação'
    }
  }
};

const hi: StudentEmailLocaleCopy = {
  footer: { rightsReserved: 'सर्वाधिकार सुरक्षित।', website: 'वेबसाइट', terms: 'शर्तें', privacy: 'गोपनीयता' },
  templates: {
    studentCourseInvite: {
      subject: 'आपको एक कोर्स में शामिल होने के लिए आमंत्रित किया गया है',
      body: '<p>नमस्ते,</p><p>आपको {{org_name}} पर <strong>{{course_name}}</strong> में शामिल होने के लिए आमंत्रित किया गया है।</p><p>यह आमंत्रण <strong>{{expires_at}}</strong> को समाप्त होगा।</p>',
      cta: 'कोर्स में शामिल हों'
    },
    studentCourseWelcome: {
      subject: 'आपको {{course_name}} की पहुँच मिल गई है',
      body: '<p>नमस्ते,</p><p>अब आपको <strong>{{org_name}}</strong> में <strong>{{course_name}}</strong> की पहुँच है।</p><p>किसी समस्या पर अपने प्रशिक्षक से संपर्क करें।</p><p>शुभकामनाएँ,<br>{{org_name}}</p>',
      cta: 'कोर्स खोलें'
    },
    studentCourseCompletion: {
      subject: 'बधाई — आपने कोर्स पूरा कर लिया',
      body: '<p>नमस्ते {{student_name}},</p><p>बधाई! आपने <strong>{{course_name}}</strong> की पूर्णता आवश्यकताएँ पूरी कर ली हैं।</p>{{course_message}}<p>शुभकामनाएँ,<br>{{org_name}}</p>',
      cta: 'प्रमाणपत्र देखें'
    },
    studentOrgInvite: {
      subject: 'आपको विद्यार्थी के रूप में शामिल होने का आमंत्रण मिला है',
      body: '<p>नमस्ते,</p><p>आपको विद्यार्थी के रूप में <strong>{{org_name}}</strong> में शामिल होने के लिए आमंत्रित किया गया है।</p>{{course_names}}<p>यह आमंत्रण <strong>{{expires_at}}</strong> को समाप्त होगा।</p>',
      cta: 'आमंत्रण स्वीकार करें'
    },
    studentCohortWelcome: {
      subject: 'आपको एक समूह की पहुँच मिल गई है',
      body: '<p>नमस्ते,</p><p>अब आपको <strong>{{org_name}}</strong> में <strong>{{cohort_name}}</strong> की पहुँच है।</p><p>किसी समस्या पर अपने प्रशिक्षक से संपर्क करें।</p><p>शुभकामनाएँ,<br>{{org_name}}</p>',
      cta: 'समूह खोलें'
    },
    studentProvePayment: {
      subject: 'बस एक कदम और',
      body: '<p>नमस्ते {{student_name}},</p><p>आप <strong>{{course_name}}</strong> में शामिल होने के एक कदम और करीब हैं।</p><p>कोर्स में शामिल होने के लिए भुगतान प्रमाण <strong>{{teacher_email}}</strong> पर भेजें।</p><p>कक्षा में जल्द मिलेंगे।</p><p>{{org_name}}</p>'
    },
    cohortGoalReminder: {
      subject: 'रिमाइंडर: समूह का लक्ष्य जल्द पूरा करना है',
      body: '<p>नमस्ते,</p><p>{{org_name}} के <strong>{{cohort_name}}</strong> में लक्ष्य <strong>{{goal_title}}</strong> पर ध्यान देने की आवश्यकता है।</p><p>{{due_status}}</p><p>आपकी प्रगति: <strong>{{required_count}} में से {{completed_count}} कोर्स पूरे</strong>।</p><p>शुभकामनाएँ,<br>{{org_name}}</p>',
      cta: 'LMS खोलें'
    },
    quizAssigned: {
      subject: 'आपको एक क्विज़ पूरा करना है',
      body: '<p>नमस्ते,</p><p><strong>{{org_name}}</strong> के <strong>{{course_name}}</strong> में क्विज़ <strong>{{exercise_title}}</strong> आपको दिया गया है।</p><p>शुभकामनाएँ,<br>{{org_name}}</p>',
      cta: 'क्विज़ शुरू करें'
    },
    sessionReminder: {
      subject: 'रिमाइंडर: आपका लाइव सत्र जल्द शुरू होगा',
      body: '<p>नमस्ते,</p><p><strong>{{course_name}}</strong> में आपका लाइव सत्र <strong>{{session_title}}</strong> <strong>{{when}}</strong> शुरू होगा।</p><p><strong>समय:</strong> {{session_time}}</p><p>वहाँ मिलते हैं,<br>{{org_name}}</p>',
      cta: 'सत्र में शामिल हों'
    },
    sessionUpdated: {
      subject: 'अपडेट: आपके लाइव सत्र का विवरण बदल गया है',
      body: '<p>नमस्ते,</p><p><strong>{{course_name}}</strong> में लाइव सत्र <strong>{{session_title}}</strong> अपडेट किया गया है।</p><p><strong>नया समय:</strong> {{session_time}}</p><p>संलग्न कैलेंडर आमंत्रण आपके ईवेंट को अपडेट कर देगा।</p><p>शुभकामनाएँ,<br>{{org_name}}</p>',
      cta: 'सत्र में शामिल हों'
    },
    submissionGraded: {
      subject: 'आपकी गतिविधि अपडेट हो गई है',
      body: '<p>नमस्ते {{student_name}},</p><p><strong>{{course_name}}</strong> में <strong>{{exercise_title}}</strong> के लिए आपकी गतिविधि की स्थिति अब <strong>{{status}}</strong> है।</p><p><strong>आपका स्कोर:</strong> {{score}}</p><p>यह अभ्यास <strong>{{lesson_title}}</strong> पाठ का हिस्सा है।</p>',
      cta: 'अभ्यास खोलें',
      ctaWhenScored: 'अपना परिणाम देखें'
    },
    newsfeedPost: {
      subject: 'कोर्स में नई पोस्ट',
      body: '<p><strong>{{teacher_name}}</strong> ने आपके कोर्स <strong>{{course_name}}</strong> में पोस्ट की है।</p>{{post_content}}',
      cta: 'पोस्ट देखें'
    }
  }
};

const vi: StudentEmailLocaleCopy = {
  footer: {
    rightsReserved: 'Đã đăng ký bản quyền.',
    website: 'Trang web',
    terms: 'Điều khoản',
    privacy: 'Quyền riêng tư'
  },
  templates: {
    studentCourseInvite: {
      subject: 'Bạn được mời tham gia một khóa học',
      body: '<p>Xin chào,</p><p>Bạn được mời tham gia <strong>{{course_name}}</strong> tại {{org_name}}.</p><p>Lời mời này hết hạn vào <strong>{{expires_at}}</strong>.</p>',
      cta: 'Tham gia khóa học'
    },
    studentCourseWelcome: {
      subject: 'Bạn đã có quyền truy cập {{course_name}}',
      body: '<p>Xin chào,</p><p>Bạn đã có quyền truy cập <strong>{{course_name}}</strong> tại <strong>{{org_name}}</strong>.</p><p>Nếu gặp vấn đề, hãy liên hệ với giảng viên.</p><p>Thân mến,<br>{{org_name}}</p>',
      cta: 'Mở khóa học'
    },
    studentCourseCompletion: {
      subject: 'Chúc mừng — bạn đã hoàn thành khóa học',
      body: '<p>Xin chào {{student_name}},</p><p>Chúc mừng! Bạn đã đáp ứng yêu cầu hoàn thành <strong>{{course_name}}</strong>.</p>{{course_message}}<p>Thân mến,<br>{{org_name}}</p>',
      cta: 'Xem chứng chỉ'
    },
    studentOrgInvite: {
      subject: 'Bạn được mời tham gia với tư cách học viên',
      body: '<p>Xin chào,</p><p>Bạn được mời tham gia <strong>{{org_name}}</strong> với tư cách học viên.</p>{{course_names}}<p>Lời mời này hết hạn vào <strong>{{expires_at}}</strong>.</p>',
      cta: 'Chấp nhận lời mời'
    },
    studentCohortWelcome: {
      subject: 'Bạn đã có quyền truy cập một nhóm học',
      body: '<p>Xin chào,</p><p>Bạn đã có quyền truy cập <strong>{{cohort_name}}</strong> tại <strong>{{org_name}}</strong>.</p><p>Nếu gặp vấn đề, hãy liên hệ với giảng viên.</p><p>Thân mến,<br>{{org_name}}</p>',
      cta: 'Mở nhóm học'
    },
    studentProvePayment: {
      subject: 'Chỉ còn một bước nữa',
      body: '<p>Xin chào {{student_name}},</p><p>Bạn đã tiến gần hơn đến việc tham gia <strong>{{course_name}}</strong>.</p><p>Hãy gửi bằng chứng thanh toán đến <strong>{{teacher_email}}</strong> để tham gia khóa học.</p><p>Hẹn gặp bạn trong lớp.</p><p>{{org_name}}</p>'
    },
    cohortGoalReminder: {
      subject: 'Nhắc nhở: mục tiêu nhóm học sắp đến hạn',
      body: '<p>Xin chào,</p><p>Mục tiêu <strong>{{goal_title}}</strong> trong <strong>{{cohort_name}}</strong> tại {{org_name}} cần bạn chú ý.</p><p>{{due_status}}</p><p>Tiến độ: <strong>đã hoàn thành {{completed_count}}/{{required_count}} khóa học</strong>.</p><p>Thân mến,<br>{{org_name}}</p>',
      cta: 'Mở LMS'
    },
    quizAssigned: {
      subject: 'Bạn có một bài kiểm tra cần hoàn thành',
      body: '<p>Xin chào,</p><p>Bài kiểm tra <strong>{{exercise_title}}</strong> đã được giao cho bạn trong <strong>{{course_name}}</strong> tại <strong>{{org_name}}</strong>.</p><p>Thân mến,<br>{{org_name}}</p>',
      cta: 'Làm bài kiểm tra'
    },
    sessionReminder: {
      subject: 'Nhắc nhở: buổi học trực tiếp sắp bắt đầu',
      body: '<p>Xin chào,</p><p>Buổi học <strong>{{session_title}}</strong> trong <strong>{{course_name}}</strong> bắt đầu <strong>{{when}}</strong>.</p><p><strong>Thời gian:</strong> {{session_time}}</p><p>Hẹn gặp bạn,<br>{{org_name}}</p>',
      cta: 'Tham gia buổi học'
    },
    sessionUpdated: {
      subject: 'Cập nhật: thông tin buổi học đã thay đổi',
      body: '<p>Xin chào,</p><p>Buổi học <strong>{{session_title}}</strong> trong <strong>{{course_name}}</strong> đã được cập nhật.</p><p><strong>Thời gian mới:</strong> {{session_time}}</p><p>Lời mời lịch đính kèm sẽ cập nhật sự kiện của bạn.</p><p>Thân mến,<br>{{org_name}}</p>',
      cta: 'Tham gia buổi học'
    },
    submissionGraded: {
      subject: 'Bài nộp của bạn đã được cập nhật',
      body: '<p>Xin chào {{student_name}},</p><p>Trạng thái bài nộp <strong>{{exercise_title}}</strong> trong khóa học <strong>{{course_name}}</strong> hiện là <strong>{{status}}</strong>.</p><p><strong>Điểm của bạn:</strong> {{score}}</p><p>Bài tập này thuộc bài học <strong>{{lesson_title}}</strong>.</p>',
      cta: 'Mở bài tập',
      ctaWhenScored: 'Xem kết quả của bạn'
    },
    newsfeedPost: {
      subject: 'Bài đăng mới trong khóa học',
      body: '<p><strong>{{teacher_name}}</strong> đã đăng bài trong khóa học <strong>{{course_name}}</strong>.</p>{{post_content}}',
      cta: 'Xem bài đăng'
    }
  }
};

const ru: StudentEmailLocaleCopy = {
  footer: { rightsReserved: 'Все права защищены.', website: 'Сайт', terms: 'Условия', privacy: 'Конфиденциальность' },
  templates: {
    studentCourseInvite: {
      subject: 'Вас пригласили на курс',
      body: '<p>Здравствуйте!</p><p>Вас пригласили на курс <strong>{{course_name}}</strong> в {{org_name}}.</p><p>Приглашение действительно до <strong>{{expires_at}}</strong>.</p>',
      cta: 'Присоединиться к курсу'
    },
    studentCourseWelcome: {
      subject: 'Вам доступен курс {{course_name}}',
      body: '<p>Здравствуйте!</p><p>Теперь вам доступен курс <strong>{{course_name}}</strong> в <strong>{{org_name}}</strong>.</p><p>Если возникнут проблемы, обратитесь к преподавателю.</p><p>С уважением,<br>{{org_name}}</p>',
      cta: 'Открыть курс'
    },
    studentCourseCompletion: {
      subject: 'Поздравляем — вы завершили курс',
      body: '<p>Здравствуйте, {{student_name}}!</p><p>Поздравляем! Вы выполнили требования курса <strong>{{course_name}}</strong>.</p>{{course_message}}<p>С уважением,<br>{{org_name}}</p>',
      cta: 'Посмотреть сертификат'
    },
    studentOrgInvite: {
      subject: 'Вас пригласили присоединиться как учащегося',
      body: '<p>Здравствуйте!</p><p>Вас пригласили присоединиться к <strong>{{org_name}}</strong> как учащегося.</p>{{course_names}}<p>Приглашение действительно до <strong>{{expires_at}}</strong>.</p>',
      cta: 'Принять приглашение'
    },
    studentCohortWelcome: {
      subject: 'Вам доступна учебная группа',
      body: '<p>Здравствуйте!</p><p>Теперь вам доступна группа <strong>{{cohort_name}}</strong> в <strong>{{org_name}}</strong>.</p><p>Если возникнут проблемы, обратитесь к преподавателю.</p><p>С уважением,<br>{{org_name}}</p>',
      cta: 'Открыть группу'
    },
    studentProvePayment: {
      subject: 'Остался ещё один шаг',
      body: '<p>Здравствуйте, {{student_name}}!</p><p>Вы стали ближе к участию в <strong>{{course_name}}</strong>.</p><p>Отправьте подтверждение оплаты на <strong>{{teacher_email}}</strong>, чтобы присоединиться к курсу.</p><p>До встречи на занятии.</p><p>{{org_name}}</p>'
    },
    cohortGoalReminder: {
      subject: 'Напоминание: срок цели группы скоро истекает',
      body: '<p>Здравствуйте!</p><p>Цель <strong>{{goal_title}}</strong> в <strong>{{cohort_name}}</strong> от {{org_name}} требует вашего внимания.</p><p>{{due_status}}</p><p>Прогресс: <strong>завершено {{completed_count}} из {{required_count}} курсов</strong>.</p><p>С уважением,<br>{{org_name}}</p>',
      cta: 'Открыть LMS'
    },
    quizAssigned: {
      subject: 'Вам назначен тест',
      body: '<p>Здравствуйте!</p><p>Вам назначен тест <strong>{{exercise_title}}</strong> в курсе <strong>{{course_name}}</strong> от <strong>{{org_name}}</strong>.</p><p>С уважением,<br>{{org_name}}</p>',
      cta: 'Пройти тест'
    },
    sessionReminder: {
      subject: 'Напоминание: скоро начнётся онлайн-занятие',
      body: '<p>Здравствуйте!</p><p>Занятие <strong>{{session_title}}</strong> в <strong>{{course_name}}</strong> начнётся <strong>{{when}}</strong>.</p><p><strong>Время:</strong> {{session_time}}</p><p>До встречи,<br>{{org_name}}</p>',
      cta: 'Присоединиться'
    },
    sessionUpdated: {
      subject: 'Обновление: данные онлайн-занятия изменились',
      body: '<p>Здравствуйте!</p><p>Занятие <strong>{{session_title}}</strong> в <strong>{{course_name}}</strong> обновлено.</p><p><strong>Новое время:</strong> {{session_time}}</p><p>Приложенное приглашение обновит событие в календаре.</p><p>С уважением,<br>{{org_name}}</p>',
      cta: 'Присоединиться'
    },
    submissionGraded: {
      subject: 'Ваша работа обновлена',
      body: '<p>Здравствуйте, {{student_name}}!</p><p>Статус работы <strong>{{exercise_title}}</strong> в курсе <strong>{{course_name}}</strong>: <strong>{{status}}</strong>.</p><p><strong>Ваш результат:</strong> {{score}}</p><p>Это задание относится к уроку <strong>{{lesson_title}}</strong>.</p>',
      cta: 'Открыть задание',
      ctaWhenScored: 'Посмотреть результат'
    },
    newsfeedPost: {
      subject: 'Новая публикация в курсе',
      body: '<p><strong>{{teacher_name}}</strong> опубликовал(а) запись в курсе <strong>{{course_name}}</strong>.</p>{{post_content}}',
      cta: 'Посмотреть публикацию'
    }
  }
};

const pl: StudentEmailLocaleCopy = {
  footer: { rightsReserved: 'Wszelkie prawa zastrzeżone.', website: 'Strona', terms: 'Warunki', privacy: 'Prywatność' },
  templates: {
    studentCourseInvite: {
      subject: 'Zaproszono Cię do kursu',
      body: '<p>Cześć,</p><p>Zaproszono Cię do kursu <strong>{{course_name}}</strong> w {{org_name}}.</p><p>Zaproszenie wygasa <strong>{{expires_at}}</strong>.</p>',
      cta: 'Dołącz do kursu'
    },
    studentCourseWelcome: {
      subject: 'Masz dostęp do {{course_name}}',
      body: '<p>Cześć,</p><p>Masz teraz dostęp do <strong>{{course_name}}</strong> w <strong>{{org_name}}</strong>.</p><p>W razie problemów skontaktuj się z prowadzącym.</p><p>Pozdrawiamy,<br>{{org_name}}</p>',
      cta: 'Otwórz kurs'
    },
    studentCourseCompletion: {
      subject: 'Gratulacje — kurs został ukończony',
      body: '<p>Cześć {{student_name}},</p><p>Gratulacje! Spełniasz wymagania ukończenia kursu <strong>{{course_name}}</strong>.</p>{{course_message}}<p>Pozdrawiamy,<br>{{org_name}}</p>',
      cta: 'Zobacz certyfikat'
    },
    studentOrgInvite: {
      subject: 'Zaproszono Cię jako osobę uczącą się',
      body: '<p>Cześć,</p><p>Zaproszono Cię do <strong>{{org_name}}</strong> jako osobę uczącą się.</p>{{course_names}}<p>Zaproszenie wygasa <strong>{{expires_at}}</strong>.</p>',
      cta: 'Przyjmij zaproszenie'
    },
    studentCohortWelcome: {
      subject: 'Masz dostęp do grupy',
      body: '<p>Cześć,</p><p>Masz teraz dostęp do <strong>{{cohort_name}}</strong> w <strong>{{org_name}}</strong>.</p><p>W razie problemów skontaktuj się z prowadzącym.</p><p>Pozdrawiamy,<br>{{org_name}}</p>',
      cta: 'Otwórz grupę'
    },
    studentProvePayment: {
      subject: 'Jeszcze tylko jeden krok',
      body: '<p>Cześć {{student_name}},</p><p>Jesteś o krok bliżej dołączenia do <strong>{{course_name}}</strong>.</p><p>Wyślij potwierdzenie płatności na <strong>{{teacher_email}}</strong>, aby dołączyć do kursu.</p><p>Do zobaczenia na zajęciach.</p><p>{{org_name}}</p>'
    },
    cohortGoalReminder: {
      subject: 'Przypomnienie: zbliża się termin celu grupy',
      body: '<p>Cześć,</p><p>Cel <strong>{{goal_title}}</strong> w <strong>{{cohort_name}}</strong> w {{org_name}} wymaga Twojej uwagi.</p><p>{{due_status}}</p><p>Postęp: <strong>ukończono {{completed_count}} z {{required_count}} kursów</strong>.</p><p>Pozdrawiamy,<br>{{org_name}}</p>',
      cta: 'Otwórz LMS'
    },
    quizAssigned: {
      subject: 'Masz quiz do ukończenia',
      body: '<p>Cześć,</p><p>Przypisano Ci quiz <strong>{{exercise_title}}</strong> w kursie <strong>{{course_name}}</strong> w <strong>{{org_name}}</strong>.</p><p>Pozdrawiamy,<br>{{org_name}}</p>',
      cta: 'Rozwiąż quiz'
    },
    sessionReminder: {
      subject: 'Przypomnienie: sesja na żywo wkrótce się zacznie',
      body: '<p>Cześć,</p><p>Sesja <strong>{{session_title}}</strong> w <strong>{{course_name}}</strong> zaczyna się <strong>{{when}}</strong>.</p><p><strong>Kiedy:</strong> {{session_time}}</p><p>Do zobaczenia,<br>{{org_name}}</p>',
      cta: 'Dołącz do sesji'
    },
    sessionUpdated: {
      subject: 'Aktualizacja: zmieniono szczegóły sesji',
      body: '<p>Cześć,</p><p>Sesja <strong>{{session_title}}</strong> w <strong>{{course_name}}</strong> została zaktualizowana.</p><p><strong>Nowy termin:</strong> {{session_time}}</p><p>Załączone zaproszenie zaktualizuje wydarzenie w kalendarzu.</p><p>Pozdrawiamy,<br>{{org_name}}</p>',
      cta: 'Dołącz do sesji'
    },
    submissionGraded: {
      subject: 'Twoje zadanie zostało zaktualizowane',
      body: '<p>Cześć {{student_name}},</p><p>Status zadania <strong>{{exercise_title}}</strong> w kursie <strong>{{course_name}}</strong> to teraz <strong>{{status}}</strong>.</p><p><strong>Twój wynik:</strong> {{score}}</p><p>To ćwiczenie należy do lekcji <strong>{{lesson_title}}</strong>.</p>',
      cta: 'Otwórz ćwiczenie',
      ctaWhenScored: 'Zobacz swój wynik'
    },
    newsfeedPost: {
      subject: 'Nowy wpis w kursie',
      body: '<p><strong>{{teacher_name}}</strong> opublikował(a) wpis w kursie <strong>{{course_name}}</strong>.</p>{{post_content}}',
      cta: 'Zobacz wpis'
    }
  }
};

const da: StudentEmailLocaleCopy = {
  footer: {
    rightsReserved: 'Alle rettigheder forbeholdes.',
    website: 'Websted',
    terms: 'Vilkår',
    privacy: 'Privatliv'
  },
  templates: {
    studentCourseInvite: {
      subject: 'Du er inviteret til et kursus',
      body: '<p>Hej,</p><p>Du er inviteret til <strong>{{course_name}}</strong> hos {{org_name}}.</p><p>Invitationen udløber <strong>{{expires_at}}</strong>.</p>',
      cta: 'Deltag i kurset'
    },
    studentCourseWelcome: {
      subject: 'Du har adgang til {{course_name}}',
      body: '<p>Hej,</p><p>Du har nu adgang til <strong>{{course_name}}</strong> hos <strong>{{org_name}}</strong>.</p><p>Kontakt din underviser, hvis du oplever problemer.</p><p>Venlig hilsen,<br>{{org_name}}</p>',
      cta: 'Åbn kursus'
    },
    studentCourseCompletion: {
      subject: 'Tillykke — du har gennemført kurset',
      body: '<p>Hej {{student_name}},</p><p>Tillykke! Du har opfyldt kravene til <strong>{{course_name}}</strong>.</p>{{course_message}}<p>Venlig hilsen,<br>{{org_name}}</p>',
      cta: 'Se certifikat'
    },
    studentOrgInvite: {
      subject: 'Du er inviteret som kursist',
      body: '<p>Hej,</p><p>Du er inviteret til <strong>{{org_name}}</strong> som kursist.</p>{{course_names}}<p>Invitationen udløber <strong>{{expires_at}}</strong>.</p>',
      cta: 'Accepter invitation'
    },
    studentCohortWelcome: {
      subject: 'Du har adgang til et hold',
      body: '<p>Hej,</p><p>Du har nu adgang til <strong>{{cohort_name}}</strong> hos <strong>{{org_name}}</strong>.</p><p>Kontakt din underviser, hvis du oplever problemer.</p><p>Venlig hilsen,<br>{{org_name}}</p>',
      cta: 'Åbn hold'
    },
    studentProvePayment: {
      subject: 'Kun ét trin tilbage',
      body: '<p>Hej {{student_name}},</p><p>Du er et skridt nærmere <strong>{{course_name}}</strong>.</p><p>Send betalingsbevis til <strong>{{teacher_email}}</strong> for at deltage i kurset.</p><p>Vi ses snart i undervisningen.</p><p>{{org_name}}</p>'
    },
    cohortGoalReminder: {
      subject: 'Påmindelse: et holdmål nærmer sig fristen',
      body: '<p>Hej,</p><p>Målet <strong>{{goal_title}}</strong> i <strong>{{cohort_name}}</strong> hos {{org_name}} kræver din opmærksomhed.</p><p>{{due_status}}</p><p>Din fremgang: <strong>{{completed_count}} af {{required_count}} kurser gennemført</strong>.</p><p>Venlig hilsen,<br>{{org_name}}</p>',
      cta: 'Åbn LMS'
    },
    quizAssigned: {
      subject: 'Du har en quiz, der skal gennemføres',
      body: '<p>Hej,</p><p>Quizzen <strong>{{exercise_title}}</strong> er blevet tildelt dig i <strong>{{course_name}}</strong> hos <strong>{{org_name}}</strong>.</p><p>Venlig hilsen,<br>{{org_name}}</p>',
      cta: 'Tag quizzen'
    },
    sessionReminder: {
      subject: 'Påmindelse: din live-session starter snart',
      body: '<p>Hej,</p><p>Din session <strong>{{session_title}}</strong> i <strong>{{course_name}}</strong> starter <strong>{{when}}</strong>.</p><p><strong>Tid:</strong> {{session_time}}</p><p>Vi ses,<br>{{org_name}}</p>',
      cta: 'Deltag i sessionen'
    },
    sessionUpdated: {
      subject: 'Opdatering: dine sessionsoplysninger er ændret',
      body: '<p>Hej,</p><p>Sessionen <strong>{{session_title}}</strong> i <strong>{{course_name}}</strong> er blevet opdateret.</p><p><strong>Nyt tidspunkt:</strong> {{session_time}}</p><p>Den vedhæftede kalenderinvitation opdaterer begivenheden.</p><p>Venlig hilsen,<br>{{org_name}}</p>',
      cta: 'Deltag i sessionen'
    },
    submissionGraded: {
      subject: 'Din opgave er blevet opdateret',
      body: '<p>Hej {{student_name}},</p><p>Status for <strong>{{exercise_title}}</strong> på kurset <strong>{{course_name}}</strong> er nu <strong>{{status}}</strong>.</p><p><strong>Din score:</strong> {{score}}</p><p>Denne øvelse hører til lektionen <strong>{{lesson_title}}</strong>.</p>',
      cta: 'Åbn øvelse',
      ctaWhenScored: 'Se dit resultat'
    },
    newsfeedPost: {
      subject: 'Nyt opslag i kurset',
      body: '<p><strong>{{teacher_name}}</strong> har skrevet et opslag i <strong>{{course_name}}</strong>.</p>{{post_content}}',
      cta: 'Se opslag'
    }
  }
};

const it: StudentEmailLocaleCopy = {
  footer: { rightsReserved: 'Tutti i diritti riservati.', website: 'Sito web', terms: 'Termini', privacy: 'Privacy' },
  templates: {
    studentCourseInvite: {
      subject: 'Sei invitato a iscriverti a un corso',
      body: '<p>Ciao,</p><p>Sei stato invitato a iscriverti a <strong>{{course_name}}</strong> su {{org_name}}.</p><p>Questo invito scade il <strong>{{expires_at}}</strong>.</p>',
      cta: 'Iscriviti al corso'
    },
    studentCourseWelcome: {
      subject: 'Hai accesso a {{course_name}}',
      body: '<p>Ciao,</p><p>Ora hai accesso a <strong>{{course_name}}</strong> in <strong>{{org_name}}</strong>.</p><p>Se hai problemi, contatta il tuo istruttore.</p><p>A presto,<br>{{org_name}}</p>',
      cta: 'Apri il corso'
    },
    studentCourseCompletion: {
      subject: 'Congratulazioni — hai completato i requisiti del corso',
      body: '<p>Ciao {{student_name}},</p><p>Congratulazioni! Hai soddisfatto i requisiti di completamento di <strong>{{course_name}}</strong>.</p>{{course_message}}<p>A presto,<br>{{org_name}}</p>',
      cta: 'Vedi il certificato'
    },
    studentOrgInvite: {
      subject: 'Sei stato invitato a unirti come studente',
      body: '<p>Ciao,</p><p>Sei stato invitato a unirti a <strong>{{org_name}}</strong> come studente.</p>{{course_names}}<p>Questo invito scade il <strong>{{expires_at}}</strong>.</p>',
      cta: "Accetta l'invito"
    },
    studentCohortWelcome: {
      subject: 'Hai accesso a un gruppo',
      body: '<p>Ciao,</p><p>Ora hai accesso a <strong>{{cohort_name}}</strong> in <strong>{{org_name}}</strong>.</p><p>Se hai problemi, contatta il tuo istruttore.</p><p>A presto,<br>{{org_name}}</p>',
      cta: 'Apri il gruppo'
    },
    studentProvePayment: {
      subject: 'Manca solo un passaggio',
      body: "<p>Ciao {{student_name}},</p><p>Sei a un passo dall'iscriverti a <strong>{{course_name}}</strong>.</p><p>Invia la prova di pagamento a <strong>{{teacher_email}}</strong> per iscriverti al corso.</p><p>A presto in classe.</p><p>{{org_name}}</p>"
    },
    cohortGoalReminder: {
      subject: 'Promemoria: un obiettivo del gruppo è in scadenza',
      body: "<p>Ciao,</p><p>L'obiettivo <strong>{{goal_title}}</strong> in <strong>{{cohort_name}}</strong> su {{org_name}} richiede la tua attenzione.</p><p>{{due_status}}</p><p>I tuoi progressi: <strong>{{completed_count}} di {{required_count}} corsi completati</strong>.</p><p>A presto,<br>{{org_name}}</p>",
      cta: "Apri l'LMS"
    },
    quizAssigned: {
      subject: 'Hai un quiz da completare',
      body: '<p>Ciao,</p><p>Ti è stato assegnato un quiz — <strong>{{exercise_title}}</strong> — in <strong>{{course_name}}</strong> su <strong>{{org_name}}</strong>.</p><p>A presto,<br>{{org_name}}</p>',
      cta: 'Svolgi il quiz'
    },
    sessionReminder: {
      subject: 'Promemoria: la tua sessione live sta per iniziare',
      body: '<p>Ciao,</p><p>La sessione live <strong>{{session_title}}</strong> in <strong>{{course_name}}</strong> inizia <strong>{{when}}</strong>.</p><p><strong>Quando:</strong> {{session_time}}</p><p>Ci vediamo là,<br>{{org_name}}</p>',
      cta: 'Partecipa alla sessione'
    },
    sessionUpdated: {
      subject: 'Aggiornamento: i dettagli della sessione live sono cambiati',
      body: "<p>Ciao,</p><p>La sessione live <strong>{{session_title}}</strong> in <strong>{{course_name}}</strong> è stata aggiornata.</p><p><strong>Nuovo orario:</strong> {{session_time}}</p><p>L'invito del calendario in allegato aggiornerà l'evento sul tuo calendario.</p><p>A presto,<br>{{org_name}}</p>",
      cta: 'Partecipa alla sessione'
    },
    submissionGraded: {
      subject: "La tua consegna dell'esercizio è stata aggiornata",
      body: '<p>Ciao {{student_name}},</p><p>Lo stato della tua consegna per <strong>{{exercise_title}}</strong> in <strong>{{course_name}}</strong> è ora <strong>{{status}}</strong>.</p><p><strong>Il tuo punteggio:</strong> {{score}}</p><p>Questo esercizio fa parte della lezione <strong>{{lesson_title}}</strong>.</p>',
      cta: "Apri l'esercizio",
      ctaWhenScored: 'Vedi il tuo risultato'
    },
    newsfeedPost: {
      subject: 'Nuovo post nel corso',
      body: '<p><strong>{{teacher_name}}</strong> ha pubblicato un post in un corso che stai frequentando: <strong>{{course_name}}</strong>.</p>{{post_content}}',
      cta: 'Vedi il post'
    }
  }
};

const tr: StudentEmailLocaleCopy = {
  footer: { rightsReserved: 'Tüm hakları saklıdır.', website: 'Web sitesi', terms: 'Koşullar', privacy: 'Gizlilik' },
  templates: {
    studentCourseInvite: {
      subject: 'Bir kursa katılmaya davet edildiniz',
      body: '<p>Merhaba,</p><p>{{org_name}} bünyesindeki <strong>{{course_name}}</strong> kursuna davet edildiniz.</p><p>Bu davet <strong>{{expires_at}}</strong> tarihinde sona erer.</p>',
      cta: 'Kursa katıl'
    },
    studentCourseWelcome: {
      subject: '{{course_name}} kursuna erişiminiz var',
      body: '<p>Merhaba,</p><p><strong>{{org_name}}</strong> bünyesindeki <strong>{{course_name}}</strong> kursuna artık erişebilirsiniz.</p><p>Bir sorun yaşarsanız eğitmeninizle iletişime geçin.</p><p>Sevgiler,<br>{{org_name}}</p>',
      cta: 'Kursu aç'
    },
    studentCourseCompletion: {
      subject: 'Tebrikler — kursu tamamladınız',
      body: '<p>Merhaba {{student_name}},</p><p>Tebrikler! <strong>{{course_name}}</strong> kursunun tamamlama koşullarını yerine getirdiniz.</p>{{course_message}}<p>Sevgiler,<br>{{org_name}}</p>',
      cta: 'Sertifikayı görüntüle'
    },
    studentOrgInvite: {
      subject: 'Öğrenci olarak katılmaya davet edildiniz',
      body: '<p>Merhaba,</p><p><strong>{{org_name}}</strong> kuruluşuna öğrenci olarak davet edildiniz.</p>{{course_names}}<p>Bu davet <strong>{{expires_at}}</strong> tarihinde sona erer.</p>',
      cta: 'Daveti kabul et'
    },
    studentCohortWelcome: {
      subject: 'Bir gruba erişiminiz var',
      body: '<p>Merhaba,</p><p><strong>{{org_name}}</strong> bünyesindeki <strong>{{cohort_name}}</strong> grubuna artık erişebilirsiniz.</p><p>Bir sorun yaşarsanız eğitmeninizle iletişime geçin.</p><p>Sevgiler,<br>{{org_name}}</p>',
      cta: 'Grubu aç'
    },
    studentProvePayment: {
      subject: 'Son bir adım kaldı',
      body: '<p>Merhaba {{student_name}},</p><p><strong>{{course_name}}</strong> kursuna katılmaya bir adım daha yaklaştınız.</p><p>Kursa katılmak için ödeme belgenizi <strong>{{teacher_email}}</strong> adresine gönderin.</p><p>Derste görüşmek üzere.</p><p>{{org_name}}</p>'
    },
    cohortGoalReminder: {
      subject: 'Hatırlatma: grup hedefinin süresi yaklaşıyor',
      body: '<p>Merhaba,</p><p>{{org_name}} bünyesindeki <strong>{{cohort_name}}</strong> grubunda yer alan <strong>{{goal_title}}</strong> hedefi ilginizi bekliyor.</p><p>{{due_status}}</p><p>İlerlemeniz: <strong>{{required_count}} kurstan {{completed_count}} tanesi tamamlandı</strong>.</p><p>Sevgiler,<br>{{org_name}}</p>',
      cta: 'LMS’yi aç'
    },
    quizAssigned: {
      subject: 'Tamamlamanız gereken bir sınav var',
      body: '<p>Merhaba,</p><p><strong>{{org_name}}</strong> bünyesindeki <strong>{{course_name}}</strong> kursunda <strong>{{exercise_title}}</strong> sınavı size atandı.</p><p>Sevgiler,<br>{{org_name}}</p>',
      cta: 'Sınavı başlat'
    },
    sessionReminder: {
      subject: 'Hatırlatma: canlı oturumunuz yaklaşıyor',
      body: '<p>Merhaba,</p><p><strong>{{course_name}}</strong> kursundaki <strong>{{session_title}}</strong> oturumu <strong>{{when}}</strong> başlayacak.</p><p><strong>Zaman:</strong> {{session_time}}</p><p>Görüşmek üzere,<br>{{org_name}}</p>',
      cta: 'Oturuma katıl'
    },
    sessionUpdated: {
      subject: 'Güncelleme: canlı oturum bilgileriniz değişti',
      body: '<p>Merhaba,</p><p><strong>{{course_name}}</strong> kursundaki <strong>{{session_title}}</strong> oturumu güncellendi.</p><p><strong>Yeni zaman:</strong> {{session_time}}</p><p>Ekli takvim daveti etkinliğinizi güncelleyecek.</p><p>Sevgiler,<br>{{org_name}}</p>',
      cta: 'Oturuma katıl'
    },
    submissionGraded: {
      subject: 'Gönderiniz güncellendi',
      body: '<p>Merhaba {{student_name}},</p><p><strong>{{course_name}}</strong> kursundaki <strong>{{exercise_title}}</strong> gönderinizin durumu artık <strong>{{status}}</strong>.</p><p><strong>Puanınız:</strong> {{score}}</p><p>Bu alıştırma <strong>{{lesson_title}}</strong> dersine aittir.</p>',
      cta: 'Alıştırmayı aç',
      ctaWhenScored: 'Sonucunuzu görüntüleyin'
    },
    newsfeedPost: {
      subject: 'Kursta yeni gönderi',
      body: '<p><strong>{{teacher_name}}</strong>, <strong>{{course_name}}</strong> kursunda bir gönderi paylaştı.</p>{{post_content}}',
      cta: 'Gönderiyi görüntüle'
    }
  }
};

export const STUDENT_EMAIL_CATALOG: Record<EmailLocale, StudentEmailLocaleCopy> = {
  en,
  hi,
  fr,
  pt,
  de,
  vi,
  ru,
  es,
  pl,
  da,
  tr,
  it
};
