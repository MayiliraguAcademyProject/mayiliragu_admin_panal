import { useState, useMemo, useEffect } from 'react';
import { 
  useStudentsList, 
  useStudentEnrollments, 
  useEnrollStudent, 
  useRevokeEnrollment,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useStudentProfile,
  useUpdateStudentProfile,
  useAddStudentPayment,
  useAddStudentCounseling,
  useAddStudentExamApplication,
  useAddStudentDocument,
  useAddStudentCommunication,
  useCoursesList
} from '../../../core/api/endpoints';
import type { Student } from '../../../core/types';
import { 
  Search, 
  User, 
  BookOpen, 
  Plus, 
  Trash2, 
  Loader2, 
  Mail, 
  Calendar, 
  BookMarked,
  GraduationCap,
  AlertCircle,
  Pencil,
  Trash,
  CreditCard,
  Award,
  FileText,
  Phone,
  MessageSquare,
  FileCheck,
  CheckCircle2,
  MapPin,
  DollarSign,
  Activity,
  Briefcase
} from 'lucide-react';

import { getAvailableCourses } from '../../../core/utils';
import StudentFormModal from '../components/StudentFormModal';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import EnrollModal from '../components/EnrollModal';
import PaymentModal from '../components/PaymentModal';
import CounselingModal from '../components/CounselingModal';
import ExamAppModal from '../components/ExamAppModal';
import DocModal from '../components/DocModal';
import CommModal from '../components/CommModal';

type TabType = 'overview' | 'address_education' | 'exam_prep' | 'fees_payments' | 'performance' | 'mentoring' | 'exam_apps' | 'docs_history';

