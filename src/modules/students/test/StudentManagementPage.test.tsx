import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/test-utils';
import StudentManagementPage from '../pages/StudentManagementPage';

const state = vi.hoisted(() => {
  const defaultStudents = [
    { id: 'student_1', name: 'Priya Sharma', email: 'priya@mayiliragu.com', createdAt: '2026-01-10T00:00:00.000Z' },
    { id: 'student_2', name: 'Rahul Verma', email: 'rahul@mayiliragu.com', createdAt: '2026-02-20T00:00:00.000Z' },
    { id: 'student_3', name: 'Meena K', email: 'meena@mayiliragu.com', createdAt: '2026-03-05T00:00:00.000Z' },
  ];

  const defaultEnrollments = [
    {
      id: 'enr1',
      courseId: 'course-1',
      createdAt: '2026-01-12T00:00:00.000Z',
      course: { id: 'course-1', title: 'TNPSC Group 2', thumbnail: '' },
    },
  ];

  const defaultCoursesData = {
    data: [
      { id: 'course-1', title: 'TNPSC Group 2', thumbnail: '' },
      { id: 'course-2', title: 'Bank Exams', thumbnail: '' },
    ],
  };

  const defaultExamCategories = [{ id: 'cat1', name: 'TNPSC', description: '', iconName: '' }];

  const defaultProfile = {
    userId: 'student_1',
    studentId: 'MAYIL-STU-001',
    gender: '',
    dob: '2000-01-15T00:00:00.000Z',
    bloodGroup: '',
    aadhaarNumber: '',
    nationality: 'Indian',
    category: 'General',
    mobileNumber: '',
    whatsappNumber: '',
    parentName: '',
    parentMobile: '',
    emergencyContact: '',
    currentAddress: '',
    permanentAddress: '',
    city: '',
    district: '',
    state: 'Tamil Nadu',
    pinCode: '',
    highestQualification: '',
    degree: '',
    college: '',
    yearOfPassing: '',
    percentage: '',
    mediumOfEducation: 'English',
    targetExams: [],
    preparationMode: 'Online',
    preferredLanguage: 'English',
    preparationLevel: 'Beginner',
    attemptNumber: 'First Attempt',
    admissionDate: '2026-01-10T00:00:00.000Z',
    batchName: 'Morning Batch A',
    batchTiming: '',
    courseDuration: '',
    facultyAssigned: '',
    courseFee: 15000,
    discount: 2000,
    scholarshipDetails: '',
    enrollmentStatus: 'Active',
    studyHoursPerDay: '',
    placementSelected: false,
    placementDetails: { department: '', postName: '', rank: '', joiningDate: '', salary: '', successStory: '' },
    mentorAssigned: '',
    performanceRemarks: '',
    payments: [
      {
        id: 'pay1',
        receiptNumber: 'RCPT-001',
        paymentDate: '2026-01-15T00:00:00.000Z',
        installmentInfo: 'First installment',
        paymentMethod: 'UPI',
        amountPaid: 5000,
      },
    ],
    counselingSessions: [],
    examApplications: [],
    documents: [],
    communications: [],
    user: { attempts: [] },
  };

  let students: unknown[] = defaultStudents.map((s) => ({ ...s }));
  let enrollments: unknown[] = defaultEnrollments.map((e) => ({ ...e }));
  let selectedProfile: unknown = { ...defaultProfile, user: { attempts: [] }, payments: defaultProfile.payments.map((p) => ({ ...p })) };
  let studentsLoading = false;
  let studentsError = false;
  let enrollmentsLoading = false;
  let profileLoading = false;

  const mutations = {
    enroll: vi.fn(() => Promise.resolve({})),
    revoke: vi.fn(() => Promise.resolve({})),
    createStudent: vi.fn((data: any) =>
      Promise.resolve({ id: 'student_4', name: data.name, email: data.email, createdAt: '2026-08-14T00:00:00.000Z' })
    ),
    updateStudent: vi.fn(({ id, data }: any) => Promise.resolve({ id, ...data })),
    deleteStudent: vi.fn(() => Promise.resolve({})),
    updateProfile: vi.fn(() => Promise.resolve({})),
    addPayment: vi.fn(() => Promise.resolve({})),
    addCounseling: vi.fn(() => Promise.resolve({})),
    addExamApp: vi.fn(() => Promise.resolve({})),
    addDocument: vi.fn(() => Promise.resolve({})),
    addComm: vi.fn(() => Promise.resolve({})),
  };

  const apiClient = {
    delete: vi.fn(() => Promise.resolve({ data: { status: 'success' } })),
  };

  const refetchStudents = vi.fn();
  const refetchProfile = vi.fn();

  function reset() {
    students = defaultStudents.map((s) => ({ ...s }));
    enrollments = defaultEnrollments.map((e) => ({ ...e }));
    selectedProfile = { ...defaultProfile, user: { attempts: [] }, payments: defaultProfile.payments.map((p) => ({ ...p })) };
    studentsLoading = false;
    studentsError = false;
    enrollmentsLoading = false;
    profileLoading = false;
    vi.clearAllMocks();
  }

  return {
    get students() {
      return students;
    },
    get enrollments() {
      return enrollments;
    },
    get coursesData() {
      return defaultCoursesData;
    },
    get examCategories() {
      return defaultExamCategories;
    },
    get selectedProfile() {
      return selectedProfile;
    },
    get studentsLoading() {
      return studentsLoading;
    },
    get studentsError() {
      return studentsError;
    },
    get enrollmentsLoading() {
      return enrollmentsLoading;
    },
    get profileLoading() {
      return profileLoading;
    },
    mutations,
    apiClient,
    refetchStudents,
    refetchProfile,
    reset,
    setStudentsError: (v: boolean) => {
      studentsError = v;
    },
    setStudentsLoading: (v: boolean) => {
      studentsLoading = v;
    },
    setProfile: (p: unknown) => {
      selectedProfile = p;
    },
  };
});

