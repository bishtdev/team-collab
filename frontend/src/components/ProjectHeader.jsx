import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProjectById, clearCurrentProject } from '../features/projects/projectsSlice';
import { FiArrowLeft, FiLoader } from 'react-icons/fi';

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
      <div className="px-5 py-3 border-b border-gray-800/60 bg-gray-950/50 flex items-center gap-2">
        <FiLoader className="animate-spin text-gray-600" />
        <span className="text-sm text-gray-600">Loading project...</span>
      </div>
    );
  }

  return (
    <div className="px-5 py-3 border-b border-gray-800/60 bg-gray-950/50 backdrop-blur-sm flex items-center gap-3">
      <Link
        to="/projects"
        className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        title="Back to Projects"
      >
        <FiArrowLeft className="w-4 h-4" />
      </Link>
      <div className="flex items-center gap-2 text-sm">
        <Link to="/projects" className="text-gray-500 hover:text-gray-300 transition-colors">
          Projects
        </Link>
        <span className="text-gray-700">/</span>
        <span className="text-white font-medium truncate max-w-xs">
          {project?.name || 'Project'}
        </span>
      </div>
    </div>
  );
};

export default ProjectHeader;
