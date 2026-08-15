import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/test-utils';
import StudyMaterialsPage from '../pages/StudyMaterialsPage';

const state = vi.hoisted(() => {
  const defaultCategories = [
    { id: 'c1', name: 'E-Books', description: 'Digital books for all subjects.' },
    { id: 'c2', name: 'Handwritten Notes', description: '' },
  ];
  const defaultMaterials = [
    {
      id: 'm1',
      title: 'Indian Economy Notes',
      description: 'Comprehensive notes on economy.',
      categoryId: 'c1',
      subjectId: null,
      topicId: null,
      fileUrl: '/materials/economy-notes.pdf',
      fileSize: 2048,
      fileType: 'application/pdf',
      accessType: 'FREE',
      status: 'APPROVED',
      uploadedById: null,
      version: 1,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
      category: { id: 'c1', name: 'E-Books' },
    },
    {
      id: 'm2',
      title: 'Polity Pending Notes',
      description: 'Waiting for review.',
      categoryId: 'c2',
      subjectId: null,
      topicId: null,
      fileUrl: '/materials/polity.pdf',
      fileSize: 5242880,
      fileType: 'application/pdf',
      accessType: 'PREMIUM',
      status: 'PENDING',
      uploadedById: null,
      version: 2,
      createdAt: '2026-08-02T00:00:00.000Z',
      updatedAt: '2026-08-02T00:00:00.000Z',
      category: { id: 'c2', name: 'Handwritten Notes' },
    },
  ];

  const categoriesData = { data: defaultCategories.map((c) => ({ ...c })) };
  const materialsData = { data: defaultMaterials.map((m) => ({ ...m })) };
  let materialsError: unknown = null;

  const createCategoryMutation = vi.fn().mockResolvedValue({});
  const deleteCategoryMutation = vi.fn().mockResolvedValue({});
  const createMaterialMutation = vi.fn().mockResolvedValue({});
  const updateMaterialMutation = vi.fn().mockResolvedValue({});
  const deleteMaterialMutation = vi.fn().mockResolvedValue({});

  function reset() {
    categoriesData.data = defaultCategories.map((c) => ({ ...c }));
    materialsData.data = defaultMaterials.map((m) => ({ ...m }));
    materialsError = null;
    vi.clearAllMocks();
  }

  return {
    categoriesData,
    materialsData,
    createCategoryMutation,
    deleteCategoryMutation,
    createMaterialMutation,
    updateMaterialMutation,
    deleteMaterialMutation,
    reset,
    getMaterialsError: () => materialsError,
    setMaterialsError: (err: unknown) => {
      materialsError = err;
    },
  };
});

vi.mock('../../../core/api/endpoints', () => ({
  useStudyCategoriesList: () => ({ data: state.categoriesData, isLoading: false }),
  useCreateStudyCategory: () => ({
    mutateAsync: state.createCategoryMutation,
    mutate: state.createCategoryMutation,
    isPending: false,
  }),
  useDeleteStudyCategory: () => ({
    mutateAsync: state.deleteCategoryMutation,
    mutate: state.deleteCategoryMutation,
    isPending: false,
  }),
  useStudyMaterialsAdminList: () => ({
    data: state.materialsData,
    isLoading: false,
    error: state.getMaterialsError(),
  }),
  useCreateStudyMaterial: () => ({
    mutateAsync: state.createMaterialMutation,
    mutate: state.createMaterialMutation,
    isPending: false,
  }),
  useUpdateStudyMaterial: () => ({
    mutateAsync: state.updateMaterialMutation,
    mutate: state.updateMaterialMutation,
    isPending: false,
  }),
  useDeleteStudyMaterial: () => ({
    mutateAsync: state.deleteMaterialMutation,
    mutate: state.deleteMaterialMutation,
    isPending: false,
  }),
}));

function renderPage() {
  return renderWithProviders(<StudyMaterialsPage />);
}

