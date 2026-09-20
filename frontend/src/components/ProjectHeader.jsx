import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { fetchProjectById, clearCurrentProject } from '../features/projects/projectsSlice';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ProjectHeader = ({ projectId }) => {
  const dispatch = useDispatch();
  const { currentProject: project, isLoading } = useSelector(state => state.projects);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectById(projectId));
    }
    return () => {
      dispatch(clearCurrentProject());
    };
  }, [projectId, dispatch]);

  if (isLoading || !project) {
    return (
      <div className="flex items-center gap-3 border-b border-border bg-surface px-5 py-3">
        <Skeleton className="size-8 rounded-sm" />
        <Skeleton className="h-4 w-48" />
        <span className="sr-only">Loading project</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-b border-border bg-surface px-5 py-3">
      <Button asChild variant="ghost" size="icon-sm">
        <Link to="/projects" title="Back to Projects" aria-label="Back to projects">
          <ArrowLeft className="size-4" strokeWidth={1.75} />
        </Link>
      </Button>
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-small">
        <Link
          to="/projects"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Projects
        </Link>
        <span className="text-faint">/</span>
        <span className="max-w-xs truncate font-medium text-foreground">
          {project?.name || 'Project'}
        </span>
      </nav>
    </div>
  );
};

export default ProjectHeader;
