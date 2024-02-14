export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      apps_poll: {
        Row: {
          authorId: string | null
          courseId: string | null
          created_at: string
          expiration: string | null
          id: string
          isPublic: boolean | null
          question: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          authorId?: string | null
          courseId?: string | null
          created_at?: string
          expiration?: string | null
          id?: string
          isPublic?: boolean | null
          question?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          authorId?: string | null
          courseId?: string | null
          created_at?: string
          expiration?: string | null
          id?: string
          isPublic?: boolean | null
          question?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apps_poll_authorId_fkey"
            columns: ["authorId"]
            isOneToOne: false
            referencedRelation: "groupmember"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apps_poll_courseId_fkey"
            columns: ["courseId"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          }
        ]
      }
      apps_poll_option: {
        Row: {
          created_at: string
          id: number
          label: string | null
          poll_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          label?: string | null
          poll_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          label?: string | null
          poll_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apps_poll_option_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "apps_poll"
            referencedColumns: ["id"]
          }
        ]
      }
      apps_poll_submission: {
        Row: {
          created_at: string
          id: number
          poll_id: string | null
          poll_option_id: number | null
          selected_by_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          poll_id?: string | null
          poll_option_id?: number | null
          selected_by_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          poll_id?: string | null
          poll_option_id?: number | null
          selected_by_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apps_poll_submission_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "apps_poll"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apps_poll_submission_poll_option_id_fkey"
            columns: ["poll_option_id"]
            isOneToOne: false
            referencedRelation: "apps_poll_option"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apps_poll_submission_selected_by_id_fkey"
            columns: ["selected_by_id"]
            isOneToOne: false
            referencedRelation: "groupmember"
            referencedColumns: ["id"]
          }
        ]
      }
      community_answer: {
        Row: {
          author_id: number | null
          author_profile_id: string | null
          body: string | null
          created_at: string | null
          id: string
          question_id: number | null
          votes: number | null
        }
        Insert: {
          author_id?: number | null
          author_profile_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          question_id?: number | null
          votes?: number | null
        }
        Update: {
          author_id?: number | null
          author_profile_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          question_id?: number | null
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_answer_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "organizationmember"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_answer_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_answer_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "community_question"
            referencedColumns: ["id"]
          }
        ]
      }
      community_question: {
        Row: {
          author_id: number | null
          author_profile_id: string | null
          body: string | null
          created_at: string | null
          id: number
          organization_id: string | null
          slug: string | null
          title: string | null
          votes: number | null
        }
        Insert: {
          author_id?: number | null
          author_profile_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: number
          organization_id?: string | null
          slug?: string | null
          title?: string | null
          votes?: number | null
        }
        Update: {
          author_id?: number | null
          author_profile_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: number
          organization_id?: string | null
          slug?: string | null
          title?: string | null
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_question_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "organizationmember"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_question_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_question_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          }
        ]
      }
      course: {
        Row: {
          banner_image: string | null
          certificate_theme: string | null
          cost: number | null
          created_at: string | null
          currency: string
          description: string
          group_id: string | null
          id: string
          is_certificate_downloadable: boolean | null
          is_published: boolean | null
          is_template: boolean | null
          logo: string
          metadata: Json
          overview: string | null
          slug: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          banner_image?: string | null
          certificate_theme?: string | null
          cost?: number | null
          created_at?: string | null
          currency?: string
          description: string
          group_id?: string | null
          id?: string
          is_certificate_downloadable?: boolean | null
          is_published?: boolean | null
          is_template?: boolean | null
          logo?: string
          metadata?: Json
          overview?: string | null
          slug?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          banner_image?: string | null
          certificate_theme?: string | null
          cost?: number | null
          created_at?: string | null
          currency?: string
          description?: string
          group_id?: string | null
          id?: string
          is_certificate_downloadable?: boolean | null
          is_published?: boolean | null
          is_template?: boolean | null
          logo?: string
          metadata?: Json
          overview?: string | null
          slug?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group"
            referencedColumns: ["id"]
          }
        ]
      }
      currency: {
        Row: {
          created_at: string | null
          id: number
          name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      exercise: {
        Row: {
          created_at: string | null
          description: string | null
          due_by: string | null
          id: string
          lesson_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_by?: string | null
          id?: string
          lesson_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_by?: string | null
          id?: string
          lesson_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson"
            referencedColumns: ["id"]
          }
        ]
      }
      group: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          }
        ]
      }
      group_attendance: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: number
          is_present: boolean | null
          lesson_id: string
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: number
          is_present?: boolean | null
          lesson_id: string
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: number
          is_present?: boolean | null
          lesson_id?: string
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_attendance_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "groupmember"
            referencedColumns: ["id"]
          }
        ]
      }
      groupmember: {
        Row: {
          assigned_student_id: string | null
          created_at: string | null
          email: string | null
          group_id: string
          id: string
          profile_id: string | null
          role_id: number
        }
        Insert: {
          assigned_student_id?: string | null
          created_at?: string | null
          email?: string | null
          group_id: string
          id?: string
          profile_id?: string | null
          role_id: number
        }
        Update: {
          assigned_student_id?: string | null
          created_at?: string | null
          email?: string | null
          group_id?: string
          id?: string
          profile_id?: string | null
          role_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "groupmember_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groupmember_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groupmember_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["id"]
          }
        ]
      }
      lesson: {
        Row: {
          call_url: string | null
          course_id: string
          created_at: string | null
          id: string
          is_complete: boolean | null
          is_unlocked: boolean | null
          lesson_at: string | null
          note: string | null
          order: number | null
          public: boolean | null
          slide_url: string | null
          teacher_id: string | null
          title: string
          updated_at: string | null
          video_url: string | null
          videos: Json | null
        }
        Insert: {
          call_url?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          is_complete?: boolean | null
          is_unlocked?: boolean | null
          lesson_at?: string | null
          note?: string | null
          order?: number | null
          public?: boolean | null
          slide_url?: string | null
          teacher_id?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          videos?: Json | null
        }
        Update: {
          call_url?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          is_complete?: boolean | null
          is_unlocked?: boolean | null
          lesson_at?: string | null
          note?: string | null
          order?: number | null
          public?: boolean | null
          slide_url?: string | null
          teacher_id?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          videos?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          }
        ]
      }
      lesson_comment: {
        Row: {
          comment: string | null
          created_at: string
          groupmember_id: string | null
          id: number
          lesson_id: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          groupmember_id?: string | null
          id?: number
          lesson_id?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          groupmember_id?: string | null
          id?: number
          lesson_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_comment_groupmember_id_fkey"
            columns: ["groupmember_id"]
            isOneToOne: false
            referencedRelation: "groupmember"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_comment_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson"
            referencedColumns: ["id"]
          }
        ]
      }
      lesson_completion: {
        Row: {
          created_at: string
          id: number
          is_complete: boolean | null
          lesson_id: string | null
          profile_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_complete?: boolean | null
          lesson_id?: string | null
          profile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          is_complete?: boolean | null
          lesson_id?: string | null
          profile_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completion_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_completion_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          }
        ]
      }
      lesson_progress: {
        Row: {
          created_at: string
          id: number
          is_complete: boolean | null
          lesson_id: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_complete?: boolean | null
          lesson_id?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          is_complete?: boolean | null
          lesson_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "groupmember"
            referencedColumns: ["id"]
          }
        ]
      }
      links: {
        Row: {
          created_at: string | null
          original_url: string
          short_code: string
        }
        Insert: {
          created_at?: string | null
          original_url: string
          short_code: string
        }
        Update: {
          created_at?: string | null
          original_url?: string
          short_code?: string
        }
        Relationships: []
      }
      option: {
        Row: {
          created_at: string | null
          id: number
          is_correct: boolean
          label: string
          question_id: number
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_correct?: boolean
          label: string
          question_id: number
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_correct?: boolean
          label?: string
          question_id?: number
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "option_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question"
            referencedColumns: ["id"]
          }
        ]
      }
      organization: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          landingpage: Json | null
          name: string
          settings: Json | null
          siteName: string | null
          theme: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          landingpage?: Json | null
          name: string
          settings?: Json | null
          siteName?: string | null
          theme?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          landingpage?: Json | null
          name?: string
          settings?: Json | null
          siteName?: string | null
          theme?: string | null
        }
        Relationships: []
      }
      organization_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: number
          message: string | null
          name: string | null
          organization_id: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          message?: string | null
          name?: string | null
          organization_id?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          message?: string | null
          name?: string | null
          organization_id?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          }
        ]
      }
      organization_emaillist: {
        Row: {
          created_at: string
          email: string | null
          id: number
          organization_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          organization_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_emaillist_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          }
        ]
      }
      organizationmember: {
        Row: {
          created_at: string
          email: string | null
          id: number
          organization_id: string
          profile_id: string | null
          role_id: number
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          organization_id: string
          profile_id?: string | null
          role_id: number
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          organization_id?: string
          profile_id?: string | null
          role_id?: number
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "organizationmember_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizationmember_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizationmember_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["id"]
          }
        ]
      }
      profile: {
        Row: {
          avatar_url: string | null
          can_add_course: boolean | null
          created_at: string | null
          email: string | null
          fullname: string
          goal: string | null
          id: string
          metadata: Json | null
          role: string | null
          source: string | null
          telegram_chat_id: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          can_add_course?: boolean | null
          created_at?: string | null
          email?: string | null
          fullname: string
          goal?: string | null
          id: string
          metadata?: Json | null
          role?: string | null
          source?: string | null
          telegram_chat_id?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          can_add_course?: boolean | null
          created_at?: string | null
          email?: string | null
          fullname?: string
          goal?: string | null
          id?: string
          metadata?: Json | null
          role?: string | null
          source?: string | null
          telegram_chat_id?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      question: {
        Row: {
          created_at: string | null
          exercise_id: string
          id: number
          name: string | null
          order: number | null
          points: number | null
          question_type_id: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          id?: number
          name?: string | null
          order?: number | null
          points?: number | null
          question_type_id: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          id?: number
          name?: string | null
          order?: number | null
          points?: number | null
          question_type_id?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_question_type_id_fkey"
            columns: ["question_type_id"]
            isOneToOne: false
            referencedRelation: "question_type"
            referencedColumns: ["id"]
          }
        ]
      }
      question_answer: {
        Row: {
          answers: string[] | null
          group_member_id: string
          id: number
          open_answer: string | null
          point: number | null
          question_id: number
          submission_id: string | null
        }
        Insert: {
          answers?: string[] | null
          group_member_id: string
          id?: number
          open_answer?: string | null
          point?: number | null
          question_id: number
          submission_id?: string | null
        }
        Update: {
          answers?: string[] | null
          group_member_id?: string
          id?: number
          open_answer?: string | null
          point?: number | null
          question_id?: number
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_answer_group_member_id_fkey"
            columns: ["group_member_id"]
            isOneToOne: false
            referencedRelation: "groupmember"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_answer_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_answer_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submission"
            referencedColumns: ["id"]
          }
        ]
      }
      question_type: {
        Row: {
          created_at: string | null
          id: number
          label: string
          typename: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          label: string
          typename?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          label?: string
          typename?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          questions: Json | null
          theme: string | null
          timelimit: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          questions?: Json | null
          theme?: string | null
          timelimit?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          questions?: Json | null
          theme?: string | null
          timelimit?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          }
        ]
      }
      quiz_play: {
        Row: {
          created_at: string | null
          currentQuestionId: number | null
          id: number
          isLastQuestion: boolean | null
          pin: string | null
          players: Json | null
          quiz_id: string | null
          showCurrentQuestionAnswer: boolean | null
          started: boolean | null
          step: string | null
          studentStep: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currentQuestionId?: number | null
          id?: number
          isLastQuestion?: boolean | null
          pin?: string | null
          players?: Json | null
          quiz_id?: string | null
          showCurrentQuestionAnswer?: boolean | null
          started?: boolean | null
          step?: string | null
          studentStep?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currentQuestionId?: number | null
          id?: number
          isLastQuestion?: boolean | null
          pin?: string | null
          players?: Json | null
          quiz_id?: string | null
          showCurrentQuestionAnswer?: boolean | null
          started?: boolean | null
          step?: string | null
          studentStep?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_play_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz"
            referencedColumns: ["id"]
          }
        ]
      }
      role: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      submission: {
        Row: {
          course_id: string | null
          created_at: string | null
          exercise_id: string
          id: string
          reviewer_id: number | null
          status_id: number | null
          submitted_by: string | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          exercise_id: string
          id?: string
          reviewer_id?: number | null
          status_id?: number | null
          submitted_by?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          exercise_id?: string
          id?: string
          reviewer_id?: number | null
          status_id?: number | null
          submitted_by?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "submissionstatus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "groupmember"
            referencedColumns: ["id"]
          }
        ]
      }
      submissionstatus: {
        Row: {
          id: number
          label: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          label: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          label?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      video_transcripts: {
        Row: {
          created_at: string
          downloaded: boolean | null
          id: number
          link: string | null
          muse_svid: string | null
          transcript: string | null
        }
        Insert: {
          created_at?: string
          downloaded?: boolean | null
          id?: number
          link?: string | null
          muse_svid?: string | null
          transcript?: string | null
        }
        Update: {
          created_at?: string
          downloaded?: boolean | null
          id?: number
          link?: string | null
          muse_svid?: string | null
          transcript?: string | null
        }
        Relationships: []
      }
      waitinglist: {
        Row: {
          created_at: string | null
          email: string
          id: number
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_them: {
        Args: {
          a: number
          b: number
        }
        Returns: number
      }
      get_courses: {
        Args: {
          org_id_arg: string
          profile_id_arg: string
        }
        Returns: {
          id: string
          org_id: string
          title: string
          slug: string
          description: string
          logo: string
          banner_image: string
          cost: number
          currency: string
          is_published: boolean
          profile_id: string
          role_id: number
          total_lessons: number
          total_students: number
          progress_rate: number
        }[]
      }
      get_exercises: {
        Args: Record<PropertyKey, never>
        Returns: {
          course_id: string
          lesson_id: string
          exercise_id: string
          exercise_title: string
          points: number
        }[]
      }
      get_marks: {
        Args: Record<PropertyKey, never>
        Returns: {
          course_id: string
          exercise_id: string
          exercise_title: string
          exercise_points: number
          lesson_id: string
          lesson_title: string
          status_id: number
          total_points_gotten: number
          groupmember_id: string
          fullname: string
          assigned_student_id: string
          avatar_url: string
        }[]
      }
      get_student_exercises: {
        Args: {
          org_id_arg: string
          profile_id_arg: string
        }
        Returns: {
          exercise_id: string
          exercise_title: string
          lesson_id: string
          lesson_title: string
          status_id: number
          total: number
        }[]
      }
      get_user_upcoming_lessons: {
        Args: {
          profile_id_arg: string
          org_id_arg: string
        }
        Returns: {
          course_id: string
          course_title: string
          lesson_id: string
          lesson_title: string
          call_url: string
          lesson_at: string
          is_complete: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