describe('StudyMaterialsPage', () => {
  beforeEach(() => {
    state.reset();
  });

  it('renders header and tabs with counts', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Digital Study Library' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Study Materials (1)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Approval Queue (1)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Category Manager (2)' })).toBeTruthy();
  });

  it('renders approved material cards with metadata and download link', () => {
    renderPage();

    expect(screen.getByText('Indian Economy Notes')).toBeTruthy();
    expect(screen.getByText('E-Books')).toBeTruthy();
    expect(screen.getByText('FREE')).toBeTruthy();
    expect(screen.getByText('Size: 2 KB • Version: v1')).toBeTruthy();
    expect(screen.getByText('Comprehensive notes on economy.')).toBeTruthy();

    const link = screen.getByRole('link', { name: /Download/ });
    expect(link).toHaveAttribute('href', 'http://127.0.0.1:5000/materials/economy-notes.pdf');

    expect(screen.queryByText('Polity Pending Notes')).toBeNull();
  });

  it('shows materials empty state', () => {
    state.materialsData.data = [];
    renderPage();

    expect(screen.getByText('No study materials uploaded yet.')).toBeTruthy();
  });

  it('shows materials error state', () => {
    state.setMaterialsError(new Error('boom'));
    renderPage();

    expect(screen.getByText('Failed to load study library.')).toBeTruthy();
  });

  it('shows validation errors in upload modal', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Upload Document' }));
    expect(screen.getByRole('heading', { name: 'Upload Study Material' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Upload and Publish' }));

    expect(screen.getByText('Title must be at least 5 characters')).toBeTruthy();
    expect(screen.getByText('Category is required')).toBeTruthy();
    expect(state.createMaterialMutation).not.toHaveBeenCalled();
  });

  it('shows toast when submitting without a file', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Upload Document' }));
    await user.type(screen.getByPlaceholderText('e.g. Indian Economy Notes'), 'Indian Polity Master Notes');
    await user.selectOptions(screen.getAllByRole('combobox')[0], 'c1');

    await user.click(screen.getByRole('button', { name: 'Upload and Publish' }));

    await waitFor(() => {
      expect(screen.getByText('Please select a file to upload.')).toBeTruthy();
    });
    expect(state.createMaterialMutation).not.toHaveBeenCalled();
  });

  it('creates a study material with title, category and file', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Upload Document' }));
    await user.type(screen.getByPlaceholderText('e.g. Indian Economy Notes'), 'Indian Economy Master Notes');
    await user.type(screen.getByPlaceholderText('Brief summary or chapters index...'), 'Updated economy notes for prelims.');
    await user.selectOptions(screen.getAllByRole('combobox')[0], 'c1');

    const file = new File(['pdf'], 'economy-notes-v2.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);
    expect(screen.getByText('economy-notes-v2.pdf')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Upload and Publish' }));

    await waitFor(() => {
      expect(state.createMaterialMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Indian Economy Master Notes',
          description: 'Updated economy notes for prelims.',
          categoryId: 'c1',
          accessType: 'FREE',
          status: 'APPROVED',
          file,
        })
      );
    });
    expect(screen.getByText('Study material uploaded and published successfully!')).toBeTruthy();
  });

  it('edits an existing material', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByTitle('Update details or upload new version'));
    expect(screen.getByRole('heading', { name: 'Update Study Material' })).toBeTruthy();

    const titleInput = screen.getByPlaceholderText('e.g. Indian Economy Notes');
    expect((titleInput as HTMLInputElement).value).toBe('Indian Economy Notes');

    await user.clear(titleInput);
    await user.type(titleInput, 'Indian Economy Revised Notes');
    await user.click(screen.getByRole('button', { name: 'Update Material' }));

    await waitFor(() => {
      expect(state.updateMaterialMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'm1',
          title: 'Indian Economy Revised Notes',
          categoryId: 'c1',
          accessType: 'FREE',
          status: 'APPROVED',
          file: undefined,
        })
      );
    });
    expect(screen.getByText('Study material updated successfully!')).toBeTruthy();
  });

  it('deletes a material through the confirm modal', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByTitle('Delete material'));
    expect(screen.getByRole('heading', { name: 'Delete Library Material?' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Delete Document' }));

    await waitFor(() => {
      expect(state.deleteMaterialMutation).toHaveBeenCalledWith('m1');
    });
    expect(screen.getByText('Study material deleted successfully!')).toBeTruthy();
  });

  it('renders pending materials in the approval queue', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Approval Queue (1)' }));

    expect(screen.getByText('Pending Reviews Queue')).toBeTruthy();
    expect(screen.getByText('Pending Approval')).toBeTruthy();
    expect(screen.getByText('Polity Pending Notes')).toBeTruthy();
    expect(screen.getByText('Handwritten Notes')).toBeTruthy();
    expect(screen.getByText('Size: 5 MB')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeTruthy();
  });

  it('approves a pending material', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Approval Queue (1)' }));
    await user.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      expect(state.updateMaterialMutation).toHaveBeenCalledWith({
        id: 'm2',
        status: 'APPROVED',
      });
    });
    expect(screen.getByText('"Polity Pending Notes" has been approved.')).toBeTruthy();
  });

  it('rejects a pending material', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Approval Queue (1)' }));
    await user.click(screen.getByRole('button', { name: 'Reject' }));

    await waitFor(() => {
      expect(state.updateMaterialMutation).toHaveBeenCalledWith({
        id: 'm2',
        status: 'REJECTED',
      });
    });
    expect(screen.getByText('"Polity Pending Notes" was marked as rejected.')).toBeTruthy();
  });

  it('shows approval queue empty state', async () => {
    const user = userEvent.setup();
    state.materialsData.data = [
      { ...state.materialsData.data[0] },
    ];
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Approval Queue (0)' }));
    expect(screen.getByText('No materials waiting for review.')).toBeTruthy();
  });

  it('renders categories and deletes one via window.confirm', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Category Manager (2)' }));

    expect(screen.getByText('E-Books')).toBeTruthy();
    expect(screen.getByText('Digital books for all subjects.')).toBeTruthy();
    expect(screen.getByText('Handwritten Notes')).toBeTruthy();
    expect(screen.getByText('No description provided.')).toBeTruthy();

    const deleteButtons = screen.getAllByTitle('Delete category');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(state.deleteCategoryMutation).toHaveBeenCalledWith('c1');
    });
    expect(screen.getByText('Category deleted successfully!')).toBeTruthy();
  });

  it('creates a category and shows toast', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Category Manager (2)' }));
    await user.click(screen.getByRole('button', { name: 'Create Category' }));
    expect(screen.getByRole('heading', { name: 'Create Material Category' })).toBeTruthy();

    const submitCategory = () => screen.getAllByRole('button', { name: 'Create Category' }).at(-1)!;

    await user.click(submitCategory());
    expect(screen.getByText('Category name must be at least 3 characters')).toBeTruthy();

    await user.type(screen.getByPlaceholderText('e.g. Handwritten Notes, E-Books'), 'PYQ Papers');
    await user.click(submitCategory());

    await waitFor(() => {
      expect(state.createCategoryMutation).toHaveBeenCalledWith({
        name: 'PYQ Papers',
        description: '',
      });
    });
    expect(screen.getByText('Category created successfully!')).toBeTruthy();
  });

  it('shows categories empty state', async () => {
    const user = userEvent.setup();
    state.categoriesData.data = [];
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Category Manager (0)' }));
    expect(screen.getByText('No categories defined yet.')).toBeTruthy();
  });
});
