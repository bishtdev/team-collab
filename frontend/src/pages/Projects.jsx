import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { fetchProjects, deleteProject } from '../features/projects/projectsSlice';
import ProjectFormModal from '../components/modals/ProjectFormModal';
import { useState } from 'react';
import { timeAgo } from '@/lib/time';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/product/EmptyState';
import { PageHeader } from '@/components/product/PageHeader';
import { UserAvatarGroup } from '@/components/product/UserAvatar';

const Projects = () => {
  const dispatch = useDispatch();
  const { items: projects, isLoading, isMutating, error } = useSelector(state => state.projects);
  const { user } = useAuth();
  const { canCreateProject, canEditProject, canDeleteProject } = usePermissions();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingProject, setEditingProject] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    if (user?.teamId) {
      dispatch(fetchProjects());
    }
  }, [user?.teamId, dispatch]);

  const openCreate = () => {
    setModalMode('create');
    setEditingProject(null);
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setModalMode('edit');
    setEditingProject(project);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await dispatch(deleteProject(pendingDelete._id)).unwrap();
      toast.success('Project deleted', {
        description: `${pendingDelete.name} was removed.`,
      });
      setPendingDelete(null);
    } catch (err) {
      toast.error('Could not delete the project', {
        description: typeof err === 'string' ? err : 'Check your connection and try again.',
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <PageHeader
        title="Projects"
        description={`${projects.length} project${projects.length !== 1 ? 's' : ''} in your team`}
      >
        {canCreateProject && (
          <Button id="new-project-btn" onClick={openCreate}>
            <Plus className="size-4" strokeWidth={1.75} />
            New project
          </Button>
        )}
      </PageHeader>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-small text-destructive">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-9 w-full" />
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create the first project to organize tasks and collaborate with your team."
        >
          {canCreateProject && (
            <Button onClick={openCreate}>Create your first project</Button>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card
              key={p._id}
              className="group gap-4 p-5 transition-all duration-200 ease-kiln hover:border-primary/40 hover:shadow-pop"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-h3 font-semibold text-foreground">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 text-small text-muted-foreground">
                    {p.description || 'No description'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  {canEditProject && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(p)}
                      aria-label="Edit project"
                      title="Edit project"
                    >
                      <Pencil className="size-4" strokeWidth={1.75} />
                    </Button>
                  )}
                  {canDeleteProject && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setPendingDelete(p)}
                      aria-label="Delete project"
                      title="Delete project"
                      disabled={isMutating}
                    >
                      <Trash2 className="size-4" strokeWidth={1.75} />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                {p.assignedUsers && p.assignedUsers.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <UserAvatarGroup users={p.assignedUsers} max={4} size="sm" />
                    <span className="text-micro text-muted-foreground tabular-nums">
                      {p.assignedUsers.length} member{p.assignedUsers.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                ) : (
                  <span className="text-micro text-muted-foreground">No members yet</span>
                )}
                {p.updatedAt && (
                  <span className="shrink-0 text-micro text-faint">
                    {timeAgo(p.updatedAt)}
                  </span>
                )}
              </div>

              <Button asChild variant="secondary" className="w-full">
                <Link to={`/project/${p._id}/kanban`}>Open board</Link>
              </Button>
            </Card>
          ))}
        </div>
      )}

      <ProjectFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        project={editingProject}
      />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `"${pendingDelete.name}" and its tasks are removed for everyone. This can't be undone.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep project</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
            >
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Projects;
