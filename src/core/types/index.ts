export type Role = 'ADMIN' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  driveFileId: string;
  hlsUrl?: string;
  duration: number; // in seconds
  order: number;
  downloadEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: Lesson[];
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  totalLessons?: number;
  modules?: Module[];
  createdAt: string;
  updatedAt: string;
}

export interface CoursesListResponse {
  data: Course[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface Student {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface StudentPayment {
  id: string;
  studentProfileId: string;
  amountPaid: number;
  paymentMethod: string;
  paymentDate: string;
  receiptNumber: string;
  installmentInfo?: string;
}

export interface StudentCounselingSession {
  id: string;
  studentProfileId: string;
  sessionDate: string;
  mentorName: string;
  notes: string;
  remarks?: string;
  followUpDate?: string;
}

export interface StudentExamApplication {
  id: string;
  studentProfileId: string;
  examName: string;
  notificationDate?: string;
  applied: boolean;
  applicationNo?: string;
  hallTicketNo?: string;
  examDate?: string;
  resultStatus?: string;
  finalSelection?: string;
}

export interface StudentDocument {
  id: string;
  studentProfileId: string;
  documentType: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface StudentCommunicationLog {
  id: string;
  studentProfileId: string;
  type: string;
  content: string;
  sentAt: string;
  sentBy: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  studentId: string;
  photoUrl?: string;
  gender?: string;
  dob?: string;
  bloodGroup?: string;
  aadhaarNumber?: string;
  nationality: string;
  category?: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  parentName?: string;
  parentMobile?: string;
  emergencyContact?: string;
  currentAddress?: string;
  permanentAddress?: string;
  city?: string;
  district?: string;
  state: string;
  pinCode?: string;
  highestQualification?: string;
  degree?: string;
  college?: string;
  yearOfPassing?: number;
  percentage?: number;
  mediumOfEducation?: string;
  targetExams: string[];
  preparationMode?: string;
  preferredLanguage?: string;
  preparationLevel?: string;
  attemptNumber?: string;
  admissionDate?: string;
  batchName?: string;
  batchTiming?: string;
  courseDuration?: string;
  facultyAssigned?: string;
  courseFee?: number;
  discount?: number;
  scholarshipDetails?: string;
  enrollmentStatus: string;
  studyHoursPerDay?: number;
  placementSelected: boolean;
  placementDetails?: any;
  payments?: StudentPayment[];
  counselingSessions?: StudentCounselingSession[];
  examApplications?: StudentExamApplication[];
  documents?: StudentDocument[];
  communications?: StudentCommunicationLog[];
  user?: {
    attempts: {
      id: string;
      testId: string;
      totalScore: number;
      accuracy: number;
      timeTaken: number;
      passed: boolean;
      createdAt: string;
      test: {
        title: string;
        cutoff_marks: number;
        total_marks: number;
      };
    }[];
  };
}

export interface EnrollmentCourse {
  id: string;
  title: string;
  thumbnail: string;
  isDeleted: boolean;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  course: EnrollmentCourse;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  type: string;
  question_text_en: string;
  question_text_ta?: string;
  section_id?: string | null;
  section_temp_id?: string | null;
  subject_id?: string;
  topic_id?: string;
  exam_category: string;
  difficulty: string;
  explanation_en?: string;
  explanation_ta?: string;
  marks: {
    correct: number;
    wrong: number;
    partial: number;
    negative_enabled: boolean;
  };
  tags: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
  options?: any;
  correct_option_id?: string;
  correct_option_ids?: any;
  partial_marking_enabled?: boolean;
  correct_answer?: boolean;
  accepted_answers?: any;
  hint?: string;
  model_answer?: string;
  word_limit?: number;
  images?: any;
  shared_context_en?: string;
  shared_context_ta?: string;
  table_data?: any;
  sharedContextEn?: string;
  sharedContextTa?: string;
  tableData?: any;
  question_image_url?: string;
  questionTextEn?: string;
}

export interface QuestionStats {
  total: number;
  published: number;
  draft: number;
  subjects: number;
}

export interface Test {
  id: string;
  title: string;
  description?: string;
  duration: number;
  cutoff_marks: number;
  total_marks: number;
  is_sectioned?: boolean;
  sections_count?: number;
  sections?: any[];
  course_id?: string;
  module_id?: string;
  category_id?: string;
  subject_id?: string;
  topic_id?: string;
  is_published: boolean;
  scheduled_at?: string | null;
  created_at: string;
  updated_at: string;
  question_count?: number;
  questions?: (Question & { order: number })[];
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExamTopic {
  id: string;
  name: string;
  subjectId: string;
}

export interface ExamSubject {
  id: string;
  name: string;
  categoryId: string;
  topics?: ExamTopic[];
}

export interface ExamCategory {
  id: string;
  name: string;
  description: string;
  iconName: string;
  subjects?: ExamSubject[];
}

export interface TestAnalyticsStats {
  total_submissions: number;
  avg_accuracy: number;
  active_takers: number;
}

export interface StudentTestAttempt {
  id: string;
  testId: string;
  testTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  totalScore: number;
  totalMarks: number;
  accuracy: number;
  timeTaken: number;
  passed: boolean;
  correct: number;
  wrong: number;
  skipped: number;
  rank: number;
  createdAt: string;
}

export interface CurrentAffairQuiz {
  id: string;
  currentAffairId: string;
  questionEn: string;
  questionTa?: string;
  optionsEn: string[];
  optionsTa?: string[];
  correctAnswer: string;
  explanationEn?: string;
  explanationTa?: string;
}

export interface CurrentAffair {
  id: string;
  titleEn: string;
  titleTa?: string;
  summaryEn: string;
  summaryTa?: string;
  contentEn: string;
  contentTa?: string;
  examImportanceEn?: string;
  examImportanceTa?: string;
  keyFactsEn?: string;
  keyFactsTa?: string;
  prelimsNotesEn?: string;
  prelimsNotesTa?: string;
  mainsNotesEn?: string;
  mainsNotesTa?: string;
  videoUrl?: string;
  category: string;
  publishedDate: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  quizzes?: CurrentAffairQuiz[];
  _count?: {
    quizzes: number;
  };
}

export interface MonthlyMagazine {
  id: string;
  title: string;
  month: number;
  year: number;
  pdfUrl: string;
  publishedAt: string;
}

export interface GovernmentScheme {
  id: string;
  titleEn: string;
  titleTa?: string;
  descriptionEn: string;
  descriptionTa?: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportantDate {
  id: string;
  titleEn: string;
  titleTa?: string;
  date: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudyMaterialCategory {
  id: string;
  name: string;
  description?: string;
}

export interface StudyMaterialVersion {
  id: string;
  materialId: string;
  version: number;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  subjectId?: string | null;
  topicId?: string | null;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  accessType: 'FREE' | 'PREMIUM' | 'COURSE_RESTRICTED';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedById?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  category?: StudyMaterialCategory;
  versions?: StudyMaterialVersion[];
}

export interface Book {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  images: string[];
  author?: string;
  publisher?: string;
  priceHardCopy?: number | null;
  priceSoftCopy?: number | null;
  stockHardCopy: number;
  pdfUrl?: string | null;
  categoryId: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  category?: StudyMaterialCategory;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookOrderItem {
  id: string;
  orderId: string;
  bookId: string;
  format: 'HARD_COPY' | 'SOFT_COPY';
  price: number;
  quantity: number;
  book?: Book;
}

export interface BookOrder {
  id: string;
  studentId: string;
  couponId?: string | null;
  orderDate: string;
  subTotal: number;
  shippingCharge: number;
  discountAmount: number;
  payableAmount: number;
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  orderStatus: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingName?: string | null;
  shippingPhone?: string | null;
  shippingAddress?: string | null;
  paymentScreenshotUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: BookOrderItem[];
  coupon?: Coupon | null;
  student?: {
    name: string;
    email: string;
  };
}