vi.mock('../../../core/api/endpoints', () => ({
  useStudentsList: () => ({
    data: state.students,
    isLoading: state.studentsLoading,
    isError: state.studentsError,
    refetch: state.refetchStudents,
  }),
  useStudentEnrollments: () => ({ data: state.enrollments, isLoading: state.enrollmentsLoading }),
  useCoursesList: () => ({ data: state.coursesData }),
  useExamCategories: () => ({ data: state.examCategories, isLoading: false }),
  useStudentProfile: () => ({
    data: state.selectedProfile,
    isLoading: state.profileLoading,
    refetch: state.refetchProfile,
  }),
  useEnrollStudent: () => ({ mutateAsync: state.mutations.enroll, isPending: false }),
  useRevokeEnrollment: () => ({ mutateAsync: state.mutations.revoke, isPending: false }),
  useCreateStudent: () => ({ mutateAsync: state.mutations.createStudent, isPending: false }),
  useUpdateStudent: () => ({ mutateAsync: state.mutations.updateStudent, isPending: false }),
  useDeleteStudent: () => ({ mutateAsync: state.mutations.deleteStudent, isPending: false }),
  useUpdateStudentProfile: () => ({ mutateAsync: state.mutations.updateProfile, isPending: false }),
  useAddStudentPayment: () => ({ mutateAsync: state.mutations.addPayment, isPending: false }),
  useAddStudentCounseling: () => ({ mutateAsync: state.mutations.addCounseling, isPending: false }),
  useAddStudentExamApplication: () => ({ mutateAsync: state.mutations.addExamApp, isPending: false }),
  useAddStudentDocument: () => ({ mutateAsync: state.mutations.addDocument, isPending: false }),
  useAddStudentCommunication: () => ({ mutateAsync: state.mutations.addComm, isPending: false }),
  apiClient: state.apiClient,
}));

function renderPage() {
  return renderWithProviders(<StudentManagementPage />);
}