export default function StudentManagementPage() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Enroll dialog states
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [isRevokingId, setIsRevokingId] = useState<string | null>(null);
  const [isEnrollingId, setIsEnrollingId] = useState<string | null>(null);
  
  // Student Form & Delete States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Sub-resource Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCounselingModalOpen, setIsCounselingModalOpen] = useState(false);
  const [isExamAppModalOpen, setIsExamAppModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isCommModalOpen, setIsCommModalOpen] = useState(false);

  // Queries
  const { data: students = [], isLoading: isStudentsLoading, isError: isStudentsError, refetch: refetchStudents } = useStudentsList();
  const { data: enrollments = [], isLoading: isEnrollmentsLoading } = useStudentEnrollments(selectedStudent?.id ?? '');
  const { data: coursesData } = useCoursesList(1, 50);

  // Profile Query
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useStudentProfile(selectedStudent?.id ?? '');

  // Mutations
  const enrollMutation = useEnrollStudent();
  const revokeMutation = useRevokeEnrollment(selectedStudent?.id ?? '');
  const createStudentMutation = useCreateStudent();
  const updateStudentMutation = useUpdateStudent();
  const deleteStudentMutation = useDeleteStudent();

  // Profile/Subresource mutations
  const updateProfileMutation = useUpdateStudentProfile();
  const addPaymentMutation = useAddStudentPayment();
  const addCounselingMutation = useAddStudentCounseling();
  const addExamAppMutation = useAddStudentExamApplication();
  const addDocumentMutation = useAddStudentDocument();
  const addCommMutation = useAddStudentCommunication();

  // Local Form state for editing profiles
  const [editForm, setEditForm] = useState<any>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Initialize/Sync edit form state
  useEffect(() => {
    if (profile) {
      setEditForm({
        gender: profile.gender || '',
        dob: profile.dob ? profile.dob.split('T')[0] : '',
        bloodGroup: profile.bloodGroup || '',
        aadhaarNumber: profile.aadhaarNumber || '',
        nationality: profile.nationality || 'Indian',
        category: profile.category || 'General',
        mobileNumber: profile.mobileNumber || '',
        whatsappNumber: profile.whatsappNumber || '',
        parentName: profile.parentName || '',
        parentMobile: profile.parentMobile || '',
        emergencyContact: profile.emergencyContact || '',
        currentAddress: profile.currentAddress || '',
        permanentAddress: profile.permanentAddress || '',
        city: profile.city || '',
        district: profile.district || '',
        state: profile.state || 'Tamil Nadu',
        pinCode: profile.pinCode || '',
        highestQualification: profile.highestQualification || '',
        degree: profile.degree || '',
        college: profile.college || '',
        yearOfPassing: profile.yearOfPassing || '',
        percentage: profile.percentage || '',
        mediumOfEducation: profile.mediumOfEducation || 'English',
        targetExams: profile.targetExams || [],
        preparationMode: profile.preparationMode || 'Online',
        preferredLanguage: profile.preferredLanguage || 'English',
        preparationLevel: profile.preparationLevel || 'Beginner',
        attemptNumber: profile.attemptNumber || 'First Attempt',
        admissionDate: profile.admissionDate ? profile.admissionDate.split('T')[0] : '',
        batchName: profile.batchName || '',
        batchTiming: profile.batchTiming || '',
        courseDuration: profile.courseDuration || '',
        facultyAssigned: profile.facultyAssigned || '',
        courseFee: profile.courseFee || '',
        discount: profile.discount || '',
        scholarshipDetails: profile.scholarshipDetails || '',
        enrollmentStatus: profile.enrollmentStatus || 'Active',
        studyHoursPerDay: profile.studyHoursPerDay || '',
        placementSelected: profile.placementSelected || false,
        placementDetails: profile.placementDetails || {
          department: '',
          postName: '',
          rank: '',
          joiningDate: '',
          salary: '',
          successStory: ''
        }
      });
      setProfileSuccessMsg(null);
      setProfileErrorMsg(null);
    }
  }, [profile, activeTab]);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    return students.filter(
      (student: Student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  // Enrolled course IDs for filtering
  const enrolledCourseIds = useMemo(() => {
    return new Set<string>(enrollments.map((e: any) => e.courseId));
  }, [enrollments]);

  // Filter courses available for enrollment
  const availableCourses = useMemo(() => {
    const allCourses = coursesData?.data ?? [];
    const filtered = getAvailableCourses(allCourses, enrolledCourseIds);
    if (!courseSearchQuery) return filtered;
    return filtered.filter((c: any) =>
      c.title.toLowerCase().includes(courseSearchQuery.toLowerCase())
    );
  }, [coursesData, enrolledCourseIds, courseSearchQuery]);

  const handleEnroll = async (courseId: string) => {
    if (!selectedStudent) return;
    setIsEnrollingId(courseId);
    try {
      await enrollMutation.mutateAsync({
        studentId: selectedStudent.id,
        courseId,
      });
      setIsEnrollDialogOpen(false);
      setCourseSearchQuery('');
    } catch (err) {
      console.error('Failed to enroll student:', err);
    } finally {
      setIsEnrollingId(null);
    }
  };

  const handleRevoke = async (enrollmentId: string, courseTitle: string) => {
    if (!selectedStudent) return;
    if (window.confirm(`Are you sure you want to revoke enrollment for course "${courseTitle}"?`)) {
      setIsRevokingId(enrollmentId);
      try {
        await revokeMutation.mutateAsync(enrollmentId);
      } catch (err) {
        console.error('Failed to revoke enrollment:', err);
      } finally {
        setIsRevokingId(null);
      }
    }
  };

  const handleFormSubmit = async (data: { name: string; email: string; password?: string }) => {
    if (editingStudent) {
      const updated = await updateStudentMutation.mutateAsync({
        id: editingStudent.id,
        data,
      });
      if (selectedStudent?.id === editingStudent.id) {
        setSelectedStudent(updated);
      }
    } else {
      const newStudent = await createStudentMutation.mutateAsync(data);
      setSelectedStudent(newStudent);
    }
  };

  const handleDeleteStudent = (student: Student) => {
    setStudentToDelete(student);
  };

  const handleConfirmDeleteStudent = async () => {
    if (studentToDelete) {
      await deleteStudentMutation.mutateAsync(studentToDelete.id);
      if (selectedStudent?.id === studentToDelete.id) {
        setSelectedStudent(null);
      }
    }
  };

  // Profile Save handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);
    try {
      const payload = { ...editForm };
      
      // 1. Validation: Aadhaar Number must be exactly 12 digits if provided
      if (payload.aadhaarNumber && !/^\d{12}$/.test(payload.aadhaarNumber)) {
        setProfileErrorMsg('Aadhaar Number must be exactly 12 digits.');
        setIsSavingProfile(false);
        return;
      }

      // 2. Validation: Mobile number fields must be exactly 10 digits if provided
      if (payload.mobileNumber && !/^\d{10}$/.test(payload.mobileNumber)) {
        setProfileErrorMsg('Mobile Number must be exactly 10 digits.');
        setIsSavingProfile(false);
        return;
      }

      if (payload.whatsappNumber && !/^\d{10}$/.test(payload.whatsappNumber)) {
        setProfileErrorMsg('WhatsApp Number must be exactly 10 digits.');
        setIsSavingProfile(false);
        return;
      }

      if (payload.emergencyContact && !/^\d{10}$/.test(payload.emergencyContact)) {
        setProfileErrorMsg('Emergency Contact must be exactly 10 digits.');
        setIsSavingProfile(false);
        return;
      }

      if (payload.parentMobile && !/^\d{10}$/.test(payload.parentMobile)) {
        setProfileErrorMsg('Parent/Guardian Mobile must be exactly 10 digits.');
        setIsSavingProfile(false);
        return;
      }

      // 3. Validation: PIN Code must be exactly 6 digits if provided
      if (payload.pinCode && !/^\d{6}$/.test(payload.pinCode)) {
        setProfileErrorMsg('PIN Code must be exactly 6 digits.');
        setIsSavingProfile(false);
        return;
      }

      // 4. Validation: Date of Birth must not be in the future
      if (payload.dob) {
        const dobDate = new Date(payload.dob);
        if (dobDate > new Date()) {
          setProfileErrorMsg('Date of Birth cannot be in the future.');
          setIsSavingProfile(false);
          return;
        }
      }

      // 5. Validation: Year of Passing must be a valid year (1900 to current year + 10)
      if (payload.yearOfPassing) {
        const year = Number(payload.yearOfPassing);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1900 || year > currentYear + 10) {
          setProfileErrorMsg(`Year of Passing must be a valid year between 1900 and ${currentYear + 10}.`);
          setIsSavingProfile(false);
          return;
        }
      }

      // 6. Validation: Percentage / CGPA must be a valid number between 0 and 100
      if (payload.percentage) {
        const pct = Number(payload.percentage);
        if (isNaN(pct) || pct < 0 || pct > 100) {
          setProfileErrorMsg('Percentage / CGPA must be a valid number between 0 and 100.');
          setIsSavingProfile(false);
          return;
        }
      }

      // 7. Validation: Daily Study Target (Hours) must be between 0 and 24
      if (payload.studyHoursPerDay) {
        const hours = Number(payload.studyHoursPerDay);
        if (isNaN(hours) || hours < 0 || hours > 24) {
          setProfileErrorMsg('Daily Study Target must be a number between 0 and 24.');
          setIsSavingProfile(false);
          return;
        }
      }

      // 8. Validation: courseFee and discount
      if (payload.courseFee) {
        const fee = Number(payload.courseFee);
        if (isNaN(fee) || fee < 0) {
          setProfileErrorMsg('Total Course Fee must be a valid positive number.');
          setIsSavingProfile(false);
          return;
        }
      }

      if (payload.discount) {
        const discount = Number(payload.discount);
        if (isNaN(discount) || discount < 0) {
          setProfileErrorMsg('Discount Allowed must be a valid positive number.');
          setIsSavingProfile(false);
          return;
        }
        const fee = Number(payload.courseFee || 0);
        if (discount > fee) {
          setProfileErrorMsg('Discount Allowed cannot be greater than the Total Course Fee.');
          setIsSavingProfile(false);
          return;
        }
      }
      
      // Sanitizations
      if (payload.yearOfPassing) payload.yearOfPassing = Number(payload.yearOfPassing);
      if (payload.percentage) payload.percentage = Number(payload.percentage);
      if (payload.courseFee) payload.courseFee = Number(payload.courseFee);
      if (payload.discount) payload.discount = Number(payload.discount);
      if (payload.studyHoursPerDay) payload.studyHoursPerDay = Number(payload.studyHoursPerDay);
      
      await updateProfileMutation.mutateAsync({
        userId: selectedStudent.id,
        data: payload
      });
      setProfileSuccessMsg('Student profile updated successfully!');
      refetchProfile();
    } catch (err: any) {
      console.error('Failed to update student profile:', err);
      setProfileErrorMsg(err?.response?.data?.message || err?.message || 'Failed to update student profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Toggle Target Exam helper
  const handleToggleExam = (exam: string) => {
    const currentExams = editForm.targetExams || [];
    let updated;
    if (currentExams.includes(exam)) {
      updated = currentExams.filter((e: string) => e !== exam);
    } else {
      updated = [...currentExams, exam];
    }
    setEditForm((prev: any) => ({ ...prev, targetExams: updated }));
  };

  if (isStudentsError) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-12 bg-red-50 border border-red-200 rounded-3xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-red-800">Failed to Load Students</h2>
        <button
          onClick={() => refetchStudents()}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Calculate totals for payment tab
  const totalPaid = useMemo(() => {
    if (!profile?.payments) return 0;
    return profile.payments.reduce((acc: number, curr: any) => acc + curr.amountPaid, 0);
  }, [profile?.payments]);

  const balanceFee = useMemo(() => {
    if (!profile) return 0;
    const fee = profile.courseFee || 0;
    const disc = profile.discount || 0;
    return Math.max(0, fee - disc - totalPaid);
  }, [profile, totalPaid]);

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-gradient-to-br from-background-start via-[#EFF5FF] to-background-end animate-fade-in">
      
      {/* Master Column - Left Panel */}
      <div className="w-full border-r border-border/60 md:w-5/12 lg:w-3/12 flex flex-col bg-cardBg shadow-sm">
        
        {/* Search header */}
        <div className="p-4 sm:p-5 border-b border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-text-primary tracking-tight">
              Students Directory
            </h2>
            <button
              onClick={() => {
                setEditingStudent(null);
                setIsFormOpen(true);
              }}
              className="flex items-center space-x-1 bg-accent/10 hover:bg-accent/20 text-accent font-bold py-1.5 px-3 rounded-xl text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Student</span>
            </button>
          </div>
          <div className="flex items-center bg-slate-50 border border-border/60 rounded-2xl px-4 py-2.5 shadow-xs">
            <Search className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-text-primary placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isStudentsLoading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-16 bg-slate-50 border border-border/30 rounded-2xl animate-pulse" />
            ))
          ) : filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-text-secondary">
              <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-semibold">No students found.</p>
            </div>
          ) : (
            filteredStudents.map((student: Student) => {
              const isSelected = selectedStudent?.id === student.id;
              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-accent/5 border-accent text-accent shadow-sm'
                      : 'border-border/40 hover:border-slate-350 hover:bg-slate-50 text-text-primary'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 ${
                      isSelected ? 'bg-accent text-white shadow-md' : 'bg-slate-150 text-text-secondary'
                    }`}>
                      {student.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm truncate group-hover:text-accent transition-colors">
                        {student.name}
                      </p>
                      <p className="text-[11px] text-text-secondary truncate mt-0.5 font-medium">
                        {student.email}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detail Column - Right Panel */}
      <div className="hidden md:flex md:w-7/12 lg:w-9/12 flex-col overflow-hidden">
        {selectedStudent ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Student profile Header */}
            <div className="p-6 bg-cardBg border-b border-border/50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#008A7C] to-[#006A61] overflow-hidden flex items-center justify-center text-white text-lg font-black shadow-lg shadow-accent/10 relative">
                  {profile?.photoUrl ? (
                    <img src={profile.photoUrl} alt={selectedStudent.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedStudent.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-xl font-black text-text-primary tracking-tight">
                      {selectedStudent.name}
                    </h3>
                    {profile?.studentId && (
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md tracking-wider">
                        {profile.studentId}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-text-secondary font-semibold">
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-accent" />
                      <span>{selectedStudent.email}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                      <span>Joined {new Date(selectedStudent.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 self-start lg:self-center">
                <button
                  onClick={() => {
                    setEditingStudent(selectedStudent);
                    setIsFormOpen(true);
                  }}
                  className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-text-primary font-bold py-2.5 px-3.5 rounded-xl text-xs transition-colors active:scale-[0.98]"
                  title="Edit Account Credentials"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit credentials</span>
                </button>
                <button
                  onClick={() => handleDeleteStudent(selectedStudent)}
                  disabled={deleteStudentMutation.isPending}
                  className="flex items-center space-x-1.5 bg-red-50 hover:bg-red-100 text-red-650 font-bold py-2.5 px-3.5 rounded-xl text-xs transition-colors disabled:opacity-50 active:scale-[0.98]"
                  title="Delete Student"
                >
                  {deleteStudentMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash className="w-3.5 h-3.5" />
                  )}
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Profile Workspace Navigation Tabs */}
            <div className="flex items-center bg-white border-b border-border/40 overflow-x-auto whitespace-nowrap scrollbar-none px-6">
              {[
                { id: 'overview', label: 'Basic Info', icon: User },
                { id: 'address_education', label: 'Address & Education', icon: MapPin },
                { id: 'exam_prep', label: 'Exam Prep', icon: GraduationCap },
                { id: 'fees_payments', label: 'Fees & Payments', icon: CreditCard },
                { id: 'performance', label: 'Performance', icon: Activity },
                { id: 'mentoring', label: 'Mentoring', icon: Award },
                { id: 'exam_apps', label: 'Exam Tracking', icon: FileCheck },
                { id: 'docs_history', label: 'Docs & History', icon: FileText }
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center space-x-2 py-4 px-4 border-b-2 font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                      isSelected
                        ? 'border-accent text-accent'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Workspace Content Panel */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {isProfileLoading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {profileSuccessMsg && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-2xl flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{profileSuccessMsg}</span>
                    </div>
                  )}

                  {profileErrorMsg && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-800 font-bold text-xs rounded-2xl flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-650 flex-shrink-0" />
                      <span>{profileErrorMsg}</span>
                    </div>
                  )}

                  {/* ==================== TAB 1: BASIC INFO ==================== */}
                  {activeTab === 'overview' && (
                    <div className="bg-cardBg border border-border/50 rounded-3xl p-6 shadow-xs space-y-6">
                      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                        <User className="w-4 h-4 text-accent" />
                        <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">Demographic Information</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">Gender</label>
                          <select
                            value={editForm.gender}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, gender: e.target.value }))}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">Date of Birth</label>
                          <input
                            type="date"
                            value={editForm.dob}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, dob: e.target.value }))}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">Blood Group</label>
                          <input
                            type="text"
                            placeholder="e.g. O+ve"
                            value={editForm.bloodGroup}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, bloodGroup: e.target.value }))}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">Aadhaar Number</label>
                          <input
                            type="text"
                            placeholder="12-digit number"
                            value={editForm.aadhaarNumber}
                            onChange={(e) => {
                              const cleanedVal = e.target.value.replace(/\D/g, '').slice(0, 12);
                              setEditForm((prev: any) => ({ ...prev, aadhaarNumber: cleanedVal }));
                            }}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">Nationality</label>
                          <input
                            type="text"
                            value={editForm.nationality}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, nationality: e.target.value }))}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">Category</label>
                          <select
                            value={editForm.category}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, category: e.target.value }))}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          >
                            <option value="General">General</option>
                            <option value="OBC">OBC</option>
                            <option value="SC">SC</option>
                            <option value="ST">ST</option>
                            <option value="EWS">EWS</option>
                            <option value="Others">Others</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 pt-4">
                        <Phone className="w-4 h-4 text-accent" />
                        <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">Contact & Family Details</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">Mobile Number</label>
                          <input
                            type="tel"
                            placeholder="Student Mobile"
                            value={editForm.mobileNumber}
                            onChange={(e) => {
                              const cleanedVal = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setEditForm((prev: any) => ({ ...prev, mobileNumber: cleanedVal }));
                            }}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">WhatsApp Number</label>
                          <input
                            type="tel"
                            placeholder="WhatsApp Contact"
                            value={editForm.whatsappNumber}
                            onChange={(e) => {
                              const cleanedVal = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setEditForm((prev: any) => ({ ...prev, whatsappNumber: cleanedVal }));
                            }}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">Emergency Contact</label>
                          <input
                            type="tel"
                            placeholder="Emergency Number"
                            value={editForm.emergencyContact}
                            onChange={(e) => {
                              const cleanedVal = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setEditForm((prev: any) => ({ ...prev, emergencyContact: cleanedVal }));
                            }}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">Parent / Guardian Name</label>
                          <input
                            type="text"
                            placeholder="Father/Mother/Guardian"
                            value={editForm.parentName}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, parentName: e.target.value }))}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">Parent/Guardian Mobile</label>
                          <input
                            type="tel"
                            placeholder="Parent Mobile Contact"
                            value={editForm.parentMobile}
                            onChange={(e) => {
                              const cleanedVal = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setEditForm((prev: any) => ({ ...prev, parentMobile: cleanedVal }));
                            }}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ==================== TAB 2: ADDRESS & EDUCATION ==================== */}
                  {activeTab === 'address_education' && (
                    <div className="bg-cardBg border border-border/50 rounded-3xl p-6 shadow-xs space-y-6">
                      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                        <MapPin className="w-4 h-4 text-accent" />
                        <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">Address Details</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">Current Address</label>
                          <textarea
                            placeholder="Full Present Address"
                            value={editForm.currentAddress}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, currentAddress: e.target.value }))}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none h-20 resize-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-text-secondary uppercase">Permanent Address</label>
                            <button
                              type="button"
                              onClick={() => setEditForm((prev: any) => ({ ...prev, permanentAddress: prev.currentAddress }))}
                              className="text-[10px] text-accent font-bold uppercase hover:underline"
                            >
                              Same as Current
                            </button>
                          </div>
                          <textarea
                            placeholder="Full Permanent Address"
                            value={editForm.permanentAddress}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, permanentAddress: e.target.value }))}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none h-20 resize-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">City</label>
                          <input
                            type="text"
                            value={editForm.city}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, city: e.target.value }))}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">District</label>
                          <input
                            type="text"
                            value={editForm.district}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, district: e.target.value }))}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">State</label>
                          <input
                            type="text"
                            value={editForm.state}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, state: e.target.value }))}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">PIN Code</label>
                          <input
                            type="text"
                            value={editForm.pinCode}
                            onChange={(e) => {
                              const cleanedVal = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setEditForm((prev: any) => ({ ...prev, pinCode: cleanedVal }));
                            }}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 pt-4">
                        <GraduationCap className="w-4 h-4 text-accent" />
                        <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">Educational Background</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">Highest Qualification</label>
                          <input
                            type="text"
                            placeholder="e.g. Graduation, PG, HSC"
                            value={editForm.highestQualification}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, highestQualification: e.target.value }))}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">Degree / Diploma</label>
                          <input
                            type="text"
                            placeholder="e.g. B.E. CSE, B.Sc. Physics"
                            value={editForm.degree}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, degree: e.target.value }))}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">College / University</label>
                          <input
                            type="text"
                            placeholder="Institutuion Name"
                            value={editForm.college}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, college: e.target.value }))}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">Year of Passing</label>
                          <input
                            type="number"
                            placeholder="YYYY"
                            value={editForm.yearOfPassing}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, yearOfPassing: e.target.value }))}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">Percentage / CGPA</label>
                          <input
                            type="text"
                            placeholder="e.g. 82.5 or 8.4"
                            value={editForm.percentage}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, percentage: e.target.value }))}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">Medium of Education</label>
                          <select
                            value={editForm.mediumOfEducation}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, mediumOfEducation: e.target.value }))}
                            className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                          >
                            <option value="English">English</option>
                            <option value="Tamil">Tamil</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ==================== TAB 3: EXAM PREP ==================== */}
                  {activeTab === 'exam_prep' && (
                    <div className="space-y-6">
                      <div className="bg-cardBg border border-border/50 rounded-3xl p-6 shadow-xs space-y-6">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                          <GraduationCap className="w-4 h-4 text-accent" />
                          <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">Exam Target & Prep settings</h4>
                        </div>

                        {/* Checklist Target Exams */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-text-secondary uppercase">Target Exams</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {['UPSC', 'TNPSC Group 1', 'TNPSC Group 2', 'TNPSC Group 4', 'SSC CGL', 'SSC CHSL', 'Banking', 'Railways', 'Others'].map((exam) => {
                              const isChecked = (editForm.targetExams || []).includes(exam);
                              return (
                                <button
                                  key={exam}
                                  type="button"
                                  onClick={() => handleToggleExam(exam)}
                                  className={`p-3 rounded-xl border text-xs font-extrabold transition-all duration-200 text-center ${
                                    isChecked
                                      ? 'bg-accent/15 border-accent text-accent'
                                      : 'border-border/60 bg-slate-50 text-text-secondary hover:bg-slate-100'
                                  }`}
                                >
                                  {exam}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Preparation Mode</label>
                            <select
                              value={editForm.preparationMode}
                              onChange={(e) => setEditForm((prev: any) => ({ ...prev, preparationMode: e.target.value }))}
                              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                            >
                              <option value="Online">Online</option>
                              <option value="Offline">Offline</option>
                              <option value="Hybrid">Hybrid</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Preferred Language</label>
                            <select
                              value={editForm.preferredLanguage}
                              onChange={(e) => setEditForm((prev: any) => ({ ...prev, preferredLanguage: e.target.value }))}
                              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                            >
                              <option value="English">English</option>
                              <option value="Tamil">Tamil</option>
                              <option value="Bilingual">Bilingual</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Current Prep Level</label>
                            <select
                              value={editForm.preparationLevel}
                              onChange={(e) => setEditForm((prev: any) => ({ ...prev, preparationLevel: e.target.value }))}
                              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                            >
                              <option value="Beginner">Beginner</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Advanced">Advanced</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Attempt Number</label>
                            <select
                              value={editForm.attemptNumber}
                              onChange={(e) => setEditForm((prev: any) => ({ ...prev, attemptNumber: e.target.value }))}
                              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                            >
                              <option value="First Attempt">First Attempt</option>
                              <option value="Second Attempt">Second Attempt</option>
                              <option value="Multiple Attempts">Multiple Attempts</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Daily Study Target (Hours)</label>
                            <input
                              type="number"
                              step="0.5"
                              placeholder="e.g. 6"
                              value={editForm.studyHoursPerDay}
                              onChange={(e) => setEditForm((prev: any) => ({ ...prev, studyHoursPerDay: e.target.value }))}
                              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 pt-4">
                          <BookMarked className="w-4 h-4 text-accent" />
                          <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">Class / Course Enrollment Details</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Admission Date</label>
                            <input
                              type="date"
                              value={editForm.admissionDate}
                              onChange={(e) => setEditForm((prev: any) => ({ ...prev, admissionDate: e.target.value }))}
                              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Batch Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Morning Batch A"
                              value={editForm.batchName}
                              onChange={(e) => setEditForm((prev: any) => ({ ...prev, batchName: e.target.value }))}
                              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Batch Timing</label>
                            <input
                              type="text"
                              placeholder="e.g. 09:30 AM - 01:00 PM"
                              value={editForm.batchTiming}
                              onChange={(e) => setEditForm((prev: any) => ({ ...prev, batchTiming: e.target.value }))}
                              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Course Duration</label>
                            <input
                              type="text"
                              placeholder="e.g. 6 Months"
                              value={editForm.courseDuration}
                              onChange={(e) => setEditForm((prev: any) => ({ ...prev, courseDuration: e.target.value }))}
                              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Faculty Assigned</label>
                            <input
                              type="text"
                              placeholder="Instructor Name"
                              value={editForm.facultyAssigned}
                              onChange={(e) => setEditForm((prev: any) => ({ ...prev, facultyAssigned: e.target.value }))}
                              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Enrollment Status</label>
                            <select
                              value={editForm.enrollmentStatus}
                              onChange={(e) => setEditForm((prev: any) => ({ ...prev, enrollmentStatus: e.target.value }))}
                              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                            >
                              <option value="Active">Active</option>
                              <option value="Completed">Completed</option>
                              <option value="Dropped">Dropped</option>
                              <option value="Hold">Hold</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Course Catalog Enrollments Sub Section */}
                      <div className="bg-cardBg border border-border/50 rounded-3xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-accent" />
                            <span>Active course catalog enrollments</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => setIsEnrollDialogOpen(true)}
                            className="flex items-center space-x-1.5 bg-accent/10 hover:bg-accent/20 text-accent font-bold py-1.5 px-3.5 rounded-xl text-xs transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Enroll in Course</span>
                          </button>
                        </div>

                        {isEnrollmentsLoading ? (
                          <div className="space-y-2">
                            {Array.from({ length: 2 }).map((_, idx) => (
                              <div key={idx} className="h-14 bg-slate-50 border border-border/30 rounded-2xl animate-pulse" />
                            ))}
                          </div>
                        ) : enrollments.length === 0 ? (
                          <p className="text-xs text-text-secondary py-6 text-center font-semibold">
                            No course enrollments found. Click "Enroll in Course" to add them to a syllabus.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {enrollments.map((enrollment: any) => (
                              <div
                                key={enrollment.id}
                                className="bg-cardBg border border-border/60 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:border-slate-350 transition-colors"
                              >
                                <div className="flex items-center space-x-3 min-w-0">
                                  <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 relative border border-border/45">
                                    <img
                                      src={enrollment.course.thumbnail}
                                      alt={enrollment.course.title}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500';
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="font-extrabold text-sm text-text-primary tracking-tight truncate">
                                      {enrollment.course.title}
                                    </h5>
                                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                                      Enrolled {new Date(enrollment.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRevoke(enrollment.id, enrollment.course.title)}
                                  disabled={isRevokingId === enrollment.id}
                                  className="p-2 rounded-xl hover:bg-red-50 text-text-secondary hover:text-red-650 transition-colors disabled:opacity-50"
                                  title="Revoke Enrollment"
                                >
                                  {isRevokingId === enrollment.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ==================== TAB 4: FEES & PAYMENTS ==================== */}
                  {activeTab === 'fees_payments' && (
                    <div className="space-y-6">
                      <div className="bg-cardBg border border-border/50 rounded-3xl p-6 shadow-xs space-y-6">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                          <DollarSign className="w-4 h-4 text-accent" />
                          <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">Fee & Scholarship Settings</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Total Course Fee (₹)</label>
                            <input
                              type="number"
                              placeholder="Total Fee"
                              value={editForm.courseFee}
                              onChange={(e) => setEditForm((prev: any) => ({ ...prev, courseFee: e.target.value }))}
                              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Discount Allowed (₹)</label>
                            <input
                              type="number"
                              placeholder="Discount"
                              value={editForm.discount}
                              onChange={(e) => setEditForm((prev: any) => ({ ...prev, discount: e.target.value }))}
                              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Scholarship Details</label>
                            <input
                              type="text"
                              placeholder="Scholarship / Grant notes"
                              value={editForm.scholarshipDetails}
                              onChange={(e) => setEditForm((prev: any) => ({ ...prev, scholarshipDetails: e.target.value }))}
                              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                            />
                          </div>
                        </div>

                        {/* Metric Scorecard cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-center">
                            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Total Fee Payable</p>
                            <p className="text-2xl font-black text-emerald-700 mt-1">₹{(editForm.courseFee || 0) - (editForm.discount || 0)}</p>
                          </div>
                          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-center">
                            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Total Paid Amount</p>
                            <p className="text-2xl font-black text-blue-700 mt-1">₹{totalPaid}</p>
                          </div>
                          <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 text-center">
                            <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Balance Amount Due</p>
                            <p className="text-2xl font-black text-rose-700 mt-1">₹{balanceFee}</p>
                          </div>
                        </div>
                      </div>

                      {/* Payment History Log */}
                      <div className="bg-cardBg border border-border/50 rounded-3xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-accent" />
                            <span>Payment Transaction Ledger</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="flex items-center space-x-1.5 bg-accent hover:bg-accent-onContainer text-white font-bold py-1.5 px-3.5 rounded-xl text-xs transition-colors shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Record Payment</span>
                          </button>
                        </div>

                        {/* Payments list table */}
                        {!profile?.payments || profile.payments.length === 0 ? (
                          <p className="text-xs text-text-secondary py-6 text-center font-semibold">
                            No payment transactions recorded yet. Click "Record Payment" to process an installment.
                          </p>
                        ) : (
                          <div className="overflow-x-auto border border-border/40 rounded-2xl">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-[10px] font-bold text-text-secondary uppercase tracking-wider border-b border-border/40">
                                  <th className="p-4">Receipt Number</th>
                                  <th className="p-4">Date</th>
                                  <th className="p-4">Installment Detail</th>
                                  <th className="p-4">Method</th>
                                  <th className="p-4 text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/30 text-xs text-text-primary font-medium">
                                {profile.payments.map((pmt: any) => (
                                  <tr key={pmt.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-extrabold text-accent">{pmt.receiptNumber}</td>
                                    <td className="p-4">{new Date(pmt.paymentDate).toLocaleDateString()}</td>
                                    <td className="p-4 text-text-secondary">{pmt.installmentInfo || 'General Payment'}</td>
                                    <td className="p-4">
                                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold text-[10px]">
                                        {pmt.paymentMethod}
                                      </span>
                                    </td>
                                    <td className="p-4 text-right font-black text-slate-700">₹{pmt.amountPaid}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ==================== TAB 5: PERFORMANCE ==================== */}
                  {activeTab === 'performance' && (
                    <div className="space-y-6">
                      {/* Aggregate Scores Card */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-cardBg border border-border/50 rounded-2xl p-4.5 text-center shadow-xs">
                          <p className="text-[10px] font-bold text-text-secondary uppercase">Total Tests Taken</p>
                          <p className="text-2xl font-black text-text-primary mt-1">
                            {profile?.user?.attempts?.length || 0}
                          </p>
                        </div>
                        <div className="bg-cardBg border border-border/50 rounded-2xl p-4.5 text-center shadow-xs">
                          <p className="text-[10px] font-bold text-text-secondary uppercase">Average Accuracy</p>
                          <p className="text-2xl font-black text-emerald-600 mt-1">
                            {profile?.user?.attempts && profile.user.attempts.length > 0
                              ? (profile.user.attempts.reduce((acc: number, curr: any) => acc + curr.accuracy, 0) / profile.user.attempts.length).toFixed(1) + '%'
                              : '0.0%'
                            }
                          </p>
                        </div>
                        <div className="bg-cardBg border border-border/50 rounded-2xl p-4.5 text-center shadow-xs">
                          <p className="text-[10px] font-bold text-text-secondary uppercase">Passed Rate</p>
                          <p className="text-2xl font-black text-blue-600 mt-1">
                            {profile?.user?.attempts && profile.user.attempts.length > 0
                              ? ((profile.user.attempts.filter((a: any) => a.passed).length / profile.user.attempts.length) * 100).toFixed(0) + '%'
                              : '0%'
                            }
                          </p>
                        </div>
                        <div className="bg-cardBg border border-border/50 rounded-2xl p-4.5 text-center shadow-xs">
                          <p className="text-[10px] font-bold text-text-secondary uppercase">Attendance Rate</p>
                          <p className="text-2xl font-black text-accent mt-1">92%</p>
                        </div>
                      </div>

                      {/* Test Scores scoreboard */}
                      <div className="bg-cardBg border border-border/50 rounded-3xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                          <Activity className="w-4 h-4 text-accent" />
                          <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">Exam & Mock Test Scores Log</h4>
                        </div>

                        {!profile?.user?.attempts || profile.user.attempts.length === 0 ? (
                          <p className="text-xs text-text-secondary py-6 text-center font-semibold">
                            No exam attempts recorded in the database for this student yet.
                          </p>
                        ) : (
                          <div className="overflow-x-auto border border-border/40 rounded-2xl">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-[10px] font-bold text-text-secondary uppercase tracking-wider border-b border-border/40">
                                  <th className="p-4">Test Title</th>
                                  <th className="p-4">Date Taken</th>
                                  <th className="p-4">Accuracy</th>
                                  <th className="p-4">Duration</th>
                                  <th className="p-4">Score</th>
                                  <th className="p-4 text-right">Result</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/30 text-xs text-text-primary font-medium">
                                {profile.user.attempts.map((attempt: any) => (
                                  <tr key={attempt.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-bold text-text-primary">{attempt.test?.title || 'System Test'}</td>
                                    <td className="p-4">{new Date(attempt.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4">{attempt.accuracy.toFixed(1)}%</td>
                                    <td className="p-4">{Math.floor(attempt.timeTaken / 60)}m {attempt.timeTaken % 60}s</td>
                                    <td className="p-4 font-black">
                                      {attempt.totalScore} / {attempt.test?.total_marks || 100}
                                    </td>
                                    <td className="p-4 text-right">
                                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wide uppercase ${
                                        attempt.passed
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-250'
                                          : 'bg-rose-50 text-rose-700 border border-rose-250'
                                      }`}>
                                        {attempt.passed ? 'PASS' : 'FAIL'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ==================== TAB 6: MENTORING ==================== */}
                  {activeTab === 'mentoring' && (
                    <div className="space-y-6">
                      <div className="bg-cardBg border border-border/50 rounded-3xl p-6 shadow-xs space-y-6">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                          <Award className="w-4 h-4 text-accent" />
                          <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">Mentoring & Career Details</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Assigned Mentor</label>
                            <input
                              type="text"
                              placeholder="Mentor Name"
                              value={editForm.mentorAssigned}
                              onChange={(e) => setEditForm((prev: any) => ({ ...prev, mentorAssigned: e.target.value }))}
                              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">Motivation & Remarks</label>
                            <input
                              type="text"
                              placeholder="Motivation details"
                              value={editForm.performanceRemarks}
                              onChange={(e) => setEditForm((prev: any) => ({ ...prev, performanceRemarks: e.target.value }))}
                              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Mentorship counseling log */}
                      <div className="bg-cardBg border border-border/50 rounded-3xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4 text-accent" />
                            <span>Counseling & Mentoring log</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => setIsCounselingModalOpen(true)}
                            className="flex items-center space-x-1.5 bg-accent hover:bg-accent-onContainer text-white font-bold py-1.5 px-3.5 rounded-xl text-xs transition-colors shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Log Session</span>
                          </button>
                        </div>

                        {!profile?.counselingSessions || profile.counselingSessions.length === 0 ? (
                          <p className="text-xs text-text-secondary py-6 text-center font-semibold">
                            No counseling/mentoring sessions recorded yet. Click "Log Session" to add notes.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {profile.counselingSessions.map((session: any) => (
                              <div key={session.id} className="bg-slate-50/60 border border-border/50 rounded-2xl p-4.5 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 text-xs">
                                    <span className="font-extrabold text-text-primary">Mentor: {session.mentorName}</span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-text-secondary">{new Date(session.sessionDate).toLocaleDateString()}</span>
                                  </div>
                                  {session.followUpDate && (
                                    <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200">
                                      Follow-up: {new Date(session.followUpDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-text-primary leading-relaxed">{session.notes}</p>
                                {session.remarks && (
                                  <div className="pt-2 border-t border-border/40 text-[11px] text-text-secondary flex items-start space-x-1">
                                    <span className="font-bold text-accent uppercase">Remarks:</span>
                                    <span>{session.remarks}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ==================== TAB 6: EXAM APPLICATIONS ==================== */}
                  {activeTab === 'exam_apps' && (
                    <div className="space-y-6">
                      <div className="bg-cardBg border border-border/50 rounded-3xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider flex items-center space-x-2">
                            <FileCheck className="w-4 h-4 text-accent" />
                            <span>Exam Application Tracking</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => setIsExamAppModalOpen(true)}
                            className="flex items-center space-x-1.5 bg-accent hover:bg-accent-onContainer text-white font-bold py-1.5 px-3.5 rounded-xl text-xs transition-colors shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Track Exam App</span>
                          </button>
                        </div>

                        {!profile?.examApplications || profile.examApplications.length === 0 ? (
                          <p className="text-xs text-text-secondary py-6 text-center font-semibold">
                            No exam target tracking items configured. Click "Track Exam App" to add details.
                          </p>
                        ) : (
                          <div className="overflow-x-auto border border-border/40 rounded-2xl">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-[10px] font-bold text-text-secondary uppercase tracking-wider border-b border-border/40">
                                  <th className="p-4">Exam Name</th>
                                  <th className="p-4">Notification</th>
                                  <th className="p-4">Applied?</th>
                                  <th className="p-4">App & Ticket No</th>
                                  <th className="p-4">Exam Date</th>
                                  <th className="p-4">Result</th>
                                  <th className="p-4 text-right">Final Selection</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/30 text-xs text-text-primary font-medium">
                                {profile.examApplications.map((app: any) => (
                                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-bold text-text-primary">{app.examName}</td>
                                    <td className="p-4">{app.notificationDate ? new Date(app.notificationDate).toLocaleDateString() : '-'}</td>
                                    <td className="p-4">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                        app.applied ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                      }`}>
                                        {app.applied ? 'YES' : 'NO'}
                                      </span>
                                    </td>
                                    <td className="p-4 text-text-secondary">
                                      {app.applicationNo || 'App: -'}<br />
                                      {app.hallTicketNo || 'Ticket: -'}
                                    </td>
                                    <td className="p-4">{app.examDate ? new Date(app.examDate).toLocaleDateString() : '-'}</td>
                                    <td className="p-4">{app.resultStatus || 'Awaiting'}</td>
                                    <td className="p-4 text-right font-extrabold text-emerald-650">{app.finalSelection || 'Pending'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ==================== TAB 7: DOCUMENTS & PLACEMENT ==================== */}
                  {activeTab === 'docs_history' && (
                    <div className="space-y-6">
                      
                      {/* Documents Upload Section */}
                      <div className="bg-cardBg border border-border/50 rounded-3xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-accent" />
                            <span>Verification Documents Copy</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => setIsDocModalOpen(true)}
                            className="flex items-center space-x-1.5 bg-accent/10 hover:bg-accent/20 text-accent font-bold py-1.5 px-3.5 rounded-xl text-xs transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Document Copy</span>
                          </button>
                        </div>

                        {!profile?.documents || profile.documents.length === 0 ? (
                          <p className="text-xs text-text-secondary py-6 text-center font-semibold">
                            No documents uploaded yet. Click "Add Document Copy" to upload Aadhaar, Degree, Community certs.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {profile.documents.map((doc: any) => (
                              <div key={doc.id} className="border border-border/50 bg-slate-50/50 rounded-2xl p-4 flex items-center justify-between">
                                <div className="min-w-0">
                                  <p className="font-extrabold text-xs text-text-primary truncate">{doc.documentType}</p>
                                  <p className="text-[10px] text-text-secondary mt-0.5">Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                </div>
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-accent font-bold uppercase hover:underline"
                                >
                                  View File
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Communication Log */}
                      <div className="bg-cardBg border border-border/50 rounded-3xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4 text-accent" />
                            <span>Communication logs</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => setIsCommModalOpen(true)}
                            className="flex items-center space-x-1.5 bg-accent/10 hover:bg-accent/20 text-accent font-bold py-1.5 px-3.5 rounded-xl text-xs transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Log Communication</span>
                          </button>
                        </div>

                        {!profile?.communications || profile.communications.length === 0 ? (
                          <p className="text-xs text-text-secondary py-6 text-center font-semibold">
                            No messaging or parent call interactions logged.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {profile.communications.map((log: any) => (
                              <div key={log.id} className="bg-slate-50/40 border border-border/40 rounded-xl p-3 flex items-start space-x-3 text-xs">
                                <span className="bg-slate-150 text-slate-800 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase mt-0.5">
                                  {log.type}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-text-primary leading-normal">{log.content}</p>
                                  <p className="text-[10px] text-text-secondary mt-1">
                                    Logged by {log.sentBy} • {new Date(log.sentAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Placement Tracking Section */}
                      <div className="bg-cardBg border border-border/50 rounded-3xl p-6 shadow-xs space-y-6">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                          <Briefcase className="w-4 h-4 text-accent" />
                          <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">Placement / Success Story Tracking</h4>
                        </div>

                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="placementSelected"
                            checked={editForm.placementSelected}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, placementSelected: e.target.checked }))}
                            className="w-4.5 h-4.5 rounded accent-accent"
                          />
                          <label htmlFor="placementSelected" className="text-xs font-bold text-text-primary uppercase tracking-wider cursor-pointer">
                            Student Selected / Placed? (Success Story Eligible)
                          </label>
                        </div>

                        {editForm.placementSelected && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-text-secondary uppercase">Department</label>
                              <input
                                type="text"
                                placeholder="e.g. Revenue Department"
                                value={editForm.placementDetails?.department || ''}
                                onChange={(e) => setEditForm((prev: any) => ({
                                  ...prev,
                                  placementDetails: { ...prev.placementDetails, department: e.target.value }
                                }))}
                                className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-text-secondary uppercase">Post Name</label>
                              <input
                                type="text"
                                placeholder="e.g. VAO Officer"
                                value={editForm.placementDetails?.postName || ''}
                                onChange={(e) => setEditForm((prev: any) => ({
                                  ...prev,
                                  placementDetails: { ...prev.placementDetails, postName: e.target.value }
                                }))}
                                className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-text-secondary uppercase">Rank / Score</label>
                              <input
                                type="text"
                                placeholder="e.g. State Rank 14"
                                value={editForm.placementDetails?.rank || ''}
                                onChange={(e) => setEditForm((prev: any) => ({
                                  ...prev,
                                  placementDetails: { ...prev.placementDetails, rank: e.target.value }
                                }))}
                                className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-text-secondary uppercase">Joining Date</label>
                              <input
                                type="date"
                                value={editForm.placementDetails?.joiningDate || ''}
                                onChange={(e) => setEditForm((prev: any) => ({
                                  ...prev,
                                  placementDetails: { ...prev.placementDetails, joiningDate: e.target.value }
                                }))}
                                className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-text-secondary uppercase">Starting Salary</label>
                              <input
                                type="text"
                                placeholder="e.g. ₹35,000 / PM"
                                value={editForm.placementDetails?.salary || ''}
                                onChange={(e) => setEditForm((prev: any) => ({
                                  ...prev,
                                  placementDetails: { ...prev.placementDetails, salary: e.target.value }
                                }))}
                                className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none"
                              />
                            </div>
                            <div className="space-y-1.5 md:col-span-3">
                              <label className="text-xs font-bold text-text-secondary uppercase">Success Story / Comments</label>
                              <textarea
                                placeholder="Add comments, notes, success testimonial..."
                                value={editForm.placementDetails?.successStory || ''}
                                onChange={(e) => setEditForm((prev: any) => ({
                                  ...prev,
                                  placementDetails: { ...prev.placementDetails, successStory: e.target.value }
                                }))}
                                className="w-full bg-slate-50 border border-border/60 rounded-xl px-4.5 py-3 text-sm text-text-primary focus:border-accent outline-none h-20 resize-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* BOTTOM PROFILE WORKSPACE SAVE ACTION */}
                  <div className="pt-4 border-t border-border/40 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="flex items-center space-x-1.5 bg-accent hover:bg-accent-onContainer text-white font-bold py-3 px-8 rounded-xl text-xs shadow-md shadow-accent/15 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving Profile...</span>
                        </>
                      ) : (
                        <span>Save Workspace Changes</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-secondary bg-slate-50/20 p-12">
            <GraduationCap className="w-16 h-16 text-gray-300 opacity-60 stroke-[1.5]" />
            <h4 className="mt-4 font-black text-text-primary text-base tracking-tight">No Selection</h4>
            <p className="mt-1 text-xs font-semibold text-center max-w-xs leading-relaxed">
              Select a student from the sidebar directory to configure their profile database, track exam targets, log billing installments, and view performance indexes.
            </p>
          </div>
        )}
      </div>

      {/* Enroll Course modal Dialog */}
      <EnrollModal
        isOpen={isEnrollDialogOpen}
        onClose={() => { setIsEnrollDialogOpen(false); setCourseSearchQuery(''); }}
        selectedStudent={selectedStudent}
        courseSearchQuery={courseSearchQuery}
        setCourseSearchQuery={setCourseSearchQuery}
        availableCourses={availableCourses}
        onEnroll={handleEnroll}
        isEnrollingId={isEnrollingId}
      />

      {/* ==================== SUB-RESOURCE MODAL 1: RECORD PAYMENT ==================== */}
      {isPaymentModalOpen && (
        <PaymentModal
          onClose={() => setIsPaymentModalOpen(false)}
          onSubmit={async (data) => {
            if (selectedStudent) {
              await addPaymentMutation.mutateAsync({ userId: selectedStudent.id, data });
              refetchProfile();
            }
          }}
        />
      )}

      {/* ==================== SUB-RESOURCE MODAL 2: LOG SESSION ==================== */}
      {isCounselingModalOpen && (
        <CounselingModal
          onClose={() => setIsCounselingModalOpen(false)}
          onSubmit={async (data) => {
            if (selectedStudent) {
              await addCounselingMutation.mutateAsync({ userId: selectedStudent.id, data });
              refetchProfile();
            }
          }}
        />
      )}

      {/* ==================== SUB-RESOURCE MODAL 3: TRACK EXAM APP ==================== */}
      {isExamAppModalOpen && (
        <ExamAppModal
          onClose={() => setIsExamAppModalOpen(false)}
          onSubmit={async (data) => {
            if (selectedStudent) {
              await addExamAppMutation.mutateAsync({ userId: selectedStudent.id, data });
              refetchProfile();
            }
          }}
        />
      )}

      {/* ==================== SUB-RESOURCE MODAL 4: ADD DOCUMENT ==================== */}
      {isDocModalOpen && (
        <DocModal
          onClose={() => setIsDocModalOpen(false)}
          onSubmit={async (data) => {
            if (selectedStudent) {
              await addDocumentMutation.mutateAsync({ userId: selectedStudent.id, data });
              refetchProfile();
            }
          }}
        />
      )}

      {/* ==================== SUB-RESOURCE MODAL 5: LOG COMMUNICATION ==================== */}
      {isCommModalOpen && (
        <CommModal
          onClose={() => setIsCommModalOpen(false)}
          onSubmit={async (data) => {
            if (selectedStudent) {
              await addCommMutation.mutateAsync({ userId: selectedStudent.id, data });
              refetchProfile();
            }
          }}
        />
      )}

      <StudentFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingStudent(null);
        }}
        onSubmit={handleFormSubmit}
        student={editingStudent}
      />

      <ConfirmModal
        isOpen={studentToDelete !== null}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleConfirmDeleteStudent}
        title="Delete Student Profile"
        message={`Are you sure you want to permanently delete student "${studentToDelete?.name}"? All associated enrollments and profiles will be deleted.`}
      />

    </div>
  );
}