describe('StudentManagementPage', () => {
  beforeEach(() => {
    state.reset();
  });

  it('renders the directory and the no-selection placeholder', async () => {
    renderPage();

    expect(screen.getByText('Students Directory')).toBeTruthy();
    expect(screen.getByText('Priya Sharma')).toBeTruthy();
    expect(screen.getByText('rahul@mayiliragu.com')).toBeTruthy();
    expect(screen.getByText('Meena K')).toBeTruthy();

    expect(screen.getByRole('heading', { name: 'No Selection' })).toBeTruthy();
    expect(screen.getByText(/Select a student from the sidebar directory/)).toBeTruthy();
  });

  it('shows a loading skeleton while students load', () => {
    state.setStudentsLoading(true);
    const { container } = renderPage();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(screen.queryByText('Priya Sharma')).toBeNull();
  });

  it('shows the error panel and retries the fetch', async () => {
    state.setStudentsError(true);
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText('Failed to Load Students')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(state.refetchStudents).toHaveBeenCalled();
  });

  it('shows the empty state when there are no students', () => {
    state.students.length = 0;
    renderPage();
    expect(screen.getByText('No students found.')).toBeTruthy();
  });

  it('filters students by search query', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('Search by name or email...'), 'Rahul');

    expect(screen.getByText('Rahul Verma')).toBeTruthy();
    expect(screen.queryByText('Priya Sharma')).toBeNull();
    expect(screen.queryByText('Meena K')).toBeNull();
  });

  it('selects a student and shows the profile header and basic info', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText('Priya Sharma'));

    expect(screen.getByRole('heading', { name: 'Priya Sharma' })).toBeTruthy();
    expect(screen.getByText('MAYIL-STU-001')).toBeTruthy();
    expect(screen.getByText(/Joined/)).toBeTruthy();
    expect(await screen.findByText('Demographic Information')).toBeTruthy();
    expect(screen.getByDisplayValue('2000-01-15')).toBeTruthy();
  });

  it('creates a new student through the registration modal', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'New Student' }));
    expect(screen.getByText('Register New Student')).toBeTruthy();

    await user.type(screen.getByPlaceholderText('e.g. John Doe'), 'John Doe');
    await user.type(screen.getByPlaceholderText('e.g. john.doe@email.com'), 'JOHN.DOE@email.com');
    await user.type(screen.getByPlaceholderText('•••••••• (minimum 6 characters)'), 'secret123');

    await user.click(screen.getByRole('button', { name: 'Create Student' }));

    await waitFor(() => {
      expect(state.mutations.createStudent).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john.doe@email.com',
        password: 'secret123',
      });
    });
    expect(screen.queryByText('Register New Student')).toBeNull();
  });

  it('validates the student form fields', async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    await user.click(screen.getByRole('button', { name: 'New Student' }));
    const form = container.querySelector('form');
    fireEvent.submit(form as HTMLFormElement);

    expect(screen.getByText('Name is required')).toBeTruthy();
    expect(state.mutations.createStudent).not.toHaveBeenCalled();
  });

  it('enrolls the selected student in an available course', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText('Priya Sharma'));
    await screen.findByText('Demographic Information');
    await user.click(screen.getByRole('button', { name: 'Exam Prep' }));
    await screen.findByText('Active course catalog enrollments');

    await user.click(screen.getByRole('button', { name: 'Enroll in Course' }));

    expect(screen.getByText('Enroll Student')).toBeTruthy();
    expect(screen.getByText('Bank Exams')).toBeTruthy();

    await user.click(screen.getByText('Bank Exams'));

    await waitFor(() => {
      expect(state.mutations.enroll).toHaveBeenCalledWith({ studentId: 'student_1', courseId: 'course-2' });
    });
  });

  it('revokes a course enrollment after confirmation', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText('Priya Sharma'));
    await screen.findByText('Demographic Information');
    await user.click(screen.getByRole('button', { name: 'Exam Prep' }));
    await screen.findByText('Active course catalog enrollments');

    await user.click(screen.getByRole('button', { name: 'Revoke Enrollment' }));

    expect(screen.getByText('Revoke Course Enrollment')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Revoke' }));

    await waitFor(() => {
      expect(state.mutations.revoke).toHaveBeenCalledWith('enr1');
    });
  });

  it('deletes a student after confirmation', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText('Priya Sharma'));
    await screen.findByText('Demographic Information');

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByText('Delete Student Profile')).toBeTruthy();
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(state.mutations.deleteStudent).toHaveBeenCalledWith('student_1');
    });
  });

  it('resets the device binding for the selected student', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText('Priya Sharma'));
    await screen.findByText('Demographic Information');

    await user.click(screen.getByRole('button', { name: 'Reset Device' }));

    expect(screen.getByText('Reset Bound Device')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Confirm Reset' }));

    await waitFor(() => {
      expect(state.apiClient.delete).toHaveBeenCalledWith('/profile/admin/students/student_1/device');
    });
  });

  it('validates the Aadhaar number in the profile form', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText('Priya Sharma'));
    await screen.findByText('Demographic Information');

    await user.type(screen.getByPlaceholderText('12-digit number'), '12345');
    await user.click(screen.getByRole('button', { name: 'Save Workspace Changes' }));

    expect(screen.getByText('Aadhaar Number must be exactly 12 digits.')).toBeTruthy();
    expect(state.mutations.updateProfile).not.toHaveBeenCalled();
  });

  it('saves profile changes and shows a success message', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText('Priya Sharma'));
    await screen.findByText('Demographic Information');

    await user.selectOptions(screen.getAllByRole('combobox')[0], 'Female');
    await user.click(screen.getByRole('button', { name: 'Save Workspace Changes' }));

    await waitFor(() => {
      expect(state.mutations.updateProfile).toHaveBeenCalledWith({
        userId: 'student_1',
        data: expect.objectContaining({ gender: 'Female' }),
      });
    });
    expect(await screen.findByText('Student profile updated successfully!')).toBeTruthy();
  });

  it('switches to the Fees & Payments tab and shows the ledger', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText('Priya Sharma'));
    await screen.findByText('Demographic Information');

    await user.click(screen.getByRole('button', { name: 'Fees & Payments' }));

    expect(screen.getByText('Fee & Scholarship Settings')).toBeTruthy();
    expect(screen.getByText('RCPT-001')).toBeTruthy();
    expect(screen.getByText('UPI')).toBeTruthy();
    expect(screen.getByText('₹13000')).toBeTruthy();
    expect(screen.getByText('₹8000')).toBeTruthy();
  });
});
